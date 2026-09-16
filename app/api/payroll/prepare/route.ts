import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = new Set(["owner", "field_manager", "office"]);
function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return fail("Authentication required.", 401);

  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", authData.user.id).maybeSingle();
  if (!profile?.active || !STAFF_ROLES.has(String(profile.role))) return fail("Staff access required.", 403);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return fail("Request body must be valid JSON."); }
  const jobId = String(body.job_id ?? "");
  if (!jobId) return fail("job_id is required.");

  const { data: job, error: jobError } = await supabase.from("jobs").select("id, status, completed_at").eq("id", jobId).maybeSingle();
  if (jobError) return fail(jobError.message, 500);
  if (!job) return fail("Job not found.", 404);
  if (!new Set(["signed_off", "approved", "payroll_ready"]).has(String(job.status))) return fail("Job must be signed off or approved before payroll preparation.", 422);

  const { data: assignment, error: assignmentError } = await supabase.from("job_assignments").select("worker_id, contractor_id, status").eq("job_id", jobId).eq("status", "completed").order("assigned_at", { ascending: false }).limit(1).maybeSingle();
  if (assignmentError) return fail(assignmentError.message, 500);
  if (!assignment?.worker_id) return fail("Payroll can only be prepared for a completed Worker assignment. Contractor payment is not represented by payroll_items.", 422);

  const { data: items, error: itemError } = await supabase.from("job_line_items").select("id, total_price").eq("job_id", jobId);
  if (itemError) return fail(itemError.message, 500);
  const billable = (items ?? []).reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);
  const gross = Number((billable * 0.6).toFixed(2));
  const completedDate = job.completed_at ? new Date(job.completed_at) : new Date();
  const day = completedDate.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStartDate = new Date(Date.UTC(completedDate.getUTCFullYear(), completedDate.getUTCMonth(), completedDate.getUTCDate() + diffToMonday));
  const weekEndDate = new Date(weekStartDate); weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  const isoDate = (date: Date) => date.toISOString().slice(0, 10);

  let { data: period, error: periodError } = await supabase.from("payroll_periods").select("id, status").eq("week_start", isoDate(weekStartDate)).eq("week_end", isoDate(weekEndDate)).maybeSingle();
  if (periodError) return fail(periodError.message, 500);
  if (!period) {
    const created = await supabase.from("payroll_periods").insert({ week_start: isoDate(weekStartDate), week_end: isoDate(weekEndDate), status: "draft" }).select("id, status").single();
    if (created.error || !created.data) return fail(created.error?.message ?? "Unable to create payroll period.", 500);
    period = created.data;
  }

  const { data: existingLink } = await supabase.from("payroll_job_items").select("id, payroll_item_id").eq("job_id", jobId).maybeSingle();
  if (existingLink) {
    await supabase.from("jobs").update({ status: "payroll_ready" }).eq("id", jobId);
    return NextResponse.json({ alreadyPrepared: true, payrollItemId: existingLink.payroll_item_id });
  }

  const { data: payrollItem, error: payrollError } = await supabase.from("payroll_items").insert({ payroll_period_id: period.id, worker_id: assignment.worker_id, gross_amount: gross, deductions: 0, net_amount: gross, notes: `60% Worker share for Job ${jobId}` }).select("id, payroll_period_id, worker_id, gross_amount, deductions, net_amount").single();
  if (payrollError || !payrollItem) return fail(payrollError?.message ?? "Unable to create payroll item.", 500);

  const { error: linkError } = await supabase.from("payroll_job_items").insert({ payroll_item_id: payrollItem.id, job_id: jobId, amount: gross });
  if (linkError) return fail(linkError.message, 500);

  await supabase.from("payroll_periods").update({ status: "ready" }).eq("id", period.id).eq("status", "draft");
  await supabase.from("jobs").update({ status: "payroll_ready" }).eq("id", jobId);

  return NextResponse.json({ alreadyPrepared: false, payrollItem });
}
