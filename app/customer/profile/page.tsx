"use client";

import Link from "next/link";
import {
ArrowLeft,
Mail,
Save,
User,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function CustomerProfilePage() {
const [email, setEmail] = useState("");
const [fullName, setFullName] = useState("");
const [phone, setPhone] = useState("");

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

useEffect(() => {
async function loadProfile() {
try {
const {
data: { user },
} = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/login");
      return;
    }

    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    }
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to load your profile."
    );
  } finally {
    setLoading(false);
  }
}

loadProfile();


}, []);

async function handleSave(
event: FormEvent<HTMLFormElement>
) {
event.preventDefault();

setSaving(true);
setMessage("");
setError("");

try {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const { error: updateError } =
    await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
      })
      .eq("id", user.id);

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  setMessage(
    "Your profile has been updated."
  );
} catch (err) {
  console.error(err);

  setError(
    err instanceof Error
      ? err.message
      : "Unable to save your profile."
  );
} finally {
  setSaving(false);
}


}

if (loading) {
return (
<div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
Loading profile...
</div>
);
}

return (
<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
<Link href="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" >
<ArrowLeft className="h-4 w-4" />
Customer Home
</Link>

  <div className="mt-6">
    <p className="text-sm font-semibold text-blue-600">
      Customer Portal
    </p>

    <h1 className="mt-1 text-3xl font-bold text-slate-950">
      My Profile
    </h1>

    <p className="mt-2 text-slate-500">
      Keep your contact information up to date.
    </p>
  </div>

  {message && (
    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
      {message}
    </div>
  )}

  {error && (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  )}

  <form
    onSubmit={handleSave}
    className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
  >
    <div className="grid gap-5">
      <div>
        <label
          htmlFor="full_name"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Full Name
        </label>

        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            id="full_name"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            placeholder="Your full name"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Email
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            id="email"
            value={email}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500"
          />
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Email is managed by your account login.
        </p>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Phone
        </label>

        <input
          id="phone"
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value)
          }
          type="tel"
          placeholder="(210) 555-1234"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />
      </div>
    </div>

    <div className="mt-8 flex justify-end">
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-4 w-4" />

        {saving
          ? "Saving..."
          : "Save Profile"}
      </button>
    </div>
  </form>
</div>


);
}