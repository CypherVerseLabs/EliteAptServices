import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  HardHat,
  Home as HomeIcon,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
} from "lucide-react";

const portalOptions = [
  {
  title: "Customers",
  description:
    "Submit service requests, track work orders, and stay connected with your property service team.",
  icon: HomeIcon,
},


  {
    title: "Workers",
    description:
      "View assigned jobs, update job status, upload completion details, and manage your workload.",
    icon: Wrench,
  },
  {
    title: "Contractors",
    description:
      "Manage assigned work, communicate job progress, and submit completed work for review.",
    icon: HardHat,
  },
  {
    title: "Administrators",
    description:
      "Manage properties, work orders, workers, contractors, pricing, jobs, and reporting.",
    icon: ShieldCheck,
  },
];

const features = [
  "Submit and manage service requests",
  "Automatic service pricing",
  "Work order and job tracking",
  "Worker and contractor management",
  "Property management",
  "Mobile-friendly access",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVIGATION */}
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-bold tracking-tight text-white">
                Elite Apartment Services
              </p>

              <p className="text-xs text-slate-400">
                Service Management Platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#services"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Services
            </a>

            <a
              href="#portal"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Portal
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              About
            </a>

            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 md:hidden"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.20),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
              <CheckCircle2 className="h-4 w-4" />
              Professional Apartment Service Management
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Apartment maintenance and service management,
              <span className="text-blue-500">
                {" "}
                all in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Elite Apartment Services connects properties,
              customers, workers, contractors, and administrators
              through one simple service management platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-500"
              >
                Sign In to Portal
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#portal"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explore the Platform
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Work orders
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Job tracking
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Service pricing
              </div>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-3 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-white p-6 text-slate-950 sm:p-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Service Portal
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Elite Dashboard
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Open Requests
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      24
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Active Jobs
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      18
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Wrench className="h-5 w-5 text-blue-600" />
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          Unit 214
                        </p>

                        <p className="text-xs text-slate-500">
                          Painting &amp; Turn Service
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      In Progress
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          Unit 108
                        </p>

                        <p className="text-xs text-slate-500">
                          Completed Service
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-green-600">
                      Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTAL */}
      <section
        id="portal"
        className="bg-white py-20 text-slate-950"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              One Platform
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everyone has a place in the platform.
            </h2>

            <p className="mt-4 text-slate-500">
              Customers, workers, contractors, and administrators
              each get the tools they need.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {portalOptions.map((option) => {
              const Icon = option.icon;

              return (
                <div
                  key={option.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    {option.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {option.description}
                  </p>

                  <Link
                    href="/login"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="bg-slate-50 py-20 text-slate-950"
      >
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Built for Apartment Services
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From the first request to completed work.
            </h2>

            <p className="mt-5 max-w-xl text-slate-500">
              Keep every part of the service process organized,
              from property requests and pricing through assignment,
              completion, and reporting.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

                  <span className="text-sm font-semibold text-slate-700">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
              <Smartphone className="h-7 w-7" />
            </div>

            <h3 className="mt-6 text-2xl font-bold">
              Designed for phones, tablets, and computers.
            </h3>

            <p className="mt-4 leading-7 text-slate-400">
              The portal is being built as a responsive web application
              that can be used from a browser and prepared for
              installation on supported mobile devices.
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Users className="h-5 w-5 text-blue-400" />

              <div>
                <p className="text-sm font-semibold">
                  One account system
                </p>

                <p className="text-xs text-slate-400">
                  Role-based access for every user type.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Enter Service Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="border-t border-slate-800 bg-slate-950 py-20"
      >
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <Building2 className="h-7 w-7" />
          </div>

          <h2 className="mt-6 text-3xl font-bold">
            Elite Apartment Services
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">
            A centralized service platform for apartment communities,
            maintenance teams, service professionals, and management.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Elite Apartment Services.
            All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="transition hover:text-white"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="transition hover:text-white"
            >
              Portal
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
