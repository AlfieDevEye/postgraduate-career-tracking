import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tracking-server";
import { validateJobInput } from "@/lib/job-validation.mjs";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Job opportunity ID is required." }, { status: 400 });

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const { data: existing, error: readError } = await access.db.from("job_opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw new Error(`Could not load job opportunity: ${readError.message}`);
    if (!existing) return NextResponse.json({ error: "Job opportunity not found." }, { status: 404 });

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Job details must be an object." }, { status: 400 });
    }
    const validation = validateJobInput({ ...existing, ...input });
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { data, error } = await access.db.from("job_opportunities")
      .update(validation.value)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`Could not update job opportunity: ${error.message}`);
    return NextResponse.json({ job: data });
  } catch (error) {
    console.error("Admin job opportunity update failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update job opportunity" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Job opportunity ID is required." }, { status: 400 });

    const { data, error } = await access.db.from("job_opportunities")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(`Could not delete job opportunity: ${error.message}`);
    if (!data) return NextResponse.json({ error: "Job opportunity not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Admin job opportunity delete failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete job opportunity" }, { status: 500 });
  }
}
