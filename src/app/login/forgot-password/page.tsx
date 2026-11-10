"use client";

import Link from "next/link";
import { useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function sendReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    const { error: cause } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login/reset-password` });
    setBusy(false);
    if (cause) {
      console.error("Password reset request failed:", cause);
      setError("We could not process your request right now. Please try again later.");
      return;
    }
    setSubmitted(true);
  }

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/login" className="button-secondary">Student login</Link></InstitutionHeader>
    <div className="page-wrap-narrow grid min-h-[calc(100vh-6rem)] items-center py-10">
      <section className="surface-card mx-auto w-full max-w-md p-6 sm:p-9">
        <p className="section-kicker">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#122b55]">Forgot password?</h1>
        {submitted ? <p role="status" className="mt-4 text-sm leading-6 text-slate-600">If an account matches that email address, a password reset link will be sent shortly.</p> : <>
          <p className="mt-3 text-sm leading-6 text-slate-600">Enter your account email and we will send a password reset link if it matches an account.</p>
          {error && <p role="alert" className="status-panel mt-5" data-tone="error">{error}</p>}
          <form onSubmit={(event) => void sendReset(event)} className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Email address<input name="email" type="email" autoComplete="email" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
            <button type="submit" disabled={busy} className="button-primary w-full disabled:opacity-60">{busy ? "Sending..." : "Send reset link"}</button>
          </form>
        </>}
        <p className="mt-5 text-sm text-slate-600"><Link href="/login" className="font-semibold text-teal-800 underline">Back to student sign in</Link></p>
      </section>
    </div>
    <SiteFooter />
  </main>;
}
