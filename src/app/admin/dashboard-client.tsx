"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

type Count = { label: string; count: number };
type Student = { name: string; email: string | null; degreeType: string; employmentStatus: string; trackingStatus: string };
type DashboardData = {
  metrics: { totalStudents: number; activeTracking: number; upcomingTracking: number; overdueTracking: number; frequencyMonths: number | null };
  degreeCounts: Count[];
  employmentCounts: Count[];
  options: { degrees: string[]; employmentStatuses: string[] };
  students: Student[];
  page: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
};
type Filters = { q: string; degree: string; employmentStatus: string; trackingStatus: string };
const emptyFilters: Filters = { q: "", degree: "", employmentStatus: "", trackingStatus: "" };

function Bars({ title, rows, empty }: { title: string; rows: Count[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <section className="surface-card p-5 sm:p-6"><h2 className="text-base font-semibold text-[#122b55]">{title}</h2>{rows.length ? <ul className="mt-5 space-y-4">{rows.slice(0, 8).map((row) => <li key={row.label}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-700">{row.label}</span><span className="font-semibold tabular-nums text-slate-900">{row.count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${Math.max(4, row.count / max * 100)}%` }} /></div></li>)}</ul> : <p className="mt-5 text-sm text-slate-500">{empty}</p>}</section>;
}

export default function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);

  const load = useCallback(async (selected: Filters, selectedPage: number) => {
    setLoading(true); setError(""); setDenied(false);
    try {
      const { data: auth, error: authError } = await supabase.auth.getSession();
      if (authError || !auth.session?.access_token) { setDenied(true); setError("Sign in with an active administrator account to view this page."); return; }
      const params = new URLSearchParams({ page: String(selectedPage) });
      if (selected.q) params.set("q", selected.q);
      if (selected.degree) params.set("degree", selected.degree);
      if (selected.employmentStatus) params.set("employmentStatus", selected.employmentStatus);
      if (selected.trackingStatus) params.set("trackingStatus", selected.trackingStatus);
      const response = await fetch(`/api/admin/dashboard?${params}`, { headers: { Authorization: `Bearer ${auth.session.access_token}` }, cache: "no-store" });
      const payload = await response.json() as DashboardData & { error?: string };
      if (!response.ok) { setDenied(response.status === 401 || response.status === 403); throw new Error(payload.error ?? "Dashboard request failed."); }
      setData(payload);
    } catch (cause) { setData(null); setError(cause instanceof Error ? cause.message : "Dashboard data could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(emptyFilters, 1); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPage(1); setApplied(filters); await load(filters, 1);
  }

  async function clearFilters() {
    setFilters(emptyFilters); setApplied(emptyFilters); setPage(1); await load(emptyFilters, 1);
  }

  async function goToPage(next: number) {
    setPage(next); await load(applied, next);
  }

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const fieldClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
  const activeLabels = [applied.q && `Search: ${applied.q}`, applied.degree && `Degree: ${applied.degree}`, applied.employmentStatus && `Employment: ${applied.employmentStatus}`, applied.trackingStatus && `Tracking: ${applied.trackingStatus}`].filter(Boolean) as string[];

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader>
      <nav aria-label="Administrator navigation" className="flex items-center gap-2 sm:gap-3">
        <Link href="/admin/reminders" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Reminders</Link>
        <button type="button" disabled={busy} onClick={() => void signOut()} className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Sign out</button>
      </nav>
    </InstitutionHeader>
    <div className="page-wrap py-8 sm:py-11">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-kicker">Administrator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122b55] sm:text-4xl">Career tracking overview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Live summaries and student search from the records currently available to the platform.</p></div><Link href="/admin/reminders" className="button-primary">Manage reminders <span aria-hidden="true">→</span></Link></div>
      {error && <div role="alert" className="status-panel mt-6" data-tone="error"><strong>{denied ? "Access denied" : "Dashboard unavailable"}.</strong> {error}</div>}
      {loading && <p role="status" className="surface-card mt-6 p-4 text-sm text-slate-600">Loading verified dashboard data…</p>}
      {data && <>
        <section aria-label="Platform summary" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Registered students", data.metrics.totalStudents],
            ["Active tracking records", data.metrics.activeTracking],
            ["Follow-ups due in 30 days", data.metrics.upcomingTracking],
            ["Overdue follow-ups", data.metrics.overdueTracking],
            ["Reminder interval", data.metrics.frequencyMonths ? `${data.metrics.frequencyMonths} months` : "Not configured"],
          ].map(([label, value]) => <article key={String(label)} className="surface-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums text-[#122b55]">{value}</p></article>)}
        </section>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><Bars title="Students by recorded degree type" rows={data.degreeCounts} empty="No degree records are available." /><Bars title="Current employment status" rows={data.employmentCounts} empty="No current employment records are available." /></div>
        <section className="surface-card mt-5 p-5 sm:p-6">
          <div><h2 className="text-lg font-semibold text-[#122b55]">Find students</h2><p className="mt-1 text-sm text-slate-600">Search name or email and combine the filters that have verified values.</p></div>
          <form onSubmit={(event) => void search(event)} className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]">
            <label className="text-xs font-semibold text-slate-600">Name or email<input className={`${fieldClass} mt-1`} value={filters.q} maxLength={100} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search students" /></label>
            <label className="text-xs font-semibold text-slate-600">Degree type<select className={`${fieldClass} mt-1`} value={filters.degree} onChange={(event) => setFilters({ ...filters, degree: event.target.value })}><option value="">All degree types</option>{data.options.degrees.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Current employment<select className={`${fieldClass} mt-1`} value={filters.employmentStatus} onChange={(event) => setFilters({ ...filters, employmentStatus: event.target.value })}><option value="">All statuses</option>{data.options.employmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Tracking<select className={`${fieldClass} mt-1`} value={filters.trackingStatus} onChange={(event) => setFilters({ ...filters, trackingStatus: event.target.value })}><option value="">All tracking states</option><option value="active">Active</option><option value="upcoming">Upcoming (30 days)</option><option value="overdue">Overdue</option></select></label>
            <button className="button-primary self-end" type="submit" disabled={loading}>Search</button><button className="button-secondary self-end" type="button" onClick={() => void clearFilters()} disabled={loading}>Clear filters</button>
          </form>
          {activeLabels.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">{activeLabels.map((label) => <span key={label} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900">{label}</span>)}</div>}
          <p className="mt-4 text-sm text-slate-600">{loading ? "Searching…" : `${data.totalMatches} matching students`}</p>
          {!loading && data.students.length === 0 && <p className="mt-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No students match the selected search and filters.</p>}
          {data.students.length > 0 && <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Degree</th><th className="px-4 py-3">Current employment</th><th className="px-4 py-3">Tracking</th></tr></thead><tbody className="divide-y divide-slate-100">{data.students.map((student) => <tr key={`${student.email}-${student.name}`}><td data-label="Student" className="px-4 py-3"><span className="block font-semibold text-slate-900">{student.name || "Name unavailable"}</span><span className="text-xs text-slate-500">{student.email || "Email unavailable"}</span></td><td data-label="Degree" className="px-4 py-3">{student.degreeType}</td><td data-label="Current employment" className="px-4 py-3">{student.employmentStatus}</td><td data-label="Tracking" className="px-4 py-3">{student.trackingStatus}</td></tr>)}</tbody></table></div>}
          {data.totalPages > 1 && <div className="mt-4 flex items-center justify-between gap-3"><button className="button-secondary" type="button" disabled={loading || page <= 1} onClick={() => void goToPage(page - 1)}>Previous</button><span className="text-sm text-slate-600">Page {page} of {data.totalPages}</span><button className="button-secondary" type="button" disabled={loading || page >= data.totalPages} onClick={() => void goToPage(page + 1)}>Next</button></div>}
        </section>
        <p className="mt-4 text-xs leading-5 text-slate-500">Registration date trends, faculty/department charts, skill analytics, completed tracking totals, and student detail views are omitted until their live schema, data semantics, and access policies can be verified.</p>
      </>}
    </div>
    <SiteFooter />
  </main>;
}
