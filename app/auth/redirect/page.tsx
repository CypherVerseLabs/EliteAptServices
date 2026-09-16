import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProfileRole =
  | "owner"
  | "field_manager"
  | "office"
  | "apartment_company"
  | "worker"
  | "contractor";

export default async function AuthRedirectPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("PROFILE ROLE LOOKUP ERROR:", profileError);
    redirect("/login?error=profile_lookup_failed");
  }

  if (!profile) {
    redirect("/signup");
  }

  if (profile.active === false) {
    redirect("/login?error=account_inactive");
  }

  const role = profile.role as ProfileRole;

  switch (role) {
    case "owner":
    case "field_manager":
    case "office":
      redirect("/dashboard");

    case "worker":
      redirect("/worker");

    case "contractor":
      redirect("/contractor");

    case "apartment_company":
      redirect("/customer");

    default:
      redirect("/login?error=unknown_role");
  }
}
