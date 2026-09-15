"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
ClipboardList,
Home,
LogOut,
PlusCircle,
User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
{
name: "Home",
href: "/customer",
icon: Home,
},
{
name: "New Request",
href: "/customer/request",
icon: PlusCircle,
},
{
name: "My Requests",
href: "/customer/requests",
icon: ClipboardList,
},
{
name: "Profile",
href: "/customer/profile",
icon: User,
},
];

export default function CustomerLayout({
children,
}: {
children: React.ReactNode;
}) {
const pathname = usePathname();
const supabase = createClient();

async function handleLogout() {
await supabase.auth.signOut();
window.location.assign("/login");
}

return (
<div className="min-h-screen bg-slate-50">
<header className="border-b border-slate-200 bg-white">
<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
<Link href="/customer" className="flex items-center gap-3" >
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
E
</div>

        <div>
          <p className="font-bold text-slate-950">
            Elite Apartment Services
          </p>

          <p className="text-xs text-slate-500">
            Customer Portal
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">
          Sign Out
        </span>
      </button>
    </div>
  </header>

  <div className="border-b border-slate-200 bg-white">
    <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
      {navigation.map((item) => {
        const Icon = item.icon;

        const active =
          pathname === item.href ||
          (item.href !== "/customer" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              active
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  </div>

  <main>{children}</main>
</div>


);
}