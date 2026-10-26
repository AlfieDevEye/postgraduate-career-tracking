/** Add calendar months and clamp dates that do not exist in the target month. */
export function addMonths(value, months) {
  const date = new Date(`${value}T12:00:00.000Z`);
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.toISOString().slice(0, 10);
}

export function isWithinTrackingPeriod(isActive, trackingEndDate, now = new Date()) {
  return Boolean(isActive && trackingEndDate && new Date(`${trackingEndDate}T23:59:59.999Z`) >= now);
}
