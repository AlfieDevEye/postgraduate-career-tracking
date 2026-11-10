"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Opportunity = { id: string; title: string; employer: string; location: string | null; description: string | null; application_url: string | null; closes_at: string | null };

function isSafeApplicationUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function StudentJobsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { data: result, error: cause } = await supabase.from("job_opportunities").select("id,title,employer,location,description,application_url,closes_at").eq("is_active", true).or(`closes_at.is.null,closes_at.gte.${today}`).order("created_at", { ascending: false });
      if (!active) return;
      if (cause) {
        console.error("Student job opportunities load failed:", cause);
        setError("Job opportunities could not be loaded. Please try again later.");
      } else {
        setOpportunities(result ?? []);
      }
      setBusy(false);
    })();
    return () => { active = false; };
  }, []);

  return <div className="page-wrap-narrow space-y-6 py-8">
    <header>
      <p className="section-kicker">Student portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#122b55]">Job opportunities</h1>
      <p className="mt-2 text-sm text-slate-600">Browse opportunities shared with postgraduate students and graduates.</p>
    </header>
    {busy && <p role="status" className="surface-card rounded-2xl p-5">Loading opportunities...</p>}
    {error && <p role="alert" className="status-panel" data-tone="error">{error}</p>}
    {!busy && !error && (opportunities.length ? <ul className="divide-y divide-slate-200 surface-card rounded-2xl px-5 sm:px-7">{opportunities.map((job) => <li key={job.id} className="py-5 first:pt-5"><h2 className="text-lg font-semibold text-[#122b55]">{job.title}</h2><p className="mt-1 text-sm text-slate-600">{job.employer}{job.location ? ` · ${job.location}` : ""}</p>{job.closes_at && <p className="mt-1 text-xs text-slate-500">Applications close {new Date(job.closes_at).toLocaleDateString()}</p>}{job.description && <p className="mt-3 text-sm leading-6 text-slate-600">{job.description}</p>}{job.application_url && isSafeApplicationUrl(job.application_url) && <a className="mt-3 inline-block text-sm font-semibold text-teal-800 underline" href={job.application_url} target="_blank" rel="noopener noreferrer">View opportunity</a>}</li>)}</ul> : <p className="surface-card rounded-2xl p-5 text-sm text-slate-600">There are no active opportunities at this time.</p>)}
  </div>;
}
