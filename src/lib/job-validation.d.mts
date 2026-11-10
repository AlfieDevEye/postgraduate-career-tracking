export type JobInput = {
  title: string;
  employer: string;
  location: string | null;
  description: string | null;
  application_url: string | null;
  closes_at: string | null;
  is_active: boolean;
};

export function validateJobInput(
  input: unknown
):
  | { ok: true; value: JobInput }
  | { ok: false; error: string };
