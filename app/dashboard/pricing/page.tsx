import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Settings,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PricingItem = {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: string;
  unit: string | null;
  price: number;
  active: boolean;
  sort_order: number;
};

type PricingCategory = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

type PriceList = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  effective_date: string;
};

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: priceListsData, error: priceListsError } =
    await supabase
      .from("price_lists")
      .select(
        "id, name, description, active, effective_date"
      )
      .order("name");

  const { data: categoriesData, error: categoriesError } =
    await supabase
      .from("pricing_categories")
      .select(
        "id, name, sort_order, active"
      )
      .order("sort_order");

  const { data: itemsData, error: itemsError } =
    await supabase
      .from("pricing_items")
      .select(
        "id, name, abbreviation, description, pricing_type, unit, price, active, sort_order"
      )
      .order("sort_order");

  const priceLists =
    (priceListsData ?? []) as PriceList[];

  const categories =
    (categoriesData ?? []) as PricingCategory[];

  const items =
    (itemsData ?? []) as PricingItem[];

  const error =
    priceListsError ||
    categoriesError ||
    itemsError;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <p className="mt-6 text-sm font-semibold text-blue-600">
              Elite Apartment Services
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Pricing
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage make-ready, painting, sheetrock,
              cleaning, resurfacing, tile, and other
              service pricing.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/pricing/categories"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              Categories
            </Link>

            <Link
              href="/dashboard/pricing/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Pricing
            </Link>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              Unable to load pricing.
            </p>

            <p className="mt-1">
              {error.message}
            </p>
          </div>
        )}

        {/* PRICE LISTS */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Price Lists
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pricing schedules used by Elite Apartment Services.
            </p>
          </div>

          {priceLists.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-slate-900">
                No price lists found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Run the pricing migration to load the
                company's initial price lists.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {priceLists.map((priceList) => {
                const count = items.filter(
                  (item) =>
                    item.active
                ).length;

                return (
                  <div
                    key={priceList.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {priceList.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {priceList.description ||
                            "No description."}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          priceList.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {priceList.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-sm text-slate-500">
                        {count} active pricing items
                      </span>

                      <Link
                        href={`/dashboard/pricing/${priceList.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View pricing →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SUMMARY */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Price Lists
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {priceLists.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Categories
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pricing Items
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {items.length}
            </p>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Pricing Categories
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The categories used to organize company services.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No categories found.
            </div>
          ) : (
            <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      {category.name}
                    </span>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        category.active
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENT / ALL ITEMS */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Pricing Items
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Services and rates currently stored in the pricing database.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No pricing items found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.slice(0, 50).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">
                        {item.name}
                      </p>

                      {item.abbreviation && (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {item.abbreviation}
                        </span>
                      )}

                      {!item.active && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-bold text-slate-900">
                      {item.pricing_type === "per_sq_ft"
                        ? `$${Number(item.price).toFixed(2)} / sq ft`
                        : `$${Number(item.price).toFixed(2)}`}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {item.pricing_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 50 && (
            <div className="border-t border-slate-100 px-6 py-4 text-center text-sm text-slate-500">
              Showing the first 50 pricing items.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}