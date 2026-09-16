"use client";

import { useEffect, useState } from "react";

type Assignment = { id: string; job_id: string; status: string };
type Job = { id: string; job_number: number | null; title: string | null; description: string | null; service_category: string | null; status: string | null; scheduled_date: string | null; due_date: string | null };
type LineItem = { id: string; job_id: string; description: string | null; quantity: number | null; unit_price: number | null; total_price: number | null };
type Data = { assignments: Assignment[]; jobs: Job[]; lineItems: LineItem[] };

export default function WorkerPage() {
  const [data, setData] = useState<Data>({ assignments: [], jobs: [], lineItems: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [paperworkPath, setPaperworkPath] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeTitle, setRepresentativeTitle] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/worker/jobs", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to load your Jobs.");
      setData(json);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load your Jobs."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function action(payload: Record<string, unknown>) {
    const key = `${String(payload.action)}:${String(payload.job_id ?? "")}`;
    setBusy(key); setError(""); setMessage("");
    try {
      const response = await fetch("/api/worker/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Workflow update failed.");
      setMessage("Job updated successfully."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Workflow update failed."); }
    finally { setBusy(""); }
  }

  async function upload(jobId: string, kind: "photo" | "document", file: File | undefined) {
    if (!file) return;
    setBusy(`${kind}:${jobId}`); setError(""); setMessage("");
    try {
      const form = new FormData();
      form.set("job_id", jobId); form.set("kind", kind); form.set("file", file);
      const response = await fetch("/api/jobs/files", { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Upload failed.");
      setMessage(`${kind === "photo" ? "Photo" : "Document"} uploaded successfully.`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setBusy(""); }
  }

  const assignmentFor = (jobId: string) => data.assignments.find((item) => item.job_id === jobId);
  const itemsFor = (jobId: string) => data.lineItems.filter((item) => item.job_id === jobId);

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center shadow-sm">Loading your Jobs…</div></main>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-blue-600">Field Operations</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">My Jobs</h1>
        <p className="mt-2 text-sm text-slate-500">Accept assignments, start work, record Work Performed, upload job evidence, submit paperwork, and complete Jobs.</p>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

        {data.jobs.length === 0 ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No Jobs are currently assigned to you.</div> : <div className="mt-8 space-y-6">
          {data.jobs.map((job) => {
            const assignment = assignmentFor(job.id); const items = itemsFor(job.id); const key = (actionName: string) => `${actionName}:${job.id}`;
            return <section key={job.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div><span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white">JOB-{job.job_number ?? job.id.slice(0, 8).toUpperCase()}</span><h2 className="mt-4 text-xl font-bold text-slate-900">{job.title ?? "Untitled Job"}</h2><p className="mt-1 text-sm text-slate-500">{job.service_category ?? "Service"}</p>{job.description && <p className="mt-4 text-sm text-slate-600">{job.description}</p>}</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{(job.status ?? "open").replaceAll("_", " ")}</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {assignment?.status === "assigned" && <button disabled={busy === key("assignment_status")} onClick={() => void action({ action: "assignment_status", job_id: job.id, status: "accepted" })} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Accept Job</button>}
                {(assignment?.status === "accepted" || job.status === "accepted") && <button disabled={busy === key("assignment_status")} onClick={() => void action({ action: "assignment_status", job_id: job.id, status: "in_progress" })} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Start Work</button>}
                {job.status === "in_progress" && <button disabled={busy === key("assignment_status")} onClick={() => void action({ action: "assignment_status", job_id: job.id, status: "completed" })} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Complete Work</button>}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-900">Work Performed</h3>
                <div className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-4"><span className="font-semibold">{item.description}</span><span>${Number(item.total_price ?? 0).toFixed(2)}</span></div><p className="mt-1 text-slate-500">{item.quantity} × ${Number(item.unit_price ?? 0).toFixed(2)}</p></div>)}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Work performed description" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Qty" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Unit price" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <button disabled={!description.trim() || busy === key("line_item")} onClick={() => { void action({ action: "line_item", job_id: job.id, description, quantity: Number(quantity), unit_price: Number(unitPrice) }); setDescription(""); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Add</button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-900">Job Evidence</h3>
                <p className="mt-1 text-xs text-slate-500">Images: JPG, PNG, or WebP. Documents: PDF, JPG, or PNG. Maximum 10 MB.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-700">Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-xs" disabled={busy === `photo:${job.id}`} onChange={(e) => { void upload(job.id, "photo", e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
                  <label className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-700">Upload document<input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-2 block w-full text-xs" disabled={busy === `document:${job.id}`} onChange={(e) => { void upload(job.id, "document", e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-900">Completion Documentation</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-[2fr_auto]">
                  <input value={paperworkPath} onChange={(e) => setPaperworkPath(e.target.value)} placeholder="Existing storage path for completion paperwork" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <button disabled={!paperworkPath.trim()} onClick={() => void action({ action: "paperwork", job_id: job.id, paperwork_type: "completion", storage_path: paperworkPath })} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Submit Paperwork</button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-900">Property Sign-Off</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder="Representative name" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <input value={representativeTitle} onChange={(e) => setRepresentativeTitle(e.target.value)} placeholder="Representative title" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <button disabled={!representativeName.trim()} onClick={() => void action({ action: "signoff", job_id: job.id, representative_name: representativeName, representative_title: representativeTitle, approved: true })} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">Record Approved Sign-Off</button>
                </div>
              </div>
            </section>;
          })}
        </div>}
      </div>
    </main>
  );
}
