"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

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
};

type Property = {
  id: string;
  apartment_company_id: string | null;
};

export default function CustomersPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const [customersResult, propertiesResult] =
      await Promise.all([
        supabase
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
            created_at
          `)
          .order("name", { ascending: true }),

        supabase
          .from("properties")
          .select(`
            id,
            apartment_company_id
          `),
      ]);

    if (customersResult.error) {
      console.error(
        "Customer load error:",
        customersResult.error
      );

      setError(customersResult.error.message);
      setLoading(false);
      return;
    }

    if (propertiesResult.error) {
      console.error(
        "Customer property load error:",
        propertiesResult.error
      );
    }

    setCustomers(customersResult.data ?? []);
    setProperties(propertiesResult.data ?? []);
    setLoading(false);
  }

  function getPropertyCount(customerId: string) {
    return properties.filter(
      (property) =>
        property.apartment_company_id === customerId
    ).length;
  }

  function getLocation(customer: Customer) {
    const parts = [
      customer.city,
      customer.state,
      customer.zip,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "No location provided";
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedSearch) return true;

    return [
      customer.name,
      customer.contact_name,
      customer.phone,
      customer.email,
      customer.address,
      customer.city,
      customer.state,
      customer.zip,
    ].some((value) =>
      value?.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Customers
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage apartment companies, customer contacts,
              and properties.
            </p>
          </div>

          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer, contact, phone, email, city, or state..."
              className="w-full rounded-xl border border-slate-300 bg-white px-11 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Could not load customers
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadCustomers}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading customers...
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {filteredCustomers.length}{" "}
                {filteredCustomers.length === 1
                  ? "customer"
                  : "customers"}
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

            {filteredCustomers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Building2 className="h-7 w-7 text-slate-400" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search
                    ? "No matching customers"
                    : "No customers yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {search
                    ? "Try another search."
                    : "Add your first apartment company to begin managing customers and properties."}
                </p>

                {!search && (
                  <Link
                    href="/dashboard/customers/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {filteredCustomers.map((customer) => {
                  const propertyCount =
                    getPropertyCount(customer.id);

                  return (
                    <Link
                      key={customer.id}
                      href={`/dashboard/customers/${customer.id}`}
                      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-600">
                                {customer.name ||
                                  "Unnamed Customer"}
                              </h2>

                              <span
                                className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
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
                              <p className="mt-1 text-sm font-medium text-slate-500">
                                {customer.contact_name}
                              </p>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>

                      <div className="mt-5 space-y-2">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {customer.email}
                            </span>
                          </div>
                        )}

                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-sm text-slate-500">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{getLocation(customer)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Properties
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {propertyCount}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-blue-600">
                          View customer
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}