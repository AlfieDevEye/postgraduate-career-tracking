export type StepStatus = "complete" | "current" | "upcoming";
export function stepStatus(index: number, current: number): StepStatus;
