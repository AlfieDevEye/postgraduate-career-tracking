import Link from "next/link";

export function AdminNav({ active }: { active: "dashboard" | "reminders" | "jobs" }) {
  return <nav aria-label="Administrator pages" className="page-wrap mt-4 flex gap-1 border-b border-slate-200">
    <Link href="/admin" aria-current={active === "dashboard" ? "page" : undefined} className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${active === "dashboard" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>Dashboard</Link>
    <Link href="/admin/reminders" aria-current={active === "reminders" ? "page" : undefined} className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${active === "reminders" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>Reminders</Link>
    <Link href="/admin/jobs" aria-current={active === "jobs" ? "page" : undefined} className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${active === "jobs" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>Jobs</Link>
  </nav>;
}
