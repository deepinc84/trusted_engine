import { NextRequest, NextResponse } from "next/server";
import { runOutreachWorker } from "@/lib/outreach/worker";
import { discoverRoofingProspects } from "@/lib/outreach/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const secret = process.env.OUTREACH_WORKER_SECRET;
  if (!secret) return NextResponse.json({ error: "OUTREACH_WORKER_SECRET missing" }, { status: 503 });

  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("secret");
  if (supplied !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const outreach = await runOutreachWorker(10);

    let discovery: unknown = null;
    let discovery_error: string | null = null;
    try {
      discovery = await discoverRoofingProspects();
    } catch (error) {
      discovery_error = error instanceof Error ? error.message : "Discovery failed";
    }

    return NextResponse.json({ ...outreach, discovery, discovery_error });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Worker failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handle(req); }
export async function GET(req: NextRequest) { return handle(req); }
