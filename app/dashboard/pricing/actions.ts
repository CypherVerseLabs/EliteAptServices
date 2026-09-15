"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const PRICING_TYPES = [
  "flat",
  "per_sq_ft",
  "per_wall",
  "per_room",
  "per_unit",
  "per_item",
  "per_area",
  "per_estimate",
] as const;

function pricingRedirect(
  message: string,
  priceListId?: string
): never {
  const params = new URLSearchParams();

  params.set("error", message);

  if (priceListId) {
    params.set("price_list", priceListId);
  }

  redirect(`/dashboard/pricing?${params.toString()}`);
}

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return {
    supabase,
    user,
  };
}

function getString(
  formData: FormData,
  key: string
) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(
  formData: FormData,
  key: string
) {
  const value = getString(formData, key);

  return value || null;
}

function getNumber(
  formData: FormData,
  key: string
) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

export async function createPricingItem(
  formData: FormData
) {
  const { supabase } = await requireUser();

  const priceListId = getString(
    formData,
    "price_list_id"
  );

  const categoryId = getString(
    formData,
    "category_id"
  );

  const name = getString(formData, "name");

  const abbreviation =
    getNullableString(
      formData,
      "abbreviation"
    );

  const description =
    getNullableString(
      formData,
      "description"
    );

  const pricingType = getString(
    formData,
    "pricing_type"
  );

  const unit =
    getNullableString(
      formData,
      "unit"
    );

  const price = getNumber(
    formData,
    "price"
  );

  const minimumQuantity = getNumber(
    formData,
    "minimum_quantity"
  );

  const maximumQuantity = getNumber(
    formData,
    "maximum_quantity"
  );

  const sortOrder =
    getNumber(
      formData,
      "sort_order"
    ) ?? 0;

  const active =
    formData.get("active") === "on";

  if (!priceListId) {
    pricingRedirect(
      "Price list is required."
    );
  }

  if (!categoryId) {
    pricingRedirect(
      "Category is required.",
      priceListId
    );
  }

  if (!name) {
    pricingRedirect(
      "Pricing item name is required.",
      priceListId
    );
  }

  if (
    !PRICING_TYPES.includes(
      pricingType as (typeof PRICING_TYPES)[number]
    )
  ) {
    pricingRedirect(
      "Invalid pricing type.",
      priceListId
    );
  }

  if (
    price === null ||
    price < 0
  ) {
    pricingRedirect(
      "Price must be zero or greater.",
      priceListId
    );
  }

  if (
    minimumQuantity !== null &&
    minimumQuantity < 0
  ) {
    pricingRedirect(
      "Minimum quantity cannot be negative.",
      priceListId
    );
  }

  if (
    maximumQuantity !== null &&
    maximumQuantity < 0
  ) {
    pricingRedirect(
      "Maximum quantity cannot be negative.",
      priceListId
    );
  }

  if (
    minimumQuantity !== null &&
    maximumQuantity !== null &&
    minimumQuantity > maximumQuantity
  ) {
    pricingRedirect(
      "Minimum quantity cannot be greater than maximum quantity.",
      priceListId
    );
  }

  const { data: priceList } =
    await supabase
      .from("price_lists")
      .select("id")
      .eq("id", priceListId)
      .maybeSingle();

  if (!priceList) {
    pricingRedirect(
      "The selected price list does not exist."
    );
  }

  const { data: category } =
    await supabase
      .from("pricing_categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();

  if (!category) {
    pricingRedirect(
      "The selected category does not exist.",
      priceListId
    );
  }

  const { data: duplicateName } =
    await supabase
      .from("pricing_items")
      .select("id")
      .eq("price_list_id", priceListId)
      .eq("category_id", categoryId)
      .ilike("name", name)
      .maybeSingle();

  if (duplicateName) {
    pricingRedirect(
      "A pricing item with that name already exists in this category.",
      priceListId
    );
  }

  if (abbreviation) {
    const { data: duplicateAbbreviation } =
      await supabase
        .from("pricing_items")
        .select("id")
        .eq("price_list_id", priceListId)
        .ilike("abbreviation", abbreviation)
        .maybeSingle();

    if (duplicateAbbreviation) {
      pricingRedirect(
        "That abbreviation is already in use in this price list.",
        priceListId
      );
    }
  }

  const { error } =
    await supabase
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
        active,
        sort_order: Math.round(sortOrder),
      });

  if (error) {
    console.error(
      "Create pricing item error:",
      error
    );

    pricingRedirect(
      error.message,
      priceListId
    );
  }

  redirect(
    `/dashboard/pricing?price_list=${encodeURIComponent(
      priceListId
    )}&success=${encodeURIComponent(
      "Pricing item created successfully."
    )}`
  );
}

