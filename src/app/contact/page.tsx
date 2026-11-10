import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing-page";
import { contact } from "@/lib/site-config";
export const metadata: Metadata = {
  title: "Contact | Redeemers University Postgraduate Career Tracking",
  description: "Contact the Redeemers University College of Postgraduate Studies.",
};
export default function ContactPage() {
  const rows = [
    { label: "Email", value: contact.email, href: contact.email ? `mailto:${contact.email}` : "" },
    { label: "Phone", value: contact.phone, href: contact.phone ? `tel:${contact.phone.replace(/\s+/g, "")}` : "" },
    { label: "Address", value: contact.address, href: "" },
    { label: "Office hours", value: contact.hours, href: "" },
  ].filter((row) => row.value);
  return <MarketingPage>
    <section className="page-wrap py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="section-kicker">Contact</p>
          <h1 className="mt-3 text-4xl text-[#122b55] sm:text-5xl">Get in touch</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">Questions about your profile or the check-in emails? Contact the College of Postgraduate Studies.</p>
        </div>
        {rows.length ? <dl className="divide-y divide-slate-200 border-y border-slate-200">
          {rows.map((row) => <div key={row.label} className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr]">
            <dt className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{row.label}</dt>
            <dd className="text-base text-[#122b55]">{row.href ? <a href={row.href} className="font-semibold underline underline-offset-4 hover:text-teal-800">{row.value}</a> : row.value}</dd>
          </div>)}
        </dl> : <p className="text-sm text-slate-600">Contact details are not available yet.</p>}
      </div>
    </section>
  </MarketingPage>;
}
