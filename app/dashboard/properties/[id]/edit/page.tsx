import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
  Trash2,
  Plus,
  Home,
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
};

type Company = {
  id: string;
  name: string | null;
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

export default async function EditPropertyPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

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
        active
      `)
      .eq("id", id)
      .single();

  if (propertyError || !propertyData) {
    notFound();
  }

  const property = propertyData as Property;

  const [companiesResult, unitsResult] =
    await Promise.all([
      supabase
        .from("apartment_companies")
        .select(`
          id,
          name
        `)
        .order("name", { ascending: true }),

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
        .order("unit_number", {
          ascending: true,
        }),
    ]);

  const companies =
    (companiesResult.data ?? []) as Company[];

  const units = (unitsResult.data ?? []) as Unit[];

  async function updateProperty(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const propertyType = String(
      formData.get("property_type") ?? ""
    ).trim();

    const apartmentCompanyId =
      String(
        formData.get("apartment_company_id") ?? ""
      ).trim() || null;

    const address =
      String(formData.get("address") ?? "").trim() ||
      null;

    const city =
      String(formData.get("city") ?? "").trim() ||
      null;

    const state =
      String(formData.get("state") ?? "").trim() ||
      null;

    const zip =
      String(formData.get("zip") ?? "").trim() ||
      null;

    const active =
      formData.get("active") === "on";

    if (!name) {
      redirect(
        `/dashboard/properties/${id}/edit?error=${encodeURIComponent(
          "Property name is required"
        )}`
      );
    }

    const { error } = await supabase
      .from("properties")
      .update({
        name,
        property_type:
          propertyType || null,
        apartment_company_id:
          apartmentCompanyId,
        address,
        city,
        state,
        zip,
        active,
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Property update error:",
        error
      );

      redirect(
        `/dashboard/properties/${id}/edit?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(`/dashboard/properties/${id}`);
  }

  async function addUnit(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const unitNumber = String(
      formData.get("unit_number") ?? ""
    ).trim();

    const bedroomsRaw = String(
      formData.get("bedrooms") ?? ""
    ).trim();

    const bathroomsRaw = String(
      formData.get("bathrooms") ?? ""
    ).trim();

    const squareFeetRaw = String(
      formData.get("square_feet") ?? ""
    ).trim();

    const occupied =
      formData.get("occupied") === "on";

    if (!unitNumber) {
      redirect(
        `/dashboard/properties/${id}/edit?unitError=${encodeURIComponent(
          "Unit number is required"
        )}`
      );
    }

    const bedrooms = bedroomsRaw
      ? Number(bedroomsRaw)
      : null;

    const bathrooms = bathroomsRaw
      ? Number(bathroomsRaw)
      : null;

    const squareFeet = squareFeetRaw
      ? Number(squareFeetRaw)
      : null;

    if (
      (bedrooms !== null &&
        Number.isNaN(bedrooms)) ||
      (bathrooms !== null &&
        Number.isNaN(bathrooms)) ||
      (squareFeet !== null &&
        Number.isNaN(squareFeet))
    ) {
      redirect(
        `/dashboard/properties/${id}/edit?unitError=${encodeURIComponent(
          "Unit numbers must be valid"
        )}`
      );
    }

    const { error } = await supabase
      .from("units")
      .insert({
        property_id: id,
        unit_number: unitNumber,
        bedrooms,
        bathrooms,
        square_feet: squareFeet,
        occupied,
      });

    if (error) {
      console.error(
        "Unit creation error:",
        error
      );

      redirect(
        `/dashboard/properties/${id}/edit?unitError=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(
      `/dashboard/properties/${id}/edit`
    );
  }

  async function deleteUnit(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const unitId = String(
      formData.get("unit_id") ?? ""
    ).trim();

    if (!unitId) {
      redirect(
        `/dashboard/properties/${id}/edit`
      );
    }

    const { error } = await supabase
      .from("units")
      .delete()
      .eq("id", unitId)
      .eq("property_id", id);

    if (error) {
      console.error(
        "Unit deletion error:",
        error
      );

      redirect(
        `/dashboard/properties/${id}/edit?unitError=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(
      `/dashboard/properties/${id}/edit`
    );
  }

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

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* TOP NAVIGATION */}

        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/properties/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </Link>

          <Link
            href="/dashboard/properties"
            className="text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            All Properties
          </Link>
        </div>

        {/* PAGE HEADER */}

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Properties
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Edit Property
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Update property information and manage
            the units belonging to this property.
          </p>
        </div>

        {/* PROPERTY FORM */}

        <form
          action={updateProperty}
          className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 p-6">
            <h2 className="font-semibold text-slate-900">
              Property Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Keep the property details current for
              jobs, work orders, and customers.
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">

            {/* NAME */}

            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-slate-700"
              >
                Property Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={
                  property.name ?? ""
                }
                placeholder="Example: The Oaks Apartments"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* PROPERTY TYPE */}

            <div>
              <label
                htmlFor="property_type"
                className="text-sm font-semibold text-slate-700"
              >
                Property Type
              </label>

              <select
                id="property_type"
                name="property_type"
                defaultValue={
                  property.property_type ?? ""
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="">
                  Select property type
                </option>

                <option value="apartment">
                  Apartment
                </option>

                <option value="apartment_complex">
                  Apartment Complex
                </option>

                <option value="multi_family">
                  Multi-Family
                </option>

                <option value="commercial">
                  Commercial
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            {/* APARTMENT COMPANY */}

            <div>
              <label
                htmlFor="apartment_company_id"
                className="text-sm font-semibold text-slate-700"
              >
                Apartment Company
              </label>

              <select
                id="apartment_company_id"
                name="apartment_company_id"
                defaultValue={
                  property.apartment_company_id ??
                  ""
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="">
                  No company assigned
                </option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name ||
                      "Unnamed Company"}
                  </option>
                ))}
              </select>
            </div>

            {/* ADDRESS */}

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="text-sm font-semibold text-slate-700"
              >
                Street Address
              </label>

              <input
                id="address"
                name="address"
                type="text"
                defaultValue={
                  property.address ?? ""
                }
                placeholder="Street address"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* CITY */}

            <div>
              <label
                htmlFor="city"
                className="text-sm font-semibold text-slate-700"
              >
                City
              </label>

              <input
                id="city"
                name="city"
                type="text"
                defaultValue={
                  property.city ?? ""
                }
                placeholder="San Antonio"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* STATE */}

            <div>
              <label
                htmlFor="state"
                className="text-sm font-semibold text-slate-700"
              >
                State
              </label>

              <input
                id="state"
                name="state"
                type="text"
                defaultValue={
                  property.state ?? "TX"
                }
                maxLength={2}
                placeholder="TX"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* ZIP */}

            <div>
              <label
                htmlFor="zip"
                className="text-sm font-semibold text-slate-700"
              >
                ZIP Code
              </label>

              <input
                id="zip"
                name="zip"
                type="text"
                defaultValue={
                  property.zip ?? ""
                }
                placeholder="78233"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* ACTIVE */}

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Active Property
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Allow this property to receive
                    new work.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={
                    property.active ?? true
                  }
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* SAVE */}

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:justify-end">
            <Link
              href={`/dashboard/properties/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Property
            </button>
          </div>
        </form>

        {/* UNITS */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Property Units
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add and manage the apartment units
                for this property.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              <Home className="h-4 w-4" />
              {units.length}{" "}
              {units.length === 1
                ? "Unit"
                : "Units"}
            </div>
          </div>

          {/* ADD UNIT */}

          <div className="border-b border-slate-100 bg-slate-50 p-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Add Unit
            </h3>

            <form
              action={addUnit}
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label
                  htmlFor="unit_number"
                  className="text-xs font-semibold text-slate-600"
                >
                  Unit Number
                </label>

                <input
                  id="unit_number"
                  name="unit_number"
                  type="text"
                  required
                  placeholder="101"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="bedrooms"
                  className="text-xs font-semibold text-slate-600"
                >
                  Bedrooms
                </label>

                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="2"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="bathrooms"
                  className="text-xs font-semibold text-slate-600"
                >
                  Bathrooms
                </label>

                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="2"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="square_feet"
                  className="text-xs font-semibold text-slate-600"
                >
                  Square Feet
                </label>

                <input
                  id="square_feet"
                  name="square_feet"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="950"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div className="flex items-end gap-3">
                <label className="flex h-[42px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
                  <input
                    type="checkbox"
                    name="occupied"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="text-xs font-semibold text-slate-600">
                    Occupied
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* UNIT LIST */}

          {units.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Home className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No units added
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Use the form above to add the
                property&apos;s first unit.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
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

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        unit.occupied
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {unit.occupied
                        ? "Occupied"
                        : "Available"}
                    </span>

                    <form
                      action={deleteUnit}
                    >
                      <input
                        type="hidden"
                        name="unit_id"
                        value={unit.id}
                      />

                      <button
                        type="submit"
                        title="Delete unit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}

        <div className="mt-8 flex justify-start pb-8">
          <Link
            href={`/dashboard/properties/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Property
          </Link>
        </div>

      </div>
    </div>
  );
}
