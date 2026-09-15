import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function NewPropertyPage() {
  const supabase = await createClient();

  const { data: companies, error: companiesError } =
    await supabase
      .from("apartment_companies")
      .select("id, name")
      .order("name", { ascending: true });

  async function createProperty(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const name = String(formData.get("name") ?? "").trim();
    const propertyType = String(
      formData.get("property_type") ?? ""
    ).trim();
    const apartmentCompanyId =
      String(formData.get("apartment_company_id") ?? "").trim() ||
      null;
    const address = String(formData.get("address") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const state = String(formData.get("state") ?? "").trim() || null;
    const zip = String(formData.get("zip") ?? "").trim() || null;

    if (!name) {
      redirect("/dashboard/properties/new?error=Property%20name%20is%20required");
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        name,
        property_type: propertyType || null,
        apartment_company_id: apartmentCompanyId,
        address,
        city,
        state,
        zip,
        active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Property creation error:", error);

      redirect(
        `/dashboard/properties/new?error=${encodeURIComponent(
          error?.message ?? "Could not create property"
        )}`
      );
    }

    redirect(`/dashboard/properties/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Properties
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Add Property
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Add an apartment community and its basic property information.
          </p>
        </div>

        {companiesError && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Apartment companies could not be loaded. You can still create
            the property and add the company later.
          </div>
        )}

        <form
          action={createProperty}
          className="mt-8 space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Property Information
                </h2>

                <p className="text-sm text-slate-500">
                  Basic information for the apartment community.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Property Name *
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  placeholder="Example: The Oaks Apartments"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

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
                  defaultValue="apartment"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhome">Townhome</option>
                  <option value="student_housing">
                    Student Housing
                  </option>
                  <option value="senior_living">
                    Senior Living
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

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
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">
                    Select apartment company
                  </option>

                  {(companies ?? []).map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name || "Unnamed Company"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Property Address
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the physical location of the apartment property.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
                  placeholder="13814 Lookout Rd."
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

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
                  placeholder="San Antonio"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

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
                  defaultValue="TX"
                  placeholder="TX"
                  maxLength={2}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

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
                  placeholder="78233"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/properties"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Create Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}