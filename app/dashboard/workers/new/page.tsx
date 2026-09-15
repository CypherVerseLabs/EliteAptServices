"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function NewWorkerPage() {
const supabase = createClient();

const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [phone, setPhone] = useState("");
const [email, setEmail] = useState("");

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setError("");
setSuccess("");

const trimmedFirstName = firstName.trim();
const trimmedLastName = lastName.trim();
const trimmedPhone = phone.trim();
const trimmedEmail = email.trim().toLowerCase();

if (!trimmedFirstName || !trimmedLastName) {
  setError("First name and last name are required.");
  return;
}

setLoading(true);

const { error: insertError } = await supabase
  .from("profiles")
  .insert({
    first_name: trimmedFirstName,
    last_name: trimmedLastName,
    phone: trimmedPhone || null,
    email: trimmedEmail || null,
    role: "worker",
    active: true,
  });

if (insertError) {
  console.error("Worker creation error:", insertError);
  setError(insertError.message);
  setLoading(false);
  return;
}

setSuccess("Worker added successfully.");

setFirstName("");
setLastName("");
setPhone("");
setEmail("");

setLoading(false);


}

return (
<div className="min-h-screen bg-slate-50 p-6 lg:p-8">
<div className="mx-auto max-w-3xl">

    {/* HEADER */}
    <div className="mb-8">
      <Link
        href="/dashboard/workers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workers
      </Link>

      <div className="mt-6">
        <p className="text-sm font-semibold text-blue-600">
          Team
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Add Worker
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Add a field worker to Elite Apartment Services.
        </p>
      </div>
    </div>

    {/* FORM */}
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
          <UserPlus className="h-5 w-5 text-blue-600" />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Worker Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the worker's basic contact information.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            Could not add worker
          </p>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            {success}
          </p>

          <Link
            href="/dashboard/workers"
            className="mt-2 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
          >
            View Workers →
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">

        {/* FIRST NAME */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-semibold text-slate-700"
          >
            First Name
            <span className="text-red-500"> *</span>
          </label>

          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="John"
            autoComplete="given-name"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        {/* LAST NAME */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-semibold text-slate-700"
          >
            Last Name
            <span className="text-red-500"> *</span>
          </label>

          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Smith"
            autoComplete="family-name"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        {/* PHONE */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-slate-700"
          >
            Phone
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(555) 123-4567"
            autoComplete="tel"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="john@example.com"
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {/* ROLE */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-700">
          Role
        </label>

        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Field Worker
          </p>

          <p className="mt-1 text-xs text-slate-500">
            This worker will be available for job assignments.
          </p>
        </div>
      </div>

      {/* ACTIVE */}
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />

          <div>
            <p className="text-sm font-semibold text-green-800">
              Worker will be active
            </p>

            <p className="mt-1 text-xs text-green-700">
              The worker can be assigned jobs immediately after creation.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/workers"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding Worker...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Add Worker
            </>
          )}
        </button>
      </div>
    </form>

    {/* INFO */}
    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <p className="text-sm font-semibold text-blue-900">
        Demo workflow
      </p>

      <p className="mt-1 text-sm leading-6 text-blue-800">
        Workers added here are stored in the profiles table with the
        worker role and active status. Once jobs and assignments are
        connected, these workers can be assigned to jobs from the Jobs
        section.
      </p>
    </div>
  </div>
</div>


);
}