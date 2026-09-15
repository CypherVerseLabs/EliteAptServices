
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Chrome, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
const supabase = createClient();

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [googleLoading, setGoogleLoading] =
useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function handleSignup(
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

  const { data, error } =
    await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          requested_role: "customer",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

  if (error) {
    throw new Error(error.message);
  }

  if (data.session) {
    /*
     * Email confirmation may be disabled.
     * If a session exists, continue immediately.
     */
    window.location.assign(
      "/auth/redirect"
    );
    return;
  }

  setMessage(
    "Account created. Check your email to confirm your account before signing in."
  );
} catch (error) {
  console.error(
    "SIGNUP ERROR:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Unable to create your account."
  );
} finally {
  setLoading(false);
}


}

async function handleGoogleSignup() {
setGoogleLoading(true);
setError("");

try {
  const { error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

  if (error) {
    throw new Error(error.message);
  }
} catch (error) {
  console.error(
    "GOOGLE SIGNUP ERROR:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Unable to continue with Google."
  );

  setGoogleLoading(false);
}


}

const busy =
loading || googleLoading;

return (
<main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
<div className="w-full max-w-md">

    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
        E
      </div>

      <h1 className="text-3xl font-bold text-white">
        Create your account
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        Join Elite Apartment Services
      </p>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Chrome className="h-5 w-5" />
        )}

        {googleLoading
          ? "Connecting..."
          : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />

        <span className="text-xs uppercase tracking-wide text-slate-500">
          Or
        </span>

        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <form
        onSubmit={handleSignup}
        className="space-y-5"
      >

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Full name
          </label>

          <input
            id="name"
            required
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="At least 8 characters"
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
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}

          {loading
            ? "Creating account..."
            : "Create customer account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-400 hover:text-blue-300"
        >
          Sign in
        </Link>
      </div>
    </div>

    <div className="mt-6 text-center">
      <Link
        href="/"
        className="text-sm text-slate-600 hover:text-slate-400"
      >
        ← Back to Elite Apartment Services
      </Link>
    </div>
  </div>
</main>


);
}