"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  PenLine,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type WorkOrder = {
  id: string;
  work_order_number: number | null;
  property_name: string | null;
  unit_number: string | null;
  title: string | null;
  status: string | null;
  requested_date: string | null;
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

function formatDate(value: string | null) {
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

function formatDateTime(value: string | null) {
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


function statusClasses(
  status: string | null | undefined
) {

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

  return "bg-amber-100 text-amber-700";
}

export default function PaperworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [submission, setSubmission] =
    useState<PaperworkSubmission | null>(null);

  const [workOrder, setWorkOrder] =
    useState<WorkOrder | null>(null);

  const [documents, setDocuments] =
    useState<JobDocument[]>([]);

  const [signoffs, setSignoffs] =
    useState<JobSignoff[]>([]);

  const [documentUrl, setDocumentUrl] =
    useState<string | null>(null);

  const [reviewNotes, setReviewNotes] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          throw new Error(authError.message);
        }

        if (!user) {
          throw new Error(
            "You must be logged in to review paperwork."
          );
        }

        /*
         * ------------------------------------------------------
         * PAPERWORK SUBMISSION
         * ------------------------------------------------------
         */

        const {
          data: submissionRow,
          error: submissionError,
        } = await supabase
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
          .eq("id", id)
          .single();

        if (submissionError) {
          throw new Error(
            submissionError.message ||
              "Unable to load paperwork submission."
          );
        }

        if (!submissionRow) {
          throw new Error(
            "Paperwork submission not found."
          );
        }

        setSubmission(submissionRow);
        setReviewNotes(submissionRow.notes || "");

        /*
         * ------------------------------------------------------
         * WORK ORDER
         * ------------------------------------------------------
         */

        const {
          data: workOrderRow,
          error: workOrderError,
        } = await supabase
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
          .eq("id", submissionRow.job_id)
          .maybeSingle();

        if (workOrderError) {
          console.error(
            "WORK ORDER ERROR:",
            workOrderError
          );
        }

        setWorkOrder(workOrderRow || null);

        /*
         * ------------------------------------------------------
         * JOB DOCUMENTS
         * ------------------------------------------------------
         */

        const {
          data: documentRows,
          error: documentsError,
        } = await supabase
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
          .eq("job_id", submissionRow.job_id)
          .order("created_at", {
            ascending: false,
          });

        if (documentsError) {
          console.error(
            "JOB DOCUMENTS ERROR:",
            documentsError
          );
        }

        setDocuments(documentRows || []);

        /*
         * ------------------------------------------------------
         * JOB SIGN-OFFS
         * ------------------------------------------------------
         */

        const {
          data: signoffRows,
          error: signoffsError,
        } = await supabase
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
          .eq("job_id", submissionRow.job_id)
          .order("created_at", {
            ascending: false,
          });

        if (signoffsError) {
          console.error(
            "JOB SIGNOFFS ERROR:",
            signoffsError
          );
        }

        setSignoffs(signoffRows || []);

        /*
         * ------------------------------------------------------
         * SUBMISSION DOCUMENT
         * ------------------------------------------------------
         */

        if (submissionRow.storage_path) {
          const {
            data: signedUrlData,
            error: signedUrlError,
          } = await supabase.storage
            .from("paperwork")
            .createSignedUrl(
              submissionRow.storage_path,
              60 * 60
            );

          if (signedUrlError) {
            console.error(
              "SUBMISSION DOCUMENT ERROR:",
              signedUrlError
            );
          } else {
            setDocumentUrl(
              signedUrlData?.signedUrl || null
            );
          }
        }
      } catch (error) {
        console.error(
          "PAPERWORK DETAIL ERROR:",
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

    if (id) {
      loadPaperwork();
    }
  }, [id]);

  async function updateStatus(
    nextStatus: "approved" | "rejected"
  ) {
    if (!submission) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const updateData = {
        status: nextStatus,
        notes: reviewNotes.trim() || null,
        approved_at:
          nextStatus === "approved"
            ? new Date().toISOString()
            : null,
        approved_by:
          nextStatus === "approved"
            ? user.id
            : null,
      };

      const {
        data: updatedSubmission,
        error,
      } = await supabase
        .from("paperwork_submissions")
        .update(updateData)
        .eq("id", submission.id)
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
        .single();

      if (error) {
        throw new Error(
          error.message ||
            "Unable to update paperwork."
        );
      }

      setSubmission(updatedSubmission);
      setReviewNotes(updatedSubmission.notes || "");
    } catch (error) {
      console.error(
        "PAPERWORK UPDATE ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update paperwork."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading paperwork...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/paperwork"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Paperwork
          </Link>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />

              <div>
                <h1 className="font-bold text-red-900">
                  Paperwork not found
                </h1>

                <p className="mt-1 text-sm text-red-700">
                  {errorMessage ||
                    "The requested paperwork submission could not be found."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isApproved =
    submission.status?.toLowerCase() === "approved";

  const isRejected =
    submission.status?.toLowerCase() === "rejected" ||
    submission.status?.toLowerCase() === "denied";

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/dashboard/paperwork"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Paperwork
        </Link>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />

              <p className="text-sm font-medium text-red-800">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* HEADER */}

        <div className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Paperwork Review
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {workOrder?.property_name ||
                  "Paperwork Submission"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {workOrder?.work_order_number
                  ? `WO #${workOrder.work_order_number}`
                  : `Job ${submission.job_id}`}

                {workOrder?.unit_number
                  ? ` • Unit ${workOrder.unit_number}`
                  : ""}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${statusClasses(
                submission.status
              )}`}
            >
              {formatLabel(
                submission.status || "pending"
              )}
            </span>

          </div>
        </div>

        {/* OVERVIEW */}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FileText className="h-5 w-5 text-blue-600" />

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Paperwork Type
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatLabel(
                submission.paperwork_type
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Clock3 className="h-5 w-5 text-amber-600" />

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Submitted
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatDateTime(
                submission.submitted_at ||
                  submission.created_at
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <PenLine className="h-5 w-5 text-purple-600" />

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Worker / Contractor
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {submission.worker_id ||
                "Not assigned"}
            </p>
          </div>

        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          {/* MAIN */}

          <div className="space-y-8 lg:col-span-2">

            {/* DOCUMENT */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Submitted Document
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  The document attached to this paperwork
                  submission.
                </p>
              </div>

              <div className="p-6">

                {documentUrl ? (
                  <div className="flex flex-col gap-3 sm:flex-row">

                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4" />
                      Open Document
                    </a>

                    <a
                      href={documentUrl}
                      download
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>

                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-6 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No stored document
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      This submission does not currently
                      have a storage file attached.
                    </p>
                  </div>
                )}

              </div>
            </section>

            {/* WORK ORDER */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Work Order
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Property
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {workOrder?.property_name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Unit
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {workOrder?.unit_number || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Work Order
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {workOrder?.work_order_number
                      ? `#${workOrder.work_order_number}`
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatLabel(workOrder?.status)}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Job
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {workOrder?.title || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Requested Date
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatDate(
                      workOrder?.requested_date ||
                        null
                    )}
                  </p>
                </div>

              </div>

            </section>

            {/* JOB DOCUMENTS */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Associated Job Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Other documents associated with this job.
                </p>
              </div>

              {documents.length === 0 ? (
                <div className="p-8 text-center">
                  <FolderOpen className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm text-slate-500">
                    No additional job documents.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {document.file_name ||
                              "Unnamed document"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatLabel(
                              document.document_type
                            )}
                            {" • "}
                            {formatDate(
                              document.created_at
                            )}
                          </p>
                        </div>

                      </div>

                      {document.storage_path && (
                        <span className="text-xs font-medium text-slate-400">
                          Stored document
                        </span>
                      )}
                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* SIGN-OFF */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Property Sign-Off
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Property representative approval and
                  completed-work signatures.
                </p>
              </div>

              {signoffs.length === 0 ? (
                <div className="p-8 text-center">
                  <PenLine className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm text-slate-500">
                    No property sign-off has been recorded.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {signoffs.map((signoff) => (
                    <div
                      key={signoff.id}
                      className="px-6 py-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <div className="flex items-center gap-2">

                            {signoff.approved ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock3 className="h-5 w-5 text-amber-600" />
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

                          <p className="mt-2 text-xs text-slate-400">
                            {signoff.signed_at
                              ? `Signed ${formatDateTime(
                                  signoff.signed_at
                                )}`
                              : "Not signed"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
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

                      </div>

                      {signoff.notes && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Sign-Off Notes
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {signoff.notes}
                          </p>
                        </div>
                      )}

                    </div>
                  ))}

                </div>
              )}

            </section>

          </div>

          {/* REVIEW SIDEBAR */}

          <aside>

            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Review Paperwork
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Approve or reject this submission.
                </p>
              </div>

              <div className="p-6">

                {submission.approved_at && (
                  <div className="mb-5 rounded-xl bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />

                      <div>
                        <p className="text-sm font-semibold text-green-900">
                          Approved
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          {formatDateTime(
                            submission.approved_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="mb-5 rounded-xl bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />

                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          Rejected
                        </p>

                        <p className="mt-1 text-xs text-red-700">
                          This paperwork was rejected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Review Notes
                  </span>

                  <textarea
                    value={reviewNotes}
                    onChange={(event) =>
                      setReviewNotes(event.target.value)
                    }
                    rows={6}
                    placeholder="Add notes about this paperwork..."
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="mt-5 grid gap-3">

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      updateStatus("approved")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />

                    {saving
                      ? "Saving..."
                      : isApproved
                        ? "Update Approval"
                        : "Approve Paperwork"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      updateStatus("rejected")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />

                    {saving
                      ? "Saving..."
                      : "Reject Paperwork"}
                  </button>

                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-400">
                    Submission ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {submission.id}
                  </p>
                </div>

              </div>

            </div>

          </aside>

        </div>

        <div className="mb-10 mt-8">
          <Link
            href="/dashboard/paperwork"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all paperwork
          </Link>
        </div>

      </div>
    </div>
  );
}
