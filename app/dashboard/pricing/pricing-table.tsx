"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Calculator,
  X,
} from "lucide-react";

type PricingItem = {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: string;
  unit: string | null;
  price: number | string;
  active: boolean;
  sort_order: number;
  category_id: string;
  price_list_id: string;
};

type PricingCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

type PriceList = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  effective_date: string;
};

type PricingTableProps = {
  priceLists: PriceList[];
  categories: PricingCategory[];
  items: PricingItem[];
};

const pricingTypeLabels: Record<string, string> = {
  flat: "Flat",
  per_sq_ft: "Per Sq. Ft.",
  per_wall: "Per Wall",
  per_room: "Per Room",
  per_unit: "Per Unit",
  per_item: "Per Item",
  per_area: "Per Area",
  per_estimate: "Per Estimate",
};

function formatPrice(price: number | string) {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return "$0.00";
  }

  return numericPrice.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPricingType(type: string) {
  return pricingTypeLabels[type] ?? type;
}

function getCalculationLabel(pricingType: string) {
  switch (pricingType) {
    case "per_sq_ft":
      return "Square Feet";

    case "per_wall":
      return "Walls";

    case "per_room":
      return "Rooms";

    case "per_unit":
      return "Units";

    case "per_item":
      return "Items";

    case "per_area":
      return "Areas";

    case "per_estimate":
      return "Estimate";

    default:
      return "Quantity";
  }
}

function calculatePrice(
  item: PricingItem,
  quantity: number
) {
  const basePrice = Number(item.price);

  if (!Number.isFinite(basePrice)) {
    return 0;
  }

  if (item.pricing_type === "flat") {
    return basePrice;
  }

  if (item.pricing_type === "per_estimate") {
    return quantity;
  }

  return basePrice * quantity;
}

