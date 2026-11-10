import Image from "next/image";
import Link from "next/link";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { SiteNav } from "@/components/site-nav";

const programmes = [
  { title: "Postgraduate Diploma", detail: "Build specialist knowledge and prepare for the next stage of your career.", mark: "PGD" },
  { title: "Master’s programmes", detail: "Connect advanced study with changing professional goals.", mark: "MSc" },
  { title: "Doctoral programmes", detail: "Record the professional paths that follow research and scholarship.", mark: "PhD" },
];

const steps = [
  { number: "01", title: "Create your profile", body: "Share your programme, skills and current employment information." },
  { number: "02", title: "Complete registration", body: "Finish a few short steps and receive a confirmation." },
  { number: "03", title: "Stay in touch", body: "The College sends a short check-in email every few months. No reply is needed." },
];

export default function Home() {
  return <main id="main-content" className="overflow-x-clip text-slate-900">
    <InstitutionHeader><SiteNav /></InstitutionHeader>
    <section className="home-hero relative isolate flex items-center overflow-hidden">
      <Image src="/hero.jpeg" alt="" fill priority sizes="100vw" className="-z-20 object-cover [object-position:50%_45%]" />
      <div className="absolute inset-0 -z-10 bg-[#0b1c38]/70 lg:hidden" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#0b1c38]/90 via-[#0b1c38]/60 to-[#0b1c38]/10 lg:block" aria-hidden="true" />
      <div className="page-wrap relative py-16 sm:py-20">
        <div className="soft-rise max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.08em] text-[#f2c56b]">Postgraduate Career Tracking</span>
          <h1 className="mt-6 text-[2.5rem] text-white sm:text-5xl lg:text-[3.5rem]">Postgraduate career records in one place.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">Record your programme, skills and employment details for Redeemers University College of Postgraduate Studies.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e0a63a] px-6 py-3 text-sm font-bold text-[#0b1c38] hover:bg-[#f0b84d]">Create your profile <span aria-hidden="true">{"\u2192"}</span></Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20">Student login</Link>
          </div>
          <p className="mt-8 text-xs font-medium text-white/80">For postgraduate students and graduates {"\u00b7"} Redeemers University</p>
        </div>
      </div>
    </section>

    <section id="programmes" className="home-section relative py-16 sm:py-20">
      <div className="page-wrap">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="section-kicker">A connected postgraduate community</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[#122b55] sm:text-4xl">Career tracking across postgraduate study</h2></div>
          <p className="max-w-md text-sm leading-6 text-slate-600">Maintain a clearer connection between the programmes you complete and the work you do afterward.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {programmes.map((programme, index) => <article key={programme.title} className="surface-card surface-card-lift relative overflow-hidden p-6 sm:p-7">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-teal-50" />
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-teal-900/10 bg-gradient-to-br from-teal-50 to-blue-50 text-xs font-extrabold tracking-wide text-teal-900">{programme.mark}</span>
            <h3 className="relative mt-6 text-lg font-semibold tracking-tight text-[#122b55]">{programme.title}</h3>
            <p className="relative mt-2 text-sm leading-6 text-slate-600">{programme.detail}</p>
            <span className="relative mt-6 block h-px w-full bg-gradient-to-r from-teal-700/30 to-transparent" />
            <span className="relative mt-4 block text-xs font-bold text-slate-500">Programme category {String(index + 1).padStart(2, "0")}</span>
          </article>)}
        </div>
      </div>
    </section>

    <section id="how-it-works" className="home-section home-section-tint py-16 sm:py-20">
      <div className="page-wrap">
        <div className="surface-card overflow-hidden p-6 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
            <div><p className="section-kicker">How it works</p><h2 className="mt-3 text-3xl text-[#122b55] sm:text-4xl">Register once, then stay in touch.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Your profile helps the College keep track of postgraduate alumni.</p><Link href="/how-it-works" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 underline underline-offset-4">See the full process <span aria-hidden="true">{"\u2192"}</span></Link></div>
            <div className="divide-y divide-slate-200/80">
              {steps.map((step) => <article key={step.number} className="group grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[3.25rem_1fr] sm:gap-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-xs font-extrabold text-teal-800 ring-1 ring-teal-800/10 transition group-hover:bg-teal-700 group-hover:text-white">{step.number}</span>
                <div><h3 className="font-semibold text-[#122b55]">{step.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p></div>
              </article>)}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="home-cta relative overflow-hidden bg-[#0b1c38] py-16 text-white sm:py-20">
      <div className="absolute inset-0 opacity-30" aria-hidden="true"><div className="absolute -right-20 -top-36 h-80 w-80 rounded-full border border-white/30"/><div className="absolute -right-4 -top-20 h-52 w-52 rounded-full border border-white/20"/></div>
      <div className="page-wrap relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f2c56b]">Career records</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Update your postgraduate profile.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Register to record your programme and employment information.</p></div><Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e0a63a] px-5 py-3 text-sm font-bold text-[#0b1c38] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#f0b84d]">Register as a student <span className="ml-2" aria-hidden="true">→</span></Link></div>
    </section>
    <SiteFooter />
  </main>;
}
