"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  DollarSign,
  Loader2,
} from "lucide-react";

import {
  calculatePricing,
  getDefaultQuantity,
} from "@/lib/pricing";

type PricingData = {
  id: string;
  service_category: string;
  pricing_type: string;
  price: number;
  active: boolean;
};

type PricingSectionProps = {
  serviceCategory: string;
  squareFeet: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function PricingSection({
  serviceCategory,
  squareFeet,
}: PricingSectionProps) {
  const [pricing, setPricing] =
    useState<PricingData | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  useEffect(() => {
    if (!serviceCategory) {
      setPricing(null);
      setQuantity(1);
      return;
    }

    let cancelled = false;

    async function loadPricing() {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/pricing/service?service_category=${encodeURIComponent(
              serviceCategory
            )}`
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to load pricing."
          );
        }

        if (cancelled) {
          return;
        }

        const pricingData =
          result.pricing as PricingData | null;

        setPricing(pricingData);

        if (pricingData) {
          setQuantity(
            getDefaultQuantity(
              pricingData.pricing_type,
              squareFeet
            )
          );
        } else {
          setQuantity(1);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load pricing."
        );

        setPricing(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, [serviceCategory, squareFeet]);

  const calculation = useMemo(() => {
    if (!pricing) {
      return null;
    }

    return calculatePricing({
      price: pricing.price,
      pricingType:
        pricing.pricing_type,
      quantity,
    });
  }, [pricing, quantity]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <Calculator className="h-4 w-4 text-emerald-700" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Pricing
            </h2>

            <p className="text-sm text-slate-600">
              Pricing is automatically loaded from the
              service pricing table.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pricing...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Pricing could not be loaded
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          serviceCategory &&
          !pricing && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                No pricing configured
              </p>

              <p className="mt-1 text-sm text-amber-800">
                This service does not currently have a
                pricing rule configured.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          pricing &&
          calculation && (
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pricing Type
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {pricing.pricing_type.replace(
                    /_/g,
                    " "
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit Price
                </p>

                <div className="mt-2 flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-slate-500" />

                  <span className="text-sm font-semibold text-slate-950">
                    {formatCurrency(
                      calculation.unitPrice
                    )}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </p>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.max(
                        0,
                        Number(
                          event.target.value
                        ) || 0
                      )
                    )
                  }
                  disabled={
                    pricing.pricing_type ===
                      "per_sq_ft"
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100"
                />

                {pricing.pricing_type ===
                  "per_sq_ft" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Based on {squareFeet || 0} square
                    feet.
                  </p>
                )}
              </div>

              <div className="md:col-span-3">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-300">
                        Estimated Work Order Total
                      </p>

                      <p className="mt-1 text-3xl font-bold">
                        {calculation.isEstimate
                          ? "Estimate Required"
                          : formatCurrency(
                              calculation.total
                            )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/10 px-4 py-3 text-right">
                      <p className="text-xs text-slate-400">
                        Quantity
                      </p>

                      <p className="text-sm font-semibold">
                        {calculation.quantity}
                      </p>
                    </div>
                  </div>

                  {calculation.isEstimate && (
                    <p className="mt-3 text-sm text-slate-300">
                      This service requires an estimate
                      before a final price can be
                      calculated.
                    </p>
                  )}
                </div>
              </div>

              <input
                type="hidden"
                name="pricing_id"
                value={pricing.id}
              />

              <input
                type="hidden"
                name="pricing_type"
                value={pricing.pricing_type}
              />

              <input
                type="hidden"
                name="unit_price"
                value={calculation.unitPrice}
              />

              <input
                type="hidden"
                name="pricing_quantity"
                value={calculation.quantity}
              />

              <input
                type="hidden"
                name="pricing_total"
                value={calculation.total}
              />

              <input
                type="hidden"
                name="is_estimate"
                value={
                  calculation.isEstimate
                    ? "true"
                    : "false"
                }
              />
            </div>
          )}
      </div>
    </section>
  );
}
