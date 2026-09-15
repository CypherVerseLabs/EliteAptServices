"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestSupabasePage() {
  const [result, setResult] = useState("Testing...");

  useEffect(() => {
    async function test() {
      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("SESSION:", session);
      console.log("SESSION ERROR:", sessionError);

      if (!session) {
        setResult("NO SESSION");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("USER:", user);
      console.log("USER ERROR:", userError);

      if (!user) {
        setResult("NO USER");
        return;
      }

      /*
       * This request actually goes through PostgREST/RLS.
       *
       * If RLS sees the JWT, auth.uid() should equal user.id.
       */
      const { data, error } = await supabase
        .from("work_orders")
        .select("id")
        .limit(1);

      console.log("DATABASE TEST DATA:", data);
      console.log("DATABASE TEST ERROR:", error);

      setResult(
        JSON.stringify(
          {
            sessionUserId: session.user.id,
            getUserId: user.id,
            databaseData: data,
            databaseError: error,
          },
          null,
          2
        )
      );
    }

    test();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">
          Supabase Authentication Test
        </h1>

        <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-slate-900 p-6 text-sm">
          {result}
        </pre>
      </div>
    </main>
  );
}