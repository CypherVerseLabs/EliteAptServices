"use client";

import Link from "next/link";
import {
ArrowLeft,
CalendarDays,
CheckCircle2,
ClipboardList,
Clock,
Loader2,
MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkOrder = {
id: string;
work_order_number: number | null;
title: string | null;
service: string | null;
description: string | null;
status: string | null;
priority: string | null;
requested_date: string | null;
property_name: string | null;
property_address: string | null;
city: string | null;
state: string | null;
zip: string | null;
unit_number: string | null;
};

const supabase = createClient();

export default function CustomerSchedulePage() {
const [requests, setRequests] = useState<WorkOrder[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadSchedule() {
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
        title,
        service,
        description,
        status,
        priority,
        requested_date,
        property_name,
        property_address,
        city,
        state,
        zip,
        unit_number
      `)
      .eq("requested_by", user.id)
      .not("requested_date", "is", null)
      .order("requested_date", {
        ascending: true,
      });

    if (requestsError) {
      throw new Error(
        requestsError.message ||
          "Unable to load your schedule."
      );
    }

    setRequests((data ?? []) as WorkOrder[]);
  } catch (err) {
    console.error("CUSTOMER SCHEDULE ERROR:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to load your schedule."
    );
  } finally {
    setLoading(false);
  }
}

loadSchedule();


}, []);

const activeRequests = requests.filter(
(request) =>
!["completed", "closed", "cancelled", "canceled"].includes(
request.status?.toLowerCase() ?? ""
)
);

return (
<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
<Link href="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" >
<ArrowLeft className="h-4 w-4" />
Customer Home
</Link>

  <div className="mt-6">
    <p className="text-sm font-semibold text-blue-600">
      Customer Portal
    </p>

    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
      My Schedule
    </h1>

    <p className="mt-2 text-slate-500">
      View your upcoming requested service dates.
    </p>
  </div>

  {error && (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
      <p className="font-semibold text-red-900">
        Unable to load schedule
      </p>

      <p className="mt-1 text-sm text-red-700">
        {error}
      </p>
    </div>
  )}

  {loading ? (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  ) : !error && activeRequests.length === 0 ? (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
        <CalendarDays className="h-8 w-8 text-blue-600" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        No scheduled services
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Service requests with requested dates will appear
        here as they are scheduled.
      </p>

      <Link
        href="/customer/request"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <ClipboardList className="h-4 w-4" />
        Request Service
      </Link>
    </div>
  ) : (
    <div className="mt-8 space-y-4">
      {activeRequests.map((request) => (
        <Link
          key={request.id}
          href={`/customer/request/${request.id}`}
          className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:p-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  WO-
                  {request.work_order_number ??
                    request.id.slice(0, 8).toUpperCase()}
                </span>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClasses(
                    request.status
                  )}`}
                >
                  {formatStatus(request.status)}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold text-slate-950 group-hover:text-blue-700">
                {request.title ||
                  request.service ||
                  "Service Request"}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-600">
                {request.service || "Service"}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {request.property_name || "Property"}
                  {request.unit_number
                    ? ` — Unit ${request.unit_number}`
                    : ""}
                </span>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl bg-blue-50 p-4 sm:min-w-[150px]">
              <div className="flex items-center gap-2 text-blue-600">
                <CalendarDays className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Requested
                </span>
              </div>

              <p className="mt-2 text-lg font-bold text-slate-950">
                {formatDate(request.requested_date)}
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Service date
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )}

  {!loading && !error && requests.length > 0 && (
    <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

        <div>
          <h2 className="font-semibold text-green-950">
            Schedule Information
          </h2>

          <p className="mt-1 text-sm leading-6 text-green-800">
            These dates are based on the requested service
            dates on your service requests. Elite Apartment
            Services will update your request if the schedule
            changes.
          </p>
        </div>
      </div>
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
case "closed":
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

default:
  return "bg-amber-100 text-amber-700";


}
}

function formatDate(date: string | null) {
if (!date) {
return "Not specified";
}

const parsed = new Date(date);

if (Number.isNaN(parsed.getTime())) {
return date;
}

return parsed.toLocaleDateString("en-US", {
weekday: "short",
month: "short",
day: "numeric",
year: "numeric",
});
}