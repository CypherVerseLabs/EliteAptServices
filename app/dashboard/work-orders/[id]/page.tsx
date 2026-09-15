"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Home,
  MapPin,
  Pencil,
  Phone,
  User,
  Wrench,
  Clock,
  AlertCircle,
  Calculator,
  DollarSign,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  work_order_number: number | null;

  apartment_company_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  requested_by: string | null;

  service_category: string | null;
  service: string | null;

  title: string | null;
  description: string | null;

  priority: string | null;
  status: string | null;

  requested_date: string | null;
  due_date: string | null;

  property_name: string | null;
  property_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  service_area: string | null;

  unit_number: string | null;
  square_feet: number | null;
  bedrooms: string | null;
  bathrooms: string | null;
  occupancy: string | null;

  contact_name: string | null;
  contact_phone: string | null;

  access_method: string | null;
  access_notes: string | null;

  created_at: string;
  updated_at: string;
};

type PricingItem = {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: string;
  unit: string | null;
  price: number | string;
  minimum_quantity: number | string | null;
  maximum_quantity: number | string | null;
  active: boolean;
  sort_order: number;
  category_id: string;
  price_list_id: string;
};

const statusOptions = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const pricingTypeLabels: Record<string, string> = {
  flat: "Flat",
  per_sq_ft: "Per Sq. Ft.",
  per_wall: "Per Wall",
  per_room: "Per Room",
  per_unit: "Per Unit",
  per_item: "Per Item",
  per_area: "Per Area",
  per_estimate: "Per Estimate",
};

function formatDate(date: string | null) {
  if (!date) return "Not scheduled";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatus(status: string | null) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string | null) {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "assigned":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "completed":
      return "bg-green-50 text-green-700 border-green-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getDefaultQuantity(
  pricingType: string,
  squareFeet: number | null
) {
  switch (pricingType) {
    case "per_sq_ft":
      return Math.max(0, Number(squareFeet) || 0);

    case "per_wall":
    case "per_room":
    case "per_unit":
    case "per_item":
    case "per_area":
    case "flat":
    case "per_estimate":
    default:
      return 1;
  }
}

function calculateTotal(
  price: number | string,
  pricingType: string,
  quantity: number
) {
  const numericPrice = Number(price) || 0;
  const numericQuantity = Number(quantity) || 0;

  if (pricingType === "per_estimate") {
    return 0;
  }

  return numericPrice * numericQuantity;
}

