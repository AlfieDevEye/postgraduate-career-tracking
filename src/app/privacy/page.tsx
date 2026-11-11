import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <MarketingPage>
    <section className="page-wrap max-w-4xl py-16 sm:py-24">
      <p className="section-kicker">Privacy</p>
      <h1 className="mt-3 text-4xl text-[#122b55] sm:text-5xl">Privacy</h1>
      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-xl text-[#122b55]">What we collect</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Name, email address, phone number, state and city, programme details (faculty, department, programme, admission year, start date, academic status, graduation date), skills, and employment details (status, employer, job title, work location).</p>
        </section>
        <section>
          <h2 className="text-xl text-[#122b55]">Why we collect it</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">To keep track of postgraduate alumni careers for the College of Postgraduate Studies, to send periodic check-in emails (every 3, 6 or 9 months, as set by the College; no reply is needed), and to show job opportunities posted by the College.</p>
        </section>
        <section>
          <h2 className="text-xl text-[#122b55]">Who can see it</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">You, and authorised College administrators.</p>
        </section>
        <section>
          <h2 className="text-xl text-[#122b55]">Where it is stored</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Accounts and records are held with Supabase, the site is hosted on Vercel, and emails are sent through an email service provider. A registration draft is kept in your browser until you submit.</p>
        </section>
        <section>
          <h2 className="text-xl text-[#122b55]">Your choices</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Sign in to review or update your registration; to ask for a correction or deletion, contact the College using the Contact page.</p>
        </section>
      </div>
      <p className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">Last updated: 10 November 2026</p>
      {/* TODO(College): add retention period and legal basis after review by the data officer */}
    </section>
  </MarketingPage>;
}
