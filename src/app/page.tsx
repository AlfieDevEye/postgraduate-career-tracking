import Link from "next/link";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";

const programmes = [
  { title: "Postgraduate Diploma", detail: "Build specialist knowledge and prepare for the next stage of your career.", mark: "PGD" },
  { title: "Master’s programmes", detail: "Connect advanced study with changing professional goals.", mark: "MSc" },
  { title: "Doctoral programmes", detail: "Record the professional paths that follow research and scholarship.", mark: "PhD" },
];

const steps = [
  { number: "01", title: "Create your profile", body: "Share your postgraduate programme, skills and current employment information." },
  { number: "02", title: "Keep your details current", body: "Respond to periodic requests to confirm or update your employment information." },
  { number: "03", title: "Stay connected", body: "Help the College understand graduate career progression over time." },
];

export default function Home() {
  return <main id="main-content" className="overflow-hidden text-slate-900">
    <InstitutionHeader>
      <nav aria-label="Main navigation" className="flex items-center gap-6">
        <Link href="#programmes" className="rounded-md px-1 py-2 text-sm font-semibold text-slate-600 hover:text-teal-800">Programmes</Link>
        <Link href="#how-it-works" className="rounded-md px-1 py-2 text-sm font-semibold text-slate-600 hover:text-teal-800">How it works</Link>
        <Link href="#about" className="rounded-md px-1 py-2 text-sm font-semibold text-slate-600 hover:text-teal-800">About</Link>
      </nav>
      <Link href="/login" className="button-secondary">Student login</Link>
      <Link href="/register" className="button-primary !min-h-10 !px-3 !py-2 text-xs sm:!px-4 sm:text-sm">Register <span aria-hidden="true">↗</span></Link>
    </InstitutionHeader>
    <section className="home-hero relative isolate overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-24 lg:pt-28">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="page-wrap relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div className="soft-rise max-w-2xl">
          <span className="eyebrow-pill"><span className="h-2 w-2 rounded-full bg-teal-700" /> Postgraduate Career Tracking</span>
          <h1 className="mt-6 text-[2.65rem] font-semibold leading-[1.08] tracking-[-.05em] text-gradient sm:text-6xl lg:text-[4.25rem]">
            Postgraduate career records in one place.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Record your programme, skills and employment details for Redeemers University College of Postgraduate Studies.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="button-primary">Create your profile <span aria-hidden="true">→</span></Link>
            <Link href="/login" className="button-secondary">Student login</Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-700" />For postgraduate students and graduates</span>
            <span className="hidden h-4 w-px bg-slate-300 sm:block" />
            <span>Redeemers University</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem] soft-rise [animation-delay:120ms]" aria-hidden="true">
          <div className="relative aspect-[1.08/1] overflow-hidden rounded-[2rem] border border-slate-200 bg-[#edf3f6] shadow-[0_20px_48px_rgba(17,44,78,.10)]">
            <div className="absolute left-[12%] top-[14%] h-[72%] w-[76%] rounded-[48%] border border-teal-800/10" />
            <div className="absolute left-[20%] top-[21%] h-[58%] w-[60%] rounded-[48%] border border-teal-800/10" />
            <div className="absolute left-[29%] top-[29%] h-[42%] w-[42%] rounded-[48%] border border-teal-800/15" />
            <div className="absolute left-1/2 top-[47%] grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2.4rem] border border-white bg-white shadow-[0_16px_36px_rgba(15,45,77,.10)] sm:h-44 sm:w-44">
              <div className="grid h-24 w-24 place-items-center rounded-[1.8rem] bg-gradient-to-br from-[#17365f] to-[#147d82] shadow-lg sm:h-28 sm:w-28">
                <div className="text-center text-white"><span className="block text-3xl font-semibold tracking-tight sm:text-4xl">RU</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.2em] text-teal-100">Career path</span></div>
              </div>
            </div>
            <div className="absolute bottom-[9%] left-[8%] rounded-2xl border border-white/90 bg-white/85 px-4 py-3 shadow-lg backdrop-blur">
              <span className="block text-[10px] font-bold uppercase tracking-[.15em] text-teal-800">Learning</span><span className="mt-1 block text-sm font-semibold text-slate-800">Postgraduate study</span>
            </div>
            <div className="absolute right-[8%] top-[10%] rounded-2xl border border-white/90 bg-white/85 px-4 py-3 shadow-lg backdrop-blur">
              <span className="block text-[10px] font-bold uppercase tracking-[.15em] text-blue-800">Progress</span><span className="mt-1 block text-sm font-semibold text-slate-800">Career development</span>
            </div>
            <div className="absolute bottom-[13%] right-[8%] h-3 w-3 rounded-full bg-[#c6a04a] shadow-[0_0_0_8px_rgba(198,160,74,.14)]" />
            <div className="absolute left-[11%] top-[43%] h-2 w-2 rounded-full bg-teal-700 shadow-[0_0_0_7px_rgba(20,125,130,.12)]" />
          </div>
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
            <div><p className="section-kicker">A straightforward process</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#122b55] sm:text-4xl">Keep your career story up to date.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Your updates help maintain a record of graduate employment and professional progress over time.</p></div>
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

    <section id="about" className="home-section pb-16 pt-4 sm:pb-20">
      <div className="page-wrap grid gap-8 md:grid-cols-2">
        <article className="rounded-[1.5rem] bg-[#10284e] p-7 text-white shadow-[0_22px_52px_rgba(16,40,78,.16)] sm:p-9"><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">For graduates</p><h2 className="mt-4 text-2xl font-semibold tracking-tight">A simple way to keep your profile current.</h2><p className="mt-3 text-sm leading-7 text-blue-100">Share changes in your employment and career information with the College as your professional journey evolves.</p><Link href="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-teal-300 underline-offset-4 hover:text-teal-100">Start your registration <span aria-hidden="true">→</span></Link></article>
        <article className="surface-card p-7 sm:p-9"><p className="section-kicker">For the College</p><h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#122b55]">Stay connected with graduate outcomes.</h2><p className="mt-3 text-sm leading-7 text-slate-600">A structured record of postgraduate career updates supports the College’s ongoing understanding of alumni employment and progression.</p><div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-[#8b6a22]">◆</span><p className="text-xs font-medium leading-5 text-slate-600">Built around postgraduate profiles and periodic employment updates.</p></div></article>
      </div>
    </section>

    <section className="home-cta relative overflow-hidden bg-gradient-to-r from-[#0b1c38] via-[#122b55] to-[#147d82] py-16 text-white sm:py-20">
      <div className="absolute inset-0 opacity-30" aria-hidden="true"><div className="absolute -right-20 -top-36 h-80 w-80 rounded-full border border-white/30"/><div className="absolute -right-4 -top-20 h-52 w-52 rounded-full border border-white/20"/></div>
      <div className="page-wrap relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">Career records</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Update your postgraduate profile.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Register to record your programme and employment information.</p></div><Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#10284e] shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-50">Register as a student <span className="ml-2" aria-hidden="true">→</span></Link></div>
    </section>
    <SiteFooter />
  </main>;
}