export default function PricingTable({
  priceLists,
  categories,
  items,
}: PricingTableProps) {
  const [selectedPriceList, setSelectedPriceList] =
    useState(priceLists[0]?.id ?? "");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [search, setSearch] = useState("");

  const [showInactive, setShowInactive] =
    useState(false);

  const [expandedCategories, setExpandedCategories] =
    useState<Record<string, boolean>>({});

  const [calculatorItem, setCalculatorItem] =
    useState<PricingItem | null>(null);

  const [quantity, setQuantity] =
    useState("1");

  const selectedItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return items.filter((item) => {
      if (
        selectedPriceList &&
        item.price_list_id !== selectedPriceList
      ) {
        return false;
      }

      if (
        selectedCategory !== "all" &&
        item.category_id !== selectedCategory
      ) {
        return false;
      }

      if (!showInactive && !item.active) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        item.name
          .toLowerCase()
          .includes(searchTerm) ||
        item.abbreviation
          ?.toLowerCase()
          .includes(searchTerm) ||
        item.description
          ?.toLowerCase()
          .includes(searchTerm)
      );
    });
  }, [
    items,
    selectedPriceList,
    selectedCategory,
    search,
    showInactive,
  ]);

  const visibleCategories = useMemo(() => {
    const categoryIds = new Set(
      selectedItems.map(
        (item) => item.category_id
      )
    );

    return categories
      .filter((category) =>
        categoryIds.has(category.id)
      )
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order ||
          a.name.localeCompare(b.name)
      );
  }, [categories, selectedItems]);

  const calculatedTotal = useMemo(() => {
    if (!calculatorItem) {
      return 0;
    }

    const numericQuantity =
      Number(quantity);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity < 0
    ) {
      return 0;
    }

    return calculatePrice(
      calculatorItem,
      numericQuantity
    );
  }, [calculatorItem, quantity]);

  function toggleCategory(
    categoryId: string
  ) {
    setExpandedCategories((current) => ({
      ...current,
      [categoryId]:
        !(current[categoryId] ?? true),
    }));
  }

  function getCategoryItems(
    categoryId: string
  ) {
    return selectedItems
      .filter(
        (item) =>
          item.category_id === categoryId
      )
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order ||
          a.name.localeCompare(b.name)
      );
  }

  function openCalculator(
    item: PricingItem
  ) {
    setCalculatorItem(item);

    if (item.pricing_type === "flat") {
      setQuantity("1");
      return;
    }

    setQuantity("1");
  }

  function closeCalculator() {
    setCalculatorItem(null);
    setQuantity("1");
  }

  const selectedList = priceLists.find(
    (list) => list.id === selectedPriceList
  );

  return (
    <div className="space-y-6">
      {/* PRICE LIST SELECTOR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="price-list"
              className="block text-sm font-semibold text-slate-700"
            >
              Price List
            </label>

            <div className="relative mt-2">
              <select
                id="price-list"
                value={selectedPriceList}
                onChange={(event) => {
                  setSelectedPriceList(
                    event.target.value
                  );
                  setSelectedCategory("all");
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                {priceLists.map((priceList) => (
                  <option
                    key={priceList.id}
                    value={priceList.id}
                  >
                    {priceList.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {selectedList?.description && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedList.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calculator className="h-4 w-4" />

            <span>
              {selectedItems.length}{" "}
              {selectedItems.length === 1
                ? "pricing item"
                : "pricing items"}
            </span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
          <div>
            <label
              htmlFor="pricing-search"
              className="block text-sm font-semibold text-slate-700"
            >
              Search Pricing
            </label>

            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="pricing-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search service or abbreviation..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="pricing-category"
              className="block text-sm font-semibold text-slate-700"
            >
              Category
            </label>

            <div className="relative mt-2">
              <select
                id="pricing-category"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="all">
                  All Categories
                </option>

                {categories
                  .slice()
                  .sort(
                    (a, b) =>
                      a.sort_order -
                        b.sort_order ||
                      a.name.localeCompare(
                        b.name
                      )
                  )
                  .map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) =>
                setShowInactive(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span className="text-sm font-medium text-slate-700">
              Show inactive
            </span>
          </label>
        </div>
      </div>

      {/* EMPTY STATE */}
      {visibleCategories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-5 w-5 text-slate-400" />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No pricing found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try changing the price list,
            category, or search term.
          </p>
        </div>
      )}

      {/* CATEGORY GROUPS */}
      <div className="space-y-4">
        {visibleCategories.map(
          (category) => {
            const categoryItems =
              getCategoryItems(category.id);

            const isExpanded =
              expandedCategories[
                category.id
              ] ?? true;

            return (
              <section
                key={category.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleCategory(
                      category.id
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold text-slate-900">
                        {category.name}
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {categoryItems.length}{" "}
                        {categoryItems.length ===
                        1
                          ? "item"
                          : "items"}
                      </p>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Service
                          </th>

                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Abbreviation
                          </th>

                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Pricing
                          </th>

                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Unit
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Rate
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {categoryItems.map(
                          (item) => (
                            <tr
                              key={item.id}
                              className={`transition hover:bg-slate-50 ${
                                !item.active
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {item.name}
                                  </p>

                                  {item.description && (
                                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                                      {
                                        item.description
                                      }
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                {item.abbreviation ? (
                                  <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                                    {
                                      item.abbreviation
                                    }
                                  </span>
                                ) : (
                                  <span className="text-sm text-slate-300">
                                    —
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  {formatPricingType(
                                    item.pricing_type
                                  )}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {item.unit ||
                                  "—"}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />

                                  {formatPrice(
                                    item.price
                                  ).replace(
                                    "$",
                                    ""
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4 text-right">
                                {item.active ? (
                                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                    Inactive
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCalculator(
                                      item
                                    )
                                  }
                                  disabled={
                                    !item.active
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  <Calculator className="h-3.5 w-3.5" />
                                  Calculate
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          }
        )}
      </div>

      {/* CALCULATOR */}
      {calculatorItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Pricing Calculator
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {calculatorItem.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatPricingType(
                    calculatorItem.pricing_type
                  )}
                  {" · "}
                  {formatPrice(
                    calculatorItem.price
                  )}
                  {calculatorItem.pricing_type !==
                    "flat" &&
                    calculatorItem.pricing_type !==
                      "per_estimate"
                    ? ` / ${
                        calculatorItem.unit ||
                        getCalculationLabel(
                          calculatorItem.pricing_type
                        )
                      }`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCalculator}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close calculator"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="calculation-quantity"
                  className="block text-sm font-semibold text-slate-700"
                >
                  {getCalculationLabel(
                    calculatorItem.pricing_type
                  )}
                </label>

                {calculatorItem.pricing_type ===
                  "per_sq_ft" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the unit or work area square footage.
                  </p>
                )}

                <div className="relative mt-2">
                  <input
                    id="calculation-quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        event.target.value
                      )
                    }
                    disabled={
                      calculatorItem.pricing_type ===
                      "flat"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-500"
                  />

                  {calculatorItem.unit && (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                      {calculatorItem.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* CALCULATION BREAKDOWN */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Rate
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatPrice(
                      calculatorItem.price
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {getCalculationLabel(
                      calculatorItem.pricing_type
                    )}
                  </span>

                  <span className="font-semibold text-slate-900">
                    {calculatorItem.pricing_type ===
                    "flat"
                      ? "1"
                      : quantity || "0"}
                  </span>
                </div>

                <div className="my-4 border-t border-slate-200" />

                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-600">
                    Calculated Total
                  </span>

                  <span className="text-3xl font-bold text-emerald-600">
                    {formatPrice(
                      calculatedTotal
                    )}
                  </span>
                </div>
              </div>

              {calculatorItem.pricing_type ===
                "per_sq_ft" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    SQ FT Calculation
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-900">
                    {formatPrice(
                      calculatorItem.price
                    )} ×{" "}
                    {quantity || "0"} sq ft ={" "}
                    <strong>
                      {formatPrice(
                        calculatedTotal
                      )}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeCalculator}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={closeCalculator}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Use This Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
