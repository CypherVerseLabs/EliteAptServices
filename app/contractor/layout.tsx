import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ContractorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active || profile.role !== "contractor") redirect("/auth/redirect");

  return children;
}
