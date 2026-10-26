import Link from "next/link";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";

export default function NotFound() {
  return <main id="main-content" className="min-h-screen text-slate-900">
    <InstitutionHeader><Link href="/register" className="button-primary !min-h-10 !px-3 !py-2 text-xs sm:text-sm">Register</Link></InstitutionHeader>
    <div className="page-wrap-narrow grid min-h-[70vh] place-items-center py-14 text-center">
      <section className="surface-card w-full p-8 sm:p-12">
        <span className="eyebrow-pill">Page not found</span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gradient">This page isn’t here.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600">The address may have changed, or the page may no longer be available.</p>
        <Link href="/" className="button-primary mt-7">Return to the homepage <span aria-hidden="true">→</span></Link>
      </section>
    </div>
    <SiteFooter />
  </main>;
}
