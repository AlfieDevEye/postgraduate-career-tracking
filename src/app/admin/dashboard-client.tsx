"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";
import { AdminNav } from "@/components/admin-nav";
import { Badge, EmptyState, Skeleton, StatCard } from "@/components/dashboard-ui";

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
const icon = (kind: number) => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">{kind === 0 ? <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0m3-11v6m3-3h-6" /></> : kind === 1 ? <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3m-13 5h18" /></> : kind === 2 ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> : kind === 3 ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5m0 4h.01" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></>}</svg>;
const trackingTone = (value: string): "success" | "warning" | "neutral" | "danger" => value.toLowerCase().includes("overdue") ? "danger" : value.toLowerCase().includes("upcoming") ? "warning" : value.toLowerCase().includes("active") ? "success" : "neutral";

function Bars({ title, rows, empty }: { title: string; rows: Count[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <section className="surface-card rounded-2xl p-5 sm:p-6"><h2 className="text-base font-semibold text-slate-900">{title}</h2>{rows.length ? <ul className="mt-5 space-y-4">{rows.slice(0, 8).map((row) => <li key={row.label}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-700">{row.label}</span><span className="font-semibold tabular-nums text-slate-900">{row.count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${Math.max(4, row.count / max * 100)}%` }} /></div></li>)}</ul> : <p className="mt-5 text-sm text-slate-500">{empty}</p>}</section>;
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

  const fieldClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-card px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
  const activeLabels = [applied.q && `Search: ${applied.q}`, applied.degree && `Degree: ${applied.degree}`, applied.employmentStatus && `Employment: ${applied.employmentStatus}`, applied.trackingStatus && `Tracking: ${applied.trackingStatus}`].filter(Boolean) as string[];

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader>
      <nav aria-label="Administrator navigation" className="flex items-center gap-2 sm:gap-3">
        <button type="button" disabled={busy} onClick={() => void signOut()} className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Sign out</button>
      </nav>
    </InstitutionHeader>
    <AdminNav active="dashboard" />
    <div className="page-wrap py-8 sm:py-11">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-kicker">Administrator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Career tracking overview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Live summaries and student search from the records currently available to the platform.</p></div><Link href="/admin/reminders" className="button-primary">Manage reminders <span aria-hidden="true">→</span></Link></div>
      {error && <div role="alert" className="status-panel mt-6" data-tone="error"><strong>{denied ? "Access denied" : "Dashboard unavailable"}.</strong> {error}</div>}
      {loading && !data && <div role="status" aria-label="Loading verified dashboard data" className="mt-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>}
      {data && <>
        <section aria-label="Platform summary" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Registered students", data.metrics.totalStudents, 0],
            ["Active tracking records", data.metrics.activeTracking, 1],
            ["Follow-ups due in 30 days", data.metrics.upcomingTracking, 2],
            ["Overdue follow-ups", data.metrics.overdueTracking, 3],
            ["Reminder interval", data.metrics.frequencyMonths ? `${data.metrics.frequencyMonths} months` : "Not configured", 4],
          ].map(([label, value, iconIndex]) => <StatCard key={String(label)} label={String(label)} value={value} icon={icon(Number(iconIndex))} />)}
        </section>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><Bars title="Students by recorded degree type" rows={data.degreeCounts} empty="No degree records are available." /><Bars title="Current employment status" rows={data.employmentCounts} empty="No current employment records are available." /></div>
        <section className="surface-card mt-5 rounded-2xl p-5 sm:p-6">
          <div><h2 className="text-lg font-semibold text-slate-900">Find students</h2><p className="mt-1 text-sm text-slate-600">Search name or email and combine the filters that have verified values.</p></div>
          <form onSubmit={(event) => void search(event)} className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]">
            <label className="text-xs font-semibold text-slate-600">Name or email<span className="relative mt-1 block"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg><input className={`${fieldClass} pl-10`} value={filters.q} maxLength={100} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search students" /></span></label>
            <label className="text-xs font-semibold text-slate-600">Degree type<select className={`${fieldClass} mt-1`} value={filters.degree} onChange={(event) => setFilters({ ...filters, degree: event.target.value })}><option value="">All degree types</option>{data.options.degrees.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Current employment<select className={`${fieldClass} mt-1`} value={filters.employmentStatus} onChange={(event) => setFilters({ ...filters, employmentStatus: event.target.value })}><option value="">All statuses</option>{data.options.employmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Tracking<select className={`${fieldClass} mt-1`} value={filters.trackingStatus} onChange={(event) => setFilters({ ...filters, trackingStatus: event.target.value })}><option value="">All tracking states</option><option value="active">Active</option><option value="upcoming">Upcoming (30 days)</option><option value="overdue">Overdue</option></select></label>
            <button className="button-primary self-end" type="submit" disabled={loading}>Search</button><button className="button-secondary self-end" type="button" onClick={() => void clearFilters()} disabled={loading}>Clear filters</button>
          </form>
          {activeLabels.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">{activeLabels.map((label) => <span key={label} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900">{label}</span>)}</div>}
        </section>
        <section aria-label="Student results" className="surface-card mt-5 rounded-2xl p-4 sm:p-6">
          <p className="mb-4 text-sm text-slate-600">{loading ? "Searching…" : `${data.totalMatches} matching students`}</p>
          {loading && <div role="status" aria-label="Loading student results" className="space-y-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>}
          {!loading && data.students.length === 0 && <EmptyState icon={<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>} title="No students match the selected search and filters." body="" />}
          {!loading && data.students.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm tabular-nums">
              <thead className="sticky top-0 z-10 bg-card text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Degree</th><th className="px-4 py-3">Current employment</th><th className="px-4 py-3">Tracking</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{data.students.map((student) => <tr key={`${student.email}-${student.name}`} className="transition-colors hover:bg-slate-50">
                <td data-label="Student" className="px-4 py-3"><span className="block font-semibold text-slate-900">{student.name || "Name unavailable"}</span><span className="text-xs text-slate-500">{student.email || "Email unavailable"}</span></td>
                <td data-label="Degree" className="px-4 py-3">{student.degreeType}</td>
                <td data-label="Current employment" className="px-4 py-3"><Badge tone="neutral">{student.employmentStatus}</Badge></td>
                <td data-label="Tracking" className="px-4 py-3"><Badge tone={trackingTone(student.trackingStatus)}>{student.trackingStatus}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>}
          {data.totalPages > 1 && <div className="mt-4 flex items-center justify-between gap-3"><button className="button-secondary" type="button" disabled={loading || page <= 1} onClick={() => void goToPage(page - 1)}>Previous</button><span className="text-sm text-slate-600">Page {page} of {data.totalPages}</span><button className="button-secondary" type="button" disabled={loading || page >= data.totalPages} onClick={() => void goToPage(page + 1)}>Next</button></div>}
        </section>
        <p className="mt-4 text-xs leading-5 text-slate-500">Registration date trends, faculty/department charts, skill analytics, completed tracking totals, and student detail views are omitted until their live schema, data semantics, and access policies can be verified.</p>
      </>}
    </div>
    <SiteFooter />
  </main>;
}
