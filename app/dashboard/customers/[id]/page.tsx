import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit,
  Home,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Customer = {
  id: string;
  name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
};

type Property = {
  id: string;
  name: string | null;
  property_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  active: boolean | null;
};

export default async function CustomerDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * Load customer.
   */
  const {
    data: customerData,
    error: customerError,
  } = await supabase
    .from("apartment_companies")
    .select(`
      id,
      name,
      contact_name,
      phone,
      email,
      address,
      city,
      state,
      zip,
      active,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (customerError || !customerData) {
    notFound();
  }

  const customer = customerData as Customer;

  /*
   * Load properties belonging to this customer.
   */
  const {
    data: propertyData,
    error: propertyError,
  } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      property_type,
      address,
      city,
      state,
      zip,
      active
    `)
    .eq("apartment_company_id", id)
    .order("name", {
      ascending: true,
    });

  if (propertyError) {
    console.error(
      "Customer property load error:",
      {
        message: propertyError.message,
        details: propertyError.details,
        hint: propertyError.hint,
        code: propertyError.code,
      }
    );
  }

  const properties: Property[] =
    propertyData ?? [];

  function formatPropertyType(
    type: string | null
  ) {
    if (!type) {
      return "Property";
    }

    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getPropertyLocation(
    property: Property
  ) {
    const parts = [
      property.address,
      property.city,
      property.state,
      property.zip,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "No address provided";
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
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

  const location = [
    customer.city,
    customer.state,
    customer.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>

          <Link
            href={`/dashboard/customers/${id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit Customer
          </Link>
        </div>

        {/* CUSTOMER HERO */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {customer.name ||
                      "Unnamed Customer"}
                  </h1>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      customer.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {customer.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {customer.contact_name && (
                  <p className="mt-2 text-sm font-semibold text-blue-600">
                    {customer.contact_name}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-sm text-slate-500">

                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center gap-2 transition hover:text-blue-600"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      {customer.phone}
                    </a>
                  )}

                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center gap-2 break-all transition hover:text-blue-600"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      {customer.email}
                    </a>
                  )}

                  {(customer.address ||
                    customer.city ||
                    customer.state ||
                    customer.zip) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <span>
                        {[
                          customer.address,
                          location,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PROPERTY COUNT */}
            <div className="rounded-xl bg-slate-50 p-5 lg:min-w-56">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Properties
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {properties.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {properties.length === 1
                  ? "property associated"
                  : "properties associated"}
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMER INFORMATION */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Customer Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Company Name
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Primary Contact
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer.contact_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all font-medium text-slate-800">
                {customer.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Address
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {customer.address || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Location
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {location || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Added
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {formatDate(
                  customer.created_at
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Last Updated
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {formatDate(
                  customer.updated_at
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>

              <p
                className={`mt-1 font-semibold ${
                  customer.active
                    ? "text-green-600"
                    : "text-slate-500"
                }`}
              >
                {customer.active
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>
          </div>
        </section>

        {/* PROPERTIES */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Home className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Properties
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Properties associated with this customer.
                </p>
              </div>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Home className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 font-semibold text-slate-800">
                No properties assigned
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Properties connected to this customer
                will appear here.
              </p>

              <Link
                href="/dashboard/properties/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Home className="h-4 w-4" />
                Add Property
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/dashboard/properties/${property.id}`}
                  className="block px-6 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2.5">
                        <Building2 className="h-5 w-5 text-slate-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {property.name ||
                            "Unnamed Property"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {formatPropertyType(
                            property.property_type
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {getPropertyLocation(
                            property
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
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

                      <span className="text-sm font-semibold text-blue-600">
                        View
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}