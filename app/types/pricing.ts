export type PricingType =
  | "flat"
  | "per_sq_ft"
  | "per_wall"
  | "per_room"
  | "per_unit"
  | "per_item"
  | "per_area"
  | "per_estimate";

export type PriceList = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
};

export type PricingCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PricingItem = {
  id: string;
  price_list_id: string;
  category_id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: PricingType;
  unit: string | null;
  price: number;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PricingItemWithCategory = PricingItem & {
  category: PricingCategory;
};

export type PricingItemWithRelations = PricingItem & {
  category: PricingCategory;
  price_list: PriceList;
};