export default function WorkOrderDetailPage() {
  const params = useParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = useMemo(() => createClient(), []);

  const [workOrder, setWorkOrder] =
    useState<WorkOrder | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [pricingItem, setPricingItem] =
    useState<PricingItem | null>(null);

  const [pricingLoading, setPricingLoading] =
    useState(false);

  const [pricingError, setPricingError] =
    useState("");

  const [pricingQuantity, setPricingQuantity] =
    useState(1);

  async function loadWorkOrder() {
    try {
      setLoading(true);
      setError("");

      const { data, error: supabaseError } =
        await supabase
          .from("work_orders")
          .select(`
            id,
            work_order_number,
            apartment_company_id,
            property_id,
            unit_id,
            requested_by,
            service_category,
            service,
            title,
            description,
            priority,
            status,
            requested_date,
            due_date,
            property_name,
            property_address,
            city,
            state,
            zip,
            service_area,
            unit_number,
            square_feet,
            bedrooms,
            bathrooms,
            occupancy,
            contact_name,
            contact_phone,
            access_method,
            access_notes,
            created_at,
            updated_at
          `)
          .eq("id", id)
          .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setWorkOrder(data as WorkOrder);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this work order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadWorkOrder();
    }
  }, [id]);

  async function loadPricing(currentWorkOrder: WorkOrder) {
    try {
      setPricingLoading(true);
      setPricingError("");
      setPricingItem(null);

      const serviceName =
        currentWorkOrder.service?.trim();

      if (!serviceName) {
        setPricingLoading(false);
        return;
      }

      /*
       * First attempt:
       * Exact service name match.
       */
      const { data: exactData, error: exactError } =
        await supabase
          .from("pricing_items")
          .select(`
            id,
            name,
            abbreviation,
            description,
            pricing_type,
            unit,
            price,
            minimum_quantity,
            maximum_quantity,
            active,
            sort_order,
            category_id,
            price_list_id
          `)
          .eq("active", true)
          .ilike("name", serviceName)
          .order("sort_order", {
            ascending: true,
          })
          .limit(1);

      if (exactError) {
        throw exactError;
      }

      let item =
        (exactData?.[0] as PricingItem | undefined) ??
        null;

      /*
       * Second attempt:
       * Match abbreviation.
       */
      if (!item) {
        const {
          data: abbreviationData,
          error: abbreviationError,
        } = await supabase
          .from("pricing_items")
          .select(`
            id,
            name,
            abbreviation,
            description,
            pricing_type,
            unit,
            price,
            minimum_quantity,
            maximum_quantity,
            active,
            sort_order,
            category_id,
            price_list_id
          `)
          .eq("active", true)
          .ilike("abbreviation", serviceName)
          .order("sort_order", {
            ascending: true,
          })
          .limit(1);

        if (abbreviationError) {
          throw abbreviationError;
        }

        item =
          (abbreviationData?.[0] as
            | PricingItem
            | undefined) ?? null;
      }

      /*
       * Third attempt:
       * Partial service-name match.
       */
      if (!item) {
        const {
          data: partialData,
          error: partialError,
        } = await supabase
          .from("pricing_items")
          .select(`
            id,
            name,
            abbreviation,
            description,
            pricing_type,
            unit,
            price,
            minimum_quantity,
            maximum_quantity,
            active,
            sort_order,
            category_id,
            price_list_id
          `)
          .eq("active", true)
          .ilike("name", `%${serviceName}%`)
          .order("sort_order", {
            ascending: true,
          })
          .limit(1);

        if (partialError) {
          throw partialError;
        }

        item =
          (partialData?.[0] as
            | PricingItem
            | undefined) ?? null;
      }

      setPricingItem(item);

      if (item) {
        const defaultQuantity =
          getDefaultQuantity(
            item.pricing_type,
            currentWorkOrder.square_feet
          );

        setPricingQuantity(defaultQuantity);
      }
    } catch (err) {
      console.error(err);

      setPricingError(
        err instanceof Error
          ? err.message
          : "Unable to load pricing."
      );
    } finally {
      setPricingLoading(false);
    }
  }

  useEffect(() => {
    if (workOrder) {
      loadPricing(workOrder);
    }
  }, [workOrder]);

  async function updateStatus(newStatus: string) {
    if (!workOrder) return;

    try {
      setSaving(true);
      setSaveMessage("");
      setError("");

      const updatedAt =
        new Date().toISOString();

      const { error: updateError } =
        await supabase
          .from("work_orders")
          .update({
            status: newStatus,
            updated_at: updatedAt,
          })
          .eq("id", workOrder.id);

      if (updateError) {
        throw updateError;
      }

      setWorkOrder({
        ...workOrder,
        status: newStatus,
        updated_at: updatedAt,
      });

      setSaveMessage(
        "Status updated successfully."
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the work order."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading work order...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !workOrder) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard/work-orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Work Orders
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-red-900">
              Work Order Not Found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadWorkOrder}
              className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  const location = [
    workOrder.property_address,
    workOrder.city,
    workOrder.state,
    workOrder.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const pricingTotal = pricingItem
    ? calculateTotal(
        pricingItem.price,
        pricingItem.pricing_type,
        pricingQuantity
      )
    : 0;

  const isEstimate =
    pricingItem?.pricing_type === "per_estimate";

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* BACK */}
        <Link
          href="/dashboard/work-orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Work Orders
        </Link>

        {/* HEADER */}
        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                WO-{workOrder.work_order_number ?? "—"}
              </span>

              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses(
                  workOrder.status
                )}`}
              >
                {formatStatus(workOrder.status)}
              </span>

              {workOrder.priority && (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold capitalize text-slate-600 ring-1 ring-inset ring-slate-200">
                  {workOrder.priority} priority
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {workOrder.property_name ||
                "Unnamed Property"}
            </h1>

            <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {location ||
                  "Property address not provided"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/work-orders/${workOrder.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>

            <select
              value={workOrder.status || "new"}
              disabled={saving}
              onChange={(event) =>
                updateStatus(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {statusOptions.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SAVE MESSAGE */}
        {saveMessage && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {saveMessage}
          </div>
        )}

        {error && workOrder && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* LEFT / MAIN */}
          <div className="space-y-6 lg:col-span-2">
            {/* PROPERTY */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={
                  <Building2 className="h-5 w-5" />
                }
                title="Property Information"
              />

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <Detail
                  label="Property"
                  value={workOrder.property_name}
                />

                <Detail
                  label="Service Area"
                  value={workOrder.service_area}
                />

                <div className="sm:col-span-2">
                  <Detail
                    label="Address"
                    value={location}
                  />
                </div>
              </div>
            </section>

            {/* UNIT */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={<Home className="h-5 w-5" />}
                title="Unit Information"
              />

              <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <Detail
                  label="Unit Number"
                  value={workOrder.unit_number}
                />

                <Detail
                  label="Square Feet"
                  value={
                    workOrder.square_feet !== null &&
                    workOrder.square_feet !== undefined
                      ? `${workOrder.square_feet.toLocaleString()} sq ft`
                      : null
                  }
                />

                <Detail
                  label="Bedrooms"
                  value={workOrder.bedrooms}
                />

                <Detail
                  label="Bathrooms"
                  value={workOrder.bathrooms}
                />

                <Detail
                  label="Occupancy"
                  value={workOrder.occupancy}
                />
              </div>
            </section>

            {/* SERVICE */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={<Wrench className="h-5 w-5" />}
                title="Service Request"
              />

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    label="Service"
                    value={
                      workOrder.service ||
                      workOrder.service_category
                    }
                  />

                  <Detail
                    label="Priority"
                    value={workOrder.priority}
                    capitalize
                  />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Description of Work
                  </p>

                  <div className="mt-2 rounded-xl bg-slate-50 p-5">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {workOrder.description ||
                        "No description provided."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PRICING */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={
                  <Calculator className="h-5 w-5" />
                }
                title="Service Pricing"
              />

              <div className="p-6">
                {pricingLoading ? (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-5">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                    <p className="text-sm font-medium text-slate-600">
                      Looking up service pricing...
                    </p>
                  </div>
                ) : pricingError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <p className="text-sm font-semibold text-red-800">
                      Unable to load pricing
                    </p>

                    <p className="mt-1 text-xs text-red-700">
                      {pricingError}
                    </p>
                  </div>
                ) : !pricingItem ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-900">
                      No pricing item found
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      No active pricing item matches{" "}
                      <span className="font-semibold">
                        {workOrder.service ||
                          "this service"}
                      </span>
                      .
                    </p>

                    <p className="mt-3 text-xs text-amber-700">
                      Make sure the work order service matches
                      an active item in the pricing table.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* PRICING ITEM */}
                    <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Service
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {pricingItem.name}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {pricingItem.abbreviation && (
                            <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700">
                              {pricingItem.abbreviation}
                            </span>
                          )}

                          <span className="inline-flex rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {pricingTypeLabels[
                              pricingItem.pricing_type
                            ] ??
                              pricingItem.pricing_type}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Rate
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {formatCurrency(
                            Number(pricingItem.price)
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {pricingItem.unit
                            ? `per ${pricingItem.unit}`
                            : "service rate"}
                        </p>
                      </div>
                    </div>

                    {/* QUANTITY / CALCULATION */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="pricing-quantity"
                          className="block text-xs font-bold uppercase tracking-wide text-slate-400"
                        >
                          Quantity
                        </label>

                        <input
                          id="pricing-quantity"
                          type="number"
                          min={
                            pricingItem.minimum_quantity ??
                            0
                          }
                          max={
                            pricingItem.maximum_quantity ??
                            undefined
                          }
                          step="0.01"
                          value={pricingQuantity}
                          onChange={(event) =>
                            setPricingQuantity(
                              Number(
                                event.target.value
                              )
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {pricingItem.pricing_type ===
                          "per_sq_ft"
                            ? `Automatically started from the unit's ${workOrder.square_feet?.toLocaleString() ?? "0"} square feet.`
                            : pricingItem.pricing_type ===
                                "per_estimate"
                              ? "This service requires a manual estimate."
                              : `Quantity is charged ${pricingItem.unit ? `per ${pricingItem.unit}` : "per service"}.`}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Calculation
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              {formatCurrency(
                                Number(
                                  pricingItem.price
                                )
                              )}
                              {" × "}
                              {pricingQuantity}
                            </span>

                            <span className="font-bold text-slate-900">
                              {isEstimate
                                ? "Estimate"
                                : formatCurrency(
                                    pricingTotal
                                  )}
                            </span>
                          </div>

                          {pricingItem.minimum_quantity !==
                            null && (
                            <p className="mt-3 text-xs text-slate-400">
                              Minimum quantity:{" "}
                              {
                                pricingItem.minimum_quantity
                              }
                            </p>
                          )}

                          {pricingItem.maximum_quantity !==
                            null && (
                            <p className="mt-1 text-xs text-slate-400">
                              Maximum quantity:{" "}
                              {
                                pricingItem.maximum_quantity
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TOTAL */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 text-white">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Service Total
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {isEstimate
                            ? "Pricing requires an estimate"
                            : `${pricingQuantity} ${
                                pricingItem.unit ||
                                "unit"
                              }${
                                pricingQuantity === 1
                                  ? ""
                                  : "s"
                              }`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-2xl font-bold">
                        {!isEstimate && (
                          <DollarSign className="h-5 w-5 text-emerald-400" />
                        )}

                        {isEstimate
                          ? "Estimate"
                          : formatCurrency(
                              pricingTotal
                            )}
                      </div>
                    </div>

                    {pricingItem.description && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                          Pricing Notes
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-900">
                          {pricingItem.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ACCESS */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={<MapPin className="h-5 w-5" />}
                title="Access Instructions"
              />

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    label="Access Method"
                    value={workOrder.access_method}
                  />

                  <Detail
                    label="Unit Status"
                    value={workOrder.occupancy}
                    capitalize
                  />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Special Instructions
                  </p>

                  <div className="mt-2 rounded-xl bg-amber-50 p-5">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-amber-900">
                      {workOrder.access_notes ||
                        "No special access instructions provided."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT / SIDEBAR */}
          <div className="space-y-6">
            {/* CONTACT */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={<User className="h-5 w-5" />}
                title="Property Contact"
              />

              <div className="space-y-5 p-6">
                <Detail
                  label="Contact Name"
                  value={workOrder.contact_name}
                />

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Phone
                  </p>

                  {workOrder.contact_phone ? (
                    <a
                      href={`tel:${workOrder.contact_phone}`}
                      className="mt-1 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="h-4 w-4" />
                      {workOrder.contact_phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Not provided
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* SCHEDULE */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={
                  <CalendarDays className="h-5 w-5" />
                }
                title="Schedule"
              />

              <div className="space-y-5 p-6">
                <Detail
                  label="Requested Date"
                  value={formatDate(
                    workOrder.requested_date
                  )}
                />

                <Detail
                  label="Due Date"
                  value={formatDate(
                    workOrder.due_date
                  )}
                />
              </div>
            </section>

            {/* WORKFLOW */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                icon={
                  <ClipboardList className="h-5 w-5" />
                }
                title="Workflow"
              />

              <div className="p-6">
                <WorkflowStep
                  active
                  complete={true}
                  title="Work Order Created"
                  description={formatDate(
                    workOrder.created_at
                  )}
                />

                <WorkflowStep
                  active={
                    workOrder.status ===
                      "assigned" ||
                    workOrder.status ===
                      "in_progress" ||
                    workOrder.status ===
                      "completed"
                  }
                  complete={
                    workOrder.status ===
                      "assigned" ||
                    workOrder.status ===
                      "in_progress" ||
                    workOrder.status ===
                      "completed"
                  }
                  title="Worker Assigned"
                  description="Assign Keith, Kim, or a contractor."
                />

                <WorkflowStep
                  active={
                    workOrder.status ===
                      "in_progress" ||
                    workOrder.status ===
                      "completed"
                  }
                  complete={
                    workOrder.status ===
                      "in_progress" ||
                    workOrder.status ===
                      "completed"
                  }
                  title="Work In Progress"
                  description="Worker completes the assigned job."
                />

                <WorkflowStep
                  active={
                    workOrder.status === "completed"
                  }
                  complete={
                    workOrder.status === "completed"
                  }
                  title="Completed / Sign-Off"
                  description="Property representative signs the work."
                  last
                />
              </div>
            </section>

            {/* FUTURE PAPERWORK */}
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>

              <h3 className="mt-4 font-bold text-blue-950">
                Job Paperwork
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                This work order will eventually generate
                the correct Elite paperwork for the selected
                service, including pricing, worksheet,
                technician paperwork, and property
                sign-off.
              </p>

              <div className="mt-4 space-y-2 text-xs font-medium text-blue-800">
                <p>• Technician worksheet</p>
                <p>• Service pricing</p>
                <p>• Completion checklist</p>
                <p>• Property sign-off</p>
                <p>• Weekly payroll worksheet</p>
              </div>
            </section>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 pb-10 sm:flex-row sm:justify-between">
          <Link
            href="/dashboard/work-orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Work Orders
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/dashboard/work-orders/${workOrder.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit Work Order
            </Link>

            {workOrder.status !== "completed" && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  updateStatus("completed")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
        {icon}
      </div>

      <h2 className="font-semibold text-slate-900">
        {title}
      </h2>
    </div>
  );
}

function Detail({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string | number | null | undefined;
  capitalize?: boolean;
}) {
  const displayValue =
    value === null ||
    value === undefined ||
    value === ""
      ? "Not provided"
      : String(value);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold text-slate-900 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function WorkflowStep({
  active,
  complete,
  title,
  description,
  last = false,
}: {
  active: boolean;
  complete: boolean;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last && (
        <div
          className={`absolute left-[11px] top-7 h-full w-px ${
            complete
              ? "bg-green-300"
              : "bg-slate-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          complete
            ? "bg-green-600 text-white"
            : active
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {complete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Clock className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="pb-6">
        <p
          className={`text-sm font-semibold ${
            active
              ? "text-slate-900"
              : "text-slate-400"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
