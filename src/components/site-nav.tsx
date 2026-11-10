import Link from "next/link";
import { siteNav } from "@/lib/site-config";
export function SiteNav() {
  return <>
    <nav aria-label="Main navigation" className="flex items-center gap-6">
      {siteNav.map((item) => <Link key={item.href} href={item.href} className="rounded-md px-1 py-2 text-sm font-semibold text-slate-600 hover:text-teal-800">{item.label}</Link>)}
    </nav>
    <Link href="/login" className="button-secondary">Student login</Link>
    <Link href="/register" className="button-primary !min-h-10 !px-3 !py-2 text-xs sm:!px-4 sm:text-sm">Register <span aria-hidden="true">{"\u2197"}</span></Link>
  </>;
}
