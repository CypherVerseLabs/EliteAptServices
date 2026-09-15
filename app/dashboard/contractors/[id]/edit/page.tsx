import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  BriefcaseBusiness,
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

type Contractor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean;
};

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

export default async function EditContractorPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contractors")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      email,
      specialty,
      active
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const contractor = data as Contractor;

  async function updateContractor(formData: FormData) {
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

    const specialty = String(
      formData.get("specialty") ?? ""
    ).trim();

    const active = formData.get("active") === "on";

    if (!firstName) {
      redirect(
        `/dashboard/contractors/${id}/edit?error=${encodeURIComponent(
          "First name is required."
        )}`
      );
    }

    if (!lastName) {
      redirect(
        `/dashboard/contractors/${id}/edit?error=${encodeURIComponent(
          "Last name is required."
        )}`
      );
    }

    if (!specialty) {
      redirect(
        `/dashboard/contractors/${id}/edit?error=${encodeURIComponent(
          "Contractor specialty is required."
        )}`
      );
    }

    if (email) {
      const { data: existingContractor, error: emailError } =
        await supabase
          .from("contractors")
          .select("id")
          .eq("email", email)
          .neq("id", id)
          .maybeSingle();

      if (emailError) {
        console.error(
          "Contractor email check error:",
          emailError
        );

        redirect(
          `/dashboard/contractors/${id}/edit?error=${encodeURIComponent(
            emailError.message
          )}`
        );
      }

      if (existingContractor) {
        redirect(
          `/dashboard/contractors/${id}/edit?error=${encodeURIComponent(
            "That email is already in use."
          )}`
        );
      }
    }

    const { error: updateError } = await supabase
      .from("contractors")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        specialty,
        active,
      })
      .eq("id", id);

    if (updateError) {
      console.error(
        "Contractor update error:",
        {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        }
      );

      redirect(
        `/dashboard/contractors/${id}/edit?error=${encodeURIComponent(
          updateError.message
        )}`
      );
    }

    redirect(`/dashboard/contractors/${id}`);
  }

  const displayName =
    `${contractor.first_name ?? ""} ${
      contractor.last_name ?? ""
    }`.trim() || "Contractor";

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/contractors/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contractor
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Contractors
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Edit Contractor
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update contractor information, specialty,
            contact information, and active status.
          </p>
        </div>

        {query.error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error}
          </div>
        )}

        <form
          action={updateContractor}
          className="mt-8 space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Contractor Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Basic information for {displayName}.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  First Name
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  defaultValue={contractor.first_name ?? ""}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Last Name
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  defaultValue={contractor.last_name ?? ""}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-2.5">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Contact Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Phone and email used to contact this contractor.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={contractor.phone ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={contractor.email ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-2.5">
                  <BriefcaseBusiness className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Specialty & Status
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Set the contractor's primary specialty and availability.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <label
                  htmlFor="specialty"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Contractor Specialty
                </label>

                <select
                  id="specialty"
                  name="specialty"
                  defaultValue={contractor.specialty ?? ""}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">
                    Select contractor specialty
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

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={contractor.active}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Active contractor
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Active contractors can be assigned to jobs and work orders.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/dashboard/contractors/${id}`}
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