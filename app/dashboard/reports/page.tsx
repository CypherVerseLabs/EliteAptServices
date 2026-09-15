"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  work_order_number: string | null;
  property_id: string | null;
  property_name: string | null;
  service_category: string | null;
  service: string | null;
  status: string | null;
  priority: string | null;
  requested_date: string | null;
  pricing_total: number | null;
  is_estimate: boolean | null;
  created_at: string | null;
};

type DateRange = "7" | "30" | "90" | "365" | "all";

type ReportSummary = {
  totalRevenue: number;
  completedRevenue: number;
  estimatedRevenue: number;
  totalWorkOrders: number;
  completedWorkOrders: number;
  openWorkOrders: number;
  averageJobValue: number;
};

type GroupedReport = {
  name: string;
  count: number;
  revenue: number;
};

const supabase = createClient();

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatServiceName(value: string) {
  return value
    .split("_")
    .map((word) => {
      if (/^\d/.test(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getStartDate(range: DateRange) {
  if (range === "all") {
    return null;
  }

  const days = Number(range);

  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return date.toISOString();
}

function isCompleted(status: string | null) {
  return [
    "completed",
    "complete",
    "approved",
    "closed",
    "invoiced",
  ].includes((status || "").toLowerCase());
}

function isOpen(status: string | null) {
  return !isCompleted(status);
}

function downloadCsv(
  filename: string,
  rows: string[][]
) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const escaped = String(value ?? "")
            .replace(/"/g, '""');

          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [range, setRange] =
    useState<DateRange>("30");

  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadReports = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        let query = supabase
          .from("work_orders")
          .select(
            `
              id,
              work_order_number,
              property_id,
              property_name,
              service_category,
              service,
              status,
              priority,
              requested_date,
              pricing_total,
              is_estimate,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        const startDate =
          getStartDate(range);

        if (startDate) {
          query = query.gte(
            "created_at",
            startDate
          );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          console.error(
            "REPORTS LOAD ERROR:",
            error
          );

          throw new Error(
            error.message ||
              "Unable to load reports."
          );
        }

        const normalized =
          (data || []).map((row) => ({
            ...row,
            pricing_total:
              row.pricing_total === null
                ? 0
                : Number(row.pricing_total),
          }));

        setWorkOrders(
          normalized as WorkOrder[]
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load reports."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = useMemo<ReportSummary>(() => {
    const totalRevenue =
      workOrders.reduce(
        (total, order) =>
          total +
          Number(order.pricing_total || 0),
        0
      );

    const completedOrders =
      workOrders.filter((order) =>
        isCompleted(order.status)
      );

    const completedRevenue =
      completedOrders.reduce(
        (total, order) =>
          total +
          Number(order.pricing_total || 0),
        0
      );

    const estimatedRevenue =
      workOrders
        .filter(
          (order) =>
            order.is_estimate
        )
        .reduce(
          (total, order) =>
            total +
            Number(
              order.pricing_total || 0
            ),
          0
        );

    const openWorkOrders =
      workOrders.filter((order) =>
        isOpen(order.status)
      );

    return {
      totalRevenue,
      completedRevenue,
      estimatedRevenue,
      totalWorkOrders:
        workOrders.length,
      completedWorkOrders:
        completedOrders.length,
      openWorkOrders:
        openWorkOrders.length,
      averageJobValue:
        workOrders.length
          ? totalRevenue /
            workOrders.length
          : 0,
    };
  }, [workOrders]);

  const propertyReport =
    useMemo<GroupedReport[]>(() => {
      const map =
        new Map<
          string,
          GroupedReport
        >();

      for (const order of workOrders) {
        const name =
          order.property_name ||
          "Unknown Property";

        const existing =
          map.get(name);

        if (existing) {
          existing.count += 1;

          existing.revenue +=
            Number(
              order.pricing_total || 0
            );
        } else {
          map.set(name, {
            name,
            count: 1,
            revenue:
              Number(
                order.pricing_total || 0
              ),
          });
        }
      }

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.revenue - a.revenue
      );
    }, [workOrders]);

  const serviceReport =
    useMemo<GroupedReport[]>(() => {
      const map =
        new Map<
          string,
          GroupedReport
        >();

      for (const order of workOrders) {
        const name =
          order.service ||
          order.service_category ||
          "Unknown Service";

        const existing =
          map.get(name);

        if (existing) {
          existing.count += 1;

          existing.revenue +=
            Number(
              order.pricing_total || 0
            );
        } else {
          map.set(name, {
            name,
            count: 1,
            revenue:
              Number(
                order.pricing_total || 0
              ),
          });
        }
      }

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.revenue - a.revenue
      );
    }, [workOrders]);

  const statusReport =
    useMemo<GroupedReport[]>(() => {
      const map =
        new Map<
          string,
          GroupedReport
        >();

      for (const order of workOrders) {
        const name =
          formatServiceName(
            order.status ||
              "unknown"
          );

        const existing =
          map.get(name);

        if (existing) {
          existing.count += 1;

          existing.revenue +=
            Number(
              order.pricing_total || 0
            );
        } else {
          map.set(name, {
            name,
            count: 1,
            revenue:
              Number(
                order.pricing_total || 0
              ),
          });
        }
      }

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.count - a.count
      );
    }, [workOrders]);

  function exportWorkOrders() {
    const rows = [
      [
        "Work Order",
        "Property",
        "Service",
        "Status",
        "Priority",
        "Requested Date",
        "Amount",
        "Estimate",
        "Created",
      ],
      ...workOrders.map(
        (order) => [
          order.work_order_number ||
            order.id,
          order.property_name ||
            "",
          order.service ||
            order.service_category ||
            "",
          order.status || "",
          order.priority || "",
          order.requested_date ||
            "",
          Number(
            order.pricing_total || 0
          ).toFixed(2),
          order.is_estimate
            ? "Yes"
            : "No",
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleDateString()
            : "",
        ]
      ),
    ];

    downloadCsv(
      `elite-work-orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      rows
    );
  }

  function exportPropertyReport() {
    const rows = [
      [
        "Property",
        "Work Orders",
        "Revenue",
      ],
      ...propertyReport.map(
        (item) => [
          item.name,
          String(item.count),
          item.revenue.toFixed(2),
        ]
      ),
    ];

    downloadCsv(
      `elite-property-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      rows
    );
  }

  const maxPropertyRevenue =
    propertyReport.length
      ? Math.max(
          ...propertyReport.map(
            (item) =>
              item.revenue
          )
        )
      : 0;

  const maxServiceRevenue =
    serviceReport.length
      ? Math.max(
          ...serviceReport.map(
            (item) =>
              item.revenue
          )
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>

              <div>

                <p className="text-sm font-medium text-blue-600">
                  Elite Apartment Services
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  Reports
                </h1>

              </div>

            </div>

            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Monitor work orders, revenue,
              properties, services, and
              operational performance.
            </p>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <select
              value={range}
              onChange={(event) =>
                setRange(
                  event.target
                    .value as DateRange
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="7">
                Last 7 Days
              </option>

              <option value="30">
                Last 30 Days
              </option>

              <option value="90">
                Last 90 Days
              </option>

              <option value="365">
                Last 12 Months
              </option>

              <option value="all">
                All Time
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                loadReports(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={exportWorkOrders}
              disabled={
                loading ||
                workOrders.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

          </div>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="text-sm font-bold text-red-900">
              Reports Could Not Be Loaded
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>

          </div>
        )}

        {/* KPI CARDS */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            title="Total Revenue"
            value={formatCurrency(
              summary.totalRevenue
            )}
            subtitle="All work orders in range"
            icon={DollarSign}
            color="blue"
            loading={loading}
          />

          <MetricCard
            title="Completed Revenue"
            value={formatCurrency(
              summary.completedRevenue
            )}
            subtitle={`${formatNumber(
              summary.completedWorkOrders
            )} completed jobs`}
            icon={CheckCircle2}
            color="green"
            loading={loading}
          />

          <MetricCard
            title="Work Orders"
            value={formatNumber(
              summary.totalWorkOrders
            )}
            subtitle={`${formatNumber(
              summary.openWorkOrders
            )} currently open`}
            icon={ClipboardList}
            color="purple"
            loading={loading}
          />

          <MetricCard
            title="Average Job Value"
            value={formatCurrency(
              summary.averageJobValue
            )}
            subtitle="Average work order"
            icon={TrendingUp}
            color="amber"
            loading={loading}
          />

        </div>

        {/* SECONDARY METRICS */}

        <div className="mt-5 grid gap-5 md:grid-cols-3">

          <SmallMetric
            icon={Building2}
            label="Properties Served"
            value={propertyReport.length}
          />

          <SmallMetric
            icon={Wrench}
            label="Service Types"
            value={serviceReport.length}
          />

          <SmallMetric
            icon={FileText}
            label="Estimated Revenue"
            value={formatCurrency(
              summary.estimatedRevenue
            )}
          />

        </div>

        {/* PROPERTY REPORT */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Building2 className="h-4 w-4 text-blue-700" />
                </div>

                <div>

                  <h2 className="font-semibold text-slate-950">
                    Revenue by Property
                  </h2>

                  <p className="text-xs text-slate-500">
                    Highest revenue properties
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  exportPropertyReport
                }
                disabled={
                  propertyReport.length ===
                  0
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>

            </div>

            <div className="p-6">

              {loading ? (
                <LoadingRows />
              ) : propertyReport.length ===
                0 ? (
                <EmptyReport />
              ) : (
                <div className="space-y-5">

                  {propertyReport
                    .slice(0, 10)
                    .map((item) => {
                      const width =
                        maxPropertyRevenue >
                        0
                          ? (item.revenue /
                              maxPropertyRevenue) *
                            100
                          : 0;

                      return (
                        <div
                          key={item.name}
                        >

                          <div className="flex items-center justify-between gap-4">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-900">
                                {item.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {formatNumber(
                                  item.count
                                )}{" "}
                                work order
                                {item.count !==
                                1
                                  ? "s"
                                  : ""}
                              </p>

                            </div>

                            <p className="shrink-0 text-sm font-bold text-slate-950">
                              {formatCurrency(
                                item.revenue
                              )}
                            </p>

                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${width}%`,
                              }}
                            />

                          </div>

                        </div>
                      );
                    })}

                </div>
              )}

            </div>

          </section>

          {/* SERVICE REPORT */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                  <Wrench className="h-4 w-4 text-purple-700" />
                </div>

                <div>

                  <h2 className="font-semibold text-slate-950">
                    Revenue by Service
                  </h2>

                  <p className="text-xs text-slate-500">
                    Services generating the most revenue
                  </p>

                </div>

              </div>

            </div>

            <div className="p-6">

              {loading ? (
                <LoadingRows />
              ) : serviceReport.length ===
                0 ? (
                <EmptyReport />
              ) : (
                <div className="space-y-5">

                  {serviceReport
                    .slice(0, 10)
                    .map((item) => {
                      const width =
                        maxServiceRevenue >
                        0
                          ? (item.revenue /
                              maxServiceRevenue) *
                            100
                          : 0;

                      return (
                        <div
                          key={item.name}
                        >

                          <div className="flex items-center justify-between gap-4">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-900">
                                {formatServiceName(
                                  item.name
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                {formatNumber(
                                  item.count
                                )}{" "}
                                work order
                                {item.count !==
                                1
                                  ? "s"
                                  : ""}
                              </p>

                            </div>

                            <p className="shrink-0 text-sm font-bold text-slate-950">
                              {formatCurrency(
                                item.revenue
                              )}
                            </p>

                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-purple-600"
                              style={{
                                width: `${width}%`,
                              }}
                            />

                          </div>

                        </div>
                      );
                    })}

                </div>
              )}

            </div>

          </section>

        </div>

        {/* STATUS */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <ClipboardList className="h-4 w-4 text-green-700" />
              </div>

              <div>

                <h2 className="font-semibold text-slate-950">
                  Work Order Status
                </h2>

                <p className="text-xs text-slate-500">
                  Current distribution of jobs
                </p>

              </div>

            </div>

          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

            {statusReport.map(
              (item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >

                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatNumber(
                      item.count
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatCurrency(
                      item.revenue
                    )}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* RECENT WORK ORDERS */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <CalendarDays className="h-4 w-4 text-amber-700" />
              </div>

              <div>

                <h2 className="font-semibold text-slate-950">
                  Recent Work Orders
                </h2>

                <p className="text-xs text-slate-500">
                  Latest activity in the selected period
                </p>

              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            {loading ? (
              <div className="p-10 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : workOrders.length ===
              0 ? (
              <EmptyReport />
            ) : (
              <table className="w-full min-w-[800px]">

                <thead className="bg-slate-50">

                  <tr className="border-b border-slate-200">

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Work Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Property
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Service
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {workOrders
                    .slice(0, 15)
                    .map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <p className="text-sm font-semibold text-slate-900">
                            {order.work_order_number ||
                              order.id.slice(
                                0,
                                8
                              )}
                          </p>

                          <p className="text-xs text-slate-500">
                            {order.created_at
                              ? new Date(
                                  order.created_at
                                ).toLocaleDateString()
                              : "—"}
                          </p>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {order.property_name ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {formatServiceName(
                            order.service ||
                              order.service_category ||
                              "—"
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {formatServiceName(
                              order.status ||
                                "Unknown"
                            )}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                          {formatCurrency(
                            Number(
                              order.pricing_total ||
                                0
                            )
                          )}
                        </td>

                      </tr>
                    ))}

                </tbody>

              </table>
            )}

          </div>

        </section>

      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof DollarSign;
  color:
    | "blue"
    | "green"
    | "purple"
    | "amber";
  loading: boolean;
}) {
  const colors = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
    },
    green: {
      icon: "bg-green-100 text-green-700",
    },
    purple: {
      icon: "bg-purple-100 text-purple-700",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color].icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>

      </div>

    </div>
  );
}

function SmallMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>

      <div>

        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-xl font-bold text-slate-950">
          {value}
        </p>

      </div>

    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-5">

      {[1, 2, 3, 4].map(
        (item) => (
          <div key={item}>

            <div className="flex justify-between">

              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />

              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />

            </div>

            <div className="mt-2 h-2 animate-pulse rounded-full bg-slate-100" />

          </div>
        )
      )}

    </div>
  );
}

function EmptyReport() {
  return (
    <div className="py-12 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <FileText className="h-5 w-5 text-slate-400" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">
        No report data
      </p>

      <p className="mt-1 text-xs text-slate-500">
        There are no work orders in the selected period.
      </p>

    </div>
  );
}