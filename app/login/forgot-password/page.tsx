"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
const supabase = createClient();

const [email, setEmail] = useState("");
const [loading, setLoading] = useState(false);
const [sent, setSent] = useState(false);
const [error, setError] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setLoading(true);
setError("");
setSent(false);

try {
  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  setSent(true);
} catch (error) {
  console.error("PASSWORD RESET ERROR:", error);

  setError(
    error instanceof Error
      ? error.message
      : "Unable to send password reset email."
  );
} finally {
  setLoading(false);
}


}

return (
<main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
<div className="w-full max-w-md">

    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
        E
      </div>

      <h1 className="text-3xl font-bold text-white">
        Reset your password
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        We'll send you a secure password reset link.
      </p>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

      {sent ? (
        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-400" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Check your email
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            If an account exists for{" "}
            <span className="font-semibold text-white">
              {email}
            </span>
            , we've sent instructions to reset the password.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500"
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Forgot your password?
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter the email address associated with your account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
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
                ? "Sending..."
                : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </div>

    <Link
      href="/login"
      className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-300"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to login
    </Link>
  </div>
</main>


);
}