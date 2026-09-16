import Link from "next/link";
import { Mail, Phone, Plus, UserCheck, Users, ChevronRight, BriefcaseBusiness } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Worker = { id: string; first_name: string | null; last_name: string | null; phone: string | null; email: string | null; active: boolean | null; pay_type: string | null; pay_rate: number | null };

export default async function WorkersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workers").select("id, first_name, last_name, phone, email, active, pay_type, pay_rate").order("first_name", { ascending: true });
  const workers = (data ?? []) as Worker[];

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-blue-600">Field Team</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Workers</h1><p className="mt-2 text-sm text-slate-500">Manage field workers, contact information, pay settings, and active status.</p></div>
          <Link href="/dashboard/workers/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Add Worker</Link>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p className="font-semibold text-red-800">Could not load workers</p><p className="mt-1">{error.message}</p></div>}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Workers</p><p className="mt-2 text-3xl font-bold text-slate-900">{workers.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active</p><p className="mt-2 text-3xl font-bold text-green-600">{workers.filter((worker) => worker.active).length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Inactive</p><p className="mt-2 text-3xl font-bold text-slate-500">{workers.filter((worker) => !worker.active).length}</p></div>
        </div>

        {workers.length === 0 ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"><Users className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-semibold text-slate-900">No workers yet</h2><p className="mt-2 text-sm text-slate-500">Add a worker to make them available for Job assignment.</p></div> : <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-12 md:gap-4"><div className="col-span-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Worker</div><div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Contact</div><div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Pay</div><div className="col-span-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Status</div></div>
          <div className="divide-y divide-slate-100">{workers.map((worker) => { const name = `${worker.first_name ?? ""} ${worker.last_name ?? ""}`.trim() || "Unnamed Worker"; return <Link key={worker.id} href={`/dashboard/workers/${worker.id}`} className="group block px-6 py-5 hover:bg-slate-50"><div className="md:grid md:grid-cols-12 md:items-center md:gap-4"><div className="col-span-4 flex items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{`${worker.first_name?.[0] ?? ""}${worker.last_name?.[0] ?? ""}`.toUpperCase() || "W"}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900 group-hover:text-blue-600">{name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><BriefcaseBusiness className="h-3.5 w-3.5" />Field Worker</p></div></div><div className="col-span-3 mt-4 space-y-1 md:mt-0">{worker.phone && <p className="flex items-center gap-2 text-sm text-slate-500"><Phone className="h-3.5 w-3.5" />{worker.phone}</p>}{worker.email && <p className="flex items-center gap-2 truncate text-sm text-slate-500"><Mail className="h-3.5 w-3.5" />{worker.email}</p>}{!worker.phone && !worker.email && <p className="text-sm text-slate-400">No contact information</p>}</div><div className="col-span-3 mt-4 md:mt-0"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{worker.pay_type ?? "Pay not set"}{worker.pay_rate != null ? ` • $${Number(worker.pay_rate).toFixed(2)}` : ""}</span></div><div className="col-span-2 mt-4 flex items-center justify-between md:mt-0 md:justify-end md:gap-3"><span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${worker.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}><UserCheck className="h-3.5 w-3.5" />{worker.active ? "Active" : "Inactive"}</span><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" /></div></div></Link>; })}</div>
        </div>}
      </div>
    </main>
  );
}
