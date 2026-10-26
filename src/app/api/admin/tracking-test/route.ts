import { NextResponse } from "next/server";
import { addMonths, getReminderTemplate, isTrackable, logTestRun, requireAdmin, sendReminderEmail, type TrackingRow } from "@/lib/tracking-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    const { data, error } = await access.db.from("student_tracking")
      .select("id,student_id,tracking_start_date,tracking_end_date,last_update_date,next_update_date,is_active,last_email_sent_at")
      .eq("is_active", true)
      .order("tracking_start_date", { ascending: false });
    if (error) throw new Error(`Could not load active tracking records: ${error.message}`);
    const studentIds = [...new Set((data ?? []).map((row) => row.student_id))];
    const { data: profiles, error: profilesError } = studentIds.length
      ? await access.db.from("student_profiles").select("student_id,first_name,last_name,email").in("student_id", studentIds)
      : { data: [], error: null };
    if (profilesError) throw new Error(`Could not load student labels: ${profilesError.message}`);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.student_id, profile]));
    return NextResponse.json({ records: (data ?? []).map((row) => ({ ...row, student: profileMap.get(row.student_id) ?? null })) });
  } catch (error) {
    console.error("Admin tracking test list failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load tracking records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let adminEmail: string | undefined;
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    adminEmail = access.adminEmail;
    const body = await request.json() as { trackingId?: string; frequencyMonths?: number; mode?: string };
    const { trackingId, frequencyMonths, mode } = body;
    if (!trackingId || ![3, 6, 9].includes(Number(frequencyMonths)) || !["simulate", "send"].includes(String(mode))) {
      return NextResponse.json({ error: "Choose one tracking record, an interval of 3, 6, or 9 months, and simulate or send mode." }, { status: 400 });
    }
    const testMode = mode as "simulate" | "send";

    const { data: tracking, error } = await access.db.from("student_tracking")
      .select("id,student_id,tracking_start_date,tracking_end_date,last_update_date,next_update_date,is_active,last_email_sent_at")
      .eq("id", trackingId)
      .maybeSingle();
    if (error) throw new Error(`Could not load tracking record: ${error.message}`);
    if (!tracking || !isTrackable(tracking as TrackingRow)) return NextResponse.json({ error: "This tracking record is missing, inactive, or expired." }, { status: 404 });

    const { data: profile, error: profileError } = await access.db.from("student_profiles")
      .select("student_id,first_name,last_name,email").eq("student_id", tracking.student_id).maybeSingle();
    if (profileError) throw new Error(`Could not load student profile: ${profileError.message}`);
    if (!profile?.email) return NextResponse.json({ error: "Selected student has no email address." }, { status: 422 });

    const scheduleBase = tracking.last_update_date ?? tracking.tracking_start_date;
    const nextDueDate = addMonths(scheduleBase, Number(frequencyMonths));
    const template = await getReminderTemplate(access.db);
    if (testMode === "simulate") {
      const audit = await logTestRun(access.db, { adminEmail, studentId: tracking.student_id, trackingId, frequencyMonths: Number(frequencyMonths), mode: testMode, result: "simulated" });
      return NextResponse.json({ mode: testMode, result: "simulated", emailSent: false, auditLogged: audit.logged, auditError: audit.error, student: `${profile.first_name} ${profile.last_name}`, recipient: profile.email, frequencyMonths: Number(frequencyMonths), wouldBeDueDate: nextDueDate, trackingDatesChanged: false, subject: template.subject });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const { data: priorTest, error: priorTestError } = await access.db.from("tracking_test_runs")
      .select("id")
      .eq("tracking_id", trackingId)
      .eq("frequency_months", Number(frequencyMonths))
      .eq("mode", "send")
      .eq("result", "email_sent")
      .gte("created_at", today.toISOString())
      .limit(1);
    if (priorTestError) throw new Error(`Could not check duplicate test sends: ${priorTestError.message}`);
    if (priorTest?.length) return NextResponse.json({ mode: testMode, result: "duplicate_prevented", emailSent: false, reason: "A test email for this selected record and interval was already sent today." }, { status: 409 });

    const delivery = await sendReminderEmail(profile.email, profile.first_name, template);
    if (!delivery.sent) {
      const audit = await logTestRun(access.db, { adminEmail, studentId: tracking.student_id, trackingId, frequencyMonths: Number(frequencyMonths), mode: testMode, result: "not_sent", error: delivery.reason });
      return NextResponse.json({ mode: testMode, result: "not_sent", emailSent: false, auditLogged: audit.logged, auditError: audit.error, recipient: profile.email, reason: delivery.reason, trackingDatesChanged: false }, { status: 503 });
    }

    const sentAt = new Date().toISOString();
    const { error: communicationError } = await access.db.from("tracking_communications").insert({
      student_id: tracking.student_id,
      tracking_id: trackingId,
      communication_type: "employment_update_reminder_test",
      sent_at: sentAt,
      status: "sent",
      reminder_count: 1,
    });
    const audit = await logTestRun(access.db, { adminEmail, studentId: tracking.student_id, trackingId, frequencyMonths: Number(frequencyMonths), mode: testMode, result: communicationError ? "email_sent_log_failed" : "email_sent", error: communicationError?.message ?? null });
    return NextResponse.json({ mode: testMode, result: communicationError ? "email_sent_log_failed" : "email_sent", emailSent: true, auditLogged: audit.logged, auditError: audit.error, recipient: profile.email, providerId: delivery.providerId, trackingDatesChanged: false, communicationLogged: !communicationError, communicationLogError: communicationError?.message });
  } catch (error) {
    console.error("Admin tracking test failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Tracking test failed" }, { status: 500 });
  }
}
