import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ASSIGNMENT_STATUSES = new Set(["accepted", "declined", "in_progress", "completed"]);

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getContractor() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) return { supabase, contractor: null, response: fail("Authentication required.", 401) };

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, email, active, role").eq("id", authData.user.id).maybeSingle();
  if (profileError) return { supabase, contractor: null, response: fail(profileError.message, 500) };
  if (!profile?.active || profile.role !== "contractor") return { supabase, contractor: null, response: fail("Contractor access required.", 403) };

  const { data: contractor, error: contractorError } = await supabase.from("contractors").select("id, first_name, last_name, email, phone, specialty, active").eq("id", profile.id).eq("active", true).maybeSingle();
  if (contractorError) return { supabase, contractor: null, response: fail(contractorError.message, 500) };
  if (!contractor || contractor.email?.toLowerCase() !== profile.email?.toLowerCase()) return { supabase, contractor: null, response: fail("Active contractor record not found.", 403) };

  return { supabase, contractor, response: null };
}

export async function GET() {
  const { supabase, contractor, response } = await getContractor();
  if (response || !contractor) return response ?? fail("Authentication required.", 401);

  const { data: assignments, error: assignmentsError } = await supabase.from("job_assignments").select("id, job_id, contractor_id, status, assigned_at, accepted_at, completed_at, removed_at, notes").eq("contractor_id", contractor.id).neq("status", "removed").order("assigned_at", { ascending: false });
  if (assignmentsError) return fail(assignmentsError.message, 500);

  const jobIds = (assignments ?? []).map((assignment) => assignment.job_id);
  if (jobIds.length === 0) return NextResponse.json({ assignments: [], jobs: [], lineItems: [], photos: [], documents: [], signoffs: [] });

  const [jobsResult, lineItemsResult, photosResult, documentsResult, signoffsResult] = await Promise.all([
    supabase.from("jobs").select("id, job_number, work_order_id, property_id, unit_id, service_category, title, description, status, scheduled_date, due_date, started_at, completed_at, total_amount").in("id", jobIds).order("scheduled_date", { ascending: true }),
    supabase.from("job_line_items").select("id, job_id, description, quantity, unit_price, total_price, notes").in("job_id", jobIds).order("created_at", { ascending: true }),
    supabase.from("job_photos").select("id, job_id, photo_type, storage_path, caption, created_at").in("job_id", jobIds).order("created_at", { ascending: false }),
    supabase.from("job_documents").select("id, job_id, document_type, storage_path, file_name, created_at").in("job_id", jobIds).order("created_at", { ascending: false }),
    supabase.from("job_signoffs").select("id, job_id, representative_name, representative_title, signed_at, approved, notes, created_at").in("job_id", jobIds).order("created_at", { ascending: false }),
  ]);

  const failed = [jobsResult, lineItemsResult, photosResult, documentsResult, signoffsResult].find((result) => result.error);
  if (failed?.error) return fail(failed.error.message, 500);

  return NextResponse.json({ assignments: assignments ?? [], jobs: jobsResult.data ?? [], lineItems: lineItemsResult.data ?? [], photos: photosResult.data ?? [], documents: documentsResult.data ?? [], signoffs: signoffsResult.data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, contractor, response } = await getContractor();
  if (response || !contractor) return response ?? fail("Authentication required.", 401);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return fail("Request body must be valid JSON."); }

  const action = String(body.action ?? "");
  const jobId = String(body.job_id ?? "");
  if (!jobId) return fail("job_id is required.");

  const { data: assignment, error: assignmentError } = await supabase.from("job_assignments").select("id, job_id, contractor_id, status").eq("job_id", jobId).eq("contractor_id", contractor.id).neq("status", "removed").order("assigned_at", { ascending: false }).limit(1).maybeSingle();
  if (assignmentError) return fail(assignmentError.message, 500);
  if (!assignment) return fail("You are not assigned to this Job.", 403);

  if (action === "assignment_status") {
    const status = String(body.status ?? "");
    if (!ASSIGNMENT_STATUSES.has(status)) return fail("Invalid assignment status.");
    const { error: rpcError } = await supabase.rpc("contractor_update_assignment_status", { p_assignment_id: assignment.id, p_status: status });
    if (rpcError) return fail(rpcError.message, 500);
    const { data: updated, error: updatedError } = await supabase.from("job_assignments").select("id, job_id, contractor_id, status, assigned_at, accepted_at, completed_at, removed_at, notes").eq("id", assignment.id).single();
    if (updatedError || !updated) return fail(updatedError?.message ?? "Unable to reload assignment.", 500);
    return NextResponse.json({ assignment: updated });
  }

  if (action === "line_item") {
    const description = String(body.description ?? "").trim();
    const quantity = Number(body.quantity ?? 0);
    const unitPrice = Number(body.unit_price ?? 0);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return fail("Description, positive quantity, and non-negative unit price are required.");
    const totalPrice = Number((quantity * unitPrice).toFixed(2));
    const { data, error } = await supabase.from("job_line_items").insert({ job_id: jobId, description, quantity, unit_price: unitPrice, total_price: totalPrice, notes: String(body.notes ?? "") || null }).select("id, job_id, description, quantity, unit_price, total_price, notes").single();
    if (error || !data) return fail(error?.message ?? "Unable to add Work Performed item.", 500);
    return NextResponse.json({ item: data }, { status: 201 });
  }

  if (action === "photo") {
    const storagePath = String(body.storage_path ?? "").trim();
    if (!storagePath) return fail("storage_path is required.");
    const { data, error } = await supabase.from("job_photos").insert({ job_id: jobId, uploaded_by: contractor.id, photo_type: String(body.photo_type ?? "work_performed"), storage_path: storagePath, caption: String(body.caption ?? "") || null }).select("id, job_id, photo_type, storage_path, caption, created_at").single();
    if (error || !data) return fail(error?.message ?? "Unable to save photo record.", 500);
    return NextResponse.json({ photo: data }, { status: 201 });
  }

  if (action === "document") {
    const storagePath = String(body.storage_path ?? "").trim();
    if (!storagePath) return fail("storage_path is required.");
    const { data, error } = await supabase.from("job_documents").insert({ job_id: jobId, uploaded_by: contractor.id, document_type: String(body.document_type ?? "work_performed"), storage_path: storagePath, file_name: String(body.file_name ?? storagePath.split("/").pop() ?? "document") }).select("id, job_id, document_type, storage_path, file_name, created_at").single();
    if (error || !data) return fail(error?.message ?? "Unable to save document record.", 500);
    return NextResponse.json({ document: data }, { status: 201 });
  }

  if (action === "signoff") {
    const representativeName = String(body.representative_name ?? "").trim();
    if (!representativeName) return fail("representative_name is required.");
    const approved = Boolean(body.approved);
    const { data, error } = await supabase.from("job_signoffs").insert({ job_id: jobId, representative_name: representativeName, representative_title: String(body.representative_title ?? "") || null, signature_storage_path: String(body.signature_storage_path ?? "") || null, signed_at: new Date().toISOString(), approved, notes: String(body.notes ?? "") || null }).select("id, job_id, representative_name, representative_title, signed_at, approved, notes").single();
    if (error || !data) return fail(error?.message ?? "Unable to record sign-off.", 500);
    await supabase.from("jobs").update({ status: approved ? "signed_off" : "awaiting_signoff" }).eq("id", jobId);
    return NextResponse.json({ signoff: data }, { status: 201 });
  }

  return fail("Unknown contractor workflow action.");
}
