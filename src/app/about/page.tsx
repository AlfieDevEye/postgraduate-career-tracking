import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "@/components/marketing-page";
export const metadata: Metadata = {
  title: "About | Redeemers University Postgraduate Career Tracking",
  description: "About the Postgraduate Career Tracking System of the Redeemers University College of Postgraduate Studies.",
};
export default function AboutPage() {
  return <MarketingPage>
    <section className="page-wrap py-16 sm:py-24">
      <p className="section-kicker">About</p>
      <h1 className="mt-3 max-w-3xl text-4xl text-[#122b55] sm:text-5xl">Keeping track of postgraduate alumni</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">The Postgraduate Career Tracking System is run by the College of Postgraduate Studies at Redeemers University. It records where postgraduate alumni work and how their careers develop.</p>
      <div className="mt-12 grid gap-10 border-t border-slate-200 pt-10 md:grid-cols-2 md:gap-16">
        <div><h2 className="text-xl text-[#122b55]">For graduates</h2><p className="mt-3 text-sm leading-7 text-slate-600">Create a profile once with your programme, skills and employment details. The College uses it to keep in touch with alumni.</p><Link href="/register" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 underline underline-offset-4">Start your registration <span aria-hidden="true">{"\u2192"}</span></Link></div>
        <div><h2 className="text-xl text-[#122b55]">For the College</h2><p className="mt-3 text-sm leading-7 text-slate-600">A structured record of alumni employment gives the College a clearer picture of graduate outcomes over time.</p></div>
      </div>
    </section>
  </MarketingPage>;
}
