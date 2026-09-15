import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    priceListId?: string;
    error?: string;
  }>;
};

type PriceList = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

export default async function NewPricingPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;

  const supabase = await createClient();

  const { data: priceListsData } =
    await supabase
      .from("price_lists")
      .select("id, name")
      .eq("active", true)
      .order("name");

  const { data: categoriesData } =
    await supabase
      .from("pricing_categories")
      .select("id, name")
      .eq("active", true)
      .order("sort_order");

  const priceLists =
    (priceListsData ?? []) as PriceList[];

  const categories =
    (categoriesData ?? []) as Category[];

  async function createPricing(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const priceListId = String(
      formData.get("price_list_id") ?? ""
    );

    const categoryId = String(
      formData.get("category_id") ?? ""
    );

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const abbreviation =
      String(
        formData.get("abbreviation") ?? ""
      ).trim() || null;

    const description =
      String(
        formData.get("description") ?? ""
      ).trim() || null;

    const pricingType = String(
      formData.get("pricing_type") ?? "flat"
    );

    const unit =
      String(formData.get("unit") ?? "").trim() ||
      null;

    const price = Number(
      formData.get("price") ?? 0
    );

    const minimumQuantityValue = String(
      formData.get("minimum_quantity") ?? ""
    ).trim();

    const maximumQuantityValue = String(
      formData.get("maximum_quantity") ?? ""
    ).trim();

    const minimumQuantity =
      minimumQuantityValue
        ? Number(minimumQuantityValue)
        : null;

    const maximumQuantity =
      maximumQuantityValue
        ? Number(maximumQuantityValue)
        : null;

    if (
      !priceListId ||
      !categoryId ||
      !name
    ) {
      redirect(
        `/dashboard/pricing/new?priceListId=${encodeURIComponent(
          priceListId
        )}&error=${encodeURIComponent(
          "Price list, category, and service name are required."
        )}`
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      redirect(
        `/dashboard/pricing/new?priceListId=${encodeURIComponent(
          priceListId
        )}&error=${encodeURIComponent(
          "Price must be a valid number."
        )}`
      );
    }

    const { error } = await supabase
      .from("pricing_items")
      .insert({
        price_list_id: priceListId,
        category_id: categoryId,
        name,
        abbreviation,
        description,
        pricing_type: pricingType,
        unit,
        price,
        minimum_quantity: minimumQuantity,
        maximum_quantity: maximumQuantity,
        active: true,
      });

    if (error) {
      redirect(
        `/dashboard/pricing/new?priceListId=${encodeURIComponent(
          priceListId
        )}&error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(
      `/dashboard/pricing/${priceListId}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">

        <Link
          href={
            query.priceListId
              ? `/dashboard/pricing/${query.priceListId}`
              : "/dashboard/pricing"
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pricing
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Pricing
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Add Pricing
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Add a service and its company pricing.
          </p>
        </div>

        {query.error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error}
          </div>
        )}

        <form
          action={createPricing}
          className="mt-8 space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6">

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Price List
                </label>

                <select
                  name="price_list_id"
                  required
                  defaultValue={
                    query.priceListId ?? ""
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">
                    Select price list
                  </option>

                  {priceLists.map((list) => (
                    <option
                      key={list.id}
                      value={list.id}
                    >
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Category
                </label>

                <select
                  name="category_id"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Service Name
                </label>

                <input
                  name="name"
                  required
                  placeholder="Example: Full Paint Walls"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Company Abbreviation
                </label>

                <input
                  name="abbreviation"
                  placeholder="Example: FPW"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Use the abbreviation exactly as Elite uses it on work orders.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Pricing Type
                  </label>

                  <select
                    name="pricing_type"
                    defaultValue="flat"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="flat">
                      Flat
                    </option>

                    <option value="per_sq_ft">
                      Per Square Foot
                    </option>

                    <option value="per_wall">
                      Per Wall
                    </option>

                    <option value="per_room">
                      Per Room
                    </option>

                    <option value="per_unit">
                      Per Unit
                    </option>

                    <option value="per_item">
                      Per Item
                    </option>

                    <option value="per_area">
                      Per Area
                    </option>

                    <option value="per_estimate">
                      Per Estimate
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Unit
                  </label>

                  <input
                    name="unit"
                    placeholder="sq ft, wall, room, each..."
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Price
                </label>

                <div className="relative mt-2">
                  <span className="absolute left-4 top-3 text-sm text-slate-400">
                    $
                  </span>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-slate-300 px-8 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Minimum Quantity
                  </label>

                  <input
                    name="minimum_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Maximum Quantity
                  </label>

                  <input
                    name="maximum_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </div>
              </div>

            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={
                query.priceListId
                  ? `/dashboard/pricing/${query.priceListId}`
                  : "/dashboard/pricing"
              }
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Pricing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}