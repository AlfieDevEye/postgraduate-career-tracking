import { stepStatus } from "@/lib/step-status.mjs";
export function RegistrationStepper({ steps, current }: { steps: readonly string[]; current: number }) {
  const done = current >= steps.length;
  const fill = done ? 100 : ((current + 0.5) / steps.length) * 100;
  const summary = done ? "All steps complete" : `Step ${current + 1} of ${steps.length} \u00b7 ${steps[current]}`;
  return <div className="reg-steps">
    <p className="reg-steps-summary" aria-hidden="true">{summary}</p>
    <div className="reg-bar" aria-hidden="true"><span className="reg-bar-fill" style={{ width: `${fill}%` }} /></div>
    <ol className="reg-steps-list" aria-label="Registration steps">
      {steps.map((label, index) => {
        const status = stepStatus(index, current);
        return <li key={label} className="reg-step" data-status={status} aria-current={status === "current" ? "step" : undefined}>
          {status === "complete" && <span aria-hidden="true">{"\u2713"} </span>}
          {label}
          {status === "complete" && <span className="sr-only"> (completed)</span>}
        </li>;
      })}
    </ol>
  </div>;
}
