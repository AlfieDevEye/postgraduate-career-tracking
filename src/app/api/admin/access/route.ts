import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tracking-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await requireAdmin(request);
    if ("error" in access) return access.error;
    return NextResponse.json({ authorized: true, email: access.adminEmail });
  } catch (error) {
    console.error("Admin access check failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify administrator access" }, { status: 500 });
  }
}
