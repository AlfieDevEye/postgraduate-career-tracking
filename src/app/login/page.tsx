"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { getStudentRegistration, registrationResumeStep } from "@/lib/student-registration";
import { supabase } from "@/lib/supabase";

export default function StudentLoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { data, error: cause } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (cause || !data.user) {
      if (cause?.message.toLowerCase().includes("email not confirmed")) {
        router.push(`/register/verify?email=${encodeURIComponent(String(form.get("email")).trim())}`);
        return;
      }
      setError("Sign in failed. Check your email and password, and confirm your email if required.");
      return;
    }
    try {
      const record = await getStudentRegistration(data.user.id);
      const nextStep = registrationResumeStep(record);
      router.push(nextStep === 0 ? "/dashboard" : `/register?resume=1&step=${nextStep}`);
    } catch (loadError) {
      console.error("Student registration resume failed:", loadError);
      setError("You are signed in, but your saved record could not be loaded. Please try again or contact the College.");
    }
  }

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/register" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Register</Link></InstitutionHeader>
    <div className="page-wrap-narrow grid min-h-[calc(100vh-6rem)] items-center py-10">
      <section className="surface-card mx-auto w-full max-w-md p-6 sm:p-9">
        <span className="eyebrow-pill">Student and graduate access</span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#122b55]">Student sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the email and password for your existing postgraduate career account.</p>
        {error && <p role="alert" className="status-panel mt-5" data-tone="error">{error}</p>}
        <form onSubmit={(event) => void signIn(event)} className="mt-6 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">Email address<input name="email" type="email" autoComplete="username" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
          <label className="block text-sm font-semibold text-slate-700">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
          <button disabled={busy} className="button-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-sm text-slate-600">New here? <Link className="font-semibold text-teal-800 underline" href="/register">Create your profile</Link></p>
      </section>
    </div>
    <SiteFooter />
  </main>;
}
