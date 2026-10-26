"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application route error:", error); }, [error]);
  return <main id="main-content" className="page-wrap-narrow grid min-h-[75vh] place-items-center py-12">
    <section className="surface-card w-full p-7 sm:p-10" role="alert">
      <span className="eyebrow-pill !border-red-200 !bg-red-50 !text-red-800">Page issue</span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#122b55]">We couldn’t load this page.</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">Something interrupted this page. You can try loading it again.</p>
      {error.digest && <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>}
      <button type="button" onClick={() => reset()} className="button-primary mt-6">Try again</button>
    </section>
  </main>;
}
