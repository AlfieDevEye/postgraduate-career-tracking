"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setError("");
      }
    });
    void supabase.auth.getSession().then(({ data, error: cause }) => {
      if (!active) return;
      if (cause) {
        console.error("Password recovery session check failed:", cause);
        setError("The password reset link could not be verified. Request a new link and try again.");
      } else if (data.session) {
        setReady(true);
      } else {
        setError("This password reset link is invalid or has expired. Request a new link and try again.");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmPassword"));
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: cause } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (cause) {
      console.error("Password update failed:", cause);
      setError("Your password could not be updated. Request a new reset link and try again.");
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) console.error("Sign out after password reset failed:", signOutError);
    router.push("/login?passwordUpdated=1");
  }

  return <main id="main-content" className="min-h-screen pb-12 text-slate-900">
    <InstitutionHeader><Link href="/login" className="button-secondary">Student login</Link></InstitutionHeader>
    <div className="page-wrap-narrow grid min-h-[calc(100vh-6rem)] items-center py-10">
      <section className="surface-card mx-auto w-full max-w-md p-6 sm:p-9">
        <p className="section-kicker">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#122b55]">Choose a new password</h1>
        {error && <p role="alert" className="status-panel mt-5" data-tone="error">{error}</p>}
        {ready && <form onSubmit={(event) => void updatePassword(event)} className="mt-6 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">New password<input name="password" type="password" minLength={8} autoComplete="new-password" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
          <label className="block text-sm font-semibold text-slate-700">Confirm new password<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required className="mt-2 w-full px-4 py-3 text-sm" /></label>
          <button type="submit" disabled={busy} className="button-primary w-full disabled:opacity-60">{busy ? "Updating..." : "Update password"}</button>
        </form>}
        {!ready && !error && <p role="status" className="mt-5 text-sm text-slate-600">Verifying your reset link...</p>}
        {error && <p className="mt-5 text-sm text-slate-600"><Link href="/login/forgot-password" className="font-semibold text-teal-800 underline">Request a new reset link</Link></p>}
      </section>
    </div>
    <SiteFooter />
  </main>;
}
