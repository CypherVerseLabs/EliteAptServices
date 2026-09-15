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
import { useParams } from "next/navigation";
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

export default function CustomerRequestDetailsPage() {
const params = useParams();
const id = String(params.id);

const [request, setRequest] =
useState<WorkOrder | null>(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadRequest() {
try {
const {
data: { user },
} = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/login");
      return;
    }

    const { data, error } = await supabase
      .from("work_orders")
      .select(
        `
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
        `
      )
      .eq("id", id)
      .eq("requested_by", user.id)
      .single();

    if (error) {
      throw new Error(
        error.message ||
          "Request could not be found."
      );
    }

    setRequest(data as WorkOrder);
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to load request."
    );
  } finally {
    setLoading(false);
  }
}

loadRequest();


}, [id]);

if (loading) {
return (
<div className="flex min-h-[60vh] items-center justify-center">
<Loader2 className="h-7 w-7 animate-spin text-blue-600" />
</div>
);
}

if (error || !request) {
return (
<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
<Link href="/customer/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600" >
<ArrowLeft className="h-4 w-4" />
Back to My Requests
</Link>

    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
      <h1 className="font-bold text-red-900">
        Request Not Found
      </h1>

      <p className="mt-2 text-sm text-red-700">
        {error ||
          "This service request could not be found."}
      </p>
    </div>
  </div>
);


}

return (
<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
<Link href="/customer/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" >
<ArrowLeft className="h-4 w-4" />
Back to My Requests
</Link>

  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
    <div>
      <p className="text-sm font-semibold text-blue-600">
        Work Order
      </p>

      <h1 className="mt-1 text-3xl font-bold text-slate-950">
        WO-
        {request.work_order_number ??
          request.id
            .slice(0, 8)
            .toUpperCase()}
      </h1>

      <p className="mt-2 text-slate-500">
        {request.title ||
          request.service ||
          "Service Request"}
      </p>
    </div>

    <span
      className={`inline-flex w-fit rounded-xl px-4 py-2 text-sm font-bold ${statusClasses(
        request.status
      )}`}
    >
      {formatStatus(request.status)}
    </span>
  </div>

  <div className="mt-8 grid gap-6 md:grid-cols-2">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-blue-600" />

        <h2 className="font-semibold text-slate-950">
          Request
        </h2>
      </div>

      <dl className="mt-5 space-y-4">
        <Detail
          label="Service"
          value={request.service || "—"}
        />

        <Detail
          label="Priority"
          value={formatStatus(
            request.priority
          )}
        />

        <Detail
          label="Requested Date"
          value={
            request.requested_date
              ? formatDate(
                  request.requested_date
                )
              : "—"
          }
        />

        <Detail
          label="Submitted"
          value={formatDate(
            request.created_at
          )}
        />
      </dl>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-green-600" />

        <h2 className="font-semibold text-slate-950">
          Property
        </h2>
      </div>

      <div className="mt-5">
        <p className="font-semibold text-slate-900">
          {request.property_name ||
            "Property"}
        </p>

        <p className="mt-2 text-sm text-slate-600">
          {request.property_address}
          <br />
          {request.city}, {request.state}{" "}
          {request.zip}
        </p>

        {request.unit_number && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            Unit {request.unit_number}
          </p>
        )}
      </div>
    </section>
  </div>

  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <Clock className="h-5 w-5 text-purple-600" />

      <h2 className="font-semibold text-slate-950">
        Work Description
      </h2>
    </div>

    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
      {request.description ||
        "No description provided."}
    </p>
  </section>

  <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

      <div>
        <h2 className="font-semibold text-blue-950">
          Request Status
        </h2>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          Your request is currently{" "}
          <strong>
            {formatStatus(request.status)}
          </strong>
          . Elite Apartment Services will update
          the request as it moves through the service
          process.
        </p>
      </div>
    </div>
  </section>
</div>


);
}

function Detail({
label,
value,
}: {
label: string;
value: string;
}) {
return (
<div>
<dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
{label}
</dt>

  <dd className="mt-1 text-sm font-semibold text-slate-800">
    {value}
  </dd>
</div>


);
}

function formatStatus(status: string | null) {
if (!status) return "Submitted";

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
case "in progress":
  return "bg-blue-100 text-blue-700";

case "assigned":
case "accepted":
  return "bg-purple-100 text-purple-700";

case "cancelled":
  return "bg-red-100 text-red-700";

default:
  return "bg-amber-100 text-amber-700";


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