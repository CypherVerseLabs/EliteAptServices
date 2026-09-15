import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    priceListId: string;
    itemId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type PricingItem = {
  id: string;
  price_list_id: string;
  category_id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: string;
  unit: string | null;
  price: number;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  active: boolean;
};

type Category = {
  id: string;
  name: string;
};

const PRICING_TYPES = [
  {
    value: "flat",
    label: "Flat",
  },
  {
    value: "per_sq_ft",
    label: "Per Square Foot",
  },
  {
    value: "per_wall",
    label: "Per Wall",
  },
  {
    value: "per_room",
    label: "Per Room",
  },
  {
    value: "per_unit",
    label: "Per Unit",
  },
  {
    value: "per_item",
    label: "Per Item",
  },
  {
    value: "per_area",
    label: "Per Area",
  },
  {
    value: "per_estimate",
    label: "Per Estimate",
  },
] as const;

export default async function EditPricingPage({
  params,
  searchParams,
}: PageProps) {
  const { priceListId, itemId } =
    await params;

  const query = await searchParams;

  const supabase = await createClient();

  /*
   * Load the pricing item.
   */
  const { data: itemData, error: itemError } =
    await supabase
      .from("pricing_items")
      .select(`
        id,
        price_list_id,
        category_id,
        name,
        abbreviation,
        description,
        pricing_type,
        unit,
        price,
        minimum_quantity,
        maximum_quantity,
        active
      `)
      .eq("id", itemId)
      .eq("price_list_id", priceListId)
      .maybeSingle();

  if (itemError) {
    console.error(
      "Pricing item load error:",
      itemError
    );
  }

  if (!itemData) {
    notFound();
  }

  const item = itemData as PricingItem;

  /*
   * Load active categories.
   */
  const { data: categoriesData, error: categoriesError } =
    await supabase
      .from("pricing_categories")
      .select(`
        id,
        name
      `)
      .eq("active", true)
      .order("sort_order");

  if (categoriesError) {
    console.error(
      "Pricing categories load error:",
      categoriesError
    );
  }

  const categories =
    (categoriesData ?? []) as Category[];

  /*
   * Update pricing item.
   */
  async function updatePricing(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    /*
     * Authentication check.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "You must be signed in."
        )}`
      );
    }

    /*
     * Read form values.
     */
    const categoryId = String(
      formData.get("category_id") ?? ""
    ).trim();

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const abbreviation =
      String(
        formData.get("abbreviation") ?? ""
      )
        .trim()
        .toUpperCase() || null;

    const description =
      String(
        formData.get("description") ?? ""
      ).trim() || null;

    const pricingType = String(
      formData.get("pricing_type") ?? ""
    ).trim();

    const unit =
      String(
        formData.get("unit") ?? ""
      ).trim() || null;

    const priceValue = String(
      formData.get("price") ?? ""
    ).trim();

    const minimumQuantityValue =
      String(
        formData.get("minimum_quantity") ?? ""
      ).trim();

    const maximumQuantityValue =
      String(
        formData.get("maximum_quantity") ?? ""
      ).trim();

    const active =
      formData.get("active") === "on";

    /*
     * Validate price.
     */
    const price = Number(priceValue);

    /*
     * Validate minimum quantity.
     */
    const minimumQuantity =
      minimumQuantityValue === ""
        ? null
        : Number(minimumQuantityValue);

    /*
     * Validate maximum quantity.
     */
    const maximumQuantity =
      maximumQuantityValue === ""
        ? null
        : Number(maximumQuantityValue);

    /*
     * Required fields.
     */
    if (!categoryId || !name) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "Category and service name are required."
        )}`
      );
    }

    /*
     * Validate pricing type.
     */
    const validPricingType =
      PRICING_TYPES.some(
        (type) =>
          type.value === pricingType
      );

    if (!validPricingType) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "Invalid pricing type."
        )}`
      );
    }

    /*
     * Validate price.
     */
    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "Price must be a valid number greater than or equal to zero."
        )}`
      );
    }

    /*
     * Validate minimum quantity.
     */
    if (
      minimumQuantity !== null &&
      (
        !Number.isFinite(
          minimumQuantity
        ) ||
        minimumQuantity < 0
      )
    ) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "Minimum quantity must be a valid number greater than or equal to zero."
        )}`
      );
    }

    /*
     * Validate maximum quantity.
     */
    if (
      maximumQuantity !== null &&
      (
        !Number.isFinite(
          maximumQuantity
        ) ||
        maximumQuantity < 0
      )
    ) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "Maximum quantity must be a valid number greater than or equal to zero."
        )}`
      );
    }

    /*
     * Validate quantity range.
     */
    if (
      minimumQuantity !== null &&
      maximumQuantity !== null &&
      minimumQuantity > maximumQuantity
    ) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "Minimum quantity cannot be greater than maximum quantity."
        )}`
      );
    }

    /*
     * Make sure the selected category exists
     * and is active.
     */
    const { data: category } =
      await supabase
        .from("pricing_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("active", true)
        .maybeSingle();

    if (!category) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "The selected category is not available."
        )}`
      );
    }

    /*
     * Prevent duplicate service names inside
     * the same price list/category.
     *
     * Case-insensitive.
     */
    const {
      data: duplicateName,
      error: duplicateNameError,
    } = await supabase
      .from("pricing_items")
      .select("id")
      .eq("price_list_id", priceListId)
      .eq("category_id", categoryId)
      .ilike("name", name)
      .neq("id", itemId)
      .maybeSingle();

    if (duplicateNameError) {
      console.error(
        "Pricing duplicate name check error:",
        duplicateNameError
      );

      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          duplicateNameError.message
        )}`
      );
    }

    if (duplicateName) {
      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          "A pricing item with this name already exists in this category."
        )}`
      );
    }

    /*
     * Prevent duplicate company abbreviations
     * within the same price list.
     */
    if (abbreviation) {
      const {
        data: duplicateAbbreviation,
        error: abbreviationError,
      } = await supabase
        .from("pricing_items")
        .select("id")
        .eq("price_list_id", priceListId)
        .ilike(
          "abbreviation",
          abbreviation
        )
        .neq("id", itemId)
        .maybeSingle();

      if (abbreviationError) {
        console.error(
          "Pricing abbreviation check error:",
          abbreviationError
        );

        redirect(
          `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
            abbreviationError.message
          )}`
        );
      }

      if (duplicateAbbreviation) {
        redirect(
          `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
            `The company abbreviation "${abbreviation}" is already in use in this price list.`
          )}`
        );
      }
    }

    /*
     * Update ONLY the existing pricing item.
     */
    const { error: updateError } =
      await supabase
        .from("pricing_items")
        .update({
          category_id: categoryId,
          name,
          abbreviation,
          description,
          pricing_type: pricingType,
          unit,
          price,
          minimum_quantity: minimumQuantity,
          maximum_quantity: maximumQuantity,
          active,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", itemId)
        .eq("price_list_id", priceListId);

    if (updateError) {
      console.error(
        "Pricing update error:",
        {
          message:
            updateError.message,
          details:
            updateError.details,
          hint:
            updateError.hint,
          code:
            updateError.code,
        }
      );

      redirect(
        `/dashboard/pricing/${priceListId}/edit/${itemId}?error=${encodeURIComponent(
          updateError.message
        )}`
      );
    }

    /*
     * Return to price list.
     */
    redirect(
      `/dashboard/pricing/${priceListId}`
    );
  }

  const pricingTypeLabel =
    PRICING_TYPES.find(
      (type) =>
        type.value === item.pricing_type
    )?.label ??
    item.pricing_type;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">

        {/* BACK */}
        <Link
          href={`/dashboard/pricing/${priceListId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Price List
        </Link>

        {/* HEADER */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            Pricing
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Edit Pricing
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the service, company abbreviation,
            calculation method, or rate.
          </p>
        </div>

        {/* ERROR */}
        {query.error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error}
          </div>
        )}

        <form
          action={updatePricing}
          className="mt-8 space-y-6"
        >

          {/* BASIC INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Service Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define how this service appears throughout
                the Elite Apartment Services system.
              </p>
            </div>

            <div className="grid gap-6 p-6">

              {/* CATEGORY */}
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Category
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  required
                  defaultValue={
                    item.category_id
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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

              {/* SERVICE NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Service Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={item.name}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* ABBREVIATION */}
              <div>
                <label
                  htmlFor="abbreviation"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Company Abbreviation
                </label>

                <input
                  id="abbreviation"
                  name="abbreviation"
                  type="text"
                  maxLength={30}
                  defaultValue={
                    item.abbreviation ?? ""
                  }
                  placeholder="Example: FPW-CC"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase tracking-wide text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Internal company code used on worksheets,
                  work orders, and technician documentation.
                </p>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={
                    item.description ?? ""
                  }
                  placeholder="Describe what this service includes..."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Pricing Rules
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define how the system calculates the charge.
              </p>
            </div>

            <div className="grid gap-6 p-6">

              {/* TYPE + UNIT */}
              <div className="grid gap-6 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="pricing_type"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Pricing Type
                  </label>

                  <select
                    id="pricing_type"
                    name="pricing_type"
                    required
                    defaultValue={
                      item.pricing_type
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {PRICING_TYPES.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="unit"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Unit
                  </label>

                  <input
                    id="unit"
                    name="unit"
                    type="text"
                    defaultValue={
                      item.unit ?? ""
                    }
                    placeholder="each, sq ft, wall, room..."
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Example: sq ft for painting,
                    each for repairs, or unit for
                    make-ready pricing.
                  </p>
                </div>
              </div>

              {/* PRICE */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Price
                </label>

                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    $
                  </span>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={Number(
                      item.price
                    ).toFixed(2)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-8 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* QUANTITY LIMITS */}
              <div className="grid gap-6 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="minimum_quantity"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Minimum Quantity
                  </label>

                  <input
                    id="minimum_quantity"
                    name="minimum_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      item.minimum_quantity ??
                      ""
                    }
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maximum_quantity"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Maximum Quantity
                  </label>

                  <input
                    id="maximum_quantity"
                    name="maximum_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      item.maximum_quantity ??
                      ""
                    }
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* STATUS */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Status
              </h2>
            </div>

            <div className="p-6">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={
                    item.active
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Active pricing item
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    Active pricing can be selected for
                    work orders, estimates, make-ready
                    jobs, and technician worksheets.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Pricing Preview
                </p>

                <h2 className="mt-1 text-lg font-bold text-blue-950">
                  {item.name}
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  {pricingTypeLabel}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-blue-950">
                  $
                  {Number(
                    item.price
                  ).toFixed(2)}
                </p>

                {item.unit && (
                  <p className="mt-1 text-xs text-blue-600">
                    per {item.unit}
                  </p>
                )}
              </div>
            </div>

            {item.abbreviation && (
              <div className="mt-5 border-t border-blue-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Company Code
                </p>

                <span className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-bold tracking-wide text-blue-700 shadow-sm">
                  {item.abbreviation}
                </span>
              </div>
            )}
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/dashboard/pricing/${priceListId}`}
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
