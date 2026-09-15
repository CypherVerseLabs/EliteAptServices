"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
ArrowRight,
Building2,
CheckCircle2,
Loader2,
LockKeyhole,
Mail,
} from "lucide-react";

export default function LoginPage() {
const supabase = createClient();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);
const [googleLoading, setGoogleLoading] = useState(false);
const [error, setError] = useState("");
const [message, setMessage] = useState("");

/*

READ AUTH CALLBACK ERROR
*/

useEffect(() => {
const params = new URLSearchParams(window.location.search);

const callbackError = params.get("error");
const callbackMessage = params.get("message");

if (callbackError === "auth_callback_failed") {
  setError(
    "Google sign-in could not be completed. Please try again."
  );
}

if (callbackMessage) {
  setError(callbackMessage);
}

}, []);

/*

DETERMINE USER DESTINATION
Your profiles table should contain:
id
role
Supported roles:
customer
worker
contractor
admin
*/

async function redirectUser(userId: string) {
const { data: profile, error: profileError } =
await supabase
.from("profiles")
.select("role")
.eq("id", userId)
.maybeSingle();

if (profileError) {
  console.error(
    "PROFILE LOOKUP ERROR:",
    profileError
  );

  /*
   * If the profile lookup fails, send the user
   * to the main dashboard rather than leaving them
   * stuck on the login page.
   */
  window.location.assign("/dashboard");
  return;
}

const role = String(
  profile?.role || ""
).toLowerCase();

switch (role) {
  case "customer":
    window.location.assign("/customer");
    return;

  case "worker":
    window.location.assign("/worker");
    return;

  case "contractor":
    window.location.assign("/contractor");
    return;

  case "admin":
  case "administrator":
  case "manager":
    window.location.assign("/dashboard");
    return;

  default:
    /*
     * New users without a recognized role go to
     * the customer portal for now.
     *
     * You can change this later.
     */
    window.location.assign("/customer");
    return;
}

}

/*

EMAIL / PASSWORD LOGIN
*/

async function handleLogin(
event: FormEvent<HTMLFormElement>
) {
event.preventDefault();

setLoading(true);
setError("");
setMessage("");

try {
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    throw new Error(
      "Please enter your email address."
    );
  }

  if (!password) {
    throw new Error(
      "Please enter your password."
    );
  }

  const {
    data,
    error: signInError,
  } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (signInError) {
    console.error(
      "LOGIN ERROR:",
      signInError
    );

    throw new Error(
      signInError.message ||
        "Invalid email or password."
    );
  }

  if (!data.user) {
    throw new Error(
      "Login succeeded, but no user was returned."
    );
  }

  /*
   * Confirm Supabase can read the authenticated
   * session immediately after login.
   */
  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "AUTH USER VERIFICATION ERROR:",
      userError
    );

    throw new Error(
      "Login succeeded, but the session could not be verified."
    );
  }

  await redirectUser(user.id);
} catch (error) {
  console.error(
    "LOGIN ERROR:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Unable to sign in."
  );

  setLoading(false);
}

}

/*

GOOGLE LOGIN
*/

async function handleGoogleLogin() {
setGoogleLoading(true);
setError("");
setMessage("");

try {
  const redirectTo =
    `${window.location.origin}/auth/callback`;

  const {
    error: googleError,
  } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (googleError) {
    console.error(
      "GOOGLE LOGIN ERROR:",
      googleError
    );

    throw new Error(
      googleError.message ||
        "Unable to sign in with Google."
    );
  }
} catch (error) {
  console.error(
    "GOOGLE LOGIN ERROR:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Unable to sign in with Google."
  );

  setGoogleLoading(false);
}

}

/*

FORGOT PASSWORD
*/

