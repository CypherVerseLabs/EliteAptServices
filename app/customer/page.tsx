"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  work_order_number: number | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  requested_date: string | null;
  service: string | null;
  unit_number: string | null;
  created_at: string;
};

const supabase = createClient();

export default function CustomerPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [userName, setUserName] = useState("Customer");
  const [userEmail, setUserEmail] = useState("");

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCustomerData();
  }, []);

  async function loadCustomerData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        window.location.assign("/login");
        return;
      }

      setUserEmail(user.email ?? "");

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, name, email, role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.warn(
          "CUSTOMER PROFILE LOAD ERROR:",
          profileError
        );
      }

      if (profile?.full_name) {
        setUserName(profile.full_name);
      } else if (profile?.name) {
        setUserName(profile.name);
      } else if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      }

      const { data: orders, error: ordersError } =
        await supabase
          .from("work_orders")
          .select(`
            id,
            work_order_number,
            title,
            description,
            status,
            priority,
            requested_date,
            service,
            unit_number,
            created_at
          `)
          .eq("requested_by", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(10);

      if (ordersError) {
        console.warn(
          "CUSTOMER WORK ORDERS LOAD ERROR:",
          ordersError
        );

        setWorkOrders([]);
      } else {
        setWorkOrders(
          (orders ?? []) as WorkOrder[]
        );
      }
    } catch (error) {
      console.error(
        "CUSTOMER DASHBOARD ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your customer portal."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      window.location.assign("/login");
    } catch (error) {
      console.error(
        "CUSTOMER LOGOUT ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign out."
      );

      setLoggingOut(false);
    }
  }

  const openOrders = workOrders.filter(
    (order) =>
      ![
        "completed",
        "cancelled",
        "closed",
      ].includes(
        order.status?.toLowerCase() ?? ""
      )
  );

  const scheduledOrders = workOrders.filter(
    (order) =>
      order.requested_date &&
      ![
        "completed",
        "cancelled",
      ].includes(
        order.status?.toLowerCase() ?? ""
      )
  );

  const completedOrders = workOrders.filter(
    (order) =>
      [
        "completed",
        "closed",
      ].includes(
        order.status?.toLowerCase() ?? ""
      )
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP NAVIGATION */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/customer"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Home className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-950">
                Elite Apartment Services
              </p>

              <p className="text-xs text-slate-500">
                Customer Portal
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/customer"
              className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Home
            </Link>

            <Link
              href="/customer/request"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              New Request
            </Link>

            <Link
              href="/customer/requests"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              My Requests
            </Link>

            <Link
              href="/customer/profile"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              Profile
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />

              {loggingOut
                ? "Signing out..."
                : "Sign Out"}
            </button>
          </nav>

          {/* MOBILE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* MOBILE NAV */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="space-y-2">
              <Link
                href="/customer"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="block rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
              >
                Home
              </Link>

              <Link
                href="/customer/request"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                New Request
              </Link>

              <Link
                href="/customer/requests"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                My Requests
              </Link>

              <Link
                href="/customer/profile"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Profile
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />

                {loggingOut
                  ? "Signing out..."
                  : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {/* WELCOME */}

        <section className="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400">
                    Customer Portal
                  </p>

                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Welcome, {userName}
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                    Manage your service requests, check job
                    progress, and stay connected with Elite
                    Apartment Services.
                  </p>

                  {userEmail && (
                    <p className="mt-3 text-xs text-slate-500">
                      {userEmail}
                    </p>
                  )}
                </div>

                <Link
                  href="/customer/request"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  Request Service
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Open Requests"
            value={
              loading
                ? "—"
                : openOrders.length.toString()
            }
            description="Requests needing attention"
            icon={ClipboardList}
            color="blue"
          />

          <SummaryCard
            title="Scheduled"
            value={
              loading
                ? "—"
                : scheduledOrders.length.toString()
            }
            description="Requests with dates"
            icon={CalendarDays}
            color="purple"
          />

          <SummaryCard
            title="Completed"
            value={
              loading
                ? "—"
                : completedOrders.length.toString()
            }
            description="Finished services"
            icon={CheckCircle2}
            color="green"
          />

          <SummaryCard
            title="Notifications"
            value="0"
            description="No new notifications"
            icon={Bell}
            color="amber"
          />
        </section>

        {/* QUICK ACTIONS */}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common customer actions
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              href="/customer/request"
              icon={Plus}
              title="Request Service"
              description="Submit a new maintenance or service request."
              primary
            />

            <ActionCard
              href="/customer/requests"
              icon={ClipboardList}
              title="My Requests"
              description="View and track all your service requests."
            />

            <ActionCard
              href="/customer/schedule"
              icon={CalendarDays}
              title="My Schedule"
              description="See upcoming scheduled services."
            />

            <ActionCard
              href="/customer/messages"
              icon={MessageSquare}
              title="Messages"
              description="Contact the Elite Apartment Services team."
            />
          </div>
        </section>

        {/* RECENT REQUESTS */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-950">
                Recent Service Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track the latest requests associated with your
                account.
              </p>
            </div>

            <Link
              href="/customer/requests"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your requests...
              </p>
            </div>
          ) : workOrders.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No service requests yet
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                When you submit a service request, it will
                appear here so you can track its progress.
              </p>

              <Link
                href="/customer/request"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Request Service
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {workOrders
                .slice(0, 5)
                .map((order) => (
                  <Link
                    key={order.id}
                    href={`/customer/request/${order.id}`}
                    className="block p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                            WO-
                            {order.work_order_number ??
                              order.id
                                .slice(0, 8)
                                .toUpperCase()}
                          </span>

                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusClasses(
                              order.status
                            )}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>

                          {order.priority &&
                            order.priority !==
                              "normal" && (
                              <span
                                className={`rounded-lg px-2 py-1 text-xs font-semibold ${priorityClasses(
                                  order.priority
                                )}`}
                              >
                                {formatStatus(
                                  order.priority
                                )}
                              </span>
                            )}
                        </div>

                        <h3 className="mt-2 truncate text-sm font-bold text-slate-900">
                          {order.title ||
                            order.service ||
                            "Service Request"}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          {order.unit_number && (
                            <span>
                              Unit {order.unit_number}
                            </span>
                          )}

                          <span>
                            Submitted{" "}
                            {formatDate(
                              order.created_at
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {order.requested_date && (
                          <div className="hidden text-right sm:block">
                            <p className="text-xs text-slate-400">
                              Requested
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {formatDate(
                                order.requested_date
                              )}
                            </p>
                          </div>
                        )}

                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </section>

        {/* HELP / CONTACT */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-950">
              Need service?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Submit a new request and provide the details our
              service team needs to get started.
            </p>

            <Link
              href="/customer/request"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Request Service
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-950">
              Need help?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Contact the Elite Apartment Services team if you
              have questions about a request or scheduled service.
            </p>

            <Link
              href="/customer/messages"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ACCOUNT */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-700" />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Your Account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {userEmail ||
                    "Manage your account information"}
                </p>
              </div>
            </div>

            <Link
              href="/customer/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Elite Apartment Services.
          </p>

          <p>
            Customer Service Portal
          </p>
        </div>
      </footer>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardList;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
    },
  };

  const current = colors[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${current.bg}`}
        >
          <Icon
            className={`h-5 w-5 ${current.icon}`}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: typeof ClipboardList;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        primary
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          primary
            ? "bg-white/15"
            : "bg-slate-100"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            primary
              ? "text-white"
              : "text-slate-700"
          }`}
        />
      </div>

      <h3
        className={`mt-5 font-bold ${
          primary
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {title}
      </h3>

      <p
        className={`mt-2 text-sm leading-5 ${
          primary
            ? "text-blue-100"
            : "text-slate-500"
        }`}
      >
        {description}
      </p>

      <div
        className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${
          primary
            ? "text-white"
            : "text-blue-600"
        }`}
      >
        Open
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function formatStatus(status: string | null) {
  if (!status) {
    return "New";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function statusClasses(status: string | null) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "closed":
      return "bg-green-100 text-green-700";

    case "in_progress":
    case "in progress":
      return "bg-blue-100 text-blue-700";

    case "assigned":
      return "bg-purple-100 text-purple-700";

    case "accepted":
      return "bg-cyan-100 text-cyan-700";

    case "reviewing":
      return "bg-indigo-100 text-indigo-700";

    case "approved":
      return "bg-green-100 text-green-700";

    case "awaiting_signoff":
      return "bg-orange-100 text-orange-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "submitted":
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function priorityClasses(priority: string | null) {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-red-100 text-red-700";

    case "high":
      return "bg-orange-100 text-orange-700";

    case "low":
      return "bg-slate-100 text-slate-600";

    case "normal":
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}
