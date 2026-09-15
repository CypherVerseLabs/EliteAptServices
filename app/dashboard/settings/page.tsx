import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  DollarSign,
  Users,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Configure Elite Apartment Services system settings and
            administrative options.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Link
            href="/dashboard/pricing"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <DollarSign className="h-8 w-8 text-emerald-600" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Pricing
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage price lists, services, rates, and company abbreviations.
            </p>
          </Link>

          <Link
            href="/dashboard/workers"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <Users className="h-8 w-8 text-blue-600" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Workers
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage technicians and worker information.
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Settings className="h-8 w-8 text-slate-600" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              System Settings
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Additional company configuration will be added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
