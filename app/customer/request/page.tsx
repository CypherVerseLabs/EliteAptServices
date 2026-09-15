"use client";

import Link from "next/link";
import {
ArrowLeft,
CalendarDays,
ChevronRight,
ClipboardList,
Loader2,
Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkOrder = {
id: string;
work_order_number: number | null;
property_name: string | null;
property_address: string | null;
city: string | null;
state: string | null;
zip: string | null;
unit_number: string | null;
service: string | null;
title: string | null;
description: string | null;
status: string | null;
priority: string | null;
requested_date: string | null;
created_at: string;
};

const supabase = createClient();

export default function CustomerRequestsPage() {
const [requests, setRequests] = useState<WorkOrder[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadRequests() {
try {
const {
data: { user },
error: authError,
} = await supabase.auth.getUser();

    if (authError || !user) {
      window.location.assign("/login");
      return;
    }

    const { data, error: requestsError } = await supabase
      .from("work_orders")
      .select(`
        id,
        work_order_number,
        property_name,
        property_address,
        city,
        state,
        zip,
        unit_number,
        service,
        title,
        description,
        status,
        priority,
        requested_date,
        created_at
      `)
      .eq("requested_by", user.id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      throw new Error(
        requestsError.message || "Unable to load your requests."
      );
    }

    setRequests((data || []) as WorkOrder[]);
  } catch (err) {
    console.error("CUSTOMER REQUESTS ERROR:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to load your service requests."
    );
  } finally {
    setLoading(false);
  }
}

loadRequests();


}, []);

if (loading) {
return (
<div className="flex min-h-[60vh] items-center justify-center">
<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
</div>
);
}

return (
<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
<Link href="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" >
<ArrowLeft className="h-4 w-4" />
Customer Home
</Link>

  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p className="text-sm font-semibold text-blue-600">
        Customer Portal
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        My Service Requests
      </h1>

      <p className="mt-2 text-slate-500">
        View and track the service requests you have submitted.
      </p>
    </div>

    <Link
      href="/customer/request"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
    >
      <Plus className="h-4 w-4" />
      New Request
    </Link>
  </div>

  {error && (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-semibold">Unable to load requests</p>
      <p className="mt-1">{error}</p>
    </div>
  )}

  {!error && requests.length === 0 && (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
        <ClipboardList className="h-8 w-8 text-blue-600" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        No service requests yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        When you submit a service request, it will appear here so you
        can track its status.
      </p>

      <Link
        href="/customer/request"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Request Service
      </Link>
    </div>
  )}

  {requests.length > 0 && (
    <div className="mt-8 space-y-4">
      {requests.map((request) => (
        <Link
          key={request.id}
          href={`/customer/request/${request.id}`}
          className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:p-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  {request.work_order_number
                    ? `WO-${request.work_order_number}`
                    : `WO-${request.id.slice(0, 8).toUpperCase()}`}
                </span>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClasses(
                    request.status
                  )}`}
                >
                  {formatStatus(request.status)}
                </span>

                {request.priority &&
                  request.priority.toLowerCase() !== "normal" && (
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${priorityClasses(
                        request.priority
                      )}`}
                    >
                      {formatStatus(request.priority)} Priority
                    </span>
                  )}
              </div>

              <h2 className="mt-3 text-lg font-bold text-slate-950 group-hover:text-blue-700">
                {request.title ||
                  request.service ||
                  "Service Request"}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-600">
                {request.service || "Service"}
              </p>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                {request.description ||
                  "No description provided."}
              </p>
            </div>

            <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 group-hover:text-blue-500 sm:block" />
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Property
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {request.property_name || "Property"}
              </p>

              {request.unit_number && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Unit {request.unit_number}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Requested Date
              </p>

              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {request.requested_date
                  ? formatDate(request.requested_date)
                  : "Not specified"}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Submitted
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(request.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-4 text-sm font-semibold text-blue-600 sm:hidden">
            View Request
            <ChevronRight className="ml-1 h-4 w-4" />
          </div>
        </Link>
      ))}
    </div>
  )}
</div>


);
}

function formatStatus(status: string | null) {
if (!status) {
return "Submitted";
}

return status
.replaceAll("_", " ")
.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string | null) {
switch (status?.toLowerCase()) {
case "completed":
case "paid":
return "bg-green-100 text-green-700";

case "in_progress":
case "in progress":
  return "bg-blue-100 text-blue-700";

case "assigned":
case "accepted":
  return "bg-purple-100 text-purple-700";

case "cancelled":
case "canceled":
  return "bg-red-100 text-red-700";

case "rejected":
  return "bg-red-100 text-red-700";

default:
  return "bg-amber-100 text-amber-700";


}
}

function priorityClasses(priority: string | null) {
switch (priority?.toLowerCase()) {
case "urgent":
return "bg-red-100 text-red-700";

case "high":
  return "bg-orange-100 text-orange-700";

default:
  return "bg-slate-100 text-slate-600";


}
}

function formatDate(date: string) {
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