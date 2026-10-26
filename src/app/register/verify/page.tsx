"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

const DRAFT_KEY = "postgraduate-registration-draft";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const queryEmail = new URLSearchParams(window.location.search).get("email") ?? "";
      setEmail(queryEmail);
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (!queryEmail && draft) {
        try { setEmail((JSON.parse(draft) as { email?: string }).email ?? ""); }
        catch (cause) { console.error("Could not read registration email draft:", cause); }
      }
      void checkStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function checkStatus() {
    setChecking(true); setError("");
    const { data, error: cause } = await supabase.auth.getUser();
    if (cause && cause.name !== "AuthSessionMissingError") console.error("Verification status check failed:", cause);
    const user = data.user;
    if (user?.email) setEmail(user.email);
    const isVerified = Boolean(user?.email_confirmed_at);
    setVerified(isVerified);
    setChecking(false);
    if (!isVerified) setMessage("We have sent a verification link to your email address. Please check your inbox and click the link to verify your account. Registration continues after verification.");
    else setMessage("Your email is verified. Continue to the Academic Information step to complete your registration.");
  }

  async function resend() {
    if (!email) { setError("Enter your email address to resend the verification link."); return; }
    setBusy(true); setError(""); setMessage("");
    const { error: cause } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/register/verify` } });
    setBusy(false);
    if (cause) { console.error("Verification email resend failed:", cause); setError("We could not resend the verification email. Please wait a moment and try again."); return; }
    setMessage("A new verification link has been sent. Check your inbox and spam folder.");
  }

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/register" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Registration</Link></InstitutionHeader>
    <div className="page-wrap-narrow grid min-h-[calc(100vh-6rem)] items-center py-10">
      <section className="surface-card mx-auto w-full max-w-xl p-6 sm:p-10">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-800/10" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4.5 7 7.5 5.5L19.5 7"/></svg>
        </div>
        <p className="section-kicker mt-6">Account verification</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122b55]">Verify your email</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600" role="status">{message || "Checking your verification status…"}</p>
        {email && <p className="mt-5 break-all rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800">{email}</p>}
        {error && <p role="alert" className="status-panel mt-4" data-tone="error">{error}</p>}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {verified ? <Link href="/register?continue=1" className="button-primary">Continue registration <span aria-hidden="true">→</span></Link> : <>
            <button type="button" disabled={checking || busy} onClick={() => void checkStatus()} className="button-primary disabled:opacity-60">{checking ? "Checking…" : "Check verification"}</button>
            <button type="button" disabled={busy} onClick={() => void resend()} className="button-secondary disabled:opacity-60">{busy ? "Sending…" : "Resend email"}</button>
          </>}
        </div>
        <p className="mt-6 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">After verification, return here and check your status. Your registration will continue from Academic Information.</p>
      </section>
    </div>
    <SiteFooter />
  </main>;
}
