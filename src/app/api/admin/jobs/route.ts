import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tracking-server";
import { validateJobInput } from "@/lib/job-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    const { data, error } = await access.db.from("job_opportunities")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Could not load job opportunities: ${error.message}`);
    return NextResponse.json({ jobs: data ?? [] });
  } catch (error) {
    console.error("Admin job opportunity list failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load job opportunities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const validation = validateJobInput(input);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { data, error } = await access.db.from("job_opportunities")
      .insert(validation.value)
      .select("*")
      .single();
    if (error) throw new Error(`Could not create job opportunity: ${error.message}`);
    return NextResponse.json({ job: data }, { status: 201 });
  } catch (error) {
    console.error("Admin job opportunity create failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create job opportunity" }, { status: 500 });
  }
}
