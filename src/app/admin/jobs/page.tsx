"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, EmptyState, Skeleton } from "@/components/dashboard-ui";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { Toast } from "@/components/toast";
import { supabase } from "@/lib/supabase";
import type { JobInput } from "@/lib/job-validation.mjs";

type Job = JobInput & { id: string; created_at: string };
type ApiResult = { error?: unknown; jobs?: Job[]; job?: Job };
type FormValues = Omit<JobInput, "is_active"> & { is_active: boolean };

const emptyForm: FormValues = {
  title: "",
  employer: "",
  location: "",
  description: "",
  application_url: "",
  closes_at: "",
  is_active: true,
};

const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-card px-4 py-3 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formValues(job: Job): FormValues {
  return {
    title: job.title,
    employer: job.employer,
    location: job.location ?? "",
    description: job.description ?? "",
    application_url: job.application_url ?? "",
    closes_at: job.closes_at ?? "",
    is_active: job.is_active,
  };
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path: string, init?: RequestInit): Promise<ApiResult> => {
    const { data, error: authError } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (authError || !token) {
      router.replace("/admin/login");
      throw new Error("Sign in with an administrator account to continue.");
    }

    const response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
      cache: "no-store",
    });
    const payload = await response.json() as ApiResult;
    if (response.status === 401 || response.status === 403) {
      router.replace("/admin/login");
      throw new Error(typeof payload.error === "string" ? payload.error : "Administrator access is required.");
    }
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Request failed.");
    return payload;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await request("/api/admin/jobs");
      setJobs(payload.jobs ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Job opportunities could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(editingId ? `/api/admin/jobs/${encodeURIComponent(editingId)}` : "/api/admin/jobs", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setToast(editingId ? "Job opportunity updated." : "Job opportunity added.");
      resetForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Job opportunity could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(job: Job) {
    setBusy(true);
    setError("");
    try {
      await request(`/api/admin/jobs/${encodeURIComponent(job.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !job.is_active }),
      });
      setToast(job.is_active ? "Job opportunity hidden." : "Job opportunity is now active.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Job opportunity status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(job: Job) {
    if (!window.confirm(`Delete "${job.title}"? This action cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await request(`/api/admin/jobs/${encodeURIComponent(job.id)}`, { method: "DELETE" });
      setToast("Job opportunity deleted.");
      if (editingId === job.id) resetForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Job opportunity could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/admin" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Dashboard</Link></InstitutionHeader>
    <div className="page-wrap py-9 sm:py-12">
      <AdminShell>
      <div className="space-y-5">
      <header>
        <p className="section-kicker">Administrator workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Job opportunities</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Active jobs are visible to every registered student.</p>
      </header>

      {error && <div role="alert" className="status-panel" data-tone="error">{error}</div>}

      <section className="surface-card rounded-2xl p-5 sm:p-7" aria-labelledby="job-form-heading">
        <h2 id="job-form-heading" className="text-xl font-semibold text-slate-900">{editingId ? "Edit job opportunity" : "Add a job opportunity"}</h2>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void save(event)}>
          <label className="text-sm font-semibold text-slate-700">Title
            <input className={fieldClass} value={form.title} maxLength={160} required onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-slate-700">Employer
            <input className={fieldClass} value={form.employer} maxLength={160} required onChange={(event) => setForm({ ...form, employer: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-slate-700">Location
            <input className={fieldClass} value={form.location ?? ""} maxLength={160} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-slate-700">Application link (URL)
            <input className={fieldClass} type="url" inputMode="url" value={form.application_url ?? ""} onChange={(event) => setForm({ ...form, application_url: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-slate-700">Closing date
            <input className={fieldClass} type="date" value={form.closes_at ?? ""} onChange={(event) => setForm({ ...form, closes_at: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description
            <textarea className={`${fieldClass} min-h-32 resize-y`} value={form.description ?? ""} maxLength={4000} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-700 sm:col-span-2">
            <input className="size-4 accent-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Active
          </label>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button type="submit" className="button-primary" disabled={busy}>{busy ? "Saving..." : editingId ? "Save changes" : "Add job"}</button>
            {editingId && <button type="button" className="button-secondary" disabled={busy} onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="surface-card rounded-2xl p-5 sm:p-7" aria-labelledby="job-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="job-list-heading" className="text-xl font-semibold text-slate-900">Existing jobs</h2>
          <span className="text-sm tabular-nums text-slate-500">{jobs.length} total</span>
        </div>
        {loading && <div role="status" aria-label="Loading job opportunities" className="mt-5 space-y-3">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}
        </div>}
        {!loading && jobs.length === 0 && <div className="mt-5"><EmptyState icon={<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" /></svg>} title="No job opportunities yet. Add the first one above." body="" /></div>}
        {!loading && jobs.length > 0 && <ul className="mt-5 space-y-3">
          {jobs.map((job) => {
            const closed = Boolean(job.closes_at && job.closes_at < localDate());
            const tone = closed ? "danger" : job.is_active ? "success" : "neutral";
            const status = closed ? "Closed" : job.is_active ? "Active" : "Hidden";
            return <li key={job.id} className="rounded-xl border border-slate-200 bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="break-words text-base font-semibold text-slate-900">{job.title}</h3>
                    <Badge tone={tone}>{status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{job.employer}{job.location ? ` · ${job.location}` : ""}</p>
                  {job.closes_at && <p className="mt-1 text-xs tabular-nums text-slate-500">Closes {job.closes_at}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" className="button-secondary !min-h-10 !px-3 !py-2 text-sm" disabled={busy} onClick={() => { setEditingId(job.id); setForm(formValues(job)); setError(""); }}>Edit</button>
                  <button type="button" className="button-secondary !min-h-10 !px-3 !py-2 text-sm" disabled={busy} onClick={() => void toggleActive(job)}>{job.is_active ? "Hide" : "Show"}</button>
                  <button type="button" className="button-secondary !min-h-10 !px-3 !py-2 text-sm" disabled={busy} onClick={() => void remove(job)}>Delete</button>
                </div>
              </div>
            </li>;
          })}
        </ul>}
      </section>
      </div>
      </AdminShell>
    </div>
    <Toast message={toast} onClose={() => setToast("")} />
    <SiteFooter />
  </main>;
}
