import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit,
  Home,
  MapPin,
  Plus,
  ClipboardList,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Property = {
  id: string;
  property_type: string | null;
  apartment_company_id: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  active: boolean | null;
  created_at: string;
};

type Unit = {
  id: string;
  property_id: string;
  unit_number: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  occupied: boolean | null;
};

type ApartmentCompany = {
  id: string;
  name: string | null;
};

type WorkOrder = {
  id: string;
  work_order_number: number | null;
  service: string | null;
  service_category: string | null;
  status: string | null;
  priority: string | null;
  requested_date: string | null;
  unit_number: string | null;
  created_at: string;
};

export default async function PropertyDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // ------------------------------------------------------------
  // LOAD PROPERTY FIRST
  // ------------------------------------------------------------

  const { data: propertyData, error: propertyError } =
    await supabase
      .from("properties")
      .select(`
        id,
        property_type,
        apartment_company_id,
        name,
        address,
        city,
        state,
        zip,
        active,
        created_at
      `)
      .eq("id", id)
      .single();

  if (propertyError || !propertyData) {
    notFound();
  }

  const property = propertyData as Property;

  // ------------------------------------------------------------
  // LOAD RELATED DATA AFTER PROPERTY EXISTS
  // ------------------------------------------------------------

  const [
    unitsResult,
    companiesResult,
    workOrdersResult,
  ] = await Promise.all([
    supabase
      .from("units")
      .select(`
        id,
        property_id,
        unit_number,
        bedrooms,
        bathrooms,
        square_feet,
        occupied
      `)
      .eq("property_id", id)
      .order("unit_number", { ascending: true }),

    supabase
      .from("apartment_companies")
      .select(`
        id,
        name
      `),

    property.name
      ? supabase
          .from("work_orders")
          .select(`
            id,
            work_order_number,
            service,
            service_category,
            status,
            priority,
            requested_date,
            unit_number,
            created_at
          `)
          .eq("property_name", property.name)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  // ------------------------------------------------------------
  // DATA
  // ------------------------------------------------------------

  const units = (unitsResult.data ?? []) as Unit[];

  const companies = (companiesResult.data ??
    []) as ApartmentCompany[];

  const workOrders = (workOrdersResult.data ??
    []) as WorkOrder[];

  const company =
    companies.find(
      (item) =>
        item.id === property.apartment_company_id
    ) ?? null;

  const occupiedUnits = units.filter(
    (unit) => unit.occupied
  ).length;

  const availableUnits = Math.max(
    units.length - occupiedUnits,
    0
  );

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------

  function formatPropertyType(
    type: string | null
  ) {
    if (!type) return "Property";

    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
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

  function formatStatus(status: string | null) {
    if (!status) return "New";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
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

      case "accepted":
        return "bg-cyan-100 text-cyan-700";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700";

      case "open":
      case "new":
        return "bg-slate-100 text-slate-700";

      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  const address = [
    property.address,
    property.city,
    property.state,
    property.zip,
  ]
    .filter(Boolean)
    .join(", ");

  // ------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER ACTIONS */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Link>

          <Link
            href={`/dashboard/properties/${property.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit Property
          </Link>
        </div>

        {/* PROPERTY HEADER */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <Building2 className="h-7 w-7 text-blue-600" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {property.name ||
                      "Unnamed Property"}
                  </h1>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      property.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {property.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-slate-400">
                  {formatPropertyType(
                    property.property_type
                  )}
                </p>

                {address && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>

            {company?.name && (
              <div className="rounded-xl bg-slate-50 px-5 py-4 lg:min-w-60">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Apartment Company
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {company.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PROPERTY STATS */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Home className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Units
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {units.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Occupied
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {occupiedUnits}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {units.length > 0
                ? `${Math.round(
                    (occupiedUnits /
                      units.length) *
                      100
                  )}% occupied`
                : "No units configured"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Available
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {availableUnits}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Ready for assignment
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* UNITS */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Units
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Units belonging to this property.
                </p>
              </div>

              <Link
                href={`/dashboard/properties/${property.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                Add / Manage Units
              </Link>
            </div>

            {units.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                  <Home className="h-6 w-6 text-slate-300" />
                </div>

                <p className="mt-4 font-semibold text-slate-800">
                  No units yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add units from the property edit page.
                </p>

                <Link
                  href={`/dashboard/properties/${property.id}/edit`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Units
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          {unit.unit_number ||
                            "—"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            Unit{" "}
                            {unit.unit_number ||
                              "—"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {unit.bedrooms ??
                              "—"}{" "}
                            bed ·{" "}
                            {unit.bathrooms ??
                              "—"}{" "}
                            bath
                            {unit.square_feet
                              ? ` · ${unit.square_feet.toLocaleString()} sq ft`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        unit.occupied
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {unit.occupied
                        ? "Occupied"
                        : "Available"}
                    </span>
                  </div>
                ))}

              </div>
            )}
          </section>

          {/* WORK ORDERS */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Recent Work Orders
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest requests for this property.
                  </p>
                </div>
              </div>
            </div>

            {workOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  No work orders found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {workOrders.map(
                  (workOrder) => (
                    <Link
                      key={workOrder.id}
                      href={`/dashboard/work-orders/${workOrder.id}`}
                      className="block px-6 py-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            WO-
                            {workOrder.work_order_number ??
                              workOrder.id
                                .slice(
                                  0,
                                  8
                                )
                                .toUpperCase()}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {workOrder.service ||
                              workOrder.service_category ||
                              "Service Request"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Unit{" "}
                            {workOrder.unit_number ||
                              "—"}{" "}
                            ·{" "}
                            {formatDate(
                              workOrder.requested_date
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${statusClasses(
                            workOrder.status
                          )}`}
                        >
                          {formatStatus(
                            workOrder.status
                          )}
                        </span>

                      </div>
                    </Link>
                  )
                )}

              </div>
            )}
          </section>
        </div>

        {/* PROPERTY INFORMATION */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Property Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Property Name
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {property.name ||
                  "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Property Type
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatPropertyType(
                  property.property_type
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Apartment Company
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {company?.name ||
                  "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>

              <p
                className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  property.active
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {property.active
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
