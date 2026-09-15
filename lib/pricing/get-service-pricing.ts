import { createClient } from "@/lib/supabase/server";

export type ServicePricing = {
  id: string;
  apartment_company_id: string;
  service_category: string;
  pricing_type: string;
  price: number;
  active: boolean;
};

const APARTMENT_COMPANY_ID =
  "1e879c9a-2220-434c-91ce-eb4c28a5a477";

export async function getServicePricing(
  serviceCategory: string
): Promise<ServicePricing | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_pricing")
    .select(
      `
        id,
        apartment_company_id,
        service_category,
        pricing_type,
        price,
        active
      `
    )
    .eq(
      "apartment_company_id",
      APARTMENT_COMPANY_ID
    )
    .eq(
      "service_category",
      serviceCategory
    )
    .eq("active", true)
    .limit(1);

  if (error) {
    console.error(
      "SERVICE PRICING LOOKUP ERROR:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to load service pricing."
    );
  }

  const pricing = data?.[0];

  if (!pricing) {
    return null;
  }

  return {
    ...pricing,
    price: Number(pricing.price) || 0,
  };
}
