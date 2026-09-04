import { NextRequest, NextResponse } from "next/server";
import { runOutreachWorker } from "@/lib/outreach/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const secret = process.env.OUTREACH_WORKER_SECRET;
  if (!secret) return NextResponse.json({ error: "OUTREACH_WORKER_SECRET missing" }, { status: 503 });

  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("secret");
  if (supplied !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await runOutreachWorker(13));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Worker failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handle(req); }
export async function GET(req: NextRequest) { return handle(req); }
