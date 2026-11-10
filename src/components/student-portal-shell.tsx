"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toast } from "@/components/toast";
import { getStudentRegistration, registrationResumeStep } from "@/lib/student-registration";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/settings", label: "Update profile", icon: "settings" },
  { href: "/dashboard/skills", label: "Skills", icon: "skills" },
  { href: "/dashboard/jobs", label: "Job opportunities", icon: "jobs" },
] as const;

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.8Z" transform="translate(-1 -1)" /></>,
    skills: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
    jobs: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  };
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function StudentPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: auth, error } = await supabase.auth.getUser();
      if (error || !auth.user?.email_confirmed_at) {
        router.replace("/login");
        return;
      }
      try {
        const record = await getStudentRegistration(auth.user.id);
        const incompleteStep = registrationResumeStep(record);
        if (incompleteStep > 0) {
          router.replace(`/register?resume=1&step=${incompleteStep}`);
          return;
        }
      } catch (cause) {
        console.error("Student portal access check failed:", cause);
        router.replace("/login");
        return;
      }
      if (active) setReady(true);
    })();

    const params = new URLSearchParams(window.location.search);
    const message = params.get("login") === "1"
      ? "Login successfully."
      : params.get("registered") === "1"
        ? "Your registration has been saved successfully."
        : "";
    const timer = message ? window.setTimeout(() => setNotice(message), 0) : undefined;
    if (message) window.history.replaceState(null, "", pathname);
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname, router]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Student sign out failed:", error);
      setNotice("Sign out failed. Please try again.");
      return;
    }
    router.push("/login?signedOut=1");
  }

  const navigation = <nav aria-label="Student navigation" className="student-side-links">
    {links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setMobileOpen(false)} className="student-side-link">
      <NavIcon name={link.icon} /><span className="student-side-label">{link.label}</span>
    </Link>)}
    <button type="button" onClick={() => void signOut()} className="student-side-link student-side-signout"><NavIcon name="logout" /><span className="student-side-label">Sign out</span></button>
  </nav>;

  return <main className="student-portal">
    <Toast message={notice} onClose={() => setNotice("")} />
    <aside className="student-sidebar" aria-label="Student portal">
      <Link href="/dashboard" className="student-sidebar-brand" aria-label="Redeemers University student portal home">
        <Image src="/logo.png" alt="" width={48} height={48} priority />
        <span className="student-side-label">Student portal</span>
      </Link>
      {navigation}
    </aside>
    <div className="student-mobile-nav">
      <Link href="/dashboard" className="student-mobile-brand"><Image src="/logo.png" alt="" width={38} height={38} priority /><span>Student portal</span></Link>
      <button type="button" className="button-secondary" aria-expanded={mobileOpen} aria-controls="student-mobile-links" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? "Close menu" : "Menu"}</button>
      {mobileOpen && <div id="student-mobile-links">{navigation}</div>}
    </div>
    <div className="student-portal-content">
      {ready ? children : <p role="status" className="m-8 text-sm text-slate-600">Loading your student portal...</p>}
    </div>
  </main>;
}
