import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = new Set(["owner", "field_manager", "office"]);
function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return fail("Authentication required.", 401);

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, role, active, apartment_company_id").eq("id", authData.user.id).maybeSingle();
  if (profileError) return fail(profileError.message, 500);
  if (!profile?.active) return fail("Account is inactive.", 403);

  const role = String(profile.role).toLowerCase();
  if (!STAFF_ROLES.has(role) && role !== "apartment_company") return fail("You are not authorized to create Work Orders.", 403);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return fail("Request body must be valid JSON."); }

  const propertyId = String(body.property_id ?? "");
  const unitId = body.unit_id ? String(body.unit_id) : null;
  const serviceCategory = String(body.service_category ?? "").trim();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim() || null;
  const priority = String(body.priority ?? "normal").trim();
  const requestedDate = body.requested_date ? String(body.requested_date) : null;
  const dueDate = body.due_date ? String(body.due_date) : null;
  const submissionId = body.submission_id ? String(body.submission_id) : null;
  const requestedBy = role === "apartment_company" ? profile.id : String(body.requested_by ?? profile.id);
  const requestedCompanyId = role === "apartment_company" ? profile.apartment_company_id : String(body.apartment_company_id ?? "");

  if (!propertyId || !serviceCategory || !title) return fail("property_id, service_category, and title are required.");
  if (!requestedCompanyId) return fail("apartment_company_id is required.");
  if (!submissionId) return fail("submission_id is required for duplicate-submission protection.");
  if (role === "apartment_company" && requestedBy !== profile.id) return fail("Customers may only create Work Orders for themselves.", 403);

  const { data: property, error: propertyError } = await supabase.from("properties").select("id, apartment_company_id, name, address, city, state, zip, service_area").eq("id", propertyId).eq("apartment_company_id", requestedCompanyId).maybeSingle();
  if (propertyError) return fail(propertyError.message, 500);
  if (!property) return fail("Property does not belong to the selected Apartment Company.", 403);

  let unit: { id: string; property_id: string; unit_number: string | null; square_feet: number | null; bedrooms: string | null; bathrooms: string | null; occupancy: string | null } | null = null;
  if (unitId) {
    const { data, error } = await supabase.from("units").select("id, property_id, unit_number, square_feet, bedrooms, bathrooms, occupancy").eq("id", unitId).eq("property_id", propertyId).maybeSingle();
    if (error) return fail(error.message, 500);
    if (!data) return fail("Unit does not belong to the selected Property.", 403);
    unit = data;
  }

  const { data: pricing, error: pricingError } = await supabase.from("service_pricing").select("id, pricing_type, price").eq("apartment_company_id", requestedCompanyId).eq("service_category", serviceCategory).eq("active", true).maybeSingle();
  if (pricingError) return fail(pricingError.message, 500);
  if (!pricing) return fail("No active service pricing is configured for this company and service.", 422);

  let quantity = Number(body.pricing_quantity ?? 1);
  if (pricing.pricing_type === "per_sq_ft") {
    if (!unit?.square_feet) return fail("A unit with square footage is required for per-square-foot pricing.", 422);
    quantity = Number(unit.square_feet);
  }
  if (!Number.isFinite(quantity) || quantity <= 0) return fail("pricing_quantity must be greater than zero.");

  const unitPrice = Number(pricing.price);
  const pricingType = pricing.pricing_type;
  const pricingTotal = pricingType === "per_estimate" ? 0 : Number((unitPrice * quantity).toFixed(2));

  const { data: duplicate, error: duplicateError } = await supabase.from("work_orders").select("id, work_order_number, status").eq("submission_id", submissionId).maybeSingle();
  if (duplicateError) return fail(duplicateError.message, 500);
  if (duplicate) return NextResponse.json({ workOrder: duplicate, duplicate: true });

  const { data: workOrder, error: insertError } = await supabase.from("work_orders").insert({
    apartment_company_id: requestedCompanyId,
    property_id: propertyId,
    unit_id: unitId,
    requested_by: requestedBy,
    service_category: serviceCategory,
    service: serviceCategory,
    title,
    description,
    priority,
    requested_date: requestedDate,
    due_date: dueDate,
    status: "submitted",
    property_name: property.name,
    property_address: property.address,
    city: property.city,
    state: property.state,
    zip: property.zip,
    service_area: property.service_area,
    unit_number: unit?.unit_number ?? null,
    square_feet: unit?.square_feet ?? null,
    bedrooms: unit?.bedrooms ?? null,
    bathrooms: unit?.bathrooms ?? null,
    occupancy: unit?.occupancy ?? null,
    pricing_id: pricing.id,
    pricing_type: pricingType,
    unit_price: unitPrice,
    pricing_quantity: quantity,
    pricing_total: pricingTotal,
    is_estimate: pricingType === "per_estimate",
    submission_id: submissionId,
  }).select("id, work_order_number, status, pricing_type, unit_price, pricing_quantity, pricing_total, is_estimate").single();

  if (insertError || !workOrder) return fail(insertError?.message ?? "Unable to create Work Order.", 500);
  return NextResponse.json({ workOrder, duplicate: false }, { status: 201 });
}
