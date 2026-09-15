import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    priceListId: string;
  }>;
};

type PriceList = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  effective_date: string;
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
};

type PricingItem = {
  id: string;
  category_id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: string;
  unit: string | null;
  price: number;
  active: boolean;
  sort_order: number;
};

export default async function PriceListPage({
  params,
}: PageProps) {
  const { priceListId } = await params;

  const supabase = await createClient();

  const {
    data: priceListData,
    error: priceListError,
  } = await supabase
    .from("price_lists")
    .select(
      "id, name, description, active, effective_date"
    )
    .eq("id", priceListId)
    .maybeSingle();

  if (priceListError || !priceListData) {
    notFound();
  }

  const priceList = priceListData as PriceList;

  const {
    data: categoriesData,
  } = await supabase
    .from("pricing_categories")
    .select(
      "id, name, sort_order"
    )
    .eq("active", true)
    .order("sort_order");

  const categories =
    (categoriesData ?? []) as Category[];

  const {
    data: itemsData,
    error: itemsError,
  } = await supabase
    .from("pricing_items")
    .select(`
      id,
      category_id,
      name,
      abbreviation,
      description,
      pricing_type,
      unit,
      price,
      active,
      sort_order
    `)
    .eq("price_list_id", priceListId)
    .order("sort_order");

  const items =
    (itemsData ?? []) as PricingItem[];

  const groupedCategories = categories
    .map((category) => ({
      category,
      items: items.filter(
        (item) =>
          item.category_id === category.id
      ),
    }))
    .filter(
      (group) => group.items.length > 0
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pricing
            </Link>

            <p className="mt-6 text-sm font-semibold text-blue-600">
              Price List
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {priceList.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {priceList.description}
            </p>
          </div>

          <Link
            href={`/dashboard/pricing/new?priceListId=${priceListId}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Pricing
          </Link>
        </div>

        {itemsError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {itemsError.message}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pricing Items
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {
                items.filter(
                  (item) => item.active
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Categories Used
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {groupedCategories.length}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {groupedCategories.map(
            ({ category, items: categoryItems }) => (
              <section
                key={category.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                  <h2 className="font-semibold text-slate-900">
                    {category.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {categoryItems.length} pricing item
                    {categoryItems.length === 1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-800">
                            {item.name}
                          </h3>

                          {item.abbreviation && (
                            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                              {item.abbreviation}
                            </span>
                          )}

                          {!item.active && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                              Inactive
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          {item.pricing_type}
                          {item.unit
                            ? ` · ${item.unit}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            ${Number(item.price).toFixed(2)}
                          </p>

                          {item.pricing_type ===
                            "per_sq_ft" && (
                            <p className="text-xs text-slate-400">
                              per sq ft
                            </p>
                          )}

                          {item.pricing_type ===
                            "per_wall" && (
                            <p className="text-xs text-slate-400">
                              per wall
                            </p>
                          )}

                          {item.pricing_type ===
                            "per_room" && (
                            <p className="text-xs text-slate-400">
                              per room
                            </p>
                          )}
                        </div>

                        <Link
                          href={`/dashboard/pricing/${priceListId}/edit/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          )}
        </div>

        {items.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <h2 className="font-semibold text-slate-900">
              No pricing items
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add the first service to this price list.
            </p>

            <Link
              href={`/dashboard/pricing/new?priceListId=${priceListId}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Pricing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}