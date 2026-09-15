import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProfileRole =
| "customer"
| "worker"
| "contractor"
| "admin";

export default async function AuthRedirectPage() {
const supabase = await createClient();

const {
data: { user },
error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
redirect("/login");
}

const { data: profile, error: profileError } =
await supabase
.from("profiles")
.select("role, active")
.eq("id", user.id)
.maybeSingle();

if (profileError) {
console.error(
"PROFILE ROLE LOOKUP ERROR:",
profileError
);

redirect(
  "/login?error=profile_lookup_failed"
);


}

if (!profile) {
/*
* A Google user may be authenticating for the
* first time and not have a profile yet.
*
* Send them to account setup instead of giving
* them elevated access.
*/
redirect("/signup");
}

if (profile.active === false) {
redirect(
"/login?error=account_inactive"
);
}

const role =
profile.role as ProfileRole;

switch (role) {
case "admin":
redirect("/dashboard");

case "worker":
  redirect("/worker");

case "contractor":
  redirect("/contractor");

case "customer":
  redirect("/customer");

default:
  redirect(
    "/login?error=unknown_role"
  );


}
}