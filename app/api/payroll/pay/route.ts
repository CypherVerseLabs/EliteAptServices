import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = new Set(["owner", "field_manager", "office"]);
function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Authentication required.", 401);

  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", user.id).maybeSingle();
  if (!profile?.active || !STAFF_ROLES.has(String(profile.role))) return fail("Staff access required.", 403);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return fail("Request body must be valid JSON."); }
  const jobId = String(body.job_id ?? "").trim();
  const checkNumber = String(body.check_number ?? "").trim();
  if (!jobId) return fail("job_id is required.");
  if (!checkNumber) return fail("check_number is required.");

  const { data: link, error: linkError } = await supabase.from("payroll_job_items").select("id, payroll_item_id, job_id, amount").eq("job_id", jobId).maybeSingle();
  if (linkError) return fail(linkError.message, 500);
  if (!link) return fail("Payroll has not been prepared for this Job.", 422);

  const { data: item, error: itemError } = await supabase.from("payroll_items").select("id, payroll_period_id, worker_id, gross_amount, deductions, net_amount, paid_at").eq("id", link.payroll_item_id).maybeSingle();
  if (itemError) return fail(itemError.message, 500);
  if (!item) return fail("Payroll item not found.", 404);
  if (item.paid_at) return NextResponse.json({ alreadyPaid: true, payrollItem: item });

  const paidAt = new Date().toISOString();
  const { data: updatedItem, error: updateError } = await supabase.from("payroll_items").update({ check_number: checkNumber, paid_at: paidAt }).eq("id", item.id).select("id, payroll_period_id, worker_id, gross_amount, deductions, net_amount, check_number, paid_at").single();
  if (updateError || !updatedItem) return fail(updateError?.message ?? "Unable to mark payroll item paid.", 500);

  const { error: periodError } = await supabase.from("payroll_periods").update({ status: "paid" }).eq("id", item.payroll_period_id);
  if (periodError) return fail(periodError.message, 500);

  const { error: jobError } = await supabase.from("jobs").update({ status: "paid" }).eq("id", jobId);
  if (jobError) return fail(jobError.message, 500);

  return NextResponse.json({ alreadyPaid: false, payrollItem: updatedItem });
}
