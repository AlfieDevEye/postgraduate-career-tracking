"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error: cause } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
    if (cause) { setBusy(false); setError("Sign in failed. Check your email and password."); return; }
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) { await supabase.auth.signOut(); setBusy(false); setError("Could not verify the administrator session. Please sign in again."); return; }
    try {
      const response = await fetch("/api/admin/access", { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" });
      if (!response.ok) {
        await supabase.auth.signOut();
        setBusy(false);
        setError(response.status === 401 || response.status === 403 ? "This account is not an active administrator. Please use an authorized admin account." : "Administrator access could not be verified. Please try again later.");
        return;
      }
      router.push("/admin");
    } catch {
      await supabase.auth.signOut();
      setBusy(false);
      setError("Administrator access could not be verified. Please try again later.");
    }
  }
  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/" className="button-secondary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Home</Link></InstitutionHeader>
    <div className="page-wrap-narrow grid min-h-[calc(100vh-6rem)] items-center py-10">
      <section className="surface-card mx-auto w-full max-w-md p-6 sm:p-9">
        <span className="eyebrow-pill">Secure administrator access</span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#122b55]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with your existing Supabase account. Admin access is checked again on every protected server request.</p>
        {error && <p role="alert" className="status-panel mt-5" data-tone="error">{error}</p>}
        <form onSubmit={(event) => void signIn(event)} className="mt-6 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">Email address<input name="email" type="email" autoComplete="username" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
          <label className="block text-sm font-semibold text-slate-700">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
        <button disabled={busy} className="button-primary w-full">{busy ? "Verifying access…" : "Sign in securely"}</button>
        </form>
      </section>
    </div>
    <SiteFooter />
  </main>;
}
