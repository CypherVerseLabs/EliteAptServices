"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  PenLine,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PaperworkSubmission = {
  id: string;
  job_id: string;
  worker_id: string | null;
  paperwork_type: string | null;
  storage_path: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

type JobDocument = {
  id: string;
  job_id: string;
  uploaded_by: string | null;
  document_type: string | null;
  storage_path: string | null;
  file_name: string | null;
  created_at: string;
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
  created_at: string;
};

type JobAssignment = {
  id: string;
  job_id: string;
  worker_id: string | null;
  assigned_by: string | null;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  removed_at: string | null;
  notes: string | null;
  contractor_id: string | null;
};

type WorkOrder = {
  id: string;
  work_order_number: number | null;
  property_name: string | null;
  unit_number: string | null;
  title: string | null;
  status: string | null;
  requested_date: string | null;
};

type PaperworkRow = {
  submission: PaperworkSubmission;
  workOrder: WorkOrder | null;
  assignment: JobAssignment | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "completed" ||
    normalized === "complete"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    normalized === "rejected" ||
    normalized === "denied"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    normalized === "submitted" ||
    normalized === "pending_review" ||
    normalized === "pending"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function paperworkTypeLabel(type: string | null) {
  if (!type) return "Paperwork";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAssignmentLabel(
  assignment: JobAssignment | null
) {
  if (!assignment) {
    return "No assignment";
  }

  if (assignment.worker_id) {
    return "Worker assigned";
  }

  if (assignment.contractor_id) {
    return "Contractor assigned";
  }

  return "Assignment exists";
}

export default function PaperworkPage() {
  const supabase = createClient();

  const [submissions, setSubmissions] = useState<
    PaperworkRow[]
  >([]);

  const [documents, setDocuments] = useState<
    JobDocument[]
  >([]);

  const [signoffs, setSignoffs] = useState<
    JobSignoff[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPaperwork() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(
            authError.message ||
              "Unable to verify your login session."
          );
        }

        if (!user) {
          throw new Error(
            "You must be logged in to view paperwork."
          );
        }

        /*
         * -----------------------------------------------------
         * LOAD ALL PAPERWORK DATA
         * -----------------------------------------------------
         */

        const [
          submissionsResult,
          documentsResult,
          signoffsResult,
        ] = await Promise.all([
          supabase
            .from("paperwork_submissions")
            .select(`
              id,
              job_id,
              worker_id,
              paperwork_type,
              storage_path,
              submitted_at,
              approved_at,
              approved_by,
              status,
              notes,
              created_at
            `)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("job_documents")
            .select(`
              id,
              job_id,
              uploaded_by,
              document_type,
              storage_path,
              file_name,
              created_at
            `)
            .order("created_at", {
              ascending: false,
            })
            .limit(25),

          supabase
            .from("job_signoffs")
            .select(`
              id,
              job_id,
              representative_name,
              representative_title,
              signature_storage_path,
              signed_at,
              approved,
              notes,
              created_at
            `)
            .order("created_at", {
              ascending: false,
            })
            .limit(25),
        ]);

        if (submissionsResult.error) {
          throw new Error(
            submissionsResult.error.message ||
              "Unable to load paperwork submissions."
          );
        }

        if (documentsResult.error) {
          console.error(
            "JOB DOCUMENTS ERROR:",
            documentsResult.error
          );
        }

        if (signoffsResult.error) {
          console.error(
            "JOB SIGNOFFS ERROR:",
            signoffsResult.error
          );
        }

        const submissionRows =
          submissionsResult.data || [];

        const documentRows =
          documentsResult.data || [];

        const signoffRows =
          signoffsResult.data || [];

        /*
         * -----------------------------------------------------
         * JOB IDS
         * -----------------------------------------------------
         */

        const jobIds = Array.from(
          new Set(
            [
              ...submissionRows.map(
                (row) => row.job_id
              ),
              ...documentRows.map(
                (row) => row.job_id
              ),
              ...signoffRows.map(
                (row) => row.job_id
              ),
            ].filter(Boolean)
          )
        );

        let workOrders: WorkOrder[] = [];
        let assignments: JobAssignment[] = [];

        if (jobIds.length > 0) {
          const [
            workOrdersResult,
            assignmentsResult,
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
                requested_date
              `)
              .in("id", jobIds),

            supabase
              .from("job_assignments")
              .select(`
                id,
                job_id,
                worker_id,
                assigned_by,
                status,
                assigned_at,
                accepted_at,
                completed_at,
                removed_at,
                notes,
                contractor_id
              `)
              .in("job_id", jobIds)
              .order("assigned_at", {
                ascending: false,
              }),
          ]);

          if (workOrdersResult.error) {
            console.error(
              "WORK ORDERS ERROR:",
              workOrdersResult.error
            );
          } else {
            workOrders =
              workOrdersResult.data || [];
          }

          if (assignmentsResult.error) {
            console.error(
              "JOB ASSIGNMENTS ERROR:",
              assignmentsResult.error
            );
          } else {
            assignments =
              assignmentsResult.data || [];
          }
        }

        /*
         * -----------------------------------------------------
         * CREATE LOOKUP MAPS
         * -----------------------------------------------------
         */

        const workOrderMap = new Map<
          string,
          WorkOrder
        >();

        workOrders.forEach((workOrder) => {
          workOrderMap.set(
            workOrder.id,
            workOrder
          );
        });

        const assignmentMap = new Map<
          string,
          JobAssignment
        >();

        /*
         * Because a job can potentially have multiple
         * assignments, keep the newest active assignment.
         */

        assignments.forEach((assignment) => {
          const existing =
            assignmentMap.get(assignment.job_id);

          if (!existing) {
            assignmentMap.set(
              assignment.job_id,
              assignment
            );
            return;
          }

          const existingTime = new Date(
            existing.assigned_at
          ).getTime();

          const currentTime = new Date(
            assignment.assigned_at
          ).getTime();

          if (currentTime > existingTime) {
            assignmentMap.set(
              assignment.job_id,
              assignment
            );
          }
        });

        /*
         * -----------------------------------------------------
         * BUILD PAPERWORK ROWS
         * -----------------------------------------------------
         */

        const paperworkRows: PaperworkRow[] =
          submissionRows.map((submission) => ({
            submission,
            workOrder:
              workOrderMap.get(
                submission.job_id
              ) || null,
            assignment:
              assignmentMap.get(
                submission.job_id
              ) || null,
          }));

        setSubmissions(paperworkRows);
        setDocuments(documentRows);
        setSignoffs(signoffRows);
      } catch (error) {
        console.error(
          "PAPERWORK LOAD ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load paperwork."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPaperwork();
  }, []);

  const pendingCount = useMemo(
    () =>
      submissions.filter(({ submission }) => {
        const status =
          submission.status?.toLowerCase();

        return (
          !status ||
          status === "pending" ||
          status === "submitted" ||
          status === "pending_review"
        );
      }).length,
    [submissions]
  );

  const approvedCount = useMemo(
    () =>
      submissions.filter(({ submission }) => {
        return (
          submission.status?.toLowerCase() ===
            "approved" ||
          Boolean(submission.approved_at)
        );
      }).length,
    [submissions]
  );

  const rejectedCount = useMemo(
    () =>
      submissions.filter(({ submission }) => {
        const status =
          submission.status?.toLowerCase();

        return (
          status === "rejected" ||
          status === "denied"
        );
      }).length,
    [submissions]
  );

  const signedCount = useMemo(
    () =>
      signoffs.filter((signoff) =>
        Boolean(signoff.signed_at)
      ).length,
    [signoffs]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* BACK */}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* HEADER */}

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Operations
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Paperwork
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Manage submitted paperwork, job documents,
            worker assignments, property sign-offs,
            and completed work documentation.
          </p>
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

              <div>
                <p className="font-semibold text-red-900">
                  Paperwork could not be loaded
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  All Paperwork
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "—"
                    : submissions.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Needs Review
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "—"
                    : pendingCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Approved
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "—"
                    : approvedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Signed Off
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "—"
                    : signedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                <PenLine className="h-5 w-5 text-purple-600" />
              </div>

            </div>
          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          <Link
            href="/dashboard/work-orders"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-blue-600" />

            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Work Orders
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Open work orders to review job information
              and related paperwork.
            </p>
          </Link>

          <Link
            href="/dashboard/paperwork/signoffs"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                <PenLine className="h-5 w-5 text-purple-600" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-purple-600" />

            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Sign-Offs
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Review property representative signatures
              and completed-work approvals.
            </p>

            <div className="mt-4 text-sm font-semibold text-purple-700">
              {signedCount} signed
            </div>
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <FolderOpen className="h-5 w-5 text-green-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Job Documents
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Photos, invoices, completion documents,
              and other uploaded job files.
            </p>

            <div className="mt-4 text-sm font-semibold text-green-700">
              {documents.length} recent documents
            </div>
          </div>

        </div>

        {/* PAPERWORK */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Paperwork Submissions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review recently submitted paperwork.
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {submissions.length} submissions
            </div>

          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading paperwork...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-10 text-center">

              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No paperwork submissions yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Submitted job paperwork will appear here.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {submissions.slice(0, 10).map(
                ({
                  submission,
                  workOrder,
                  assignment,
                }) => (
                  <div
                    key={submission.id}
                    className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                  >

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            submission.status
                          )}`}
                        >
                          {formatLabel(
                            submission.status ||
                              "pending"
                          )}
                        </span>

                        <span className="text-xs font-medium text-slate-400">
                          {paperworkTypeLabel(
                            submission.paperwork_type
                          )}
                        </span>

                      </div>

                      <h3 className="mt-2 font-semibold text-slate-900">
                        {workOrder?.property_name ||
                          "Job"}

                        {workOrder?.unit_number
                          ? ` • Unit ${workOrder.unit_number}`
                          : ""}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {workOrder?.work_order_number
                          ? `WO #${workOrder.work_order_number}`
                          : `Job ${submission.job_id}`}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">

                        <span>
                          Submitted{" "}
                          {formatDateTime(
                            submission.submitted_at ||
                              submission.created_at
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />

                          {getAssignmentLabel(
                            assignment
                          )}
                        </span>

                        {assignment && (
                          <span>
                            Assignment:{" "}
                            {formatLabel(
                              assignment.status
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="flex shrink-0 items-center gap-4">

                      {submission.storage_path && (
                        <span className="hidden text-xs text-slate-400 sm:block">
                          Document attached
                        </span>
                      )}

                      <Link
                        href={`/dashboard/paperwork/${submission.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600"
                      >
                        Review
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* SIGN-OFFS */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Sign-Offs
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Property representative approval and
              completed-work signatures.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading sign-offs...
            </div>
          ) : signoffs.length === 0 ? (
            <div className="p-10 text-center">

              <PenLine className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No sign-offs yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Completed property sign-offs will appear
                here.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {signoffs.slice(0, 10).map(
                (signoff) => (
                  <div
                    key={signoff.id}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <div className="flex items-center gap-2">

                        {signoff.approved ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : signoff.signed_at ? (
                          <PenLine className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Clock3 className="h-4 w-4 text-slate-400" />
                        )}

                        <p className="font-semibold text-slate-900">
                          {signoff.representative_name ||
                            "Property Representative"}
                        </p>

                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {signoff.representative_title ||
                          "Representative"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Job: {signoff.job_id}
                      </p>

                    </div>

                    <div className="text-left sm:text-right">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          signoff.approved
                            ? "bg-green-100 text-green-700"
                            : signoff.signed_at
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {signoff.approved
                          ? "Approved"
                          : signoff.signed_at
                            ? "Signed"
                            : "Pending"}
                      </span>

                      <p className="mt-2 text-xs text-slate-400">
                        {signoff.signed_at
                          ? `Signed ${formatDate(
                              signoff.signed_at
                            )}`
                          : `Created ${formatDate(
                              signoff.created_at
                            )}`}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* DOCUMENTS */}

        <section className="mt-8 mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Job Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recently uploaded documents associated
              with jobs.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-10 text-center">

              <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No job documents yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Uploaded job files will appear here.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {documents.slice(0, 10).map(
                (document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <FileText className="h-5 w-5 text-slate-500" />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-semibold text-slate-900">
                          {document.file_name ||
                            "Unnamed document"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {paperworkTypeLabel(
                            document.document_type
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Uploaded{" "}
                          {formatDate(
                            document.created_at
                          )}
                        </p>

                      </div>

                    </div>

                    <span className="text-xs font-medium text-slate-400">
                      Job {document.job_id}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </div>
  );
}
