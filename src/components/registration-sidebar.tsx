import { stepStatus } from "@/lib/step-status.mjs";
export function RegistrationSidebar({ steps, current }: { steps: readonly string[]; current: number }) {
  return <nav aria-label="Registration progress" className="reg-side hidden lg:block">
    <ol className="reg-side-list">
      {steps.map((label, index) => {
        const status = stepStatus(index, current);
        return <li key={label} className="reg-side-item" data-status={status} aria-current={status === "current" ? "step" : undefined}>
          <span className="reg-side-dot" aria-hidden="true">{status === "complete" ? "\u2713" : ""}</span>
          <span className="reg-side-label">{label}{status === "complete" && <span className="sr-only"> (completed)</span>}</span>
        </li>;
      })}
    </ol>
  </nav>;
}
