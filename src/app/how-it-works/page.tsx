import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "@/components/marketing-page";
export const metadata: Metadata = {
  title: "How it works",
  description: "How alumni register and receive check-in emails.",
};
const steps = [
  { title: "Create your profile", body: "Choose Register on the home page, create an account and confirm your email address." },
  { title: "Complete your details", body: "Fill in your personal, academic, skills and employment information in a few short steps." },
  { title: "Registration confirmed", body: "A confirmation message appears once your profile has been saved." },
  { title: "Check-in emails", body: "The College sends a short check-in email every 3, 6 or 9 months. The interval is set by the College and is the same for everyone. You do not need to reply." },
];
export default function HowItWorksPage() {
  return <MarketingPage>
    <section className="page-wrap py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="section-kicker">How it works</p>
          <h1 className="mt-3 text-4xl text-[#122b55] sm:text-5xl">From registration to staying in touch</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">You create a profile once. After that, the College keeps in touch with occasional check-ins.</p>
          <div className="mt-8"><Link href="/register" className="button-primary">Create your profile <span aria-hidden="true">{"\u2192"}</span></Link></div>
        </div>
        <ol className="divide-y divide-slate-200">
          {steps.map((step, index) => <li key={step.title} className="grid gap-3 py-6 first:pt-0 sm:grid-cols-[3rem_1fr] sm:gap-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-xs font-extrabold text-teal-800 ring-1 ring-teal-800/10">{String(index + 1).padStart(2, "0")}</span>
            <div><h2 className="text-lg text-[#122b55]">{step.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p></div>
          </li>)}
        </ol>
      </div>
    </section>
  </MarketingPage>;
}
