import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = new Set(["owner", "field_manager", "office"]);

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, active").eq("id", authData.user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.active || !STAFF_ROLES.has(String(profile.role))) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  const [companies, properties, services] = await Promise.all([
    supabase.from("apartment_companies").select("id, name").eq("active", true).order("name"),
    supabase.from("properties").select("id, apartment_company_id, name, address, city, state, zip").order("name"),
    supabase.from("service_types").select("id, name, category, active").eq("active", true).order("name"),
  ]);

  const failed = [companies, properties, services].find((result) => result.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  return NextResponse.json({ companies: companies.data ?? [], properties: properties.data ?? [], services: services.data ?? [] });
}
