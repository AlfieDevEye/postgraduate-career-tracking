export function stepStatus(index, current) {
  if (index < current) return "complete";
  if (index === current) return "current";
  return "upcoming";
}
