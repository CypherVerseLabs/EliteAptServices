import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return fail("Authentication required.", 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, active, apartment_company_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) return fail(profileError.message, 500);
  if (!profile?.active || profile.role !== "apartment_company" || !profile.apartment_company_id) return fail("Customer access required.", 403);

  const [requestsResult, propertiesResult, unitsResult, servicesResult] = await Promise.all([
    supabase.from("work_orders").select("id, work_order_number, title, service_category, status, requested_date, created_at").eq("requested_by", profile.id).order("created_at", { ascending: false }),
    supabase.from("properties").select("id, name, address, city, state, zip").eq("apartment_company_id", profile.apartment_company_id).order("name", { ascending: true }),
    supabase.from("units").select("id, property_id, unit_number").order("unit_number", { ascending: true }),
    supabase.from("service_types").select("id, name, category, active").eq("active", true).order("name", { ascending: true }),
  ]);

  const failed = [requestsResult, propertiesResult, unitsResult, servicesResult].find((item) => item.error);
  if (failed?.error) return fail(failed.error.message, 500);

  const propertyIds = (propertiesResult.data ?? []).map((property) => property.id);
  const filteredUnits = (unitsResult.data ?? []).filter((unit) => propertyIds.includes(unit.property_id));

  return NextResponse.json({ requests: requestsResult.data ?? [], properties: propertiesResult.data ?? [], units: filteredUnits, services: servicesResult.data ?? [] });
}
