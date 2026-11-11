import Link from "next/link";
import { MarketingPage } from "@/components/marketing-page";

export default function NotFound() {
  return <MarketingPage>
    <section className="page-wrap grid min-h-[70vh] place-items-center py-14 text-center">
      <div className="surface-card w-full max-w-2xl rounded-2xl p-8 sm:p-12">
        <h1 className="text-4xl text-[#122b55] sm:text-5xl">Welcome! But page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600">The page you are looking for could not be found.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="button-primary">Go to home page</Link>
          <Link href="/contact" className="button-secondary">Contact</Link>
        </div>
      </div>
    </section>
  </MarketingPage>;
}