export async function updatePricingItem(
  formData: FormData
) {
  const { supabase } = await requireUser();

  const id = getString(
    formData,
    "id"
  );

  const priceListId = getString(
    formData,
    "price_list_id"
  );

  const categoryId = getString(
    formData,
    "category_id"
  );

  const name = getString(
    formData,
    "name"
  );

  const abbreviation =
    getNullableString(
      formData,
      "abbreviation"
    );

  const description =
    getNullableString(
      formData,
      "description"
    );

  const pricingType = getString(
    formData,
    "pricing_type"
  );

  const unit =
    getNullableString(
      formData,
      "unit"
    );

  const price = getNumber(
    formData,
    "price"
  );

  const minimumQuantity =
    getNumber(
      formData,
      "minimum_quantity"
    );

  const maximumQuantity =
    getNumber(
      formData,
      "maximum_quantity"
    );

  const sortOrder =
    getNumber(
      formData,
      "sort_order"
    ) ?? 0;

  const active =
    formData.get("active") === "on";

  if (!id) {
    pricingRedirect(
      "Pricing item ID is required.",
      priceListId
    );
  }

  if (!priceListId) {
    pricingRedirect(
      "Price list is required."
    );
  }

  if (!categoryId) {
    pricingRedirect(
      "Category is required.",
      priceListId
    );
  }

  if (!name) {
    pricingRedirect(
      "Pricing item name is required.",
      priceListId
    );
  }

  if (
    !PRICING_TYPES.includes(
      pricingType as (typeof PRICING_TYPES)[number]
    )
  ) {
    pricingRedirect(
      "Invalid pricing type.",
      priceListId
    );
  }

  if (
    price === null ||
    price < 0
  ) {
    pricingRedirect(
      "Price must be zero or greater.",
      priceListId
    );
  }

  if (
    minimumQuantity !== null &&
    minimumQuantity < 0
  ) {
    pricingRedirect(
      "Minimum quantity cannot be negative.",
      priceListId
    );
  }

  if (
    maximumQuantity !== null &&
    maximumQuantity < 0
  ) {
    pricingRedirect(
      "Maximum quantity cannot be negative.",
      priceListId
    );
  }

  if (
    minimumQuantity !== null &&
    maximumQuantity !== null &&
    minimumQuantity > maximumQuantity
  ) {
    pricingRedirect(
      "Minimum quantity cannot be greater than maximum quantity.",
      priceListId
    );
  }

  const { data: existingItem } =
    await supabase
      .from("pricing_items")
      .select("id, price_list_id")
      .eq("id", id)
      .maybeSingle();

  if (!existingItem) {
    pricingRedirect(
      "Pricing item not found.",
      priceListId
    );
  }

  if (
    existingItem.price_list_id !==
    priceListId
  ) {
    pricingRedirect(
      "Invalid price list.",
      priceListId
    );
  }

  const { data: duplicateName } =
    await supabase
      .from("pricing_items")
      .select("id")
      .eq("price_list_id", priceListId)
      .eq("category_id", categoryId)
      .ilike("name", name)
      .neq("id", id)
      .maybeSingle();

  if (duplicateName) {
    pricingRedirect(
      "A pricing item with that name already exists in this category.",
      priceListId
    );
  }

  if (abbreviation) {
    const { data: duplicateAbbreviation } =
      await supabase
        .from("pricing_items")
        .select("id")
        .eq("price_list_id", priceListId)
        .ilike(
          "abbreviation",
          abbreviation
        )
        .neq("id", id)
        .maybeSingle();

    if (duplicateAbbreviation) {
      pricingRedirect(
        "That abbreviation is already in use in this price list.",
        priceListId
      );
    }
  }

  const { error } =
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
        sort_order: Math.round(sortOrder),
      })
      .eq("id", id);

  if (error) {
    console.error(
      "Update pricing item error:",
      error
    );

    pricingRedirect(
      error.message,
      priceListId
    );
  }

  redirect(
    `/dashboard/pricing?price_list=${encodeURIComponent(
      priceListId
    )}&success=${encodeURIComponent(
      "Pricing item updated successfully."
    )}`
  );
}

export async function togglePricingItem(
  formData: FormData
) {
  const { supabase } =
    await requireUser();

  const id = getString(
    formData,
    "id"
  );

  const priceListId =
    getString(
      formData,
      "price_list_id"
    );

  if (!id) {
    pricingRedirect(
      "Pricing item ID is required.",
      priceListId
    );
  }

  const { data: item } =
    await supabase
      .from("pricing_items")
      .select(
        "id, active, price_list_id"
      )
      .eq("id", id)
      .maybeSingle();

  if (!item) {
    pricingRedirect(
      "Pricing item not found.",
      priceListId
    );
  }

  const { error } =
    await supabase
      .from("pricing_items")
      .update({
        active: !item.active,
      })
      .eq("id", id);

  if (error) {
    console.error(
      "Toggle pricing item error:",
      error
    );

    pricingRedirect(
      error.message,
      priceListId
    );
  }

  redirect(
    `/dashboard/pricing?price_list=${encodeURIComponent(
      priceListId
    )}&success=${encodeURIComponent(
      item.active
        ? "Pricing item deactivated."
        : "Pricing item activated."
    )}`
  );
}