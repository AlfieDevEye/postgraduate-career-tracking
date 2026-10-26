import { NextResponse } from "next/server";
import { addMonths, requireAdmin } from "@/lib/tracking-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    const { data, error } = await access.db.from("tracking_settings")
      .select("frequency_months,tracking_period_years,is_active")
      .eq("is_active", true).limit(1).maybeSingle();
    if (error) throw new Error(`Could not load tracking settings: ${error.message}`);
    return NextResponse.json({ settings: data ?? null });
  } catch (error) {
    console.error("Tracking settings read failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    const { frequencyMonths } = await request.json() as { frequencyMonths?: number };
    if (![3, 6, 9].includes(Number(frequencyMonths))) return NextResponse.json({ error: "Frequency must be 3, 6, or 9 months." }, { status: 400 });

    const { data: settings, error: readError } = await access.db.from("tracking_settings")
      .select("id,frequency_months,tracking_period_years,is_active").eq("is_active", true).limit(2);
    if (readError) throw new Error(`Could not inspect tracking settings: ${readError.message}`);
    const active = settings ?? [];
    if (active.length > 1) throw new Error("More than one active tracking_settings row exists. Resolve this before changing the interval.");
    if (active.length === 1) {
      const { error } = await access.db.from("tracking_settings").update({ frequency_months: Number(frequencyMonths), tracking_period_years: 5 }).eq("id", active[0].id);
      if (error) throw new Error(`Could not save tracking settings: ${error.message}`);
    } else {
      const { error } = await access.db.from("tracking_settings").insert({ frequency_months: Number(frequencyMonths), tracking_period_years: 5, is_active: true });
      if (error) throw new Error(`Could not create active tracking settings: ${error.message}`);
    }

    const { data: rows, error: trackingError } = await access.db.from("student_tracking")
      .select("id,last_update_date,tracking_start_date,tracking_end_date")
      .eq("is_active", true);
    if (trackingError) throw new Error(`Settings saved, but existing schedules could not be loaded: ${trackingError.message}`);
    for (const row of rows ?? []) {
      if (!row.tracking_end_date || row.tracking_end_date < new Date().toISOString().slice(0, 10)) continue;
      const base = row.last_update_date ?? row.tracking_start_date;
      if (!base) continue;
      const { error } = await access.db.from("student_tracking").update({ next_update_date: addMonths(base, Number(frequencyMonths)) }).eq("id", row.id);
      if (error) throw new Error(`Settings saved, but schedule ${row.id} could not be recalculated: ${error.message}`);
    }
    return NextResponse.json({ saved: true, frequencyMonths: Number(frequencyMonths), trackingPeriodYears: 5, schedulesUpdated: rows?.length ?? 0 });
  } catch (error) {
    console.error("Tracking settings update failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save settings" }, { status: 500 });
  }
}