async function handleForgotPassword() {
setError("");
setMessage("");

const cleanEmail = email.trim();

if (!cleanEmail) {
  setError(
    "Enter your email address first, then select Forgot password."
  );
  return;
}

setLoading(true);

try {
  const redirectTo =
    `${window.location.origin}/reset-password`;

  const {
    error: resetError,
  } = await supabase.auth.resetPasswordForEmail(
    cleanEmail,
    {
      redirectTo,
    }
  );

  if (resetError) {
    throw new Error(
      resetError.message
    );
  }

  setMessage(
    "Password reset instructions have been sent to your email."
  );
} catch (error) {
  console.error(
    "PASSWORD RESET ERROR:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Unable to send password reset instructions."
  );
} finally {
  setLoading(false);
}

}

return (
<main className="min-h-screen bg-slate-950">
<div className="mx-auto flex min-h-screen max-w-7xl">

    {/* LEFT SIDE */}

    <div className="hidden flex-1 flex-col justify-between p-12 lg:flex">

      <div>
        <a
          href="/"
          className="inline-flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="font-bold text-white">
              Elite Apartment Services
            </p>

            <p className="text-xs text-slate-500">
              Service Management Platform
            </p>
          </div>
        </a>
      </div>

      <div className="max-w-xl">

        <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
          Welcome back
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight text-white">
          One portal for your entire service operation.
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-400">
          Manage apartment service requests, work orders,
          workers, contractors, properties, scheduling,
          and reporting from one secure platform.
        </p>

        <div className="mt-8 space-y-4">

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Customer service requests
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Worker and contractor management
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Work orders and automatic pricing
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Business reporting and analytics
          </div>

        </div>

      </div>

      <p className="text-xs text-slate-600">
        © {new Date().getFullYear()} Elite Apartment Services
      </p>

    </div>

    {/* LOGIN SIDE */}

    <div className="flex w-full items-center justify-center px-6 py-10 lg:w-[520px] lg:bg-slate-900 lg:px-12">

      <div className="w-full max-w-md">

        {/* MOBILE BRAND */}

        <div className="mb-8 text-center lg:hidden">

          <a
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>

            <div className="text-left">
              <p className="font-bold text-white">
                Elite Apartment Services
              </p>

              <p className="text-xs text-slate-500">
                Service Management Platform
              </p>
            </div>
          </a>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl lg:border-slate-800">

          <div className="mb-7">

            <p className="text-sm font-semibold text-blue-400">
              Secure Portal
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Sign in
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your Elite Apartment Services account.
            </p>

          </div>

          {/* GOOGLE */}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center text-lg font-bold">
                G
              </span>
            )}

            {googleLoading
              ? "Connecting..."
              : "Continue with Google"}
          </button>

          {/* DIVIDER */}

          <div className="my-6 flex items-center gap-4">

            <div className="h-px flex-1 bg-slate-800" />

            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Or continue with email
            </span>

            <div className="h-px flex-1 bg-slate-800" />

          </div>

          {/* EMAIL FORM */}

          <form
            onSubmit={handleLogin}
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
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

              </div>

            </div>

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  Forgot password?
                </button>

              </div>

              <div className="relative">

                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

              </div>

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
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>

          {/* ACCOUNT TYPES */}

          <div className="mt-7 border-t border-slate-800 pt-6">

            <p className="text-center text-xs text-slate-500">
              Your account determines which portal you see.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">

              <div className="rounded-lg bg-slate-950 px-3 py-2 text-center text-xs text-slate-500">
                Customer
              </div>

              <div className="rounded-lg bg-slate-950 px-3 py-2 text-center text-xs text-slate-500">
                Worker
              </div>

              <div className="rounded-lg bg-slate-950 px-3 py-2 text-center text-xs text-slate-500">
                Contractor
              </div>

              <div className="rounded-lg bg-slate-950 px-3 py-2 text-center text-xs text-slate-500">
                Admin
              </div>

            </div>

          </div>

        </div>

        <div className="mt-6 text-center">

          <a
            href="/"
            className="text-sm text-slate-500 transition hover:text-white"
          >
            ← Back to Elite Apartment Services
          </a>

        </div>

      </div>

    </div>

  </div>
</main>

);
}