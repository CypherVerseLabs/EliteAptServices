"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, DollarSign, FileText, Loader2, PenLine, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Job = { id: string; job_number: number | null; work_order_id: string | null; title: string; status: string; total_amount: number };
type Assignment = { job_id: string; worker_id: string | null; contractor_id: string | null; status: string; completed_at: string | null };
type LineItem = { job_id: string; total_price: number | null };
type Signoff = { job_id: string; approved: boolean; signed_at: string | null };
type Document = { job_id: string; document_type: string | null; file_name: string | null };
type PayrollLink = { job_id: string; payroll_item_id: string };
type PayrollItem = { id: string; paid_at: string | null; check_number: string | null; gross_amount: number };

type Row = Job & { assignment: Assignment | null; total: number; signoff: Signoff | null; hasDocuments: boolean; payroll: PayrollItem | null; prepared: boolean };

function money(value: number) { return value.toLocaleString("en-US", { style: "currency", currency: "USD" }); }
function label(value: string) { return value.replaceAll("_", " "); }

export default function PayrollPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const [jobsResult, assignmentsResult, itemsResult, signoffsResult, documentsResult, linksResult] = await Promise.all([
        supabase.from("jobs").select("id, job_number, work_order_id, title, status, total_amount").order("created_at", { ascending: false }).limit(100),
        supabase.from("job_assignments").select("job_id, worker_id, contractor_id, status, completed_at").neq("status", "removed").order("assigned_at", { ascending: false }),
        supabase.from("job_line_items").select("job_id, total_price"),
        supabase.from("job_signoffs").select("job_id, approved, signed_at").order("created_at", { ascending: false }),
        supabase.from("job_documents").select("job_id, document_type, file_name"),
        supabase.from("payroll_job_items").select("job_id, payroll_item_id"),
      ]);
      const failed = [jobsResult, assignmentsResult, itemsResult, signoffsResult, documentsResult, linksResult].find((result) => result.error);
      if (failed?.error) throw new Error(failed.error.message);

      const links = (linksResult.data ?? []) as PayrollLink[];
      const payrollIds = links.map((link) => link.payroll_item_id);
      let payrollItems: PayrollItem[] = [];
      if (payrollIds.length) {
        const result = await supabase.from("payroll_items").select("id, paid_at, check_number, gross_amount").in("id", payrollIds);
        if (result.error) throw new Error(result.error.message);
        payrollItems = (result.data ?? []) as PayrollItem[];
      }

      const assignments = (assignmentsResult.data ?? []) as Assignment[];
      const items = (itemsResult.data ?? []) as LineItem[];
      const signoffs = (signoffsResult.data ?? []) as Signoff[];
      const documents = (documentsResult.data ?? []) as Document[];
      const jobs = (jobsResult.data ?? []) as Job[];
      const assignmentMap = new Map<string, Assignment>();
      assignments.forEach((item) => { if (!assignmentMap.has(item.job_id)) assignmentMap.set(item.job_id, item); });
      const totalMap = new Map<string, number>();
      items.forEach((item) => totalMap.set(item.job_id, (totalMap.get(item.job_id) ?? 0) + Number(item.total_price ?? 0)));
      const signoffMap = new Map<string, Signoff>();
      signoffs.forEach((item) => { if (!signoffMap.has(item.job_id)) signoffMap.set(item.job_id, item); });
      const documentSet = new Set<string>(documents.map((item) => item.job_id));
      const payrollMap = new Map<string, PayrollItem>();
      links.forEach((link) => { const item = payrollItems.find((candidate) => candidate.id === link.payroll_item_id); if (item) payrollMap.set(link.job_id, item); });

      setRows(jobs.filter((job) => assignmentMap.has(job.id) || totalMap.has(job.id)).map((job) => {
        const assignment = assignmentMap.get(job.id) ?? null;
        const signoff = signoffMap.get(job.id) ?? null;
        const total = totalMap.get(job.id) ?? Number(job.total_amount ?? 0);
        const payroll = payrollMap.get(job.id) ?? null;
        return { ...job, assignment, total, signoff, hasDocuments: documentSet.has(job.id), payroll, prepared: Boolean(payroll) };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payroll.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function prepare(jobId: string) {
    setBusy(`prepare:${jobId}`); setError(""); setMessage("");
    try {
      const response = await fetch("/api/payroll/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: jobId }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to prepare payroll.");
      setMessage(json.alreadyPrepared ? "Payroll was already prepared." : "Payroll item prepared successfully.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to prepare payroll."); }
    finally { setBusy(""); }
  }

  async function markPaid(jobId: string) {
    const checkNumber = window.prompt("Enter the payroll check number:");
    if (!checkNumber?.trim()) return;
    setBusy(`pay:${jobId}`); setError(""); setMessage("");
    try {
      const response = await fetch("/api/payroll/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: jobId, check_number: checkNumber.trim() }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to mark payroll paid.");
      setMessage(json.alreadyPaid ? "Payroll was already marked paid." : "Payroll marked paid.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to mark payroll paid."); }
    finally { setBusy(""); }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
        <div className="mt-6"><p className="text-sm font-semibold text-blue-600">Finance</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Payroll</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Review completed Jobs, verify paperwork and sign-off, prepare worker payroll, and record payment.</p></div>
        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Jobs</p><p className="mt-2 text-3xl font-bold">{loading ? "—" : rows.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Prepared</p><p className="mt-2 text-3xl font-bold text-blue-600">{loading ? "—" : rows.filter((row) => row.prepared).length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Paid</p><p className="mt-2 text-3xl font-bold text-green-600">{loading ? "—" : rows.filter((row) => row.payroll?.paid_at).length}</p></div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5"><h2 className="text-lg font-bold text-slate-900">Payroll Review</h2><p className="mt-1 text-sm text-slate-500">A Job becomes payroll-ready after completion, sign-off, and required documentation.</p></div>
          {loading ? <div className="p-10 text-center text-slate-500">Loading payroll…</div> : rows.length === 0 ? <div className="p-10 text-center text-slate-500">No assigned Jobs are available for payroll.</div> : <div className="divide-y divide-slate-100">
            {rows.map((row) => {
              const completed = row.assignment?.status === "completed" || row.status === "completed" || row.status === "signed_off" || row.status === "approved" || row.status === "payroll_ready" || row.status === "paid";
              const approved = Boolean(row.signoff?.approved);
              const ready = completed && approved && row.hasDocuments && row.total > 0;
              return <div key={row.id} className="px-6 py-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.payroll?.paid_at ? "bg-green-100 text-green-700" : row.prepared ? "bg-blue-100 text-blue-700" : ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{row.payroll?.paid_at ? "Paid" : row.prepared ? "Prepared" : ready ? "Ready" : "Needs Attention"}</span><span className="text-xs text-slate-400">{row.job_number ? `JOB-${row.job_number}` : row.id}</span></div><h3 className="mt-2 font-semibold text-slate-900">{row.title}</h3><div className="mt-2 flex flex-wrap gap-4 text-xs"><span className={completed ? "text-green-600" : "text-amber-600"}><Clock3 className="mr-1 inline h-3.5 w-3.5" />{label(row.status)}</span><span className={approved ? "text-green-600" : "text-amber-600"}><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{approved ? "Sign-off approved" : "Sign-off pending"}</span><span className={row.hasDocuments ? "text-green-600" : "text-red-600"}><FileText className="mr-1 inline h-3.5 w-3.5" />{row.hasDocuments ? "Documents received" : "Documents missing"}</span><span className="text-slate-500"><Users className="mr-1 inline h-3.5 w-3.5" />{row.assignment?.worker_id ? "Worker" : row.assignment?.contractor_id ? "Contractor" : "Unassigned"}</span></div></div>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"><div className="text-right"><p className="text-xs text-slate-400">Job total</p><p className="text-lg font-bold text-slate-900">{money(row.total)}</p></div>{!row.prepared && <button type="button" disabled={!ready || busy === `prepare:${row.id}`} onClick={() => void prepare(row.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy === `prepare:${row.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}Prepare Payroll</button>}{row.prepared && !row.payroll?.paid_at && <button type="button" disabled={busy === `pay:${row.id}`} onClick={() => void markPaid(row.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === `pay:${row.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Mark Paid</button>}</div>
              </div></div>;
            })}
          </div>}
        </section>

        <div className="mt-6 mb-10 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500"><PenLine className="mr-2 inline h-4 w-4" />Payroll preparation is restricted to completed Worker assignments. Contractor assignments are not inserted into the worker payroll tables.</div>
      </div>
    </main>
  );
}
