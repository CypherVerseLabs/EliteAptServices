"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  CalendarDays,
  Building2,
  User,
  DollarSign,
  Loader2,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  job_number: number | null;
  title: string | null;
  description: string | null;
  service_category: string | null;
  status: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  total_amount: number | null;
  property_id: string | null;
  unit_id: string | null;
  created_at: string;
};

type Property = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean;
};

type Assignment = {
  id: string;
  job_id: string;
  worker_id: string | null;
  contractor_id: string | null;
  status: string | null;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  removed_at: string | null;
};

type JobLineItem = {
  id: string;
  job_id: string;
  pricing_item_id: string | null;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
};

const CONTRACTOR_PERCENTAGE = 0.6;
const ELITE_PERCENTAGE = 0.4;

export default function JobsPage() {
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [lineItems, setLineItems] = useState<JobLineItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const [
        jobsResult,
        propertiesResult,
        assignmentsResult,
        contractorsResult,
      ] = await Promise.all([
        supabase
          .from("jobs")
          .select(`
            id,
            job_number,
            title,
            description,
            service_category,
            status,
            scheduled_date,
            due_date,
            total_amount,
            property_id,
            unit_id,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("properties")
          .select(`
            id,
            name,
            address,
            city,
            state
          `),

        supabase
          .from("job_assignments")
          .select(`
            id,
            job_id,
            worker_id,
            contractor_id,
            status,
            assigned_at,
            accepted_at,
            completed_at,
            removed_at
          `)
          .not("contractor_id", "is", null)
          .order("assigned_at", {
            ascending: false,
          }),

        supabase
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
          }),
      ]);

      if (jobsResult.error) {
        throw new Error(
          jobsResult.error.message ||
            "Unable to load jobs."
        );
      }

      if (propertiesResult.error) {
        console.error(
          "Property load error:",
          propertiesResult.error
        );
      }

      if (assignmentsResult.error) {
        console.error(
          "Assignment load error:",
          assignmentsResult.error
        );
      }

      if (contractorsResult.error) {
        console.error(
          "Contractor load error:",
          contractorsResult.error
        );
      }

      const loadedJobs = jobsResult.data ?? [];
      const loadedProperties =
        propertiesResult.data ?? [];
      const loadedAssignments =
        assignmentsResult.data ?? [];
      const loadedContractors =
        contractorsResult.data ?? [];

      /*
       * Load line items for all jobs.
       *
       * This is the source of truth for billable job
       * amounts. We intentionally do not rely on
       * jobs.total_amount for payroll calculations.
       */

      const jobIds = loadedJobs.map(
        (job) => job.id
      );

      let loadedLineItems: JobLineItem[] = [];

      if (jobIds.length > 0) {
        const lineItemsResult = await supabase
          .from("job_line_items")
          .select(`
            id,
            job_id,
            pricing_item_id,
            description,
            quantity,
            unit_price,
            total_price,
            notes
          `)
          .in("job_id", jobIds)
          .order("created_at", {
            ascending: true,
          });

        if (lineItemsResult.error) {
          throw new Error(
            lineItemsResult.error.message ||
              "Unable to load job line items."
          );
        }

        loadedLineItems =
          lineItemsResult.data ?? [];
      }

      setJobs(loadedJobs);
      setProperties(loadedProperties);
      setAssignments(loadedAssignments);
      setContractors(loadedContractors);
      setLineItems(loadedLineItems);
    } catch (error) {
      console.error(
        "Jobs load error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOOKUPS
   * ---------------------------------------------------------
   */

  function getProperty(
    propertyId: string | null
  ) {
    if (!propertyId) {
      return null;
    }

    return properties.find(
      (property) =>
        property.id === propertyId
    );
  }

  /*
   * A job may have multiple historical assignments.
   *
   * We want the newest active/current contractor
   * assignment rather than an old removed assignment.
   */

  function getAssignment(jobId: string) {
    const jobAssignments =
      assignments
        .filter(
          (assignment) =>
            assignment.job_id === jobId
        )
        .sort(
          (a, b) =>
            new Date(
              b.assigned_at
            ).getTime() -
            new Date(
              a.assigned_at
            ).getTime()
        );

    return (
      jobAssignments.find(
        (assignment) =>
          assignment.status !== "removed" &&
          !assignment.removed_at
      ) ||
      jobAssignments[0] ||
      null
    );
  }

  function getContractor(jobId: string) {
    const assignment =
      getAssignment(jobId);

    if (!assignment?.contractor_id) {
      return null;
    }

    return (
      contractors.find(
        (contractor) =>
          contractor.id ===
          assignment.contractor_id
      ) || null
    );
  }

  function getJobLineItems(jobId: string) {
    return lineItems.filter(
      (lineItem) =>
        lineItem.job_id === jobId
    );
  }

  /*
   * IMPORTANT:
   *
   * The billable job amount comes from the sum of
   * job_line_items.total_price.
   *
   * This allows:
   *
   * Make Ready       $500
   * Sheetrock        $150
   * Painting         $200
   * ---------------------
   * Customer Total   $850
   *
   * Contractor gets 60% of EACH item.
   */

  function getJobFinancials(jobId: string) {
    const items =
      getJobLineItems(jobId);

    const customerTotal = items.reduce(
      (total, item) =>
        total +
        (Number(item.total_price) || 0),
      0
    );

    const contractorTotal =
      Number(
        (
          customerTotal *
          CONTRACTOR_PERCENTAGE
        ).toFixed(2)
      );

    const eliteTotal =
      Number(
        (
          customerTotal *
          ELITE_PERCENTAGE
        ).toFixed(2)
      );

    return {
      customerTotal,
      contractorTotal,
      eliteTotal,
      itemCount: items.length,
    };
  }

  /*
   * ---------------------------------------------------------
   * FORMATTING
   * ---------------------------------------------------------
   */

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "—";
    }

    const parsed = new Date(
      `${date}T00:00:00`
    );

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

  function formatCurrency(
    amount: number | null
  ) {
    if (
      amount === null ||
      amount === undefined
    ) {
      return "$0.00";
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    ).format(Number(amount));
  }

  function formatStatus(
    status: string | null
  ) {
    if (!status) {
      return "Open";
    }

    return status
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function formatSpecialty(
    specialty: string | null
  ) {
    if (!specialty) {
      return "Contractor";
    }

    return specialty
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function statusClasses(
    status: string | null
  ) {
    switch (
      status?.toLowerCase()
    ) {
      case "open":
        return "bg-slate-100 text-slate-700";

      case "assigned":
        return "bg-purple-100 text-purple-700";

      case "accepted":
        return "bg-blue-100 text-blue-700";

      case "in_progress":
        return "bg-amber-100 text-amber-700";

      case "completed":
        return "bg-green-100 text-green-700";

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

      case "paid":
        return "bg-green-100 text-green-700";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  const filteredJobs = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    if (!searchText) {
      return jobs;
    }

    return jobs.filter((job) => {
      const property =
        getProperty(
          job.property_id
        );

      const contractor =
        getContractor(job.id);

      const contractorName =
        contractor
          ? `${contractor.first_name ?? ""} ${
              contractor.last_name ?? ""
            }`.trim()
          : "";

      const contractorSpecialty =
        contractor?.specialty ?? "";

      const jobItems =
        getJobLineItems(job.id);

      const lineItemText =
        jobItems
          .map(
            (item) =>
              `${item.description ?? ""} ${
                item.notes ?? ""
              }`
          )
          .join(" ");

      return (
        String(
          job.job_number ?? ""
        )
          .toLowerCase()
          .includes(searchText) ||
        job.title
          ?.toLowerCase()
          .includes(searchText) ||
        job.description
          ?.toLowerCase()
          .includes(searchText) ||
        job.service_category
          ?.toLowerCase()
          .includes(searchText) ||
        property?.name
          ?.toLowerCase()
          .includes(searchText) ||
        property?.address
          ?.toLowerCase()
          .includes(searchText) ||
        property?.city
          ?.toLowerCase()
          .includes(searchText) ||
        contractorName
          .toLowerCase()
          .includes(searchText) ||
        contractorSpecialty
          .toLowerCase()
          .includes(searchText) ||
        lineItemText
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [
    jobs,
    properties,
    assignments,
    contractors,
    lineItems,
    search,
  ]);

  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   */

  const summary = useMemo(() => {
    return filteredJobs.reduce(
      (result, job) => {
        const financials =
          getJobFinancials(job.id);

        result.customer +=
          financials.customerTotal;

        result.contractor +=
          financials.contractorTotal;

        result.elite +=
          financials.eliteTotal;

        result.items +=
          financials.itemCount;

        if (getContractor(job.id)) {
          result.assigned += 1;
        }

        return result;
      },
      {
        customer: 0,
        contractor: 0,
        elite: 0,
        items: 0,
        assigned: 0,
      }
    );
  }, [
    filteredJobs,
    lineItems,
    assignments,
    contractors,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Operations
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Jobs
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track assigned work, contractors,
              job progress, line-item pricing,
              sign-off, and contractor pay.
            </p>
          </div>

          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Job
          </Link>
        </div>

        {/* PAY RULE */}

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-blue-900">
                Job Payment Rule
              </p>

              <p className="mt-1 max-w-2xl text-sm text-blue-700">
                Every billable line item is split
                60% to the assigned contractor
                and 40% to Elite. This applies
                separately to make-ready work and
                additional items such as sheetrock
                or painting.
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-400">
                  Contractor
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-700">
                  60%
                </p>
              </div>

              <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-400">
                  Elite
                </p>

                <p className="mt-1 text-xl font-bold text-blue-700">
                  40%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search jobs, properties, services, contractors, or line items..."
              className="w-full rounded-xl border border-slate-300 bg-white px-11 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Could not load jobs
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadJobs}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* SUMMARY */}

        {!loading && !error && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Customer Billable
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  summary.customer
                )}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {summary.items} billable items
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Contractor 60%
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {formatCurrency(
                  summary.contractor
                )}
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                Based on line-item pricing
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Elite 40%
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-800">
                {formatCurrency(
                  summary.elite
                )}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                Elite share before other costs
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Assigned Contractors
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.assigned}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Of {filteredJobs.length} jobs
              </p>
            </div>
          </div>
        )}

        {/* CONTENT */}

        {loading ? (
          <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading jobs...
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1
                  ? "job"
                  : "jobs"}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              )}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Wrench className="h-7 w-7 text-slate-400" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search
                    ? "No matching jobs"
                    : "No jobs yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {search
                    ? "Try another job, property, service, contractor, specialty, or line item."
                    : "Jobs will appear here after work orders are converted into jobs."}
                </p>

                {!search && (
                  <Link
                    href="/dashboard/work-orders/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Job
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filteredJobs.map(
                  (job) => {
                    const property =
                      getProperty(
                        job.property_id
                      );

                    const contractor =
                      getContractor(
                        job.id
                      );

                    const assignment =
                      getAssignment(
                        job.id
                      );

                    const financials =
                      getJobFinancials(
                        job.id
                      );

                    const contractorName =
                      contractor
                        ? `${contractor.first_name ?? ""} ${
                            contractor.last_name ?? ""
                          }`.trim()
                        : "Unassigned";

                    const lineItemsForJob =
                      getJobLineItems(
                        job.id
                      );

                    return (
                      <Link
                        key={job.id}
                        href={`/dashboard/jobs/${job.id}`}
                        className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-5">

                          {/* TOP */}

                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
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
                                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClasses(
                                    job.status
                                  )}`}
                                >
                                  {formatStatus(
                                    job.status
                                  )}
                                </span>

                                {assignment?.completed_at && (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Completed
                                  </span>
                                )}
                              </div>

                              <h2 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                                {job.title ||
                                  "Untitled Job"}
                              </h2>

                              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <Building2 className="h-4 w-4 text-slate-400" />

                                  {property?.name ||
                                    "No property"}
                                </span>

                                {property?.city && (
                                  <span>
                                    {
                                      property.city
                                    }
                                    {property.state
                                      ? `, ${property.state}`
                                      : ""}
                                  </span>
                                )}

                                <span className="inline-flex items-center gap-1.5">
                                  <User className="h-4 w-4 text-slate-400" />

                                  {contractorName}
                                </span>
                              </div>

                              {contractor && (
                                <p className="mt-2 text-xs font-semibold text-blue-600">
                                  {formatSpecialty(
                                    contractor.specialty
                                  )}
                                </p>
                              )}

                              {job.description && (
                                <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                                  {
                                    job.description
                                  }
                                </p>
                              )}
                            </div>

                            <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600 lg:block" />
                          </div>

                          {/* JOB DETAILS */}

                          <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">

                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Service
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {job.service_category
                                  ?.replaceAll(
                                    "_",
                                    " "
                                  )
                                  .replace(
                                    /\b\w/g,
                                    (
                                      letter
                                    ) =>
                                      letter.toUpperCase()
                                  ) ||
                                  "Service"}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Scheduled
                              </div>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {formatDate(
                                  job.scheduled_date
                                )}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Billable Items
                              </div>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {
                                  lineItemsForJob.length
                                }
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <DollarSign className="h-3.5 w-3.5" />
                                Customer
                              </div>

                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {formatCurrency(
                                  financials.customerTotal
                                )}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                                <DollarSign className="h-3.5 w-3.5" />
                                Contractor 60%
                              </div>

                              <p className="mt-1 text-sm font-bold text-emerald-700">
                                {formatCurrency(
                                  financials.contractorTotal
                                )}
                              </p>
                            </div>
                          </div>

                          {/* FINANCIAL SPLIT */}

                          {financials.itemCount >
                            0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    Job Payment Split
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      financials.itemCount
                                    }{" "}
                                    billable{" "}
                                    {financials.itemCount ===
                                    1
                                      ? "item"
                                      : "items"}{" "}
                                    calculated from
                                    individual line-item
                                    totals.
                                  </p>
                                </div>

                                <div className="flex items-center gap-5">
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-slate-400">
                                      Contractor
                                    </p>

                                    <p className="mt-1 font-bold text-emerald-700">
                                      {formatCurrency(
                                        financials.contractorTotal
                                      )}
                                    </p>
                                  </div>

                                  <div className="h-8 w-px bg-slate-200" />

                                  <div className="text-right">
                                    <p className="text-xs font-medium text-slate-400">
                                      Elite
                                    </p>

                                    <p className="mt-1 font-bold text-blue-700">
                                      {formatCurrency(
                                        financials.eliteTotal
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* NO PRICING WARNING */}

                          {financials.itemCount ===
                            0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                              <p className="text-sm font-semibold text-amber-800">
                                No billable line items
                              </p>

                              <p className="mt-1 text-xs text-amber-700">
                                Add job line items before
                                this job can be included
                                in contractor payroll.
                              </p>
                            </div>
                          )}

                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
