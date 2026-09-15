import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewCustomerPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  async function createCustomer(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const contactName =
      String(
        formData.get("contact_name") ?? ""
      ).trim() || null;

    const phone =
      String(formData.get("phone") ?? "").trim() || null;

    const email =
      String(formData.get("email") ?? "")
        .trim()
        .toLowerCase() || null;

    const address =
      String(formData.get("address") ?? "").trim() || null;

    const city =
      String(formData.get("city") ?? "").trim() || null;

    const state =
      String(formData.get("state") ?? "")
        .trim()
        .toUpperCase() || null;

    const zip =
      String(formData.get("zip") ?? "").trim() || null;

    if (!name) {
      redirect(
        "/dashboard/customers/new?error=Customer%20name%20is%20required"
      );
    }

    const {
      data: existingCustomer,
      error: duplicateError,
    } = await supabase
      .from("apartment_companies")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Customer duplicate check error:",
        duplicateError
      );

      redirect(
        `/dashboard/customers/new?error=${encodeURIComponent(
          duplicateError.message
        )}`
      );
    }

    if (existingCustomer) {
      redirect(
        "/dashboard/customers/new?error=A%20customer%20with%20that%20name%20already%20exists"
      );
    }

    if (email) {
      const { data: existingEmail } =
        await supabase
          .from("apartment_companies")
          .select("id")
          .ilike("email", email)
          .maybeSingle();

      if (existingEmail) {
        redirect(
          "/dashboard/customers/new?error=That%20email%20is%20already%20in%20use"
        );
      }
    }

    const { data: customer, error } =
      await supabase
        .from("apartment_companies")
        .insert({
          name,
          contact_name: contactName,
          phone,
          email,
          address,
          city,
          state,
          zip,
          active: true,
        })
        .select("id")
        .single();

    if (error || !customer) {
      console.error(
        "Customer creation error:",
        {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        }
      );

      redirect(
        `/dashboard/customers/new?error=${encodeURIComponent(
          error?.message ??
            "Could not create customer"
        )}`
      );
    }

    redirect(
      `/dashboard/customers/${customer.id}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Customers
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Add Customer
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Add an apartment company and its primary
                contact information.
              </p>
            </div>
          </div>

          {params.error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <form
            action={createCustomer}
            className="mt-8 space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="text-sm font-semibold text-slate-700"
              >
                Company Name
              </label>

              <input
                id="name"
                name="name"
                required
                autoFocus
                placeholder="Apartment company name"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="contact_name"
                className="text-sm font-semibold text-slate-700"
              >
                Primary Contact
              </label>

              <input
                id="contact_name"
                name="contact_name"
                placeholder="Contact person's name"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(210) 555-1234"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="text-sm font-semibold text-slate-700"
              >
                Address
              </label>

              <input
                id="address"
                name="address"
                placeholder="Street address"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="sm:col-span-1">
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
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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
                  maxLength={2}
                  placeholder="TX"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="zip"
                  className="text-sm font-semibold text-slate-700"
                >
                  ZIP
                </label>

                <input
                  id="zip"
                  name="zip"
                  inputMode="numeric"
                  placeholder="78201"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                Customer structure
              </p>

              <p className="mt-1 text-sm text-blue-700">
                Properties can be connected to this customer
                after the customer is created.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/customers"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Save Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}