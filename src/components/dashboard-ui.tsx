import type { ReactNode } from "react";

export function StatCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon: ReactNode; hint?: string }) {
  return <article className="surface-card flex min-w-0 items-start gap-4 rounded-2xl p-4 sm:p-5">
    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  </article>;
}

const badgeStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function Badge({ tone, children }: { tone: keyof typeof badgeStyles; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyles[tone]}`}>{children}</span>;
}

export function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded motion-reduce:animate-none ${className}`} />;
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-card px-5 py-10 text-center">
    <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-teal-50 text-teal-800">{icon}</span>
    <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
    {body && <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">{body}</p>}
  </div>;
}

export function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  return <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-lg font-bold text-teal-800">{initials}</span>;
}
