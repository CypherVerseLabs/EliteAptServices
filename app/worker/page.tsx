"use client";

import { useEffect, useState } from "react";

interface Assignment {
  id: string;
  job_id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface Job {
  id: string;
  job_number: number | null;
  title: string | null;
  description: string | null;
  service_category: string | null;
  status: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  total_amount: number | null;
}

interface LineItem {
  id: string;
  job_id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
}

interface WorkflowData {
  assignments: Assignment[];
  jobs: Job[];
  lineItems: LineItem[];
}

export default function WorkerPage() {
  const [data, setData] = useState<WorkflowData>({ assignments: [], jobs: [], lineItems: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/worker/jobs", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to load your Jobs.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your Jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function action(payload: Record<string, unknown>) {
    const key = `${String(payload.action)}:${String(payload.job_id ?? "")}`;
    setBusy(key);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/worker/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Workflow update failed.");
      setMessage("Job updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow update failed.");
    } finally {
      setBusy("");
    }
  }

  async function addWork(jobId: string) {
    await action({
      action: "line_item",
      job_id: jobId,
      description: workDescription,
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
    });
    setWorkDescription("");
    setQuantity("1");
    setUnitPrice("0");
  }

  const assignmentFor = (jobId: string) =>
    data.assignments.find((assignment) => assignment.job_id === jobId);

  const itemsFor = (jobId: string) =>
    data.lineItems.filter((item) => item.job_id === jobId);

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center shadow-sm">Loading your Jobs…</div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold text-blue-600">Field Operations</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="mt-2 text-sm text-slate-500">Accept assignments, start work, record Work Performed, submit paperwork, and complete Jobs.</p>
        </header>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

        {data.jobs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No Jobs are currently assigned to you.</div>
        ) : (
          <div className="mt-8 space-y-6">
            {data.jobs.map((job) => {
              const assignment = assignmentFor(job.id);
              const items = itemsFor(job.id);
              const busyKey = (name: string) => `${name}:${job.id}`;
              return (
                <section key={job.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white">JOB-{job.job_number ?? job.id.slice(0, 8).toUpperCase()}</span>
                      <h2 className="mt-4 text-xl font-bold text-slate-900">{job.title ?? "Untitled Job"}</h2>
                      <p className="mt-1 text-sm text-slate-500">{job.service_category ?? "Service"}</p>
                      {job.description && <p className="mt-4 text-sm text-slate-600">{job.description}</p>}
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{(job.status ?? "open").replaceAll("_", " ")}</span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Scheduled</p><p className="mt-1 font-semibold text-slate-800">{job.scheduled_date ?? "Not scheduled"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Due</p><p className="mt-1 font-semibold text-slate-800">{job.due_date ?? "No due date"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Work Performed</p><p className="mt-1 font-semibold text-slate-800">{items.length} line item{items.length === 1 ? "" : "s"}</p></div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {assignment?.status === "assigned" && <button disabled={busy === busyKey("assignment_status")} onClick={() => void action({ action: "assignment_status", job_id: job.id, status: "accepted" })} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Accept Job</button>}
                    {(assignment?.status === "accepted" || job.status === "accepted") && <button disabled={busy === busyKey("assignment_status")} onClick={() => void action({ action: "assignment_status", job_id: job.id, status: "in_progress" })} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Start Work</button>}
                    {job.status === "in_progress" && <button disabled={busy === busyKey("assignment_status")} onClick={() => void action({ action: "assignment_status", job_id: job.id, status: "completed" })} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Complete Work</button>}
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <h3 className="font-bold text-slate-900">Work Performed</h3>
                    <div className="mt-3 space-y-2">
                      {items.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-4"><span className="font-semibold text-slate-800">{item.description}</span><span className="font-semibold text-slate-900">${Number(item.total_price ?? 0).toFixed(2)}</span></div><p className="mt-1 text-slate-500">{item.quantity} × ${Number(item.unit_price ?? 0).toFixed(2)}</p></div>)}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                      <input value={workDescription} onChange={(event) => setWorkDescription(event.target.value)} placeholder="Work performed description" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0.01" step="0.01" placeholder="Qty" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <input value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} type="number" min="0" step="0.01" placeholder="Unit price" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <button disabled={!workDescription.trim() || busy === busyKey("line_item")} onClick={() => void addWork(job.id)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Add</button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
                    <button onClick={() => void action({ action: "paperwork", job_id: job.id, paperwork_type: "completion", storage_path: `pending/${job.id}/completion` })} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Submit Completion Paperwork</button>
                    <button onClick={() => void action({ action: "signoff", job_id: job.id, representative_name: "Property Representative", approved: true })} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Record Property Sign-Off</button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
