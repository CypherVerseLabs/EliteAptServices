import Link from "next/link";
import {
  ClipboardList,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  Building2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type JobRow = {
  id: string;
  job_number: number | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  total_amount: number | null;
  property_name: string | null;
  property_address: string | null;
  unit_number: string | null;
  service: string | null;
  service_category: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  /*
   * ---------------------------------------------------------
   * LOAD DASHBOARD DATA
   * ---------------------------------------------------------
   *
   * Dashboard metrics are intentionally kept simple.
   * Each query can fail independently without preventing
   * the rest of the dashboard from rendering.
   */

  const [
    openWorkOrdersResult,
    activeJobsResult,
    completedJobsResult,
    weeklyJobsResult,
    recentJobsResult,
    workersResult,
    propertiesResult,
  ] = await Promise.all([
    /*
     * Work orders waiting for review, approval,
     * or assignment.
     */
    supabase
      .from("work_orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "submitted",
        "reviewing",
        "approved",
      ]),

    /*
     * Jobs currently active.
     */
    supabase
      .from("jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "assigned",
        "accepted",
        "in_progress",
      ]),

    /*
     * Jobs completed this week.
     */
    supabase
      .from("jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "completed")
      .gte(
        "created_at",
        getStartOfWeekISO()
      ),

    /*
     * Job value created this week.
     */
    supabase
      .from("jobs")
      .select("total_amount")
      .gte(
        "created_at",
        getStartOfWeekISO()
      ),

    /*
     * Most recent jobs.
     */
    supabase
      .from("jobs")
      .select(`
        id,
        job_number,
        title,
        status,
        priority,
        total_amount,
        property_name,
        property_address,
        unit_number,
        service,
        service_category,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    /*
     * Active workers.
     */
    supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("role", "worker")
      .eq("active", true),

    /*
     * Active properties.
     */
    supabase
      .from("properties")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("active", true),
  ]);

  /*
   * ---------------------------------------------------------
   * SAFE FALLBACK VALUES
   * ---------------------------------------------------------
   */

  const openWorkOrders =
    openWorkOrdersResult.count ?? 0;

  const activeJobs =
    activeJobsResult.count ?? 0;

  const completedThisWeek =
    completedJobsResult.count ?? 0;

  const workers =
    workersResult.count ?? 0;

  const properties =
    propertiesResult.count ?? 0;

  const recentJobs =
    (recentJobsResult.data ?? []) as JobRow[];

  /*
   * ---------------------------------------------------------
   * WEEKLY JOB VALUE
   * ---------------------------------------------------------
   */

  const weeklyJobs =
    (weeklyJobsResult.data ?? []) as {
      total_amount: number | null;
    }[];

  const weeklyTotal =
    weeklyJobs.reduce(
      (
        total: number,
        job: {
          total_amount: number | null;
        }
      ) =>
        total +
        Number(
          job.total_amount ?? 0
        ),
      0
    );

  /*
   * ---------------------------------------------------------
   * DASHBOARD STATS
   * ---------------------------------------------------------
   */

  const stats = [
    {
      name: "Open Work Orders",
      value:
        openWorkOrders.toLocaleString(),
      description:
        "Awaiting review or assignment",
      icon: ClipboardList,
      color: "blue",
      href: "/dashboard/work-orders",
    },

    {
      name: "Active Jobs",
      value:
        activeJobs.toLocaleString(),
      description:
        "Currently in progress",
      icon: Clock,
      color: "amber",
      href: "/dashboard/jobs",
    },

    {
      name: "Completed This Week",
      value:
        completedThisWeek.toLocaleString(),
      description:
        "Jobs completed this week",
      icon: ClipboardList,
      color: "green",
      href: "/dashboard/jobs",
    },

    {
      name: "Job Value This Week",
      value:
        formatCurrency(weeklyTotal),
      description:
        "Job value created this week",
      icon: DollarSign,
      color: "purple",
      href: "/dashboard/jobs",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* -------------------------------------------------
            HEADER
        ------------------------------------------------- */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            Overview
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Manage Elite Apartment Services from one place.
          </p>
        </div>

        {/* -------------------------------------------------
            STATS
        ------------------------------------------------- */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.name}
                href={stat.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.name}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3 transition group-hover:bg-blue-50">
                    <Icon className="h-5 w-5 text-slate-700 group-hover:text-blue-600" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {stat.description}
                  </p>

                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* -------------------------------------------------
            MAIN CONTENT
        ------------------------------------------------- */}

        <div className="mt-8 grid gap-6 xl:grid-cols-3">

          {/* -------------------------------------------------
              RECENT JOBS
          ------------------------------------------------- */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Recent Jobs
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest work across Elite Apartment Services
                </p>
              </div>

              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center">

                <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 font-medium text-slate-700">
                  No jobs yet
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Jobs will appear here when work is assigned.
                </p>

              </div>
            ) : (
              <div className="mt-6 divide-y divide-slate-100">

                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50"
                  >

                    {/* JOB INFORMATION */}

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          JOB-
                          {job.job_number ??
                            job.id
                              .slice(
                                0,
                                8
                              )
                              .toUpperCase()}
                        </span>

                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusClasses(
                            job.status
                          )}`}
                        >
                          {formatStatus(
                            job.status
                          )}
                        </span>

                        {job.priority &&
                          job.priority.toLowerCase() !==
                            "normal" && (
                            <span
                              className={`rounded-lg px-2 py-1 text-xs font-semibold ${priorityClasses(
                                job.priority
                              )}`}
                            >
                              {formatPriority(
                                job.priority
                              )}
                            </span>
                          )}

                      </div>

                      {/* PROPERTY / UNIT */}

                      <p className="mt-2 truncate text-sm font-semibold text-slate-800">
                        {job.property_name ||
                          "Property not specified"}

                        {job.unit_number
                          ? ` · Unit ${job.unit_number}`
                          : ""}
                      </p>

                      {/* SERVICE */}

                      <p className="mt-1 truncate text-sm text-slate-600">
                        {job.service ||
                          job.service_category ||
                          job.title ||
                          "Untitled Job"}
                      </p>

                      {/* JOB TITLE */}

                      {job.title &&
                        job.title !==
                          job.service &&
                        job.title !==
                          job.service_category && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {job.title}
                          </p>
                        )}

                      <p className="mt-1 text-xs text-slate-400">
                        Created{" "}
                        {formatDate(
                          job.created_at
                        )}
                      </p>

                    </div>

                    {/* JOB VALUE */}

                    <div className="flex shrink-0 items-center gap-4">

                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrency(
                          Number(
                            job.total_amount ??
                              0
                          )
                        )}
                      </p>

                      <ArrowRight className="h-4 w-4 text-slate-300" />

                    </div>

                  </Link>
                ))}

              </div>
            )}

          </section>

          {/* -------------------------------------------------
              QUICK ACTIONS
          ------------------------------------------------- */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common management tasks
            </p>

            <div className="mt-5 space-y-3">

              <Link
                href="/dashboard/work-orders/new"
                className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Create Work Order
              </Link>

              <Link
                href="/dashboard/properties"
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4 text-slate-500" />

                Add Property
              </Link>

              <Link
                href="/dashboard/workers"
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Users className="h-4 w-4 text-slate-500" />

                Add Worker
              </Link>

            </div>

            {/* -------------------------------------------------
                PROPERTY SUMMARY
            ------------------------------------------------- */}

            <div className="mt-6 rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Active Properties
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {properties}
                  </p>

                </div>

                <Building2 className="h-6 w-6 text-slate-400" />

              </div>

              <Link
                href="/dashboard/properties"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage properties

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

            </div>

            {/* -------------------------------------------------
                WORKER SUMMARY
            ------------------------------------------------- */}

            <div className="mt-3 rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Active Workers
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {workers}
                  </p>

                </div>

                <Users className="h-6 w-6 text-slate-400" />

              </div>

              <Link
                href="/dashboard/workers"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage workers

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

            </div>

          </section>

        </div>
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * DATE HELPERS
 * ---------------------------------------------------------
 */

/**
 * Returns the beginning of the current week as an ISO timestamp.
 *
 * Week starts on Monday.
 */
function getStartOfWeekISO() {
  const now = new Date();

  const day = now.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  const start = new Date(now);

  start.setDate(
    now.getDate() + difference
  );

  start.setHours(
    0,
    0,
    0,
    0
  );

  return start.toISOString();
}

/*
 * ---------------------------------------------------------
 * FORMATTERS
 * ---------------------------------------------------------
 */

function formatCurrency(
  amount: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

function formatDate(
  date: string | null
) {
  if (!date) {
    return "—";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatStatus(
  status: string | null
) {
  if (!status) {
    return "New";
  }

  return status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatPriority(
  priority: string | null
) {
  if (!priority) {
    return "";
  }

  return priority
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

/*
 * ---------------------------------------------------------
 * STATUS COLORS
 * ---------------------------------------------------------
 */

function statusClasses(
  status: string | null
) {
  switch (
    status?.toLowerCase()
  ) {
    case "completed":
      return "bg-green-100 text-green-700";

    case "in_progress":
    case "in progress":
      return "bg-blue-100 text-blue-700";

    case "assigned":
      return "bg-purple-100 text-purple-700";

    case "accepted":
      return "bg-cyan-100 text-cyan-700";

    case "awaiting_signoff":
    case "awaiting signoff":
      return "bg-orange-100 text-orange-700";

    case "signed_off":
    case "signed off":
    case "paperwork_submitted":
    case "paperwork submitted":
      return "bg-indigo-100 text-indigo-700";

    case "approved":
    case "payroll_ready":
    case "payroll ready":
    case "paid":
      return "bg-green-100 text-green-700";

    case "cancelled":
    case "canceled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

/*
 * ---------------------------------------------------------
 * PRIORITY COLORS
 * ---------------------------------------------------------
 */

function priorityClasses(
  priority: string | null
) {
  switch (
    priority?.toLowerCase()
  ) {
    case "urgent":
      return "bg-red-100 text-red-700";

    case "high":
      return "bg-orange-100 text-orange-700";

    case "low":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-blue-100 text-blue-700";
  }
}
