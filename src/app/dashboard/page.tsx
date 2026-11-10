"use client";

import { useEffect, useState } from "react";
import { getStudentRegistration, registrationResumeStep, type StudentRegistration } from "@/lib/student-registration";
import { PROGRAMME_DURATION_YEARS } from "@/lib/student-dashboard-config";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Avatar, Badge, EmptyState, Skeleton, StatCard } from "@/components/dashboard-ui";

const section = "surface-card rounded-2xl p-5 sm:p-7";
const label = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const icon = (path: string) => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">{path === "person" ? <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></> : path === "book" ? <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20" /></> : path === "briefcase" ? <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3m-13 5h18m-11 0v2h4v-2" /></> : <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /></>}</svg>;

export default function DashboardPage() {
  const [record, setRecord] = useState<StudentRegistration | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user?.email_confirmed_at) return;
      try {
        const student = await getStudentRegistration(auth.user.id);
        if (!alive) return;
        setRecord(student);
      } catch (cause) {
        console.error("Student dashboard load failed:", cause);
        if (alive) setError("Your saved record could not be loaded. Check that your account has access, then try again.");
      } finally { if (alive) setBusy(false); }
    })();
    return () => { alive = false; };
  }, []);

  const profile = record?.profile;
  const academic = record?.academic;
  const incompleteStep = record ? registrationResumeStep(record) : 2;
  const startYear = Number(String(academic?.programme_start_date ?? academic?.admission_year ?? "").slice(0, 4));
  const graduationYear = academic?.graduation_date ? Number(String(academic.graduation_date).slice(0, 4)) : null;
  const suggestedEndYear = startYear ? startYear + PROGRAMME_DURATION_YEARS : null;
  const timelineEndYear = graduationYear ?? suggestedEndYear;
  const currentYear = new Date().getFullYear();
  const progress = startYear && timelineEndYear && timelineEndYear > startYear ? Math.max(0, Math.min(100, Math.round(((currentYear - startYear) / (timelineEndYear - startYear)) * 100))) : 0;
  const currentLabelPosition = Math.max(12, Math.min(88, progress));
  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ");
  const details = [
    { group: "Contact", rows: [["Email", profile?.email], ["Phone", profile?.phone], ["Location", location]] },
    { group: "Programme", rows: [["Programme", academic?.degree_type], ["Academic status", academic?.academic_status], ["Admission year", academic?.admission_year]] },
    { group: "Career", rows: [["Current role", record?.employment?.job_title], ["Employer", record?.employment?.employer_name], ["Skills", record?.skills.length ? `${record.skills.length} recorded` : record?.preference?.no_side_skills ? "No side skills" : "Not provided"]] },
  ].map((group) => ({ ...group, rows: group.rows.map(([name, value]) => ({ name: String(name), value: value === null || value === undefined || value === "" ? "" : String(value) })) }));
  const filledDetails = details.flatMap((group) => group.rows).filter((row) => row.value).length;
  const firstName = String(profile?.first_name ?? "");
  const fullName = [firstName, profile?.last_name].filter(Boolean).map(String).join(" ");

  return <div className="page-wrap space-y-6 py-6 sm:py-8">
    {busy && <section role="status" aria-label="Loading your saved record" className="space-y-5">
      <div className="surface-card flex items-center gap-4 rounded-2xl p-5 sm:p-7"><Skeleton className="size-14 rounded-2xl" /><div className="flex-1 space-y-3"><Skeleton className="h-3 w-36" /><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-64 max-w-full" /></div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
    </section>}
    {error && <p role="alert" className="status-panel" data-tone="error">{error}</p>}
    {!busy && <section className={`${section} flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-center gap-4"><Avatar name={fullName} /><div><p className="section-kicker">Student dashboard</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Welcome{firstName ? `, ${firstName}` : ""}</h1><p className="mt-1 text-sm text-slate-600">Your postgraduate programme and career information.</p></div></div>
      <div className="flex flex-wrap items-center gap-3"><Badge tone={incompleteStep === 0 ? "success" : "warning"}>{incompleteStep === 0 ? "Registration complete" : "Registration incomplete"}</Badge><Link className="button-secondary" href="/register?resume=1">Edit registration</Link></div>
      {record && incompleteStep > 0 && <div role="alert" className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Your profile needs attention. <Link className="font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href="/dashboard/settings">Review your profile</Link> <Link className="ml-2 inline-flex font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href="/register?resume=1">Continue registration</Link></div>}
    </section>}
    {!busy && record && <>
      <section aria-label="Profile summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Programme" value={String(academic?.degree_type || "Not provided")} icon={icon("book")} />
        <StatCard label="Academic status" value={String(academic?.academic_status || "Not provided")} icon={icon("person")} />
        <StatCard label="Skills" value={record.skills.length ? `${record.skills.length} recorded` : record.preference?.no_side_skills ? "No side skills" : "0 recorded"} icon={icon("briefcase")} />
        <StatCard label="Profile completeness" value={`${filledDetails} of 9 details`} icon={icon("chart")} />
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className={section} aria-labelledby="timeline-title">
            <h2 id="timeline-title" className="text-xl font-semibold text-slate-900">Programme timeline</h2>
            {startYear ? <>
              <div className="relative mt-8 h-20">
                <div className="absolute left-2 right-2 top-2 h-1 rounded-full bg-slate-200" aria-hidden="true"><div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} /></div>
                <span aria-hidden="true" className="absolute left-0 top-0 size-5 rounded-full border-4 border-card bg-slate-400" />
                <span aria-hidden="true" className="absolute right-0 top-0 size-5 rounded-full border-4 border-card bg-slate-400" />
                <span aria-hidden="true" className="absolute top-0 size-5 -translate-x-1/2 rounded-full border-4 border-card bg-teal-700" style={{ left: `${progress}%` }} />
                <div className="absolute inset-x-0 top-7 flex justify-between gap-2 text-xs font-semibold text-slate-600"><span className="max-w-[35%]">Started<br /><span className="text-base tabular-nums text-slate-900">{startYear}</span></span><span className="max-w-[35%] text-right">{graduationYear ? "Graduation" : "Suggested completion"}<br /><span className="text-base tabular-nums text-slate-900">{timelineEndYear || "Not provided"}</span></span></div>
                <span className="absolute -top-7 -translate-x-1/2 text-center text-xs font-semibold text-slate-600" style={{ left: `${currentLabelPosition}%` }}>Current year <span className="text-base tabular-nums text-slate-900">{currentYear}</span></span>
              </div>
              {!graduationYear && <p className="mt-4 text-xs leading-5 text-slate-500">Estimate based on a standard programme length.</p>}
            </> : <p className="mt-4 text-sm text-slate-600">Programme start year is not available.</p>}
          </section>
          <section className={section} aria-labelledby="opportunities-title">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="opportunities-title" className="text-xl font-semibold text-slate-900">Job opportunities</h2><p className="mt-1 text-sm text-slate-600">Browse opportunities shared with postgraduate students and graduates.</p></div><Link href="/dashboard/jobs" className="button-secondary">Job opportunities</Link></div>
            <div className="mt-5"><EmptyState icon={icon("briefcase")} title="Job opportunities" body="Browse opportunities shared with postgraduate students and graduates." /></div>
          </section>
        </div>
        <section className={section} aria-labelledby="details-title">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="details-title" className="text-xl font-semibold text-slate-900">Your details</h2><Link className="text-sm font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href="/register?resume=1">Continue or edit registration</Link></div>
          <div className="mt-5 space-y-6">{details.map((group) => <section key={group.group} aria-label={group.group}><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.group}</h3><dl className="mt-3 space-y-3">{group.rows.map((row) => <div key={row.name} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0"><dt className={label}>{row.name}</dt><dd className={`text-sm ${row.value ? "text-slate-800" : "italic text-slate-500"}`}>{row.value || "Not provided"}</dd></div>)}</dl></section>)}</div>
        </section>
      </div>
    </>}
  </div>;
}
