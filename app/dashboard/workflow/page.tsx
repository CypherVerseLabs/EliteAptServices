"use client";

import { useEffect, useState } from "react";

type WorkOrder = { id: string; work_order_number: number | null; title: string | null; service_category: string | null; status: string | null; pricing_total: number | null };
type Job = { id: string; job_number: number | null; work_order_id: string; title: string | null; status: string | null; scheduled_date: string | null; due_date: string | null };
type Worker = { id: string; first_name: string | null; last_name: string | null; email: string | null };
type Contractor = { id: string; first_name: string | null; last_name: string | null; specialty: string | null };
type Assignment = { id: string; job_id: string; worker_id: string | null; contractor_id: string | null; status: string | null };

type Data = { workOrders: WorkOrder[]; jobs: Job[]; workers: Worker[]; contractors: Contractor[]; assignments: Assignment[] };

const empty: Data = { workOrders: [], jobs: [], workers: [], contractors: [], assignments: [] };

export default function WorkflowPage() {
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [worker, setWorker] = useState("");
  const [contractor, setContractor] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/jobs/workflow", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to load workflow.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workflow.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function run(payload: Record<string, unknown>) {
    setBusy(String(payload.action)); setError(""); setMessage("");
    try {
      const response = await fetch("/api/jobs/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Workflow action failed.");
      setMessage("Workflow updated successfully."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Workflow action failed."); }
    finally { setBusy(""); }
  }

  const assignmentFor = (jobId: string) => data.assignments.find((item) => item.job_id === jobId && item.status !== "removed");
  const workerName = (id: string | null) => { const item = data.workers.find((worker) => worker.id === id); return item ? `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() : "Worker"; };
  const contractorName = (id: string | null) => { const item = data.contractors.find((contractor) => contractor.id === id); return item ? `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() : "Contractor"; };

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-6xl rounded-2xl bg-white p-10 text-center shadow-sm">Loading Operations Workflow…</div></main>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-blue-600">Operations</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Work Order → Job Workflow</h1>
        <p className="mt-2 text-sm text-slate-500">Convert approved Work Orders, assign field personnel, monitor completion, and manage sign-off.</p>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Work Orders ready for Job creation</h2>
          <div className="mt-4 space-y-3">
            {data.workOrders.filter((wo) => !data.jobs.some((job) => job.work_order_id === wo.id)).map((wo) => (
              <div key={wo.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold text-slate-900">WO-{wo.work_order_number ?? wo.id.slice(0, 8)}</p><p className="text-sm text-slate-500">{wo.title ?? wo.service_category ?? "Work Order"} · ${Number(wo.pricing_total ?? 0).toFixed(2)}</p></div>
                <button disabled={busy === "create_job"} onClick={() => void run({ action: "create_job", work_order_id: wo.id })} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create Job</button>
              </div>
            ))}
            {data.workOrders.filter((wo) => !data.jobs.some((job) => job.work_order_id === wo.id)).length === 0 && <p className="text-sm text-slate-500">No unconverted Work Orders.</p>}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {data.jobs.map((job) => {
            const assignment = assignmentFor(job.id);
            return <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white">JOB-{job.job_number ?? job.id.slice(0, 8)}</span><h2 className="mt-3 text-xl font-bold text-slate-900">{job.title ?? "Untitled Job"}</h2><p className="text-sm text-slate-500">{job.scheduled_date ?? "Not scheduled"} · {job.due_date ?? "No due date"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{(job.status ?? "open").replaceAll("_", " ")}</span></div>
              <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assignment</p><p className="mt-1 font-semibold text-slate-800">{assignment?.worker_id ? workerName(assignment.worker_id) : assignment?.contractor_id ? contractorName(assignment.contractor_id) : "Unassigned"}</p><p className="text-sm text-slate-500">{assignment?.status ?? "No assignment"}</p></div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select value={worker} onChange={(event) => { setWorker(event.target.value); setContractor(""); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Assign worker…</option>{data.workers.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>)}</select>
                <select value={contractor} onChange={(event) => { setContractor(event.target.value); setWorker(""); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Assign contractor…</option>{data.contractors.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name}{item.specialty ? ` · ${item.specialty}` : ""}</option>)}</select>
                <button disabled={(!worker && !contractor) || busy === "assign"} onClick={() => void run({ action: "assign", job_id: job.id, worker_id: worker || undefined, contractor_id: contractor || undefined })} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Assign</button>
              </div>
              {assignment && <div className="mt-4 flex flex-wrap gap-2">{assignment.status === "assigned" && <button onClick={() => void run({ action: "assignment_status", assignment_id: assignment.id, status: "accepted" })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">Mark Accepted</button>}{assignment.status === "accepted" && <button onClick={() => void run({ action: "assignment_status", assignment_id: assignment.id, status: "in_progress" })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">Mark In Progress</button>}{assignment.status === "in_progress" && <button onClick={() => void run({ action: "assignment_status", assignment_id: assignment.id, status: "completed" })} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white">Mark Completed</button>}<a href={`/dashboard/jobs/${job.id}`} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">Open Job</a></div>}
            </article>;
          })}
        </section>
      </div>
    </main>
  );
}
