import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ASSIGNMENT_STATUSES = new Set([
  "accepted",
  "declined",
  "in_progress",
  "completed",
]);

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getWorker() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { supabase, user: null, response: fail("Authentication required.", 401) };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, active, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error) return { supabase, user: null, response: fail(error.message, 500) };

  if (!profile?.active || profile.role !== "worker") {
    return { supabase, user: null, response: fail("Worker access required.", 403) };
  }

  return { supabase, user: profile, response: null };
}

async function notify(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  title: string,
  message: string,
  type: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });
}

export async function GET() {
  const { supabase, user, response } = await getWorker();

  if (response || !user) return response ?? fail("Authentication required.", 401);

  const { data: assignments, error } = await supabase
    .from("job_assignments")
    .select("id, job_id, worker_id, status, assigned_at, accepted_at, completed_at, notes")
    .eq("worker_id", user.id)
    .neq("status", "removed")
    .order("assigned_at", { ascending: false });

  if (error) return fail(error.message, 500);

  const jobIds = (assignments ?? []).map((item) => item.job_id);

  if (jobIds.length === 0) {
    return NextResponse.json({ assignments: [], jobs: [], lineItems: [], photos: [], documents: [] });
  }

  const [jobsResult, lineItemsResult, photosResult, documentsResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, job_number, work_order_id, property_id, unit_id, service_category, title, description, status, scheduled_date, due_date, started_at, completed_at, total_amount")
      .in("id", jobIds)
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("job_line_items")
      .select("id, job_id, description, quantity, unit_price, total_price, notes")
      .in("job_id", jobIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("job_photos")
      .select("id, job_id, photo_type, storage_path, caption, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_documents")
      .select("id, job_id, document_type, storage_path, file_name, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false }),
  ]);

  const failed = [jobsResult, lineItemsResult, photosResult, documentsResult].find((item) => item.error);
  if (failed?.error) return fail(failed.error.message, 500);

  return NextResponse.json({
    assignments: assignments ?? [],
    jobs: jobsResult.data ?? [],
    lineItems: lineItemsResult.data ?? [],
    photos: photosResult.data ?? [],
    documents: documentsResult.data ?? [],
  });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await getWorker();

  if (response || !user) return response ?? fail("Authentication required.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("Request body must be valid JSON.");
  }

  const action = String(body.action ?? "");
  const jobId = String(body.job_id ?? "");

  if (!jobId) return fail("job_id is required.");

  const { data: assignment, error: assignmentError } = await supabase
    .from("job_assignments")
    .select("id, job_id, worker_id, status")
    .eq("job_id", jobId)
    .eq("worker_id", user.id)
    .neq("status", "removed")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError) return fail(assignmentError.message, 500);
  if (!assignment) return fail("You are not assigned to this Job.", 403);

  const now = new Date().toISOString();

  if (action === "assignment_status") {
    const status = String(body.status ?? "");
    if (!ASSIGNMENT_STATUSES.has(status)) return fail("Invalid assignment status.");

    const patch: Record<string, string> = { status };
    if (status === "accepted") patch.accepted_at = now;
    if (status === "in_progress") patch.accepted_at = now;
    if (status === "completed") patch.completed_at = now;

    const { data: updated, error } = await supabase
      .from("job_assignments")
      .update(patch)
      .eq("id", assignment.id)
      .select("id, job_id, status, accepted_at, completed_at")
      .single();

    if (error || !updated) return fail(error?.message ?? "Unable to update assignment.", 500);

    const jobStatus = status === "accepted" ? "accepted" : status === "in_progress" ? "in_progress" : status === "completed" ? "completed" : "assigned";
    const jobPatch: Record<string, string> = { status: jobStatus };
    if (status === "in_progress") jobPatch.started_at = now;
    if (status === "completed") jobPatch.completed_at = now;

    await supabase.from("jobs").update(jobPatch).eq("id", jobId);

    await notify(
      supabase,
      user.id,
      `Job ${jobStatus.replaceAll("_", " ")}`,
      `Your assigned Job has been updated to ${jobStatus.replaceAll("_", " ")}.`,
      "job_status"
    );

    return NextResponse.json({ assignment: updated });
  }

  if (action === "line_item") {
    const description = String(body.description ?? "").trim();
    const quantity = Number(body.quantity ?? 0);
    const unitPrice = Number(body.unit_price ?? 0);

    if (!description || quantity <= 0 || unitPrice < 0 || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return fail("Description, positive quantity, and non-negative unit price are required.");
    }

    const totalPrice = Number((quantity * unitPrice).toFixed(2));
    const { data, error } = await supabase
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

    if (error || !data) return fail(error?.message ?? "Unable to add Work Performed item.", 500);

    return NextResponse.json({ item: data }, { status: 201 });
  }

  if (action === "photo") {
    const storagePath = String(body.storage_path ?? "").trim();
    if (!storagePath) return fail("storage_path is required.");

    const { data, error } = await supabase
      .from("job_photos")
      .insert({
        job_id: jobId,
        uploaded_by: user.id,
        photo_type: String(body.photo_type ?? "work_performed"),
        storage_path: storagePath,
        caption: String(body.caption ?? "") || null,
      })
      .select("id, job_id, photo_type, storage_path, caption, created_at")
      .single();

    if (error || !data) return fail(error?.message ?? "Unable to save photo record.", 500);
    return NextResponse.json({ photo: data }, { status: 201 });
  }

  if (action === "document") {
    const storagePath = String(body.storage_path ?? "").trim();
    if (!storagePath) return fail("storage_path is required.");

    const { data, error } = await supabase
      .from("job_documents")
      .insert({
        job_id: jobId,
        uploaded_by: user.id,
        document_type: String(body.document_type ?? "work_performed"),
        storage_path: storagePath,
        file_name: String(body.file_name ?? storagePath.split("/").pop() ?? "document"),
      })
      .select("id, job_id, document_type, storage_path, file_name, created_at")
      .single();

    if (error || !data) return fail(error?.message ?? "Unable to save document record.", 500);
    return NextResponse.json({ document: data }, { status: 201 });
  }

  if (action === "paperwork") {
    const storagePath = String(body.storage_path ?? "").trim();
    const paperworkType = String(body.paperwork_type ?? "completion").trim();
    if (!storagePath) return fail("storage_path is required.");

    const { data, error } = await supabase
      .from("paperwork_submissions")
      .insert({
        job_id: jobId,
        worker_id: user.id,
        paperwork_type: paperworkType,
        storage_path: storagePath,
        submitted_at: now,
        status: "submitted",
        notes: String(body.notes ?? "") || null,
      })
      .select("id, job_id, worker_id, paperwork_type, storage_path, submitted_at, status, notes")
      .single();

    if (error || !data) return fail(error?.message ?? "Unable to submit paperwork.", 500);

    await supabase.from("jobs").update({ status: "paperwork_submitted" }).eq("id", jobId);
    return NextResponse.json({ paperwork: data }, { status: 201 });
  }

  if (action === "signoff") {
    const representativeName = String(body.representative_name ?? "").trim();
    if (!representativeName) return fail("representative_name is required.");

    const { data, error } = await supabase
      .from("job_signoffs")
      .insert({
        job_id: jobId,
        representative_name: representativeName,
        representative_title: String(body.representative_title ?? "") || null,
        signature_storage_path: String(body.signature_storage_path ?? "") || null,
        signed_at: now,
        approved: Boolean(body.approved),
        notes: String(body.notes ?? "") || null,
      })
      .select("id, job_id, representative_name, representative_title, signature_storage_path, signed_at, approved, notes")
      .single();

    if (error || !data) return fail(error?.message ?? "Unable to record sign-off.", 500);

    await supabase.from("jobs").update({ status: Boolean(body.approved) ? "signed_off" : "awaiting_signoff" }).eq("id", jobId);
    return NextResponse.json({ signoff: data }, { status: 201 });
  }

  return fail("Unknown worker workflow action.");
}
