import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  UserCheck,
  Briefcase,
  CalendarDays,
  Building2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean | null;
  created_at: string;
};

type Assignment = {
  job_id: string;
  status: string | null;
  assigned_at: string;
};

type Job = {
  id: string;
  job_number: number | null;
  title: string | null;
  status: string | null;
  scheduled_date: string | null;
  property_id: string | null;
};

type Property = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
};

const SPECIALTIES: Record<string, string> = {
  painter: "Painter",
  carpet_cleaner: "Carpet Cleaner",
  housekeeper: "Housekeeper",
  make_ready_specialist: "Make Ready Specialist",
  re_surfacing: "Re-Surfacing",
};

export default async function ContractorDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * ---------------------------------------------------------
   * LOAD CONTRACTOR
   * ---------------------------------------------------------
   */

  const {
    data: contractorData,
    error: contractorError,
  } = await supabase
    .from("contractors")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      email,
      specialty,
      active,
      created_at
    `)
    .eq("id", id)
    .single();

  if (contractorError || !contractorData) {
    notFound();
  }

  const contractor = contractorData as Contractor;

  /*
   * ---------------------------------------------------------
   * LOAD ASSIGNMENTS
   * ---------------------------------------------------------
   */

  const {
    data: assignmentData,
    error: assignmentsError,
  } = await supabase
    .from("job_assignments")
    .select(`
      job_id,
      status,
      assigned_at
    `)
    .eq("contractor_id", id)
    .neq("status", "removed")
    .order("assigned_at", {
      ascending: false,
    });

  if (assignmentsError) {
    console.error(
      "Contractor assignments load error:",
      assignmentsError
    );
  }

  const assignments: Assignment[] =
    assignmentData ?? [];

  /*
   * ---------------------------------------------------------
   * GET UNIQUE JOB IDS
   * ---------------------------------------------------------
   */

  const jobIds = Array.from(
    new Set(
      assignments
        .map((assignment) => assignment.job_id)
        .filter(Boolean)
    )
  );

  /*
   * ---------------------------------------------------------
   * LOAD JOBS
   * ---------------------------------------------------------
   */

  let jobs: Job[] = [];

  if (jobIds.length > 0) {
    const {
      data: jobsData,
      error: jobsError,
    } = await supabase
      .from("jobs")
      .select(`
        id,
        job_number,
        title,
        status,
        scheduled_date,
        property_id,
        created_at
      `)
      .in("id", jobIds)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (jobsError) {
      console.error(
        "Contractor jobs load error:",
        jobsError
      );
    } else {
      jobs = (jobsData ?? []) as Job[];
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD PROPERTIES
   * ---------------------------------------------------------
   */

  const propertyIds = Array.from(
    new Set(
      jobs
        .map((job) => job.property_id)
        .filter(
          (propertyId): propertyId is string =>
            Boolean(propertyId)
        )
    )
  );

  let properties: Property[] = [];

  if (propertyIds.length > 0) {
    const {
      data: propertiesData,
      error: propertiesError,
    } = await supabase
      .from("properties")
      .select(`
        id,
        name,
        city,
        state
      `)
      .in("id", propertyIds);

    if (propertiesError) {
      console.error(
        "Contractor properties load error:",
        propertiesError
      );
    } else {
      properties =
        (propertiesData ?? []) as Property[];
    }
  }

  /*
   * ---------------------------------------------------------
   * DISPLAY VALUES
   * ---------------------------------------------------------
   */

  const name =
    `${contractor.first_name ?? ""} ${
      contractor.last_name ?? ""
    }`.trim() || "Unnamed Contractor";

  const specialty =
    SPECIALTIES[contractor.specialty ?? ""] ??
    (contractor.specialty
      ? contractor.specialty
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          )
      : "Contractor");

  const initials =
    `${contractor.first_name?.charAt(0) ?? ""}${
      contractor.last_name?.charAt(0) ?? ""
    }`.toUpperCase() || "C";

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    /*
     * Handle PostgreSQL DATE values such as:
     * 2026-09-14
     *
     * Handle PostgreSQL TIMESTAMPTZ values such as:
     * 2026-09-14T18:32:00.000Z
     */
    const parsed = value.includes("T")
      ? new Date(value)
      : new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatStatus(status: string | null) {
    if (!status) {
      return "Open";
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function statusClasses(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-700";

      case "in_progress":
      case "accepted":
        return "bg-blue-100 text-blue-700";

      case "assigned":
        return "bg-purple-100 text-purple-700";

      case "awaiting_signoff":
        return "bg-orange-100 text-orange-700";

      case "signed_off":
        return "bg-cyan-100 text-cyan-700";

      case "paperwork_submitted":
        return "bg-indigo-100 text-indigo-700";

      case "approved":
        return "bg-emerald-100 text-emerald-700";

      case "payroll_ready":
        return "bg-violet-100 text-violet-700";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  function getProperty(propertyId: string | null) {
    if (!propertyId) {
      return null;
    }

    return (
      properties.find(
        (property) => property.id === propertyId
      ) ?? null
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER ACTIONS */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/contractors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contractors
          </Link>

          <Link
            href={`/dashboard/contractors/${id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit Contractor
          </Link>
        </div>

        {/* CONTRACTOR HEADER */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {name}
                  </h1>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      contractor.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {contractor.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-blue-600">
                  {specialty}
                </p>

                <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">

                  {contractor.phone && (
                    <a
                      href={`tel:${contractor.phone}`}
                      className="flex items-center gap-2 transition hover:text-blue-600"
                    >
                      <Phone className="h-4 w-4 text-slate-400" />
                      {contractor.phone}
                    </a>
                  )}

                  {contractor.email && (
                    <a
                      href={`mailto:${contractor.email}`}
                      className="flex items-center gap-2 transition hover:text-blue-600"
                    >
                      <Mail className="h-4 w-4 text-slate-400" />
                      {contractor.email}
                    </a>
                  )}

                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 lg:min-w-56">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contractor Type
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {specialty}
              </p>
            </div>

          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Assigned Jobs
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {jobIds.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-2.5">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Status
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {contractor.active
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Specialty
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {specialty}
            </p>
          </div>

        </div>

        {/* ASSIGNED JOBS */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-6">
            <h2 className="font-semibold text-slate-900">
              Assigned Jobs
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Jobs currently assigned to this contractor.
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="px-6 py-14 text-center">

              <Briefcase className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 font-semibold text-slate-800">
                No jobs assigned
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Jobs assigned to this contractor will appear here.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {jobs.map((job) => {
                const property = getProperty(
                  job.property_id
                );

                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="block px-6 py-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">

                        <p className="text-sm font-bold text-slate-900">
                          JOB-
                          {job.job_number ??
                            job.id
                              .slice(0, 8)
                              .toUpperCase()}
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {job.title ||
                            "Untitled Job"}
                        </p>

                        {property && (
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Building2 className="h-4 w-4 shrink-0" />

                            <span>
                              {property.name}

                              {property.city
                                ? ` · ${property.city}${
                                    property.state
                                      ? `, ${property.state}`
                                      : ""
                                  }`
                                : ""}
                            </span>
                          </p>
                        )}

                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">

                          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />

                            {formatDate(
                              job.scheduled_date
                            )}
                          </div>

                          <span
                            className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClasses(
                              job.status
                            )}`}
                          >
                            {formatStatus(
                              job.status
                            )}
                          </span>

                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}

            </div>
          )}

        </section>

        {/* CONTRACTOR INFORMATION */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-semibold text-slate-900">
            Contractor Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                First Name
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {contractor.first_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Last Name
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {contractor.last_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Specialty
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {specialty}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {contractor.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all font-medium text-slate-800">
                {contractor.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account Status
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {contractor.active
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Added
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {formatDate(
                  contractor.created_at
                )}
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
