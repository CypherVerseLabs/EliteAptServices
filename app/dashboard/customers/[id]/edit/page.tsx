import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
  User,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
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
};

type Property = {
  id: string;
  name: string | null;
  apartment_company_id: string | null;
};

export default async function EditCustomerPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  /*
   * Load the customer.
   *
   * Customers are stored in apartment_companies.
   */
  const { data: customerData, error: customerError } =
    await supabase
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
        active
      `)
      .eq("id", id)
      .single();

  if (customerError || !customerData) {
    notFound();
  }

  const customer = customerData as Customer;

  /*
   * Load properties currently associated with this customer.
   *
   * Properties reference the customer through
   * apartment_company_id.
   */
  const { data: propertiesData, error: propertiesError } =
    await supabase
      .from("properties")
      .select(`
        id,
        name,
        apartment_company_id
      `)
      .eq("apartment_company_id", id)
      .order("name", {
        ascending: true,
      });

  if (propertiesError) {
    console.error(
      "Customer properties load error:",
      propertiesError
    );
  }

  const properties: Property[] =
    propertiesData ?? [];

  async function updateCustomer(formData: FormData) {
    "use server";

    const supabase = await createClient();

    /*
     * Verify authentication before modifying data.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(
        `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
          "You must be signed in."
        )}`
      );
    }

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const contactName =
      String(
        formData.get("contact_name") ?? ""
      ).trim() || null;

    const phone =
      String(formData.get("phone") ?? "").trim() ||
      null;

    const email =
      String(formData.get("email") ?? "")
        .trim()
        .toLowerCase() || null;

    const address =
      String(formData.get("address") ?? "").trim() ||
      null;

    const city =
      String(formData.get("city") ?? "").trim() ||
      null;

    const state =
      String(formData.get("state") ?? "")
        .trim()
        .toUpperCase() || null;

    const zip =
      String(formData.get("zip") ?? "").trim() ||
      null;

    const active =
      formData.get("active") === "on";

    /*
     * Validate company name.
     */
    if (!name) {
      redirect(
        `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
          "Customer name is required."
        )}`
      );
    }

    /*
     * Prevent duplicate customer names.
     */
    const {
      data: existingName,
      error: nameCheckError,
    } = await supabase
      .from("apartment_companies")
      .select("id")
      .ilike("name", name)
      .neq("id", id)
      .maybeSingle();

    if (nameCheckError) {
      console.error(
        "Customer name check error:",
        nameCheckError
      );

      redirect(
        `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
          nameCheckError.message
        )}`
      );
    }

    if (existingName) {
      redirect(
        `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
          "A customer with that name already exists."
        )}`
      );
    }

    /*
     * Prevent duplicate customer emails.
     */
    if (email) {
      const {
        data: existingEmail,
        error: emailCheckError,
      } = await supabase
        .from("apartment_companies")
        .select("id")
        .eq("email", email)
        .neq("id", id)
        .maybeSingle();

      if (emailCheckError) {
        console.error(
          "Customer email check error:",
          emailCheckError
        );

        redirect(
          `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
            emailCheckError.message
          )}`
        );
      }

      if (existingEmail) {
        redirect(
          `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
            "That email is already in use."
          )}`
        );
      }
    }

    /*
     * Update the existing customer.
     *
     * IMPORTANT:
     * This performs UPDATE only.
     *
     * It does NOT INSERT into apartment_companies,
     * so it will not trigger the INSERT RLS policy.
     */
    const { error: updateError } =
      await supabase
        .from("apartment_companies")
        .update({
          name,
          contact_name: contactName,
          phone,
          email,
          address,
          city,
          state,
          zip,
          active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (updateError) {
      console.error(
        "Customer update error:",
        {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        }
      );

      redirect(
        `/dashboard/customers/${id}/edit?error=${encodeURIComponent(
          updateError.message
        )}`
      );
    }

    redirect(`/dashboard/customers/${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/customers/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customer
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Customers
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Edit Customer
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update customer information and contact details.
          </p>
        </div>

        {query.error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error}
          </div>
        )}

        <form
          action={updateCustomer}
          className="mt-8 space-y-6"
        >
          {/* CUSTOMER INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Customer Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Basic information for this customer.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Customer / Company Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={customer.name ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact_name"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Primary Contact
                </label>

                <input
                  id="contact_name"
                  name="contact_name"
                  type="text"
                  defaultValue={
                    customer.contact_name ?? ""
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={customer.phone ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={customer.email ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          {/* ADDRESS */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Customer Address
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Billing or primary business address.
              </p>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Street Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  defaultValue={customer.address ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-semibold text-slate-700"
                >
                  City
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  defaultValue={customer.city ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-semibold text-slate-700"
                >
                  State
                </label>

                <input
                  id="state"
                  name="state"
                  type="text"
                  maxLength={2}
                  defaultValue={customer.state ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="zip"
                  className="block text-sm font-semibold text-slate-700"
                >
                  ZIP Code
                </label>

                <input
                  id="zip"
                  name="zip"
                  type="text"
                  inputMode="numeric"
                  defaultValue={customer.zip ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          {/* STATUS */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Customer Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Inactive customers remain in the system but
                should not be used for new operations.
              </p>
            </div>

            <div className="p-6">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={
                    customer.active ?? false
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Active customer
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    Active customers can be used for properties,
                    jobs, and work orders.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* PROPERTIES */}
          {properties.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="font-semibold text-slate-900">
                  Customer Properties
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Properties currently associated with this
                  customer.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {property.name ||
                          "Unnamed Property"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Property
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/properties/${property.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href={`/dashboard/customers/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
