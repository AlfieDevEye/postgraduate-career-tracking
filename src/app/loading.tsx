export default function Loading() {
  return <main id="main-content" aria-busy="true" aria-live="polite" className="page-wrap-narrow grid min-h-[70vh] content-center py-12">
    <div className="surface-card p-6 sm:p-9">
      <span className="section-kicker">Loading page</span>
      <div className="mt-5 h-8 w-2/3 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
      <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="h-24 animate-pulse rounded-2xl bg-teal-50"/><div className="h-24 animate-pulse rounded-2xl bg-blue-50"/></div>
      <span className="sr-only">Loading, please wait.</span>
    </div>
  </main>;
}
