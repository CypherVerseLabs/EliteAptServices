"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
const supabase = createClient();

const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function handleSubmit(
event: FormEvent<HTMLFormElement>
) {
event.preventDefault();

setLoading(true);
setError("");
setMessage("");

try {
  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters."
    );
  }

  if (password !== confirmPassword) {
    throw new Error(
      "Passwords do not match."
    );
  }

  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  setMessage(
    "Your password has been updated successfully."
  );

  setPassword("");
  setConfirmPassword("");

  setTimeout(() => {
    window.location.assign("/login");
  }, 1500);
} catch (err) {
  console.error(
    "RESET PASSWORD ERROR:",
    err
  );

  setError(
    err instanceof Error
      ? err.message
      : "Unable to update your password."
  );
} finally {
  setLoading(false);
}


}

return (
<main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
<div className="w-full max-w-md">

    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
        <LockKeyhole className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-3xl font-bold text-white">
        Reset your password
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        Create a new password for your Elite Apartment Services account.
      </p>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            New password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Confirm new password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            placeholder="Enter your password again"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-900/50 bg-green-950/40 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}

          {loading
            ? "Updating password..."
            : "Update password"}
        </button>

      </form>

      <div className="mt-6 text-center text-sm text-slate-400">
        <Link
          href="/login"
          className="font-semibold text-blue-400 hover:text-blue-300"
        >
          ← Back to sign in
        </Link>
      </div>

    </div>

    <div className="mt-6 text-center">
      <Link
        href="/"
        className="text-sm text-slate-600 hover:text-slate-400"
      >
        Elite Apartment Services
      </Link>
    </div>

  </div>
</main>


);
}