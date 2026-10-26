"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { getStudentRegistration, registrationResumeStep, type StudentRegistration } from "@/lib/student-registration";
import { PROGRAMME_DURATION_YEARS } from "@/lib/student-dashboard-config";
import { supabase } from "@/lib/supabase";

type Opportunity = { id: string; title: string; employer: string; location: string | null; description: string | null; application_url: string | null; closes_at: string | null };
const section = "surface-card rounded-2xl p-5 sm:p-7";
const label = "text-xs font-semibold uppercase tracking-wide text-slate-500";

export default function DashboardPage() {
  const router = useRouter();
  const [record, setRecord] = useState<StudentRegistration | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [opportunityError, setOpportunityError] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user?.email_confirmed_at) { router.push("/login"); return; }
      try {
        const student = await getStudentRegistration(auth.user.id);
        const { data: jobs, error: jobsError } = await supabase.from("job_opportunities").select("id,title,employer,location,description,application_url,closes_at").eq("is_active", true).order("created_at", { ascending: false });
        if (!alive) return;
        setRecord(student);
        if (jobsError) setOpportunityError("Job opportunities could not be loaded."); else setOpportunities(jobs ?? []);
      } catch (cause) {
        console.error("Student dashboard load failed:", cause);
        if (alive) setError("Your saved record could not be loaded. Check that your account has access, then try again.");
      } finally { if (alive) setBusy(false); }
    })();
    return () => { alive = false; };
  }, [router]);

  const profile = record?.profile;
  const academic = record?.academic;
  const incompleteStep = record ? registrationResumeStep(record) : 2;
  const startYear = Number(String(academic?.programme_start_date ?? academic?.admission_year ?? "").slice(0, 4));
  const estimatedEndYear = startYear ? startYear + PROGRAMME_DURATION_YEARS : null;
  const progress = startYear && estimatedEndYear ? Math.max(0, Math.min(100, Math.round(((new Date().getFullYear() - startYear) / PROGRAMME_DURATION_YEARS) * 100))) : 0;

  async function signOut() { await supabase.auth.signOut(); router.push("/login"); }

  return <main id="main-content" className="min-h-screen text-slate-900">
    <InstitutionHeader><button type="button" onClick={() => void signOut()} className="button-secondary">Sign out</button></InstitutionHeader>
    <div className="page-wrap-narrow space-y-6 py-10">
      <section className={section}>
        <p className="section-kicker">Student dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122b55]">Welcome{profile?.first_name ? `, ${String(profile.first_name)}` : ""}</h1>
        <p className="mt-2 text-slate-600">Your postgraduate programme and career information.</p>
        {!busy && incompleteStep > 0 && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Your registration is incomplete. <Link className="font-semibold underline" href={`/register?resume=1&step=${incompleteStep}`}>Continue registration</Link></div>}
      </section>
      {busy && <p role="status" className={section}>Loading your saved record...</p>}
      {error && <p role="alert" className="status-panel" data-tone="error">{error}</p>}
      {!busy && record && incompleteStep === 0 && <>
        <section className={section} aria-labelledby="timeline-title"><h2 id="timeline-title" className="text-xl font-semibold text-[#122b55]">Programme timeline</h2><p className="mt-2 text-sm text-slate-600">{startYear ? `Started ${startYear}. Suggested completion: ${estimatedEndYear}.` : "Programme start year is not available."} Duration is an estimate pending confirmation by the College.</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Estimated programme timeline" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${progress}%` }}/></div></section>
        <section className={section} aria-labelledby="details-title"><h2 id="details-title" className="text-xl font-semibold text-[#122b55]">Your details</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{[["Email", profile?.email], ["Phone", profile?.phone], ["Location", [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ")], ["Programme", academic?.degree_type], ["Academic status", academic?.academic_status], ["Admission year", academic?.admission_year], ["Skills", record.skills.length ? `${record.skills.length} recorded` : record.preference?.no_side_skills ? "No side skills" : "None recorded"], ["Current role", record.employment?.job_title], ["Employer", record.employment?.employer_name]].map(([name, value]) => <div key={String(name)}><p className={label}>{String(name)}</p><p className="mt-1 text-sm text-slate-800">{value ? String(value) : "Not provided"}</p></div>)}</div><Link className="mt-6 inline-flex text-sm font-semibold text-teal-800 underline" href="/register?resume=1">Continue or edit registration</Link></section>
      </>}
      <section className={section} aria-labelledby="jobs-title"><h2 id="jobs-title" className="text-xl font-semibold text-[#122b55]">Job opportunities</h2>{opportunityError ? <p role="alert" className="mt-4 text-sm text-red-700">{opportunityError}</p> : opportunities.length ? <ul className="mt-4 divide-y divide-slate-200">{opportunities.map((job) => <li key={job.id} className="py-4 first:pt-0"><h3 className="font-semibold text-slate-900">{job.title}</h3><p className="mt-1 text-sm text-slate-600">{job.employer}{job.location ? ` · ${job.location}` : ""}</p>{job.description && <p className="mt-2 text-sm leading-6 text-slate-600">{job.description}</p>}{job.application_url && <a className="mt-3 inline-block text-sm font-semibold text-teal-800 underline" href={job.application_url} target="_blank" rel="noopener noreferrer">View opportunity</a>}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">There are no active opportunities at this time.</p>}</section>
    </div><SiteFooter />
  </main>;
}
