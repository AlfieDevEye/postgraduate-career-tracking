"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

export default function TestDbPage() {
  const [results, setResults] = useState<Record<string, unknown[]>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTables() {
      const { data: auth, error: authError } = await supabase.auth.getSession();
      if (authError || !auth.session?.access_token) {
        setError("Sign in with an active administrator account to use this developer utility.");
        setLoading(false);
        return;
      }
      try {
        const access = await fetch("/api/admin/access", { headers: { Authorization: `Bearer ${auth.session.access_token}` }, cache: "no-store" });
        if (!access.ok) {
          setError("Administrator access is required to inspect database samples.");
          setLoading(false);
          return;
        }
      } catch {
        setError("Administrator access could not be verified. Database samples were not loaded.");
        setLoading(false);
        return;
      }
      const tables = ["student_profiles", "student_academic_records", "student_career_preferences", "student_skills", "employment_history", "employment_updates", "professional_experiences", "employment_statuses"];
      const output: Record<string, unknown[]> = {};
      for (const table of tables) {
        const { data, error: tableError } = await supabase.from(table).select("*").limit(1);
        if (tableError) { setError(`${table}: ${tableError.message}`); setLoading(false); return; }
        output[table] = data ?? [];
      }
      setResults(output);
      setLoading(false);
    }
    void loadTables();
  }, []);

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Home</Link></InstitutionHeader>
    <div className="page-wrap py-9 sm:py-12">
      <p className="section-kicker">Developer utility</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122b55]">Database connection check</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">This page checks a sample row from the existing registration-related tables.</p>
      {error && <div role="alert" className="status-panel mt-6" data-tone="error">{error}</div>}
      {loading && <div role="status" className="surface-card mt-6 p-5 text-sm text-slate-600">Checking the database tables…</div>}
      {!loading && !error && Object.keys(results).length === 0 && <div className="surface-card mt-6 p-5 text-sm text-slate-600">No table results are available.</div>}
      <div className="mt-7 grid gap-4 xl:grid-cols-2">
        {Object.entries(results).map(([table, rows]) => <section key={table} className="surface-card min-w-0 overflow-hidden p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold text-[#122b55]">{table.replaceAll("_", " ")}</h2><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800">Connected</span></div>
          <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-[#f5f8fb] p-4 text-[11px] leading-5 text-slate-700">{JSON.stringify(rows, null, 2)}</pre>
        </section>)}
      </div>
    </div>
    <SiteFooter />
  </main>;
}
