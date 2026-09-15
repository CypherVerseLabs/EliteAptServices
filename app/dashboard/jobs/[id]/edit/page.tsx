"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type Assignment = {
job_id: string;
worker_id: string;
status: string | null;
};

type Worker = {
id: string;
first_name: string | null;
last_name: string | null;
};

export default function JobsPage() {
const supabase = createClient();

const [jobs, setJobs] = useState<Job[]>([]);
const [properties, setProperties] = useState<Property[]>([]);
const [assignments, setAssignments] = useState<Assignment[]>([]);
const [workers, setWorkers] = useState<Worker[]>([]);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [search, setSearch] = useState("");

useEffect(() => {
loadJobs();
}, []);

async function loadJobs() {
setLoading(true);
setError("");

const [
  jobsResult,
  propertiesResult,
  assignmentsResult,
  workersResult,
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
    .order("created_at", { ascending: false }),

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
      job_id,
      worker_id,
      status
    `),

  supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name
    `)
    .eq("role", "worker"),
]);

if (jobsResult.error) {
  console.error("Jobs load error:", jobsResult.error);
  setError(jobsResult.error.message);
  setLoading(false);
  return;
}

setJobs((jobsResult.data ?? []) as Job[]);
setProperties((propertiesResult.data ?? []) as Property[]);
setAssignments((assignmentsResult.data ?? []) as Assignment[]);
setWorkers((workersResult.data ?? []) as Worker[]);

setLoading(false);


}

function getProperty(propertyId: string | null) {
if (!propertyId) return null;

return properties.find((property) => property.id === propertyId) ?? null;


}

function getWorker(jobId: string) {
const assignment = assignments.find(
(item) =>
item.job_id === jobId &&
item.status !== "removed"
);

if (!assignment) return null;

return (
  workers.find(
    (worker) => worker.id === assignment.worker_id
  ) ?? null
);


}

function formatDate(date: string | null) {
if (!date) return "—";

const parsed = new Date(`${date}T00:00:00`);

if (Number.isNaN(parsed.getTime())) {
  return date;
}

return parsed.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});


}

function formatCurrency(amount: number | null) {
if (amount === null || amount === undefined) {
return "$0.00";
}

return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(Number(amount));


}

function statusClasses(status: string | null) {
switch (status?.toLowerCase()) {
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
    return "bg-red-100 text-red-700";

  default:
    return "bg-slate-100 text-slate-600";
}


}

function formatStatus(status: string | null) {
if (!status) return "Open";

return status
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());


}

function formatCategory(category: string | null) {
if (!category) return "Service";

return category
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());


}

const filteredJobs = jobs.filter((job) => {
const property = getProperty(job.property_id);
const worker = getWorker(job.id);

const workerName = worker
  ? `${worker.first_name ?? ""} ${worker.last_name ?? ""}`.trim()
  : "";

const searchText = search.trim().toLowerCase();

if (!searchText) return true;

return (
  String(job.job_number ?? "")
    .toLowerCase()
    .includes(searchText) ||
  job.title?.toLowerCase().includes(searchText) ||
  job.description?.toLowerCase().includes(searchText) ||
  job.service_category?.toLowerCase().includes(searchText) ||
  property?.name?.toLowerCase().includes(searchText) ||
  property?.address?.toLowerCase().includes(searchText) ||
  property?.city?.toLowerCase().includes(searchText) ||
  workerName.toLowerCase().includes(searchText)
);


});

return (
<div className="min-h-screen bg-slate-50 p-6 lg:p-8">
<div className="mx-auto max-w-7xl">
<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
<div>
<p className="text-sm font-semibold text-blue-600">
Operations
</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Jobs
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Track assigned work, job progress, workers, and payments.
        </p>
      </div>

      <Link
        href="/dashboard/jobs/new"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Create Job
      </Link>
    </div>

    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search jobs, properties, services, or workers..."
          className="w-full rounded-xl border border-slate-300 bg-white px-11 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />
      </div>
    </div>

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
            {filteredJobs.length === 1 ? "job" : "jobs"}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
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
              {search ? "No matching jobs" : "No jobs yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search
                ? "Try searching for another job, property, service, or worker."
                : "Jobs will appear here after work orders are converted into jobs."}
            </p>

            {!search && (
              <Link
                href="/dashboard/jobs/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Job
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {filteredJobs.map((job) => {
              const property = getProperty(job.property_id);
              const worker = getWorker(job.id);

              const workerName = worker
                ? `${worker.first_name ?? ""} ${
                    worker.last_name ?? ""
                  }`.trim()
                : "Unassigned";

              return (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          JOB-
                          {job.job_number ??
                            job.id.slice(0, 8).toUpperCase()}
                        </span>

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            job.status
                          )}`}
                        >
                          {formatStatus(job.status)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                        {job.title || "Untitled Job"}
                      </h2>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {property?.name || "No property"}
                        </span>

                        {property?.city && (
                          <span>
                            {property.city}
                            {property.state
                              ? `, ${property.state}`
                              : ""}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-4 w-4 text-slate-400" />
                          {workerName}
                        </span>
                      </div>

                      {job.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-6 lg:justify-end">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Service
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatCategory(job.service_category)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Scheduled
                        </div>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(job.scheduled_date)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          Total
                        </div>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatCurrency(job.total_amount)}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </>
    )}
  </div>
</div>


);
}