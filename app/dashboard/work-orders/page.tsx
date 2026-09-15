"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ClipboardList,
  Search,
  MapPin,
  CalendarDays,
  Building2,
  Loader2,
  ChevronRight,
  Calculator,
  DollarSign,
} from "lucide-react";

import {
  calculatePricing,
  getDefaultQuantity,
} from "@/lib/pricing/calculate";

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
  square_feet: number | null;
  bedrooms: string | null;
  bathrooms: string | null;
  service: string | null;
  service_category: string | null;
  description: string | null;
  priority: string | null;
  status: string | null;
  requested_date: string | null;
  due_date: string | null;
  created_at: string;
  contact_name: string | null;
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
  price_list_id: string;
  category_id: string;
};

export default function WorkOrdersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Pricing state must be inside the component.
  const [pricingItem, setPricingItem] =
    useState<PricingItem | null>(null);

  const [pricingQuantity, setPricingQuantity] =
    useState(1);

  const [pricingLoading, setPricingLoading] =
    useState(false);

  const [pricingError, setPricingError] =
    useState("");

  useEffect(() => {
    loadWorkOrders();
  }, []);

  async function loadWorkOrders() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
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
        square_feet,
        bedrooms,
        bathrooms,
        service,
        service_category,
        description,
        priority,
        status,
        requested_date,
        due_date,
        created_at,
        contact_name
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Work order load error:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setWorkOrders((data ?? []) as WorkOrder[]);
    setLoading(false);
  }

  const filteredOrders = workOrders.filter((order) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return true;
    }

    return (
      order.property_name
        ?.toLowerCase()
        .includes(searchText) ||
      order.property_address
        ?.toLowerCase()
        .includes(searchText) ||
      order.city
        ?.toLowerCase()
        .includes(searchText) ||
      order.unit_number
        ?.toLowerCase()
        .includes(searchText) ||
      order.service
        ?.toLowerCase()
        .includes(searchText) ||
      order.service_category
        ?.toLowerCase()
        .includes(searchText) ||
      order.description
        ?.toLowerCase()
        .includes(searchText) ||
      String(order.work_order_number ?? "")
        .includes(searchText)
    );
  });

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

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

  function formatStatus(status: string | null) {
    if (!status) {
      return "New";
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatPriority(priority: string | null) {
    if (!priority) {
      return "Normal";
    }

    return (
      priority.charAt(0).toUpperCase() +
      priority.slice(1)
    );
  }

  function statusClasses(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "in_progress":
      case "in progress":
        return "bg-blue-100 text-blue-700";

      case "assigned":
        return "bg-purple-100 text-purple-700";

      case "approved":
        return "bg-green-100 text-green-700";

      case "reviewing":
        return "bg-purple-100 text-purple-700";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700";

      case "submitted":
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

      case "low":
        return "bg-slate-100 text-slate-600";

      case "medium":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  /*
   * Keep these pricing helpers available for when pricing
   * records are displayed or attached to a work order.
   *
   * They do not fabricate pricing data.
   */
  function getPricingPreview() {
    if (!pricingItem) {
      return null;
    }

    const quantity = getDefaultQuantity(
      pricingItem.pricing_type,
      null
    );

    const result = calculatePricing({
      price: Number(pricingItem.price),
      pricingType: pricingItem.pricing_type,
      quantity:
        pricingQuantity > 0
          ? pricingQuantity
          : quantity,
    });

    return result;
  }

  const pricingPreview = getPricingPreview();

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
              Work Orders
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View, manage, assign, and track apartment service requests.
            </p>
          </div>

          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Work Order
          </Link>
        </div>

        {/* SEARCH */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search property, unit, service, city, or work order number..."
              className="w-full rounded-xl border border-slate-300 bg-white px-11 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* PRICING ERROR */}

        {pricingError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Pricing Error
            </p>

            <p className="mt-1 text-sm text-red-700">
              {pricingError}
            </p>
          </div>
        )}

        {/* OPTIONAL PRICING PREVIEW */}

        {pricingLoading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Loading pricing...
          </div>
        )}

        {pricingPreview && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <Calculator className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-950">
                  Pricing Preview
                </p>

                <p className="mt-1 text-sm text-blue-800">
                  {pricingItem?.name}
                </p>

                <div className="mt-3 flex flex-wrap gap-5 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-blue-900">
                    <DollarSign className="h-4 w-4" />
                    Unit price: $
                    {pricingPreview.unitPrice.toFixed(2)}
                  </span>

                  <span className="text-blue-900">
                    Quantity: {pricingPreview.quantity}
                  </span>

                  <span className="font-bold text-blue-950">
                    {pricingPreview.isEstimate
                      ? "Estimate Required"
                      : `Total: $${pricingPreview.total.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Could not load work orders
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadWorkOrders}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading work orders...
            </div>
          </div>
        ) : (
          <>
            {/* SUMMARY */}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {filteredOrders.length}{" "}
                {filteredOrders.length === 1
                  ? "work order"
                  : "work orders"}
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

            {/* EMPTY */}

            {filteredOrders.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <ClipboardList className="h-7 w-7 text-slate-400" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search
                    ? "No matching work orders"
                    : "No work orders yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {search
                    ? "Try a different property, unit, service, or work order number."
                    : "Create your first work order to begin tracking apartment service requests."}
                </p>

                {!search && (
                  <Link
                    href="/dashboard/work-orders/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Work Order
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filteredOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/work-orders/${order.id}`}
                    className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* LEFT */}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            WO-
                            {order.work_order_number ??
                              order.id
                                .slice(0, 8)
                                .toUpperCase()}
                          </span>

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClasses(
                              order.status
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${priorityClasses(
                              order.priority
                            )}`}
                          >
                            {formatPriority(order.priority)}
                          </span>
                        </div>

                        <h2 className="mt-3 truncate text-lg font-bold text-slate-900 group-hover:text-blue-600">
                          {order.property_name ||
                            "Unnamed Property"}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-400" />

                            {order.property_address
                              ? `${order.property_address}, ${
                                  order.city ?? ""
                                } ${
                                  order.state ?? ""
                                } ${
                                  order.zip ?? ""
                                }`
                              : order.city ||
                                "No address"}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            Unit{" "}
                            {order.unit_number || "—"}
                          </span>

                          {order.square_feet && (
                            <span>
                              {order.square_feet.toLocaleString()}{" "}
                              sq ft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* RIGHT */}

                      <div className="flex shrink-0 items-center gap-5 lg:justify-end">

                        <div className="text-left lg:text-right">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Service
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {order.service ||
                              order.service_category ||
                              "Service Request"}
                          </p>
                        </div>

                        <div className="hidden text-right sm:block">
                          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Due
                          </div>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatDate(order.due_date)}
                          </p>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>
                    </div>

                    {order.description && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="line-clamp-2 text-sm text-slate-500">
                          {order.description}
                        </p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}