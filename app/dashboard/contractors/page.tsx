"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ChevronRight,
  UserCheck,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean | null;
};


const SPECIALTIES = [
  {
    value: "painter",
    label: "Painter",
  },
  {
    value: "carpet_cleaner",
    label: "Carpet Cleaner",
  },
  {
    value: "housekeeper",
    label: "Housekeeper",
  },
  {
    value: "make_ready_specialist",
    label: "Make Ready Specialist",
  },
  {
    value: "re_surfacing",
    label: "Re-Surfacing",
  },
];

const supabase = createClient();

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  useEffect(() => {
    loadContractors();
  }, []);

  async function loadContractors() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
  .from("contractors")
  .select(`
    id,
    first_name,
    last_name,
    phone,
    email,
    specialty,
    active
  `)
  .order("first_name", {
    ascending: true,
  });


    if (error) {
      console.error("Contractor load error:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setContractors(data ?? []);
    setLoading(false);
  }

  function formatSpecialty(value: string | null) {
    if (!value) return "Contractor";

    return (
      SPECIALTIES.find(
        (specialty) => specialty.value === value
      )?.label ??
      value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  }

  function getInitials(
    firstName: string | null,
    lastName: string | null
  ) {
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";

    return (
      `${first}${last}`.toUpperCase() || "C"
    );
  }

  const filteredContractors = contractors.filter(
    (contractor) => {
      const name =
        `${contractor.first_name ?? ""} ${
          contractor.last_name ?? ""
        }`.toLowerCase();

      const searchText = search.toLowerCase();

      const matchesSearch =
        name.includes(searchText) ||
        contractor.email
          ?.toLowerCase()
          .includes(searchText) ||
        contractor.phone
          ?.toLowerCase()
          .includes(searchText) ||
        contractor.specialty
          ?.toLowerCase()
          .includes(searchText);

      const matchesSpecialty =
        specialtyFilter === "all" ||
        contractor.specialty === specialtyFilter;

      return matchesSearch && matchesSpecialty;
    }
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Team
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Contractors
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage contractors, specialties, contact information,
              and job assignments.
            </p>
          </div>

          <Link
            href="/dashboard/contractors/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Contractor
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search contractors, phone, email, or specialty..."
                className="w-full rounded-xl border border-slate-300 bg-white px-11 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <select
            value={specialtyFilter}
            onChange={(event) =>
              setSpecialtyFilter(event.target.value)
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">
              All Specialties
            </option>

            {SPECIALTIES.map((specialty) => (
              <option
                key={specialty.value}
                value={specialty.value}
              >
                {specialty.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Could not load contractors
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadContractors}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-75 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading contractors...
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {filteredContractors.length}{" "}
                {filteredContractors.length === 1
                  ? "contractor"
                  : "contractors"}
              </p>

              {(search ||
                specialtyFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSpecialtyFilter("all");
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>

            {filteredContractors.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Users className="h-7 w-7 text-slate-400" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search ||
                  specialtyFilter !== "all"
                    ? "No matching contractors"
                    : "No contractors yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {search ||
                  specialtyFilter !== "all"
                    ? "Try another search or specialty."
                    : "Add contractors so jobs can be assigned and tracked."}
                </p>

                {!search &&
                  specialtyFilter === "all" && (
                    <Link
                      href="/dashboard/contractors/new"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Contractor
                    </Link>
                  )}
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                  {filteredContractors.map(
                    (contractor) => {
                      const name =
                        `${contractor.first_name ?? ""} ${
                          contractor.last_name ?? ""
                        }`.trim() ||
                        "Unnamed Contractor";

                      return (
                        <Link
                          key={contractor.id}
                          href={`/dashboard/contractors/${contractor.id}`}
                          className="group block px-6 py-5 transition hover:bg-slate-50"
                        >
                          <div className="md:grid md:grid-cols-12 md:items-center md:gap-4">
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

                                <p className="mt-1 text-xs text-slate-400">
                                  Contractor
                                </p>
                              </div>
                            </div>

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
                            </div>

                            <div className="col-span-3 mt-4 md:mt-0">
                              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {formatSpecialty(
                                  contractor.specialty
                                )}
                              </span>
                            </div>

                            <div className="col-span-2 mt-4 flex items-center justify-between md:mt-0 md:justify-end md:gap-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  contractor.active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <UserCheck className="h-3.5 w-3.5" />

                                {contractor.active
                                  ? "Active"
                                  : "Inactive"}
                              </span>

                              <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}