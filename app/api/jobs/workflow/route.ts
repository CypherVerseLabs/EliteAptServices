import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = new Set(["owner", "field_manager", "office"]);

const JOB_STATUSES = new Set([
  "open",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "awaiting_signoff",
  "signed_off",
  "paperwork_submitted",
  "approved",
  "payroll_ready",
  "paid",
  "cancelled",
]);

const ASSIGNMENT_STATUSES = new Set([
  "assigned",
  "accepted",
  "declined",
  "in_progress",
  "completed",
  "removed",
]);

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getStaffClient() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { supabase, user: null, profile: null, response: errorResponse("Authentication required.", 401) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    return { supabase, user: userData.user, profile: null, response: errorResponse(profileError.message, 500) };
  }

  if (!profile?.active || !STAFF_ROLES.has(String(profile.role).toLowerCase())) {
    return { supabase, user: userData.user, profile, response: errorResponse("Staff access required.", 403) };
  }

  return { supabase, user: userData.user, profile, response: null };
}

export async function GET() {
  const { supabase, response } = await getStaffClient();

  if (response) {
    return response;
  }

  const [jobsResult, workOrdersResult, assignmentsResult, lineItemsResult, signoffsResult, workersResult, contractorsResult] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("id, job_number, work_order_id, property_id, unit_id, service_category, title, description, assigned_by, status, scheduled_date, due_date, started_at, completed_at, total_amount, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("work_orders")
        .select("id, work_order_number, property_id, unit_id, service_category, title, description, status, pricing_id, pricing_type, unit_price, pricing_quantity, pricing_total, requested_date, due_date")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("job_assignments")
        .select("id, job_id, worker_id, contractor_id, assigned_by, status, assigned_at, accepted_at, completed_at, removed_at, notes")
        .order("assigned_at", { ascending: false }),
      supabase
        .from("job_line_items")
        .select("id, job_id, pricing_item_id, description, quantity, unit_price, total_price, notes, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("job_signoffs")
        .select("id, job_id, representative_name, representative_title, signature_storage_path, signed_at, approved, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, active, role")
        .eq("role", "worker")
        .eq("active", true)
        .order("first_name", { ascending: true }),
      supabase
        .from("contractors")
        .select("id, first_name, last_name, email, phone, specialty, active")
        .eq("active", true)
        .order("first_name", { ascending: true }),
    ]);

  const failed = [
    jobsResult,
    workOrdersResult,
    assignmentsResult,
    lineItemsResult,
    signoffsResult,
    workersResult,
    contractorsResult,
  ].find((result) => result.error);

  if (failed?.error) {
    return errorResponse(failed.error.message, 500);
  }

  return NextResponse.json({
    jobs: jobsResult.data ?? [],
    workOrders: workOrdersResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    lineItems: lineItemsResult.data ?? [],
    signoffs: signoffsResult.data ?? [],
    workers: workersResult.data ?? [],
    contractors: contractorsResult.data ?? [],
  });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await getStaffClient();

  if (response || !user) {
    return response ?? errorResponse("Authentication required.", 401);
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const action = String(body.action ?? "");

  if (action === "create_job") {
    const workOrderId = String(body.work_order_id ?? "");

    if (!workOrderId) {
      return errorResponse("work_order_id is required.");
    }

    const { data: workOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .select("id, work_order_number, property_id, unit_id, service_category, title, description, status, pricing_id, pricing_type, unit_price, pricing_quantity, pricing_total, requested_date, due_date")
      .eq("id", workOrderId)
      .maybeSingle();

    if (workOrderError) {
      return errorResponse(workOrderError.message, 500);
    }

    if (!workOrder) {
      return errorResponse("Work Order not found.", 404);
    }

    const { data: existingJob, error: existingError } = await supabase
      .from("jobs")
      .select("id, job_number, status")
      .eq("work_order_id", workOrderId)
      .maybeSingle();

    if (existingError) {
      return errorResponse(existingError.message, 500);
    }

    if (existingJob) {
      return NextResponse.json({ job: existingJob, alreadyExists: true });
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        work_order_id: workOrder.id,
        property_id: workOrder.property_id,
        unit_id: workOrder.unit_id,
        service_category: workOrder.service_category,
        title: workOrder.title,
        description: workOrder.description,
        assigned_by: user.id,
        status: "open",
        scheduled_date: workOrder.requested_date,
        due_date: workOrder.due_date,
        total_amount: Number(workOrder.pricing_total) || 0,
      })
      .select("id, job_number, work_order_id, status")
      .single();

    if (jobError || !job) {
      return errorResponse(jobError?.message ?? "Unable to create Job.", 500);
    }

    const quantity = Number(workOrder.pricing_quantity) || 1;
    const unitPrice = Number(workOrder.unit_price) || 0;
    const totalPrice = Number(workOrder.pricing_total) || unitPrice * quantity;

    const { error: lineItemError } = await supabase.from("job_line_items").insert({
      job_id: job.id,
      pricing_item_id: workOrder.pricing_id,
      description: workOrder.title || workOrder.service_category || "Work Order",
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: `Created from Work Order #${workOrder.work_order_number}`,
    });

    if (lineItemError) {
      await supabase.from("jobs").delete().eq("id", job.id);
      return errorResponse(lineItemError.message, 500);
    }

    const { error: workOrderUpdateError } = await supabase
      .from("work_orders")
      .update({ status: "approved" })
      .eq("id", workOrder.id);

    if (workOrderUpdateError) {
      return errorResponse(workOrderUpdateError.message, 500);
    }

    return NextResponse.json({ job, alreadyExists: false }, { status: 201 });
  }

  if (action === "assign") {
    const jobId = String(body.job_id ?? "");
    const workerId = body.worker_id ? String(body.worker_id) : null;
    const contractorId = body.contractor_id ? String(body.contractor_id) : null;

    if (!jobId || Number(Boolean(workerId)) + Number(Boolean(contractorId)) !== 1) {
      return errorResponse("Choose exactly one worker or contractor.");
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return errorResponse(jobError?.message ?? "Job not found.", jobError ? 500 : 404);
    }

    if (workerId) {
      const { data: worker } = await supabase
        .from("profiles")
        .select("id, active, role")
        .eq("id", workerId)
        .eq("role", "worker")
        .maybeSingle();

      if (!worker?.active) {
        return errorResponse("Active worker not found.", 404);
      }
    }

    if (contractorId) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id, active")
        .eq("id", contractorId)
        .maybeSingle();

      if (!contractor?.active) {
        return errorResponse("Active contractor not found.", 404);
      }
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("job_assignments")
      .insert({
        job_id: jobId,
        worker_id: workerId,
        contractor_id: contractorId,
        assigned_by: user.id,
        status: "assigned",
        notes: String(body.notes ?? "") || null,
      })
      .select("id, job_id, worker_id, contractor_id, status, assigned_at")
      .single();

    if (assignmentError || !assignment) {
      return errorResponse(assignmentError?.message ?? "Unable to assign Job.", 500);
    }

    const { error: statusError } = await supabase
      .from("jobs")
      .update({ status: "assigned" })
      .eq("id", jobId);

    if (statusError) {
      return errorResponse(statusError.message, 500);
    }

    return NextResponse.json({ assignment });
  }

  if (action === "assignment_status") {
    const assignmentId = String(body.assignment_id ?? "");
    const status = String(body.status ?? "");

    if (!assignmentId || !ASSIGNMENT_STATUSES.has(status)) {
      return errorResponse("Valid assignment_id and assignment status are required.");
    }

    const patch: Record<string, string | null> = { status };
    const now = new Date().toISOString();

    if (status === "accepted") patch.accepted_at = now;
    if (status === "in_progress") patch.accepted_at = now;
    if (status === "completed") patch.completed_at = now;
    if (status === "removed") patch.removed_at = now;

    const { data: assignment, error } = await supabase
      .from("job_assignments")
      .update(patch)
      .eq("id", assignmentId)
      .select("id, job_id, status, accepted_at, completed_at, removed_at")
      .single();

    if (error || !assignment) {
      return errorResponse(error?.message ?? "Unable to update assignment.", 500);
    }

    if (status === "accepted" || status === "in_progress") {
      await supabase.from("jobs").update({ status }).eq("id", assignment.job_id);
    }

    if (status === "completed") {
      await supabase.from("jobs").update({ status: "completed", completed_at: now }).eq("id", assignment.job_id);
    }

    return NextResponse.json({ assignment });
  }

  if (action === "status") {
    const jobId = String(body.job_id ?? "");
    const status = String(body.status ?? "");

    if (!jobId || !JOB_STATUSES.has(status)) {
      return errorResponse("Valid job_id and Job status are required.");
    }

    const patch: Record<string, string> = { status };
    const now = new Date().toISOString();

    if (status === "in_progress") patch.started_at = now;
    if (status === "completed") patch.completed_at = now;

    const { data: job, error } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", jobId)
      .select("id, job_number, status, started_at, completed_at")
      .single();

    if (error || !job) {
      return errorResponse(error?.message ?? "Unable to update Job.", 500);
    }

    return NextResponse.json({ job });
  }

  if (action === "line_item") {
    const jobId = String(body.job_id ?? "");
    const description = String(body.description ?? "").trim();
    const quantity = Number(body.quantity ?? 0);
    const unitPrice = Number(body.unit_price ?? 0);

    if (!jobId || !description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return errorResponse("Job, description, positive quantity, and non-negative unit price are required.");
    }

    const totalPrice = Number((quantity * unitPrice).toFixed(2));

    const { data: item, error } = await supabase
      .from("job_line_items")
      .insert({
        job_id: jobId,
        description,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        notes: String(body.notes ?? "") || null,
      })
      .select("id, job_id, description, quantity, unit_price, total_price, notes")
      .single();

    if (error || !item) {
      return errorResponse(error?.message ?? "Unable to add line item.", 500);
    }

    return NextResponse.json({ item }, { status: 201 });
  }

  if (action === "photo" || action === "document") {
    const jobId = String(body.job_id ?? "");
    const storagePath = String(body.storage_path ?? "").trim();

    if (!jobId || !storagePath) {
      return errorResponse("Job and storage path are required.");
    }

    if (action === "photo") {
      const { data, error } = await supabase
        .from("job_photos")
        .insert({
          job_id: jobId,
          uploaded_by: user.id,
          photo_type: String(body.photo_type ?? "completion"),
          storage_path: storagePath,
          caption: String(body.caption ?? "") || null,
        })
        .select("id, job_id, storage_path, photo_type, caption, created_at")
        .single();

      if (error || !data) return errorResponse(error?.message ?? "Unable to add photo record.", 500);
      return NextResponse.json({ photo: data }, { status: 201 });
    }

    const { data, error } = await supabase
      .from("job_documents")
      .insert({
        job_id: jobId,
        uploaded_by: user.id,
        document_type: String(body.document_type ?? "completion"),
        storage_path: storagePath,
        file_name: String(body.file_name ?? storagePath.split("/").pop() ?? "document"),
      })
      .select("id, job_id, storage_path, document_type, file_name, created_at")
      .single();

    if (error || !data) return errorResponse(error?.message ?? "Unable to add document record.", 500);
    return NextResponse.json({ document: data }, { status: 201 });
  }

  if (action === "signoff") {
    const jobId = String(body.job_id ?? "");
    const representativeName = String(body.representative_name ?? "").trim();

    if (!jobId || !representativeName) {
      return errorResponse("Job and representative name are required.");
    }

    const { data: signoff, error } = await supabase
      .from("job_signoffs")
      .insert({
        job_id: jobId,
        representative_name: representativeName,
        representative_title: String(body.representative_title ?? "") || null,
        signature_storage_path: String(body.signature_storage_path ?? "") || null,
        signed_at: new Date().toISOString(),
        approved: Boolean(body.approved),
        notes: String(body.notes ?? "") || null,
      })
      .select("id, job_id, representative_name, representative_title, signature_storage_path, signed_at, approved, notes")
      .single();

    if (error || !signoff) {
      return errorResponse(error?.message ?? "Unable to record sign-off.", 500);
    }

    const nextStatus = Boolean(body.approved) ? "signed_off" : "awaiting_signoff";
    await supabase.from("jobs").update({ status: nextStatus }).eq("id", jobId);

    return NextResponse.json({ signoff }, { status: 201 });
  }

  return errorResponse("Unknown workflow action.");
}
