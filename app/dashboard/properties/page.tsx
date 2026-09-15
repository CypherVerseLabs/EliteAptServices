"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Home,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

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

export default function PropertiesPage() {
  const supabase = createClient();

  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [companies, setCompanies] = useState<ApartmentCompany[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setError("");

    const [
      propertiesResult,
      unitsResult,
      companiesResult,
    ] = await Promise.all([
      supabase
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
        .order("created_at", { ascending: false }),

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
        `),

      supabase
        .from("apartment_companies")
        .select(`
          id,
          name
        `)
        .order("name", { ascending: true }),
    ]);

    if (propertiesResult.error) {
      console.error(
        "Property load error:",
        propertiesResult.error
      );

      setError(propertiesResult.error.message);
      setLoading(false);
      return;
    }

    if (unitsResult.error) {
      console.error(
        "Unit load error:",
        unitsResult.error
      );
    }

    if (companiesResult.error) {
      console.error(
        "Company load error:",
        companiesResult.error
      );
    }

    setProperties(propertiesResult.data ?? []);
    setUnits(unitsResult.data ?? []);
    setCompanies(companiesResult.data ?? []);

    setLoading(false);
  }

  function getUnits(propertyId: string) {
    return units.filter(
      (unit) => unit.property_id === propertyId
    );
  }

  function getCompany(companyId: string | null) {
    if (!companyId) return null;

    return companies.find(
      (company) => company.id === companyId
    );
  }

  function formatPropertyType(type: string | null) {
    if (!type) return "Property";

    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getPropertyAddress(property: Property) {
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

  const filteredProperties = properties.filter((property) => {
    const company = getCompany(
      property.apartment_company_id
    );

    const searchText = search.toLowerCase();

    const companyName =
      company?.name?.toLowerCase() ?? "";

    return (
      property.name
        ?.toLowerCase()
        .includes(searchText) ||
      property.address
        ?.toLowerCase()
        .includes(searchText) ||
      property.city
        ?.toLowerCase()
        .includes(searchText) ||
      property.state
        ?.toLowerCase()
        .includes(searchText) ||
      property.zip
        ?.toLowerCase()
        .includes(searchText) ||
      companyName.includes(searchText)
    );
  });

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
              Properties
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage apartment properties, units, and occupancy.
            </p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Property
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
              placeholder="Search property, address, city, ZIP, or apartment company..."
              className="w-full rounded-xl border border-slate-300 bg-white px-11 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Could not load properties
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProperties}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading properties...
            </div>
          </div>
        ) : (
          <>
            {/* SUMMARY */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {filteredProperties.length}{" "}
                {filteredProperties.length === 1
                  ? "property"
                  : "properties"}
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
            {filteredProperties.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Building2 className="h-7 w-7 text-slate-400" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search
                    ? "No matching properties"
                    : "No properties yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {search
                    ? "Try searching for another property, address, city, ZIP code, or apartment company."
                    : "Add your first apartment property to begin managing units and work orders."}
                </p>

                {!search && (
                  <Link
                    href="/dashboard/properties/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Property
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {filteredProperties.map((property) => {
                  const propertyUnits = getUnits(
                    property.id
                  );

                  const occupiedUnits =
                    propertyUnits.filter(
                      (unit) => unit.occupied
                    ).length;

                  const company = getCompany(
                    property.apartment_company_id
                  );

                  return (
                    <Link
                      key={property.id}
                      href={`/dashboard/properties/${property.id}`}
                      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      {/* TOP */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-600">
                                {property.name ||
                                  "Unnamed Property"}
                              </h2>

                              <span
                                className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
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

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {formatPropertyType(
                                property.property_type
                              )}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>

                      {/* ADDRESS */}
                      <div className="mt-5 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                        <span>
                          {getPropertyAddress(property)}
                        </span>
                      </div>

                      {/* COMPANY */}
                      {company?.name && (
                        <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Apartment Company
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {company.name}
                          </p>
                        </div>
                      )}

                      {/* STATS */}
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-slate-400" />

                            <span className="text-xs font-medium text-slate-400">
                              Units
                            </span>
                          </div>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {propertyUnits.length}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-medium text-slate-400">
                            Occupied
                          </p>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {occupiedUnits}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-medium text-slate-400">
                            Available
                          </p>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {Math.max(
                              propertyUnits.length -
                                occupiedUnits,
                              0
                            )}
                          </p>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-400">
                          {propertyUnits.length === 1
                            ? "1 unit"
                            : `${propertyUnits.length} units`}
                        </p>

                        <span className="text-sm font-semibold text-blue-600">
                          View property
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