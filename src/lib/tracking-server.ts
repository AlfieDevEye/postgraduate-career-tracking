import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addMonths, isWithinTrackingPeriod } from "@/lib/tracking-schedule.mjs";

export { addMonths } from "@/lib/tracking-schedule.mjs";

export type TrackingRow = {
  id: string;
  student_id: string;
  tracking_start_date: string;
  tracking_end_date: string;
  last_update_date: string | null;
  next_update_date: string | null;
  is_active: boolean;
  last_email_sent_at: string | null;
};

export type ReminderSettings = {
  frequency_months: number;
  tracking_period_years: number;
  is_active: boolean;
};

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireAdmin(request: Request, db = serviceClient()) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user?.email) return { error: Response.json({ error: "Invalid session" }, { status: 401 }) };

  const { data: admin, error: adminError } = await db
    .from("admin_users")
    .select("email,role,is_active")
    .ilike("email", data.user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) throw new Error(`Could not verify admin access: ${adminError.message}`);
  if (!admin || !["admin", "super_admin"].includes(String(admin.role).toLowerCase())) {
    return { error: Response.json({ error: "Administrator access required" }, { status: 403 }) };
  }

  return { adminEmail: admin.email as string, db };
}

export function dueDate(tracking: TrackingRow, settings: ReminderSettings): string {
  return tracking.next_update_date ?? addMonths(tracking.last_update_date ?? tracking.tracking_start_date, settings.frequency_months);
}

export function isTrackable(tracking: TrackingRow, now = new Date()): boolean {
  return isWithinTrackingPeriod(tracking.is_active, tracking.tracking_end_date, now);
}

export function defaultTemplate() {
  return {
    subject: "Please update your postgraduate employment information",
    body: "Dear {{first_name}},\n\nPlease take a moment to confirm or update your employment information with Redeemers University College of Postgraduate Studies.\n\nThank you,\nCollege of Postgraduate Studies",
  };
}

export async function getReminderTemplate(db: SupabaseClient) {
  const { data, error } = await db.from("email_templates")
    .select("template_name,template_type,subject,body,is_active")
    .eq("is_active", true)
    .limit(100);
  if (error) throw new Error(`Could not load reminder email template: ${error.message}`);
  const selected = (data ?? []).find((item) =>
    `${item.template_name ?? ""} ${item.template_type ?? ""}`.toLowerCase().includes("employment")
    && `${item.template_name ?? ""} ${item.template_type ?? ""}`.toLowerCase().includes("remind")
    && item.subject && item.body,
  );
  return selected ? { subject: selected.subject as string, body: selected.body as string } : defaultTemplate();
}

export function renderTemplate(value: string, firstName: string) {
  return value.replace(/{{\s*first_name\s*}}/gi, firstName || "Graduate");
}

export async function sendReminderEmail(to: string, firstName: string, template: { subject: string; body: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false as const, reason: "Email delivery is not configured (RESEND_API_KEY and RESEND_FROM_EMAIL are required)." };

  const renderedBody = renderTemplate(template.body, firstName);
  const body = renderedBody.includes("<")
    ? { html: renderedBody }
    : { text: renderedBody };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: renderTemplate(template.subject, firstName),
      ...body,
    }),
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) return { sent: false as const, reason: result.message ?? `Email provider returned HTTP ${response.status}.` };
  return { sent: true as const, providerId: result.id ?? null };
}

export async function logTestRun(db: SupabaseClient, input: {
  adminEmail: string;
  studentId: string;
  trackingId: string;
  frequencyMonths: number;
  mode: "simulate" | "send";
  result: string;
  error?: string | null;
}) {
  const { error } = await db.from("tracking_test_runs").insert({
    admin_email: input.adminEmail,
    student_id: input.studentId,
    tracking_id: input.trackingId,
    frequency_months: input.frequencyMonths,
    mode: input.mode,
    result: input.result,
    error_message: input.error ?? null,
  });
  if (error) console.error("Could not save tracking test audit row:", error.message);
  return { logged: !error, error: error?.message ?? null };
}
