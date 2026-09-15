"use client";

import Link from "next/link";
import {
ArrowLeft,
CheckCircle2,
Mail,
MessageSquare,
Phone,
} from "lucide-react";

export default function CustomerMessagesPage() {
return (
<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
<Link href="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950" >
<ArrowLeft className="h-4 w-4" />
Customer Home
</Link>

  <div className="mt-6">
    <p className="text-sm font-semibold text-blue-600">
      Customer Portal
    </p>

    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
      Messages & Support
    </h1>

    <p className="mt-2 text-slate-500">
      Contact Elite Apartment Services about your service
      requests or scheduled work.
    </p>
  </div>

  <div className="mt-8 grid gap-6 md:grid-cols-2">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
        <MessageSquare className="h-6 w-6 text-blue-600" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        Customer Support
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Need help with a request? Open your service request
        to review its current status and details.
      </p>

      <Link
        href="/customer/requests"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <MessageSquare className="h-4 w-4" />
        View My Requests
      </Link>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        Need Service?
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Submit a new service request with the property,
        unit, requested date, priority, and work description.
      </p>

      <Link
        href="/customer/request"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Request Service
      </Link>
    </section>
  </div>

  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <Mail className="h-5 w-5 text-purple-600" />

      <div>
        <h2 className="font-semibold text-slate-950">
          Contact Information
        </h2>

        <p className="text-sm text-slate-500">
          Use the contact information provided by Elite
          Apartment Services for direct support.
        </p>
      </div>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-slate-500" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              Contact Elite Apartment Services
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-slate-500" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Phone
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              Contact your service representative
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
    <div className="flex items-start gap-3">
      <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

      <div>
        <h2 className="font-semibold text-blue-950">
          Messaging is coming soon
        </h2>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          The customer portal is ready for a future
          two-way messaging system. For now, use your service
          request details and your established Elite Apartment
          Services contact method for support.
        </p>
      </div>
    </div>
  </div>
</div>


);
}