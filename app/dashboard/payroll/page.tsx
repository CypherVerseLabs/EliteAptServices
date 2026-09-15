"use client";

import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileText,
  PenLine,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  work_order_number: number | null;
  property_name: string | null;
  unit_number: string | null;
  title: string | null;
  status: string | null;
  requested_date: string | null;
  pricing_total: number | null;
};

type JobLineItem = {
  id: string;
  job_id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
};

type JobAssignment = {
  id: string;
  job_id: string;
  worker_id: string | null;
  contractor_id: string | null;
  status: string | null;
  assigned_at: string;
  completed_at: string | null;
};

type JobSignoff = {
  id: string;
  job_id: string;
  signed_at: string | null;
  approved: boolean | null;
};

type JobDocument = {
  id: string;
  job_id: string;
  document_type: string | null;
  file_name: string | null;
  created_at: string;
};

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  active: boolean;
};

type PayrollJob = {
  jobId: string;
  workOrder: WorkOrder | null;
  assignment: JobAssignment | null;
  contractor: Contractor | null;
  lineItems: JobLineItem[];
  signoff: JobSignoff | null;
  documents: JobDocument[];
};

const CONTRACTOR_PERCENTAGE = 0.6;
const ELITE_PERCENTAGE = 0.4;

function money(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getContractorName(contractor: Contractor | null) {
  if (!contractor) {
    return "Unassigned";
  }

  const name =
    `${contractor.first_name ?? ""} ${contractor.last_name ?? ""}`.trim();

  return name || "Unnamed Contractor";
}

export default function PayrollPage() {
  const supabase = createClient();

  const [jobs, setJobs] = useState<PayrollJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPayroll() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!user) {
          throw new Error("You must be logged in to view payroll.");
        }

        const [
          workOrdersResult,
          lineItemsResult,
          assignmentsResult,
          signoffsResult,
          documentsResult,
          contractorsResult,
        ] = await Promise.all([
          supabase
            .from("work_orders")
            .select(`
              id,
              work_order_number,
              property_name,
              unit_number,
              title,
              status,
              requested_date,
              pricing_total
            `)
            .order("created_at", {
              ascending: false,
            })
            .limit(100),

          supabase
            .from("job_line_items")
            .select(`
              id,
              job_id,
              description,
              quantity,
              unit_price,
              total_price,
              notes
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
              completed_at
            `)
            .order("assigned_at", {
              ascending: false,
            }),

          supabase
            .from("job_signoffs")
            .select(`
              id,
              job_id,
              signed_at,
              approved
            `)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("job_documents")
            .select(`
              id,
              job_id,
              document_type,
              file_name,
              created_at
            `)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("contractors")
            .select(`
              id,
              first_name,
              last_name,
              specialty,
              active
            `)
            .eq("active", true),
        ]);

        if (workOrdersResult.error) {
          throw new Error(workOrdersResult.error.message);
        }

        if (lineItemsResult.error) {
          console.error(
            "PAYROLL LINE ITEMS ERROR:",
            lineItemsResult.error
          );
        }

        if (assignmentsResult.error) {
          console.error(
            "PAYROLL ASSIGNMENTS ERROR:",
            assignmentsResult.error
          );
        }

        if (signoffsResult.error) {
          console.error(
            "PAYROLL SIGNOFF ERROR:",
            signoffsResult.error
          );
        }

        if (documentsResult.error) {
          console.error(
            "PAYROLL DOCUMENT ERROR:",
            documentsResult.error
          );
        }

        if (contractorsResult.error) {
          console.error(
            "PAYROLL CONTRACTOR ERROR:",
            contractorsResult.error
          );
        }

        const workOrders =
          (workOrdersResult.data as WorkOrder[] | null) ?? [];

        const lineItems =
          (lineItemsResult.data as JobLineItem[] | null) ?? [];

        const assignments =
          (assignmentsResult.data as JobAssignment[] | null) ?? [];

        const signoffs =
          (signoffsResult.data as JobSignoff[] | null) ?? [];

        const documents =
          (documentsResult.data as JobDocument[] | null) ?? [];

        const contractors =
          (contractorsResult.data as Contractor[] | null) ?? [];

        const contractorMap = new Map<string, Contractor>();

        contractors.forEach((contractor) => {
          contractorMap.set(contractor.id, contractor);
        });

        const lineItemMap = new Map<string, JobLineItem[]>();

        lineItems.forEach((item) => {
          const existing = lineItemMap.get(item.job_id) ?? [];

          existing.push(item);
          lineItemMap.set(item.job_id, existing);
        });

        /*
         * Assignments are ordered newest first.
         * Keep the newest non-removed assignment for each job.
         */
        const assignmentMap = new Map<string, JobAssignment>();

        assignments.forEach((assignment) => {
          const existing = assignmentMap.get(assignment.job_id);

          if (!existing) {
            assignmentMap.set(assignment.job_id, assignment);
            return;
          }

          const existingRemoved =
            existing.status?.toLowerCase() === "removed";

          const currentRemoved =
            assignment.status?.toLowerCase() === "removed";

          if (existingRemoved && !currentRemoved) {
            assignmentMap.set(assignment.job_id, assignment);
          }
        });

        const signoffMap = new Map<string, JobSignoff>();

        signoffs.forEach((signoff) => {
          if (!signoffMap.has(signoff.job_id)) {
            signoffMap.set(signoff.job_id, signoff);
          }
        });

        const documentMap = new Map<string, JobDocument[]>();

        documents.forEach((document) => {
          const existing = documentMap.get(document.job_id) ?? [];

          existing.push(document);
          documentMap.set(document.job_id, existing);
        });

        const payrollJobs: PayrollJob[] = workOrders
          .map((workOrder) => {
            const assignment =
              assignmentMap.get(workOrder.id) ?? null;

            const validAssignment =
              assignment &&
              assignment.status?.toLowerCase() !== "removed"
                ? assignment
                : null;

            const contractor =
              validAssignment?.contractor_id
                ? contractorMap.get(
                    validAssignment.contractor_id
                  ) ?? null
                : null;

            return {
              jobId: workOrder.id,
              workOrder,
              assignment: validAssignment,
              contractor,
              lineItems:
                lineItemMap.get(workOrder.id) ?? [],
              signoff:
                signoffMap.get(workOrder.id) ?? null,
              documents:
                documentMap.get(workOrder.id) ?? [],
            };
          })
          .filter(
            (job) =>
              Boolean(job.assignment) ||
              job.lineItems.length > 0
          );

        if (mounted) {
          setJobs(payrollJobs);
        }
      } catch (error) {
        console.error("PAYROLL LOAD ERROR:", error);

        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load payroll."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPayroll();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const payrollJobs = useMemo(() => {
    return jobs.map((job) => {
      const customerTotal = job.lineItems.reduce(
        (total, item) =>
          total + Number(item.total_price || 0),
        0
      );

      /*
       * If line items exist, use their total.
       * Otherwise fall back to the work order pricing total.
       */
      const calculatedCustomerTotal =
        job.lineItems.length > 0
          ? customerTotal
          : Number(job.workOrder?.pricing_total || 0);

      const contractorPay = Number(
        (
          calculatedCustomerTotal *
          CONTRACTOR_PERCENTAGE
        ).toFixed(2)
      );

      const eliteShare = Number(
        (
          calculatedCustomerTotal *
          ELITE_PERCENTAGE
        ).toFixed(2)
      );

      const hasWorksheet = job.documents.some((document) => {
        const type =
          document.document_type?.toLowerCase() ?? "";

        const file =
          document.file_name?.toLowerCase() ?? "";

        return (
          type.includes("worksheet") ||
          file.includes("worksheet")
        );
      });

      const hasSignoff = Boolean(job.signoff?.signed_at);

      const approvedSignoff = Boolean(
        job.signoff?.approved
      );

      const completed =
        job.workOrder?.status?.toLowerCase() ===
          "completed" ||
        job.assignment?.status?.toLowerCase() ===
          "completed";

      const ready =
        Boolean(job.assignment) &&
        job.lineItems.length > 0 &&
        hasWorksheet &&
        hasSignoff &&
        approvedSignoff;

      return {
        ...job,
        customerTotal: calculatedCustomerTotal,
        contractorPay,
        eliteShare,
        hasWorksheet,
        hasSignoff,
        approvedSignoff,
        completed,
        ready,
      };
    });
  }, [jobs]);

  const totalCustomerRevenue = useMemo(
    () =>
      payrollJobs.reduce(
        (total, job) =>
          total + job.customerTotal,
        0
      ),
    [payrollJobs]
  );

  const totalContractorPay = useMemo(
    () =>
      payrollJobs.reduce(
        (total, job) =>
          total + job.contractorPay,
        0
      ),
    [payrollJobs]
  );

  const totalEliteShare = useMemo(
    () =>
      payrollJobs.reduce(
        (total, job) =>
          total + job.eliteShare,
        0
      ),
    [payrollJobs]
  );

  const readyCount = payrollJobs.filter(
    (job) => job.ready
  ).length;

  const worksheetCount = payrollJobs.filter(
    (job) => job.hasWorksheet
  ).length;

  const signoffCount = payrollJobs.filter(
    (job) => job.hasSignoff
  ).length;

  const missingCount =
    payrollJobs.length - readyCount;

  const contractorSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        contractor: Contractor | null;
        jobs: number;
        total: number;
        ready: number;
      }
    >();

    payrollJobs.forEach((job) => {
      const key =
        job.contractor?.id ?? "unassigned";

      const existing =
        map.get(key) ?? {
          contractor: job.contractor,
          jobs: 0,
          total: 0,
          ready: 0,
        };

      existing.jobs += 1;
      existing.total += job.contractorPay;

      if (job.ready) {
        existing.ready += 1;
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [payrollJobs]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Friday Payroll
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Review completed work, worksheets, property
            sign-offs, and contractor payments before
            Friday payroll is processed.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

              <div>
                <p className="font-semibold text-red-900">
                  Payroll could not be loaded
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 text-blue-600" />

              <div>
                <p className="font-bold text-blue-900">
                  Friday payroll cutoff
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Worksheets and property sign-offs must
                  be turned in before 10:00 AM Friday.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm">
              10:00 AM Friday
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Jobs
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "—" : payrollJobs.length}
                </p>
              </div>

              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Ready
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {loading ? "—" : readyCount}
                </p>
              </div>

              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Needs Attention
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {loading ? "—" : missingCount}
                </p>
              </div>

              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Contractor Pay
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "—"
                    : money(totalContractorPay)}
                </p>
              </div>

              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Calculator className="h-7 w-7 text-blue-600" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Payroll Calculation
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Contractor pay is currently calculated at
              60% of each job line item.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Customer work
                </span>

                <span className="font-semibold text-slate-900">
                  {money(totalCustomerRevenue)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Contractor share
                </span>

                <span className="font-semibold text-emerald-700">
                  {money(totalContractorPay)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-medium text-slate-700">
                  Elite share
                </span>

                <span className="font-bold text-blue-700">
                  {money(totalEliteShare)}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/workers"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <Users className="h-7 w-7 text-blue-600" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Workers & Contractors
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Review workers and contractor information.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              View workers
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/dashboard/work-orders"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <ClipboardList className="h-7 w-7 text-blue-600" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Work Orders
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Review completed jobs and their line items.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              View work orders
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Contractor Payroll
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current estimated payroll based on completed
              work and the 60% contractor share.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading payroll...
            </div>
          ) : contractorSummary.length === 0 ? (
            <div className="p-10 text-center">
              <DollarSign className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No payroll items yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Completed assigned work will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contractorSummary.map((summary) => (
                <div
                  key={
                    summary.contractor?.id ??
                    "unassigned"
                  }
                  className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {getContractorName(
                          summary.contractor
                        )}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {summary.contractor?.specialty ??
                          "Contractor"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-right">
                    <div>
                      <p className="text-xs text-slate-400">
                        Jobs
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {summary.jobs}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Ready
                      </p>

                      <p className="mt-1 font-bold text-emerald-600">
                        {summary.ready}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Estimated Pay
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {money(summary.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Payroll Review
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Every job should have the paperwork and
              sign-off required before payment.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading payroll jobs...
              </div>
            ) : payrollJobs.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  No jobs ready for review
                </h3>
              </div>
            ) : (
              payrollJobs.slice(0, 25).map((job) => (
                <div
                  key={job.jobId}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            job.ready
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {job.ready
                            ? "Ready for Payroll"
                            : "Needs Attention"}
                        </span>

                        <span className="text-xs font-medium text-slate-400">
                          {job.workOrder
                            ?.work_order_number
                            ? `WO #${job.workOrder.work_order_number}`
                            : "Work Order"}
                        </span>

                        {job.workOrder?.status && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {statusLabel(
                              job.workOrder.status
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 font-semibold text-slate-900">
                        {job.workOrder?.property_name ??
                          "Property"}

                        {job.workOrder?.unit_number
                          ? ` • Unit ${job.workOrder.unit_number}`
                          : ""}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {job.workOrder?.title ??
                          "Completed work"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                        <span
                          className={
                            job.hasWorksheet
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          <FileText className="mr-1 inline h-3.5 w-3.5" />
                          Worksheet{" "}
                          {job.hasWorksheet
                            ? "received"
                            : "missing"}
                        </span>

                        <span
                          className={
                            job.hasSignoff
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          <PenLine className="mr-1 inline h-3.5 w-3.5" />
                          Sign-off{" "}
                          {job.hasSignoff
                            ? "received"
                            : "missing"}
                        </span>

                        <span
                          className={
                            job.approvedSignoff
                              ? "text-green-600"
                              : "text-amber-600"
                          }
                        >
                          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                          {job.approvedSignoff
                            ? "Approved"
                            : "Not approved"}
                        </span>

                        <span className="text-slate-500">
                          Contractor:{" "}
                          {getContractorName(
                            job.contractor
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Customer
                        </p>

                        <p className="mt-1 font-semibold text-slate-700">
                          {money(
                            job.customerTotal
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Contractor
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-600">
                          {money(
                            job.contractorPay
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/work-orders/${job.jobId}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600"
                      >
                        Review
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Worksheets
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {loading ? "—" : worksheetCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sign-Offs
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {loading ? "—" : signoffCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Elite Share
            </p>

            <p className="mt-1 text-xl font-bold text-blue-700">
              {loading
                ? "—"
                : money(totalEliteShare)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
