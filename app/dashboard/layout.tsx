import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Paintbrush,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Work Orders", href: "/dashboard/work-orders", icon: ClipboardList },
  { name: "Jobs", href: "/dashboard/jobs", icon: Wrench },
  { name: "Properties", href: "/dashboard/properties", icon: Building2 },
  { name: "Contractors", href: "/dashboard/contractors", icon: Users },
  { name: "Customers", href: "/dashboard/customers", icon: Home },
  { name: "Pricing", href: "/dashboard/pricing", icon: DollarSign },
  { name: "Paperwork", href: "/dashboard/paperwork", icon: FileText },
  { name: "Payroll", href: "/dashboard/payroll", icon: DollarSign },
  { name: "Reports", href: "/dashboard/reports", icon: Paintbrush },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) redirect("/login?error=profile_lookup_failed");
  if (profile.active === false) redirect("/login?error=account_inactive");

  const staffRoles = new Set(["owner", "field_manager", "office"]);
  if (!staffRoles.has(profile.role)) redirect("/auth/redirect");

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-slate-950 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">E</div>
            <div>
              <p className="font-bold text-white">ELITE</p>
              <p className="text-xs text-slate-400">Apartment Services</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-800 p-4">
            <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              <Settings className="h-5 w-5" /> Settings
            </Link>
            <Link href="/login" className="mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              <LogOut className="h-5 w-5" /> Sign out
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <div>
              <p className="text-sm text-slate-500">Elite Apartment Services</p>
              <h2 className="text-lg font-semibold text-slate-900">Management Portal</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">O</div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
