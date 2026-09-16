"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Company = { id: string; name: string | null };
type Property = { id: string; apartment_company_id: string; name: string | null; address: string | null; city: string | null; state: string | null; zip: string | null };
type Service = { id: string; name: string; category: string; active: boolean };

export default function NewWorkOrderPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [requestedDate, setRequestedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/work-orders/options", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Unable to load Work Order options.");
        setCompanies(json.companies ?? []); setProperties(json.properties ?? []); setServices(json.services ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load Work Order options."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const submissionId = crypto.randomUUID();
      const response = await fetch("/api/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apartment_company_id: companyId, property_id: propertyId, service_category: serviceCategory, title, description, priority, requested_date: requestedDate || null, pricing_quantity: 1, submission_id: submissionId }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Unable to create Work Order.");
      setMessage(`Work Order WO-${json.workOrder.work_order_number ?? ""} created.`); setTitle(""); setDescription(""); setRequestedDate("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create Work Order."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 text-center">Loading…</div></main>;
  const filteredProperties = properties.filter((property) => property.apartment_company_id === companyId);

  return <main className="min-h-screen bg-slate-50 p-6 lg:p-8"><div className="mx-auto max-w-4xl"><Link href="/dashboard/work-orders" className="text-sm font-semibold text-slate-500">← Work Orders</Link><h1 className="mt-5 text-3xl font-bold text-slate-900">New Work Order</h1><p className="mt-2 text-sm text-slate-500">Pricing is resolved and calculated on the server from the selected company and service.</p>{error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message && <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">{message}</div>}
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold">Apartment Company<select required value={companyId} onChange={(e) => { setCompanyId(e.target.value); setPropertyId(""); }} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"><option value="">Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name ?? company.id}</option>)}</select></label>
      <label className="text-sm font-semibold">Property<select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"><option value="">Select property</option>{filteredProperties.map((property) => <option key={property.id} value={property.id}>{property.name ?? property.address ?? property.id}</option>)}</select></label>
      <label className="text-sm font-semibold">Service<select required value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"><option value="">Select service</option>{services.map((service) => <option key={service.id} value={service.category}>{service.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Priority<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <label className="text-sm font-semibold md:col-span-2">Title<input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-semibold md:col-span-2">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-semibold">Requested Date<input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" /></label>
    </div><button disabled={saving} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating…" : "Create Work Order"}</button></form>
  </div></main>;
}
