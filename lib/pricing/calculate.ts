export type PricingType =
  | "flat"
  | "per_sq_ft"
  | "per_wall"
  | "per_room"
  | "per_unit"
  | "per_item"
  | "per_area"
  | "per_estimate";

export type PricingCalculationInput = {
  price: number;
  pricingType: PricingType | string;
  quantity?: number | null;
};

export type PricingCalculationResult = {
  quantity: number;
  unitPrice: number;
  total: number;
  isEstimate: boolean;
};

export function calculatePricing({
  price,
  pricingType,
  quantity,
}: PricingCalculationInput): PricingCalculationResult {
  const unitPrice = Number(price) || 0;

  const calculatedQuantity =
    quantity === null || quantity === undefined
      ? 1
      : Math.max(0, Number(quantity) || 0);

  const isEstimate = pricingType === "per_estimate";

  if (isEstimate) {
    return {
      quantity: calculatedQuantity,
      unitPrice,
      total: 0,
      isEstimate: true,
    };
  }

  return {
    quantity: calculatedQuantity,
    unitPrice,
    total: unitPrice * calculatedQuantity,
    isEstimate: false,
  };
}

export function getDefaultQuantity(
  pricingType: PricingType | string,
  squareFeet?: number | null
) {
  switch (pricingType) {
    case "per_sq_ft":
      return Math.max(0, Number(squareFeet) || 0);

    case "per_wall":
    case "per_room":
    case "per_unit":
    case "per_item":
    case "per_area":
    case "flat":
    case "per_estimate":
    default:
      return 1;
  }
}
