const optionalStringFields = {
  location: { max: 160, label: "Location" },
  description: { max: 4000, label: "Description" },
  application_url: { label: "Application link" },
  closes_at: { label: "Closing date" },
};

function trimmedString(value) {
  return typeof value === "string" ? value.trim() : null;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateJobInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Job details must be an object." };
  }

  const title = trimmedString(input.title);
  const employer = trimmedString(input.employer);
  if (!title) return { ok: false, error: "Title is required." };
  if (!employer) return { ok: false, error: "Employer is required." };
  if (title.length > 160) return { ok: false, error: "Title must be 160 characters or fewer." };
  if (employer.length > 160) return { ok: false, error: "Employer must be 160 characters or fewer." };

  const value = { title, employer };
  for (const [field, { max, label }] of Object.entries(optionalStringFields)) {
    const raw = input[field];
    if (raw !== null && raw !== undefined && typeof raw !== "string") {
      return { ok: false, error: `${label} must be a string.` };
    }
    const trimmed = trimmedString(raw);
    if (trimmed && max !== undefined && trimmed.length > max) {
      return { ok: false, error: `${label} must be ${max} characters or fewer.` };
    }
    value[field] = trimmed || null;
  }

  if (value.application_url) {
    let url;
    try {
      url = new URL(value.application_url);
    } catch {
      return { ok: false, error: "Application link must be a valid HTTP or HTTPS URL." };
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "Application link must use HTTP or HTTPS." };
    }
  }

  if (value.closes_at && !validDate(value.closes_at)) {
    return { ok: false, error: "Closing date must be a valid YYYY-MM-DD date." };
  }

  if (input.is_active !== undefined && typeof input.is_active !== "boolean") {
    return { ok: false, error: "Active must be a boolean." };
  }
  value.is_active = input.is_active ?? true;

  return { ok: true, value };
}
