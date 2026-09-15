import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Save,
  UserPlus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

const SPECIALTIES = [
  {
    value: "painter",
    label: "Painter",
  },
  {
    value: "carpet_cleaner",
    label: "Carpet Cleaner",
  },
  {
    value: "housekeeper",
    label: "Housekeeper",
  },
  {
    value: "make_ready_specialist",
    label: "Make Ready Specialist",
  },
  {
    value: "re_surfacing",
    label: "Re-Surfacing",
  },
];

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewContractorPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  async function createContractor(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const firstName = String(
      formData.get("first_name") ?? ""
    ).trim();

    const lastName = String(
      formData.get("last_name") ?? ""
    ).trim();

    const phone =
      String(formData.get("phone") ?? "").trim() || null;

    const email =
      String(formData.get("email") ?? "")
        .trim()
        .toLowerCase() || null;

    const specialty =
      String(formData.get("specialty") ?? "").trim() || null;

    if (!firstName) {
      redirect(
        "/dashboard/contractors/new?error=First%20name%20is%20required"
      );
    }

    if (!specialty) {
      redirect(
        "/dashboard/contractors/new?error=Please%20select%20a%20specialty"
      );
    }

    /*
     * Make sure the person creating the contractor
     * is authenticated.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(
        "/dashboard/contractors/new?error=You%20must%20be%20signed%20in"
      );
    }

    /*
     * Check for duplicate contractor email.
     *
     * Contractors are stored in the contractors table,
     * not profiles.
     */
    if (email) {
      const { data: existingContractor, error: emailCheckError } =
        await supabase
          .from("contractors")
          .select("id")
          .eq("email", email)
          .maybeSingle();

      if (emailCheckError) {
        console.error(
          "Contractor email check error:",
          emailCheckError
        );

        redirect(
          `/dashboard/contractors/new?error=${encodeURIComponent(
            emailCheckError.message
          )}`
        );
      }

      if (existingContractor) {
        redirect(
          "/dashboard/contractors/new?error=That%20email%20is%20already%20in%20use"
        );
      }
    }

    /*
     * Create the contractor record.
     *
     * Do NOT insert into profiles.
     * The rest of the contractor dashboard uses
     * the contractors table.
     */
    const { data: contractor, error: insertError } =
      await supabase
        .from("contractors")
        .insert({
          first_name: firstName,
          last_name: lastName || null,
          phone,
          email,
          specialty,
          active: true,
        })
        .select("id")
        .single();

    if (insertError || !contractor) {
      console.error(
        "Contractor creation error:",
        {
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint,
          code: insertError?.code,
        }
      );

      redirect(
        `/dashboard/contractors/new?error=${encodeURIComponent(
          insertError?.message ??
            "Could not create contractor"
        )}`
      );
    }

    redirect(
      `/dashboard/contractors/${contractor.id}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/contractors"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contractors
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Contractors
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Add Contractor
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Add an independent contractor and assign
                their primary specialty.
              </p>
            </div>
          </div>

          {params.error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <form
            action={createContractor}
            className="mt-8 space-y-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first_name"
                  className="text-sm font-semibold text-slate-700"
                >
                  First Name
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="First name"
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Last Name
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="specialty"
                className="text-sm font-semibold text-slate-700"
              >
                Specialty
              </label>

              <select
                id="specialty"
                name="specialty"
                required
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="" disabled>
                  Select specialty
                </option>

                {SPECIALTIES.map((specialty) => (
                  <option
                    key={specialty.value}
                    value={specialty.value}
                  >
                    {specialty.label}
                  </option>
                ))}
              </select>
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
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="(210) 555-1234"
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
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="contractor@example.com"
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                Contractor access
              </p>

              <p className="mt-1 text-sm text-blue-700">
                This creates the contractor record in Elite
                Apartment Services. It does not create a
                login account. Login access can be added
                separately later.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/contractors"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Save Contractor
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}