"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

type RecordRow = {
  id: string;
  student_id: string;
  tracking_start_date: string;
  tracking_end_date: string;
  next_update_date: string | null;
  is_active: boolean;
  student: { first_name: string; last_name: string; email: string } | null;
};
type Result = Record<string, unknown>;
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800";

export default function AdminRemindersPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [trackingId, setTrackingId] = useState("");
  const [frequency, setFrequency] = useState("3");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [configuredFrequency, setConfiguredFrequency] = useState<number | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const selected = useMemo(() => records.find((record) => record.id === trackingId), [records, trackingId]);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const { data, error: authError } = await supabase.auth.getSession();
    if (authError || !data.session?.access_token) throw new Error("Sign in with an administrator account to continue.");
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}`, ...init?.headers } });
    const payload = await response.json() as Result;
    if (!response.ok) throw new Error(String(payload.error ?? "Request failed"));
    return payload;
  }, []);

  const load = useCallback(async () => {
    setError("");
    setLoadingRecords(true);
    try {
      const [list, settings] = await Promise.all([request("/api/admin/tracking-test"), request("/api/admin/tracking-settings")]);
      const rows = (list.records ?? []) as RecordRow[];
      setRecords(rows);
      setTrackingId((previous) => rows.some((row) => row.id === previous) ? previous : rows[0]?.id ?? "");
      const active = settings.settings as { frequency_months?: number } | null;
      if (active?.frequency_months) { setFrequency(String(active.frequency_months)); setConfiguredFrequency(active.frequency_months); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load admin data."); }
    finally { setLoadingRecords(false); }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(mode: "simulate" | "send") {
    if (!trackingId) { setError("Select a tracking record first."); return; }
    setBusy(true); setError(""); setResult(null);
    try { setResult(await request("/api/admin/tracking-test", { method: "POST", body: JSON.stringify({ trackingId, frequencyMonths: Number(frequency), mode }) })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Test could not run."); }
    finally { setBusy(false); }
  }

  async function saveSettings() {
    setBusy(true); setError(""); setResult(null);
    try {
      const saved = await request("/api/admin/tracking-settings", { method: "PUT", body: JSON.stringify({ frequencyMonths: Number(frequency) }) });
      setResult(saved); setConfiguredFrequency(Number(frequency));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Settings could not be saved."); }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/admin" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Dashboard</Link></InstitutionHeader>
    <div className="page-wrap-narrow py-9 sm:py-12">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="section-kicker">Administrator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122b55] sm:text-4xl">Employment reminders</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Control update intervals and test one selected tracking record. Server routes verify your active administrator account for every action.</p></div>
        <span className="eyebrow-pill !normal-case !tracking-normal">Five-year tracking period</span>
      </div>
      {error && <div role="alert" className="status-panel mb-5" data-tone="error">{error}</div>}
      <section className="surface-card mb-5 p-5 sm:p-7">
        <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 font-bold text-teal-800 ring-1 ring-teal-800/10">01</span><div><h2 className="text-lg font-semibold text-[#122b55]">Tracking schedule</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Changing the interval recalculates the next update date for active, unexpired records from their last update or tracking start date.</p></div></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-slate-700">Reminder interval<select className={`${inputClass} mt-2`} value={frequency} onChange={(event) => setFrequency(event.target.value)}><option value="3">Every 3 months</option><option value="6">Every 6 months</option><option value="9">Every 9 months</option></select></label><button type="button" disabled={busy} onClick={() => void saveSettings()} className="button-primary">{busy ? "Saving…" : "Save interval"}</button></div>
        <p className="mt-3 text-xs text-slate-500">Active database interval: {configuredFrequency ? `${configuredFrequency} months` : "no active settings row"}.</p>
      </section>
      <section className="surface-card p-5 sm:p-7">
        <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 font-bold text-blue-800 ring-1 ring-blue-800/10">02</span><div><h2 className="text-lg font-semibold text-[#122b55]">Immediate single-record test</h2><p className="mt-1 text-sm leading-6 text-slate-600">Choose one active record and evaluate any supported interval without waiting for its due date.</p></div></div>
        <label className="mt-5 block text-sm font-semibold text-slate-700">Student and tracking record<select className={`${inputClass} mt-2`} value={trackingId} onChange={(event) => setTrackingId(event.target.value)}><option value="">Select one active tracking record</option>{records.map((record) => <option key={record.id} value={record.id}>{record.student ? `${record.student.first_name} ${record.student.last_name} — ${record.student.email}` : record.student_id} · next {record.next_update_date ?? "not set"}</option>)}</select></label>
        {loadingRecords ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500" role="status">Loading active tracking records…</p> : records.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">No active tracking records are available to test.</p> : selected && <p className="mt-3 text-xs text-slate-500">Tracking period: {selected.tracking_start_date} to {selected.tracking_end_date}. Test actions do not change its scheduled dates.</p>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={busy || !trackingId || loadingRecords} onClick={() => void run("simulate")} className="button-secondary">{busy ? "Working…" : "Simulate reminder"}</button><button type="button" disabled={busy || !trackingId || loadingRecords} onClick={() => void run("send")} className="button-primary !border-teal-800 !bg-teal-700">Send test email</button></div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Simulation records a test result but sends no email. Email mode targets only this student and reports if delivery is unavailable.</p>
      </section>
      {result && <pre role="status" className="mt-5 overflow-auto rounded-2xl border border-slate-700/30 bg-[#10213c] p-4 text-xs leading-5 text-teal-100 shadow-lg">{JSON.stringify(result, null, 2)}</pre>}
    </div>
    <SiteFooter />
  </main>;
}
