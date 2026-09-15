import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function EditWorkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: worker, error } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      email,
      role,
      active
    `)
    .eq("id", id)
    .eq("role", "worker")
    .maybeSingle();

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/workers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workers
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-semibold text-red-800">
              Could not load worker
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!worker) {
    redirect("/dashboard/workers");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* BACK */}
        <Link
          href={`/dashboard/workers/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Worker
        </Link>

        {/* HEADER */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Team
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Edit Worker
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update this worker's information and account status.
          </p>
        </div>

        {/* FORM */}
        <form
          action={updateWorker}
          className="mt-8 space-y-6"
        >
          <input type="hidden" name="id" value={worker.id} />

          {/* PERSONAL INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <User className="h-5 w-5 text-blue-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Basic information for this worker.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                name="first_name"
                label="First Name"
                defaultValue={worker.first_name ?? ""}
                required
              />

              <FormField
                name="last_name"
                label="Last Name"
                defaultValue={worker.last_name ?? ""}
                required
              />
            </div>
          </section>

          {/* CONTACT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <Phone className="h-5 w-5 text-green-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Contact Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Phone and email used to contact the worker.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={worker.phone ?? ""}
                    placeholder="(555) 555-5555"
                    className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={worker.email ?? ""}
                    placeholder="worker@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ROLE & STATUS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <ShieldCheck className="h-5 w-5 text-purple-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Account Settings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage the worker's role and availability.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Role
                </label>

                <select
                  id="role"
                  name="role"
                  defaultValue={worker.role ?? "worker"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="worker">Worker</option>
                  <option value="field_manager">Field Manager</option>
                  <option value="office">Office</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="active"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>

                <select
                  id="active"
                  name="active"
                  defaultValue={worker.active ? "true" : "false"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex gap-3">
                <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Worker availability
                  </p>

                  <p className="mt-1 text-sm text-blue-700">
                    Inactive workers can remain in the system but should not
                    receive new job assignments.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/dashboard/workers/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function updateWorker(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "worker");
  const active = String(formData.get("active") ?? "true") === "true";

  if (!id || !firstName || !lastName) {
    redirect(`/dashboard/workers/${id}/edit`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email: email || null,
      role,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Worker update error:", error);
    redirect(`/dashboard/workers/${id}/edit`);
  }

  redirect(`/dashboard/workers/${id}`);
}

function FormField({
  name,
  label,
  defaultValue,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );
}