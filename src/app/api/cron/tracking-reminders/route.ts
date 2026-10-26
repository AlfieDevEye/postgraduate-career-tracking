import { NextResponse } from "next/server";
import { addMonths, getReminderTemplate, isTrackable, sendReminderEmail, serviceClient, type TrackingRow } from "@/lib/tracking-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cronSecret = process.env.TRACKING_CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = serviceClient();
    const { data: settings, error: settingsError } = await db.from("tracking_settings")
      .select("frequency_months,tracking_period_years,is_active")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (settingsError) throw new Error(`Could not load active tracking settings: ${settingsError.message}`);
    if (!settings) return NextResponse.json({ sent: 0, skipped: 0, message: "No active tracking settings row; no reminders were processed." });
    if (![3, 6, 9].includes(settings.frequency_months)) throw new Error("Active tracking frequency must be 3, 6, or 9 months.");

    const { data: rows, error: trackingError } = await db.from("student_tracking")
      .select("id,student_id,tracking_start_date,tracking_end_date,last_update_date,next_update_date,is_active,last_email_sent_at")
      .eq("is_active", true)
      .lte("next_update_date", new Date().toISOString().slice(0, 10));
    if (trackingError) throw new Error(`Could not load due tracking records: ${trackingError.message}`);

    const template = await getReminderTemplate(db);
    const today = new Date().toISOString().slice(0, 10);
    let sent = 0;
    let skipped = 0;
    const failures: Array<{ trackingId: string; error: string }> = [];
    for (const raw of rows ?? []) {
      const tracking = raw as TrackingRow;
      if (!isTrackable(tracking)) { skipped++; continue; }

      // Responses may have advanced last_update_date since the stored due date
      // was written. Reconcile only this selected active record before deciding.
      const scheduleBase = tracking.last_update_date ?? tracking.tracking_start_date;
      const canonicalDueDate = addMonths(scheduleBase, settings.frequency_months);
      if (tracking.next_update_date !== canonicalDueDate) {
        const { error: scheduleError } = await db.from("student_tracking").update({ next_update_date: canonicalDueDate }).eq("id", tracking.id);
        if (scheduleError) { failures.push({ trackingId: tracking.id, error: `Could not reconcile next_update_date: ${scheduleError.message}` }); continue; }
      }
      if (canonicalDueDate > today) { skipped++; continue; }

      const dedupeSince = canonicalDueDate;
      const { data: prior, error: priorError } = await db.from("tracking_communications")
        .select("tracking_id")
        .eq("tracking_id", tracking.id)
        .eq("communication_type", "employment_update_reminder")
        .gte("sent_at", `${dedupeSince}T00:00:00.000Z`)
        .limit(1);
      if (priorError) { failures.push({ trackingId: tracking.id, error: priorError.message }); continue; }
      if (prior?.length) { skipped++; continue; }

      const { data: profile, error: profileError } = await db.from("student_profiles")
        .select("first_name,email")
        .eq("student_id", tracking.student_id)
        .maybeSingle();
      if (profileError || !profile?.email) { failures.push({ trackingId: tracking.id, error: profileError?.message ?? "Student email is missing" }); continue; }

      const delivery = await sendReminderEmail(profile.email, profile.first_name, template);
      if (!delivery.sent) { failures.push({ trackingId: tracking.id, error: delivery.reason }); continue; }

      const sentAt = new Date().toISOString();
      const { error: commError } = await db.from("tracking_communications").insert({
        student_id: tracking.student_id,
        tracking_id: tracking.id,
        communication_type: "employment_update_reminder",
        sent_at: sentAt,
        status: "sent",
        reminder_count: 1,
      });
      if (commError) { failures.push({ trackingId: tracking.id, error: `Email sent but communication logging failed: ${commError.message}` }); continue; }

      const { error: updateError } = await db.from("student_tracking")
        .update({ last_email_sent_at: sentAt })
        .eq("id", tracking.id);
      if (updateError) failures.push({ trackingId: tracking.id, error: `Email sent and logged; last_email_sent_at was not updated: ${updateError.message}` });
      else sent++;
    }
    return NextResponse.json({ sent, skipped, failures });
  } catch (error) {
    console.error("Tracking reminder scheduler failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduler failed" }, { status: 500 });
  }
}
