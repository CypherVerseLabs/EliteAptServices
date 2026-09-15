import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  UserCheck,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  ChevronRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Worker = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  active: boolean | null;
  created_at: string | null;
};

type Assignment = {
  id: string;
  status: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  notes: string | null;
  jobs:
    | {
        id: string;
        job_number: number | null;
        title: string | null;
        description: string | null;
        status: string | null;
        scheduled_date: string | null;
        due_date: string | null;
        total_amount: number | null;
        property_id: string | null;
        service_category: string | null;
      }
    | {
        id: string;
        job_number: number | null;
        title: string | null;
        description: string | null;
        status: string | null;
        scheduled_date: string | null;
        due_date: string | null;
        total_amount: number | null;
        property_id: string | null;
        service_category: string | null;
      }[]
    | null;
};

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const [{ data: workerData, error: workerError }, { data: assignmentsData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          role,
          active,
          created_at
        `)
        .eq("id", id)
        .eq("role", "worker")
        .maybeSingle(),

      supabase
        .from("job_assignments")
        .select(`
          id,
          status,
          assigned_at,
          accepted_at,
          completed_at,
          notes,
          jobs (
            id,
            job_number,
            title,
            description,
            status,
            scheduled_date,
            due_date,
            total_amount,
            property_id,
            service_category
          )
        `)
        .eq("worker_id", id)
        .neq("status", "removed")
        .order("assigned_at", { ascending: false }),
    ]);

  if (workerError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
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
              {workerError.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!workerData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/workers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workers
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <User className="h-7 w-7 text-slate-400" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Worker not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              This worker does not exist or is no longer available.
            </p>

            <Link
              href="/dashboard/workers"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const worker = workerData as Worker;

  const assignments = (assignmentsData ?? []) as Assignment[];

  const jobs = assignments
    .map((assignment) => {
      const job = Array.isArray(assignment.jobs)
        ? assignment.jobs[0]
        : assignment.jobs;

      return {
        assignment,
        job,
      };
    })
    .filter((item) => item.job !== null);

  const activeJobs = jobs.filter((item) => {
    const status = item.assignment.status?.toLowerCase();

    return (
      status === "assigned" ||
      status === "accepted" ||
      status === "in_progress"
    );
  }).length;

  const completedJobs = jobs.filter((item) => {
    return item.assignment.status?.toLowerCase() === "completed";
  }).length;

  const name =
    `${worker.first_name ?? ""} ${worker.last_name ?? ""}`.trim() ||
    "Unnamed Worker";

  const initials = getInitials(worker.first_name, worker.last_name);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* BACK */}
        <Link
          href="/dashboard/workers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workers
        </Link>

        {/* HEADER */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                {initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {name}
                  </h1>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      worker.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {worker.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {formatStatus(worker.role)}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/workers/${worker.id}/edit`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Worker
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active Jobs"
            value={activeJobs}
            icon={BriefcaseBusiness}
            color="blue"
          />

          <StatCard
            label="Completed Jobs"
            value={completedJobs}
            icon={UserCheck}
            color="green"
          />

          <StatCard
            label="Total Assignments"
            value={jobs.length}
            icon={CalendarDays}
            color="purple"
          />
        </div>

        {/* CONTENT */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* CONTACT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Worker Information
            </h2>

            <div className="mt-5 space-y-5">
              <InfoRow
                icon={User}
                label="Name"
                value={name}
              />

              <InfoRow
                icon={Mail}
                label="Email"
                value={worker.email}
              />

              <InfoRow
                icon={Phone}
                label="Phone"
                value={worker.phone}
              />

              <InfoRow
                icon={UserCheck}
                label="Status"
                value={worker.active ? "Active" : "Inactive"}
              />

              <InfoRow
                icon={CalendarDays}
                label="Added"
                value={formatDate(worker.created_at)}
              />
            </div>
          </section>

          {/* JOBS */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Assigned Jobs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Jobs currently assigned or previously completed by this worker.
              </p>
            </div>

            {jobs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <BriefcaseBusiness className="h-7 w-7 text-slate-400" />
                </div>

                <h3 className="mt-5 font-semibold text-slate-900">
                  No jobs assigned
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Jobs assigned to this worker will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs.map(({ assignment, job }) => {
                  if (!job) return null;

                  return (
                    <Link
                      key={assignment.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="group block px-6 py-5 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              JOB-
                              {job.job_number ??
                                job.id.slice(0, 8).toUpperCase()}
                            </span>

                            <span
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${assignmentStatusClasses(
                                assignment.status
                              )}`}
                            >
                              {formatStatus(assignment.status)}
                            </span>
                          </div>

                          <h3 className="mt-3 truncate font-semibold text-slate-900 group-hover:text-blue-600">
                            {job.title || "Untitled Job"}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            {job.service_category && (
                              <span>
                                {formatStatus(job.service_category)}
                              </span>
                            )}

                            {job.scheduled_date && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(job.scheduled_date)}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>

                      {job.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                          {job.description}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof BriefcaseBusiness;
  color: "blue" | "green" | "purple";
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-800">
          {value || "—"}
        </p>
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

  return `${first}${last}`.toUpperCase() || "W";
}

function formatStatus(value: string | null) {
  if (!value) return "Worker";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function assignmentStatusClasses(status: string | null) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";

    case "in_progress":
      return "bg-blue-100 text-blue-700";

    case "accepted":
      return "bg-purple-100 text-purple-700";

    case "declined":
      return "bg-red-100 text-red-700";

    case "removed":
      return "bg-slate-100 text-slate-500";

    default:
      return "bg-amber-100 text-amber-700";
  }
}
