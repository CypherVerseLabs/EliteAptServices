import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  Mail,
  ChevronRight,
  UserCheck,
  BriefcaseBusiness,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  active: boolean | null;
};

const specialtyLabels: Record<string, string> = {
  painter: "Painter",
  painters: "Painter",
  carpet_cleaner: "Carpet Cleaner",
  carpet_cleaners: "Carpet Cleaner",
  housekeeper: "Housekeeper",
  housekeepers: "Housekeeper",
  housekeeping: "Housekeeper",
  make_ready_specialist: "Make Ready Specialist",
  make_ready_specialists: "Make Ready Specialist",
  make_ready: "Make Ready Specialist",
  re_surfacing: "Re-Surfacing",
  resurfacing: "Re-Surfacing",
  sheetrock: "Sheetrock",
  tape_float_texture: "Tape / Float / Texture",
  "tape-float-texture": "Tape / Float / Texture",
};

export default async function ContractorsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .eq("role", "worker")
    .order("first_name", { ascending: true });

  const contractors = (data ?? []) as Contractor[];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Field Team
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Contractors
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage contractors, specialties, contact information, and
              availability.
            </p>
          </div>

          <Link
            href="/dashboard/workers/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Contractor
          </Link>
        </div>

        {/* SPECIALTIES */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Painters",
              value: "painter",
            },
            {
              label: "Carpet Cleaners",
              value: "carpet_cleaner",
            },
            {
              label: "Housekeepers",
              value: "housekeeper",
            },
            {
              label: "Make Ready",
              value: "make_ready_specialist",
            },
            {
              label: "Re-Surfacing",
              value: "re_surfacing",
            },
            {
              label: "Sheetrock",
              value: "sheetrock",
            },
          ].map((specialty) => {
            const count = contractors.filter((contractor) => {
              const role = contractor.role?.toLowerCase() ?? "";

              return (
                role === specialty.value ||
                role === specialty.value.replace("_", " ") ||
                role.includes(specialty.value.replace("_", " "))
              );
            }).length;

            return (
              <div
                key={specialty.value}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Specialty
                </p>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  {specialty.label}
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-semibold text-red-800">
              Could not load contractors
            </p>

            <p className="mt-1">{error.message}</p>
          </div>
        )}

        {/* EMPTY */}
        {contractors.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-7 w-7 text-slate-400" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No contractors yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add contractors so jobs can be assigned, completed, signed off,
              and paid.
            </p>

            <Link
              href="/dashboard/workers/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Contractor
            </Link>
          </div>
        ) : (
          /* CONTRACTOR LIST */
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* TABLE HEADER */}
            <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-12 md:gap-4">
              <div className="col-span-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contractor
              </div>

              <div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contact
              </div>

              <div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Specialty
              </div>

              <div className="col-span-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {contractors.map((contractor) => {
                const name =
                  `${contractor.first_name ?? ""} ${
                    contractor.last_name ?? ""
                  }`.trim() || "Unnamed Contractor";

                return (
                  <Link
                    key={contractor.id}
                    href={`/dashboard/workers/${contractor.id}`}
                    className="group block px-6 py-5 transition hover:bg-slate-50"
                  >
                    <div className="md:grid md:grid-cols-12 md:items-center md:gap-4">
                      {/* NAME */}
                      <div className="col-span-4 flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {getInitials(
                            contractor.first_name,
                            contractor.last_name
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-blue-600">
                            {name}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                            Contractor
                          </p>
                        </div>
                      </div>

                      {/* CONTACT */}
                      <div className="col-span-3 mt-4 space-y-1 md:mt-0">
                        {contractor.phone && (
                          <p className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="h-3.5 w-3.5" />
                            {contractor.phone}
                          </p>
                        )}

                        {contractor.email && (
                          <p className="flex items-center gap-2 truncate text-sm text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                            {contractor.email}
                          </p>
                        )}

                        {!contractor.phone && !contractor.email && (
                          <p className="text-sm text-slate-400">
                            No contact information
                          </p>
                        )}
                      </div>

                      {/* SPECIALTY */}
                      <div className="col-span-3 mt-4 md:mt-0">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {formatSpecialty(contractor.role)}
                        </span>
                      </div>

                      {/* STATUS */}
                      <div className="col-span-2 mt-4 flex items-center justify-between md:mt-0 md:justify-end md:gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            contractor.active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {contractor.active ? "Active" : "Inactive"}
                        </span>

                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(
  firstName: string | null,
  lastName: string | null
) {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "C";
}

function formatSpecialty(value: string | null) {
  if (!value) return "Contractor";

  const normalized = value.toLowerCase();

  if (specialtyLabels[normalized]) {
    return specialtyLabels[normalized];
  }

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}