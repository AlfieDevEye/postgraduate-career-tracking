import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/tracking-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const CHUNK_SIZE = 1000;
const DAY = 86_400_000;
type Row = Record<string, unknown>;

async function readAll(db: SupabaseClient, table: string, columns: string) {
  const output: Row[] = [];
  for (let from = 0; ; from += CHUNK_SIZE) {
    const { data, error } = await db.from(table).select(columns).range(from, from + CHUNK_SIZE - 1);
    if (error) throw new Error(`Could not load ${table}: ${error.message}`);
    const batch = (data ?? []) as unknown as Row[];
    output.push(...batch);
    if (batch.length < CHUNK_SIZE) return output;
  }
}

function countBy(rows: Row[], key: string, distinctKey?: string) {
  const result = new Map<string, Set<string>>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      const group = result.get(value) ?? new Set<string>();
      group.add(distinctKey && row[distinctKey] != null ? String(row[distinctKey]) : `${value}:${result.size}:${group.size}`);
      result.set(value, group);
    }
  }
  return [...result.entries()].map(([label, values]) => ({ label, count: values.size })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function GET(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;

    const url = new URL(request.url);
    const rawQuery = url.searchParams.get("q")?.trim() ?? "";
    if (rawQuery.length > 100 || /[^\p{L}\p{N}\s@._'\-]/u.test(rawQuery)) {
      return NextResponse.json({ error: "Search may contain letters, numbers, spaces, email punctuation, apostrophes, and hyphens only (100 characters maximum)." }, { status: 400 });
    }
    const page = Number(url.searchParams.get("page") ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 100_000) return NextResponse.json({ error: "Page must be a positive integer." }, { status: 400 });
    const degree = url.searchParams.get("degree")?.trim() ?? "";
    const employmentStatus = url.searchParams.get("employmentStatus")?.trim() ?? "";
    const trackingStatus = url.searchParams.get("trackingStatus")?.trim() ?? "";
    if (degree.length > 100 || employmentStatus.length > 100 || !["", "active", "upcoming", "overdue"].includes(trackingStatus)) {
      return NextResponse.json({ error: "One or more dashboard filters are invalid." }, { status: 400 });
    }

    const db = access.db;
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
    const [profiles, academics, employment, statuses, tracks, settings] = await Promise.all([
      db.from("student_profiles").select("student_id", { count: "exact", head: true }),
      readAll(db, "student_academic_records", "student_id,degree_type,programme_id"),
      readAll(db, "employment_history", "student_id,employment_status_id,is_current"),
      readAll(db, "employment_statuses", "id,name"),
      readAll(db, "student_tracking", "student_id,tracking_start_date,tracking_end_date,next_update_date,is_active"),
      db.from("tracking_settings").select("frequency_months,tracking_period_years").eq("is_active", true).limit(1).maybeSingle(),
    ]);
    if (profiles.error) throw new Error(`Could not load student profiles: ${profiles.error.message}`);
    if (settings.error) throw new Error(`Could not load tracking settings: ${settings.error.message}`);
    const activeTracks = (tracks as Row[]).filter((row) => row.is_active === true && typeof row.tracking_end_date === "string" && String(row.tracking_end_date) >= today);
    const overdue = activeTracks.filter((row) => typeof row.next_update_date === "string" && String(row.next_update_date) < today).length;
    const upcoming = activeTracks.filter((row) => typeof row.next_update_date === "string" && String(row.next_update_date) >= today && String(row.next_update_date) <= soon).length;
    const degreeCounts = countBy(academics as Row[], "degree_type", "student_id");
    const statusById = new Map((statuses as Row[]).map((row) => [String(row.id), String(row.name ?? "Other")]));
    const currentEmployment = (employment as Row[]).filter((row) => row.is_current === true);
    const employmentCounts = countBy(currentEmployment.map((row) => ({ student_id: row.student_id, status: statusById.get(String(row.employment_status_id)) ?? "Unmapped status" })), "status", "student_id");

    const eligibleIds = new Set<string>();
    if (degree) for (const row of academics as Row[]) if (row.degree_type === degree) eligibleIds.add(String(row.student_id));
    if (employmentStatus) {
      const statusId = (statuses as Row[]).find((row) => row.name === employmentStatus)?.id;
      const employmentIds = new Set((employment as Row[]).filter((row) => row.is_current === true && row.employment_status_id === statusId).map((row) => String(row.student_id)));
      if (!degree) for (const id of employmentIds) eligibleIds.add(id);
      else for (const id of [...eligibleIds]) if (!employmentIds.has(id)) eligibleIds.delete(id);
    }
    if (trackingStatus) {
      const trackingIds = new Set(activeTracks.filter((row) => {
        const due = typeof row.next_update_date === "string" ? String(row.next_update_date) : "";
        return trackingStatus === "active" || (trackingStatus === "overdue" && due < today) || (trackingStatus === "upcoming" && due >= today && due <= soon);
      }).map((row) => String(row.student_id)));
      if (!degree && !employmentStatus) for (const id of trackingIds) eligibleIds.add(id);
      else for (const id of [...eligibleIds]) if (!trackingIds.has(id)) eligibleIds.delete(id);
    }

    let query = db.from("student_profiles").select("student_id,first_name,middle_name,last_name,email", { count: "exact" });
    if (rawQuery) {
      const term = `%${rawQuery}%`;
      query = query.or(`first_name.ilike."${term}",middle_name.ilike."${term}",last_name.ilike."${term}",email.ilike."${term}"`);
    }
    if (degree || employmentStatus || trackingStatus) {
      if (!eligibleIds.size) return NextResponse.json({ metrics: { totalStudents: profiles.count ?? 0, activeTracking: activeTracks.length, upcomingTracking: upcoming, overdueTracking: overdue, frequencyMonths: settings.data?.frequency_months ?? null }, degreeCounts, employmentCounts, options: { degrees: degreeCounts.map((item) => item.label), employmentStatuses: [...new Set((statuses as Row[]).map((row) => String(row.name ?? "")).filter(Boolean))].sort() }, students: [], page, pageSize: PAGE_SIZE, totalMatches: 0, totalPages: 0 });
      query = query.in("student_id", [...eligibleIds]);
    }
    query = query.order("last_name", { ascending: true }).order("first_name", { ascending: true }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data: students, error: studentsError, count } = await query;
    if (studentsError) throw new Error(`Could not search students: ${studentsError.message}`);

    const ids = (students ?? []).map((row) => row.student_id);
    const [pageAcademics, pageEmployment, pageTracks] = ids.length ? await Promise.all([
      db.from("student_academic_records").select("student_id,degree_type,programme_id").in("student_id", ids),
      db.from("employment_history").select("student_id,employment_status_id").eq("is_current", true).in("student_id", ids),
      db.from("student_tracking").select("student_id,next_update_date,is_active,tracking_end_date").eq("is_active", true).in("student_id", ids),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    for (const [name, result] of [["academic records", pageAcademics], ["employment records", pageEmployment], ["tracking records", pageTracks]] as const) {
      if (result.error) throw new Error(`Could not load student ${name}: ${result.error.message}`);
    }
    const academicMap = new Map((pageAcademics.data ?? []).map((row) => [row.student_id, row]));
    const employmentMap = new Map((pageEmployment.data ?? []).map((row) => [row.student_id, statusById.get(String(row.employment_status_id)) ?? "Unmapped status"]));
    const trackingMap = new Map((pageTracks.data ?? []).map((row) => [row.student_id, row]));
    const resultRows = (students ?? []).map((student) => {
      const tracking = trackingMap.get(student.student_id);
      let trackingLabel = "No active tracking";
      if (tracking && String(tracking.tracking_end_date ?? "") >= today) {
        const due = String(tracking.next_update_date ?? "");
        trackingLabel = due && due < today ? "Overdue" : due && due <= soon ? "Upcoming" : "Active";
      }
      return {
        name: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
        email: student.email,
        degreeType: academicMap.get(student.student_id)?.degree_type ?? "Not recorded",
        employmentStatus: employmentMap.get(student.student_id) ?? "Not recorded",
        trackingStatus: trackingLabel,
      };
    });

    return NextResponse.json({
      metrics: { totalStudents: profiles.count ?? 0, activeTracking: activeTracks.length, upcomingTracking: upcoming, overdueTracking: overdue, frequencyMonths: settings.data?.frequency_months ?? null },
      degreeCounts,
      employmentCounts,
      options: { degrees: degreeCounts.map((item) => item.label), employmentStatuses: [...new Set((statuses as Row[]).map((row) => String(row.name ?? "")).filter(Boolean))].sort() },
      students: resultRows,
      page,
      pageSize: PAGE_SIZE,
      totalMatches: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (error) {
    console.error("Admin dashboard request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load dashboard data" }, { status: 500 });
  }
}
