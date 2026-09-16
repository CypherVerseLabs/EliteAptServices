"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Property = { id: string; name: string | null; address: string | null; city: string | null; state: string | null; zip: string | null };
type Unit = { id: string; property_id: string; unit_number: string | null };
type ServiceType = { id: string; name: string; category: string; active: boolean };
type WorkOrder = { id: string; work_order_number: number | null; title: string | null; service_category: string | null; status: string | null; requested_date: string | null; created_at: string };

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [requestedDate, setRequestedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/customer/request-data", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to load request data.");
      setRequests(json.requests ?? []); setProperties(json.properties ?? []); setUnits(json.units ?? []); setServices(json.services ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load service requests."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const submissionId = crypto.randomUUID();
      const response = await fetch("/api/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id: propertyId, unit_id: unitId || null, service_category: serviceCategory, title, description, priority, requested_date: requestedDate || null, pricing_quantity: 1, submission_id: submissionId }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to create Work Order.");
      setMessage(json.duplicate ? "Your request was already submitted." : `Work Order WO-${json.workOrder.work_order_number ?? ""} was submitted.`);
      setTitle(""); setDescription(""); setRequestedDate(""); setUnitId(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create Work Order."); }
    finally { setSaving(false); }
  }

  const propertyUnits = units.filter((unit) => unit.property_id === propertyId);

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center shadow-sm">Loading Service Requests…</div></main>;

  return <main className="min-h-screen bg-slate-50 p-6 lg:p-8"><div className="mx-auto max-w-5xl">
    <Link href="/customer" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Customer Home</Link>
    <header className="mt-6"><p className="text-sm font-semibold text-blue-600">Customer Portal</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Service Requests</h1><p className="mt-2 text-slate-500">Submit and track your Work Orders.</p></header>
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

    <form onSubmit={createRequest} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">New Service Request</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Property<select required value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setUnitId(""); }} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"><option value="">Select property</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.name ?? p.address ?? p.id}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">Unit<select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"><option value="">No unit / property-level</option>{propertyUnits.map((u) => <option key={u.id} value={u.id}>{u.unit_number ?? u.id}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">Service<select required value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"><option value="">Select service</option>{services.map((s) => <option key={s.id} value={s.category}>{s.name}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">Priority<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Title<input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" placeholder="Describe the service needed" /></label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" placeholder="Provide useful details for the field team" /></label>
      <label className="text-sm font-semibold text-slate-700">Requested date<input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" /></label>
    </div><button disabled={saving} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit Service Request"}</button></form>

    <section className="mt-8 space-y-3"><h2 className="text-lg font-bold text-slate-900">My Requests</h2>{requests.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">No service requests yet.</div> : requests.map((request) => <Link key={request.id} href={`/customer/request/${request.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold text-blue-600">WO-{request.work_order_number ?? request.id.slice(0, 8).toUpperCase()}</p><h3 className="mt-1 font-bold text-slate-900">{request.title ?? request.service_category ?? "Service Request"}</h3><p className="mt-1 text-sm text-slate-500">{request.service_category ?? "Service"} · {request.requested_date ?? "No requested date"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{(request.status ?? "submitted").replaceAll("_", " ")}</span></div></Link>)}</section>
  </div></main>;
}
