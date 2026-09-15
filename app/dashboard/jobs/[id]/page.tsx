import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Building2,
  User,
  DollarSign,
  Wrench,
  Pencil,
  ClipboardList,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
  zip: string | null;
};

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean | null;
};

type Assignment = {
  id: string;
  job_id: string;
  contractor_id: string | null;
  status: string | null;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  removed_at: string | null;
  notes: string | null;
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

type JobSignoff = {
  id: string;
  job_id: string;
  representative_name: string | null;
  representative_title: string | null;
  signature_storage_path: string | null;
  signed_at: string | null;
  approved: boolean | null;
  notes: string | null;
};

const CONTRACTOR_PERCENTAGE = 0.6;
const ELITE_PERCENTAGE = 0.4;

export default async function JobDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * ---------------------------------------------------------
   * LOAD JOB
   * ---------------------------------------------------------
   */

  const { data: jobData, error: jobError } = await supabase
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
    .eq("id", id)
    .single();

  if (jobError || !jobData) {
    notFound();
  }

  const job = jobData as Job;

  /*
   * ---------------------------------------------------------
   * LOAD PROPERTY
   * ---------------------------------------------------------
   */

  let property: Property | null = null;

  if (job.property_id) {
    const { data } = await supabase
      .from("properties")
      .select(`
        id,
        name,
        address,
        city,
        state,
        zip
      `)
      .eq("id", job.property_id)
      .maybeSingle();

    property = data as Property | null;
  }

  /*
   * ---------------------------------------------------------
   * LOAD CONTRACTOR ASSIGNMENTS
   *
   * IMPORTANT:
   * The contractor is connected through
   * job_assignments.contractor_id.
   * ---------------------------------------------------------
   */

  const { data: assignmentData, error: assignmentError } =
    await supabase
      .from("job_assignments")
      .select(`
        id,
        job_id,
        contractor_id,
        status,
        assigned_at,
        accepted_at,
        completed_at,
        removed_at,
        notes
      `)
      .eq("job_id", job.id)
      .not("contractor_id", "is", null)
      .order("assigned_at", {
        ascending: false,
      });

  if (assignmentError) {
    console.error(
      "Job assignment load error:",
      assignmentError
    );
  }

  const assignments =
    (assignmentData as Assignment[] | null) ?? [];

  /*
   * Use the newest non-removed contractor assignment.
   */

  const activeAssignment =
    assignments.find(
      (assignment) =>
        assignment.status?.toLowerCase() !== "removed"
    ) ?? null;

  /*
   * ---------------------------------------------------------
   * LOAD CONTRACTOR
   * ---------------------------------------------------------
   */

  let contractor: Contractor | null = null;

  if (activeAssignment?.contractor_id) {
    const { data: contractorData } = await supabase
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
      .eq("id", activeAssignment.contractor_id)
      .maybeSingle();

    contractor =
      contractorData as Contractor | null;
  }

  /*
   * ---------------------------------------------------------
   * LOAD JOB LINE ITEMS
   *
   * These are the actual billable pieces of the job.
   * Payroll uses these same values.
   * ---------------------------------------------------------
   */

  const { data: lineItemData, error: lineItemError } =
    await supabase
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
      .eq("job_id", job.id)
      .order("created_at", {
        ascending: true,
      });

  if (lineItemError) {
    console.error(
      "Job line item load error:",
      lineItemError
    );
  }

  const lineItems =
    (lineItemData as JobLineItem[] | null) ?? [];

  /*
   * ---------------------------------------------------------
   * LOAD SIGN-OFF
   * ---------------------------------------------------------
   */

  const { data: signoffData } = await supabase
    .from("job_signoffs")
    .select(`
      id,
      job_id,
      representative_name,
      representative_title,
      signature_storage_path,
      signed_at,
      approved,
      notes
    `)
    .eq("job_id", job.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  const signoff =
    signoffData as JobSignoff | null;

  /*
   * ---------------------------------------------------------
   * CALCULATE JOB FINANCIALS
   *
   * Each line item:
   * 60% contractor
   * 40% Elite
   * ---------------------------------------------------------
   */

  const calculatedTotal = lineItems.reduce(
    (total, item) =>
      total + (Number(item.total_price) || 0),
    0
  );

  const billableTotal =
    lineItems.length > 0
      ? calculatedTotal
      : Number(job.total_amount) || 0;

  const contractorTotal = Number(
    (billableTotal * CONTRACTOR_PERCENTAGE).toFixed(2)
  );

  const eliteTotal = Number(
    (billableTotal * ELITE_PERCENTAGE).toFixed(2)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <div className="mb-6">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
        </div>

        {/* JOB HEADER */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  JOB-
                  {job.job_number ??
                    job.id.slice(0, 8).toUpperCase()}
                </span>

                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${statusClasses(
                    job.status
                  )}`}
                >
                  {formatStatus(job.status)}
                </span>

              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {job.title || "Untitled Job"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Job details, contractor assignment,
                billable items, sign-off, and payment split.
              </p>
            </div>

            <Link
              href={`/dashboard/jobs/${job.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600"
            >
              <Pencil className="h-4 w-4" />
              Edit Job
            </Link>
          </div>

          {/* SUMMARY CARDS */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoCard
              icon={<Wrench className="h-5 w-5" />}
              label="Service"
              value={formatCategory(
                job.service_category
              )}
            />

            <InfoCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Scheduled"
              value={formatDate(
                job.scheduled_date
              )}
            />

            <InfoCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Due Date"
              value={formatDate(
                job.due_date
              )}
            />

            <InfoCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Billable Total"
              value={formatCurrency(
                billableTotal
              )}
            />

          </div>
        </div>

        {/* PROPERTY + CONTRACTOR */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* PROPERTY */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Property
                </h2>

                <p className="text-sm text-slate-500">
                  Job location
                </p>
              </div>

            </div>

            <div className="mt-6">

              <p className="text-lg font-semibold text-slate-900">
                {property?.name ||
                  "No property assigned"}
              </p>

              {property && (
                <div className="mt-3 space-y-1 text-sm text-slate-500">

                  {property.address && (
                    <p>{property.address}</p>
                  )}

                  {(property.city ||
                    property.state ||
                    property.zip) && (
                    <p>
                      {property.city}
                      {property.state
                        ? `, ${property.state}`
                        : ""}
                      {property.zip
                        ? ` ${property.zip}`
                        : ""}
                    </p>
                  )}

                </div>
              )}

              {job.unit_id && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Unit
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    Unit assigned
                  </p>

                </div>
              )}

            </div>
          </section>

          {/* CONTRACTOR */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Assigned Contractor
                </h2>

                <p className="text-sm text-slate-500">
                  Contractor responsible for this job
                </p>
              </div>

            </div>

            <div className="mt-6">

              {contractor ? (
                <>

                  <div className="flex flex-wrap items-center gap-2">

                    <p className="text-lg font-semibold text-slate-900">
                      {getContractorName(
                        contractor
                      )}
                    </p>

                    {contractor.active && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    )}

                  </div>

                  {contractor.specialty && (
                    <p className="mt-1 text-sm font-semibold text-blue-600">
                      {formatCategory(
                        contractor.specialty
                      )}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 text-sm text-slate-500">

                    {contractor.phone && (
                      <p>{contractor.phone}</p>
                    )}

                    {contractor.email && (
                      <p>{contractor.email}</p>
                    )}

                  </div>

                  {activeAssignment && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Assignment Status
                          </p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {formatStatus(
                              activeAssignment.status
                            )}
                          </p>
                        </div>

                        <div
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignmentStatusClasses(
                            activeAssignment.status
                          )}`}
                        >
                          {formatStatus(
                            activeAssignment.status
                          )}
                        </div>

                      </div>

                    </div>
                  )}

                </>
              ) : (
                <div className="rounded-xl bg-amber-50 p-4">

                  <p className="font-semibold text-amber-800">
                    No contractor assigned
                  </p>

                  <p className="mt-1 text-sm text-amber-700">
                    This job still needs to be assigned
                    to a contractor.
                  </p>

                </div>
              )}

            </div>
          </section>

        </div>

        {/* BILLABLE ITEMS */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Billable Items
                  </h2>

                  <p className="text-sm text-slate-500">
                    Individual job items used for billing
                    and contractor payroll.
                  </p>
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">

                <p className="text-xs font-semibold text-slate-400">
                  Items
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {lineItems.length}
                </p>

              </div>

            </div>

          </div>

          {lineItems.length === 0 ? (

            <div className="p-8 text-center">

              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 font-semibold text-slate-700">
                No job line items
              </p>

              <p className="mt-1 text-sm text-slate-500">
                This job does not have individual billable
                items yet.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-3">
                      Item
                    </th>

                    <th className="px-6 py-3 text-right">
                      Quantity
                    </th>

                    <th className="px-6 py-3 text-right">
                      Unit Price
                    </th>

                    <th className="px-6 py-3 text-right">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-right">
                      Contractor 60%
                    </th>

                    <th className="px-6 py-3 text-right">
                      Elite 40%
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {lineItems.map((item) => {

                    const total =
                      Number(
                        item.total_price
                      ) || 0;

                    const contractorAmount =
                      Number(
                        (
                          total *
                          CONTRACTOR_PERCENTAGE
                        ).toFixed(2)
                      );

                    const eliteAmount =
                      Number(
                        (
                          total *
                          ELITE_PERCENTAGE
                        ).toFixed(2)
                      );

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <p className="font-semibold text-slate-900">
                            {item.description ||
                              "Job item"}
                          </p>

                          {item.notes && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.notes}
                            </p>
                          )}

                        </td>

                        <td className="px-6 py-4 text-right text-sm text-slate-600">
                          {item.quantity ?? "—"}
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-slate-600">
                          {formatCurrency(
                            item.unit_price
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                          {formatCurrency(
                            total
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-emerald-700">
                          {formatCurrency(
                            contractorAmount
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-blue-700">
                          {formatCurrency(
                            eliteAmount
                          )}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

                <tfoot>

                  <tr className="border-t-2 border-slate-200 bg-slate-50">

                    <td
                      colSpan={3}
                      className="px-6 py-4 text-right font-bold text-slate-700"
                    >
                      Totals
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(
                        billableTotal
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-emerald-700">
                      {formatCurrency(
                        contractorTotal
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-blue-700">
                      {formatCurrency(
                        eliteTotal
                      )}
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>
          )}

        </section>

        {/* PAYROLL SPLIT */}

        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-sm font-bold text-blue-900">
                Job Payment Split
              </p>

              <p className="mt-1 max-w-2xl text-sm text-blue-700">
                Elite bills the customer and retains 40%.
                The assigned contractor receives 60% of
                each billable job item.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-white px-5 py-4 text-center shadow-sm">

                <p className="text-xs font-semibold text-slate-400">
                  Contractor
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {formatCurrency(
                    contractorTotal
                  )}
                </p>

                <p className="text-xs font-semibold text-emerald-600">
                  60%
                </p>

              </div>

              <div className="rounded-xl bg-white px-5 py-4 text-center shadow-sm">

                <p className="text-xs font-semibold text-slate-400">
                  Elite
                </p>

                <p className="mt-1 text-xl font-bold text-blue-700">
                  {formatCurrency(
                    eliteTotal
                  )}
                </p>

                <p className="text-xs font-semibold text-blue-600">
                  40%
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* SIGN-OFF */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                signoff?.approved
                  ? "bg-green-100 text-green-600"
                  : signoff?.signed_at
                  ? "bg-amber-100 text-amber-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {signoff?.approved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock3 className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Job Sign-Off
              </h2>

              <p className="text-sm text-slate-500">
                Customer or property representative approval
              </p>
            </div>

          </div>

          <div className="mt-6">

            {!signoff ? (

              <div className="rounded-xl bg-amber-50 p-4">

                <p className="font-semibold text-amber-800">
                  No sign-off recorded
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  This job does not have a sign-off record yet.
                </p>

              </div>

            ) : (

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Representative
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {signoff.representative_name ||
                      "Not provided"}
                  </p>

                  {signoff.representative_title && (
                    <p className="mt-1 text-sm text-slate-500">
                      {signoff.representative_title}
                    </p>
                  )}

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    {signoff.approved ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />

                        <span className="font-semibold text-green-700">
                          Approved
                        </span>
                      </>
                    ) : signoff.signed_at ? (
                      <>
                        <Clock3 className="h-5 w-5 text-amber-600" />

                        <span className="font-semibold text-amber-700">
                          Signed
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-slate-600">
                        Pending
                      </span>
                    )}

                  </div>

                  {signoff.signed_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(
                        signoff.signed_at
                      )}
                    </p>
                  )}

                </div>

              </div>

            )}

          </div>
        </section>

        {/* DESCRIPTION */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Job Description
              </h2>

              <p className="text-sm text-slate-500">
                Instructions and service details
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-5">

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {job.description ||
                "No description provided."}
            </p>

          </div>

        </section>

        {/* TIMELINE */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-bold text-slate-900">
            Job Timeline
          </h2>

          <div className="mt-6 space-y-4">

            <TimelineItem
              label="Job Created"
              value={formatDateTime(
                job.created_at
              )}
              active
            />

            <TimelineItem
              label="Contractor"
              value={
                contractor
                  ? getContractorName(
                      contractor
                    )
                  : "Unassigned"
              }
              active={Boolean(contractor)}
            />

            <TimelineItem
              label="Current Status"
              value={formatStatus(
                job.status
              )}
              active
            />

            <TimelineItem
              label="Scheduled"
              value={formatDate(
                job.scheduled_date
              )}
              active={Boolean(
                job.scheduled_date
              )}
            />

            <TimelineItem
              label="Due Date"
              value={formatDate(
                job.due_date
              )}
              active={Boolean(
                job.due_date
              )}
            />

            <TimelineItem
              label="Sign-Off"
              value={
                signoff?.approved
                  ? "Approved"
                  : signoff?.signed_at
                  ? "Signed"
                  : "Pending"
              }
              active={Boolean(
                signoff?.signed_at
              )}
            />

          </div>
        </section>

      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}

function TimelineItem({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-4">

      <div
        className={`h-3 w-3 rounded-full ${
          active
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      />

      <div className="flex flex-1 items-center justify-between border-b border-slate-100 pb-4">

        <p className="text-sm font-semibold text-slate-700">
          {label}
        </p>

        <p className="text-sm text-slate-500">
          {value}
        </p>

      </div>

    </div>
  );
}

function getContractorName(
  contractor: Contractor
) {
  return (
    `${contractor.first_name ?? ""} ${
      contractor.last_name ?? ""
    }`.trim() || "Unnamed Contractor"
  );
}

function formatDate(
  date: string | null
) {
  if (!date) return "Not scheduled";

  const parsed = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(parsed.getTime())) {
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

function formatDateTime(
  date: string | null
) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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
  if (!status) return "Open";

  return status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatCategory(
  category: string | null
) {
  if (!category) return "Service";

  return category
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function assignmentStatusClasses(
  status: string | null
) {
  switch (
    status?.toLowerCase()
  ) {
    case "assigned":
      return "bg-purple-100 text-purple-700";

    case "accepted":
      return "bg-blue-100 text-blue-700";

    case "in_progress":
      return "bg-amber-100 text-amber-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "removed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
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
