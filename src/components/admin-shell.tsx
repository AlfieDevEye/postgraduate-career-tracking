"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active: "dashboard" | "reminders" | "jobs" = pathname.startsWith("/admin/jobs")
    ? "jobs"
    : pathname.startsWith("/admin/reminders")
      ? "reminders"
      : "dashboard";

  const links = [
    {
      href: "/admin",
      label: "Dashboard",
      current: active === "dashboard",
      icon: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></>,
    },
    {
      href: "/admin/jobs",
      label: "Job opportunities",
      current: active === "jobs",
      icon: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3m-13 5h18" /></>,
    },
    {
      href: "/admin/reminders",
      label: "Reminders",
      current: active === "reminders",
      icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    },
  ];

  return <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
    <div className="overflow-x-auto lg:hidden">
      <AdminNav active={active} />
    </div>
    <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
      <nav aria-label="Admin" className="rounded-2xl border border-slate-200 bg-card p-3">
        <p className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">Admin</p>
        <div className="space-y-1">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={link.current ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg border-l-[3px] px-3 py-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 ${link.current ? "border-teal-700 bg-teal-50 font-semibold text-teal-800" : "border-transparent text-slate-700"}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">{link.icon}</svg>
            <span>{link.label}</span>
          </Link>)}
        </div>
        <div className="my-3 border-t border-slate-200" />
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0"><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /><path d="M3 4v16" /></svg>
          <span>Back to site</span>
        </Link>
      </nav>
    </aside>
    <div className="min-w-0">{children}</div>
  </div>;
}
