import { NextResponse } from "next/server";
import { listPendingGbpPosts, markGbpQueueStatus } from "@/lib/db";

export async function POST(request: Request) {
  const token = request.headers.get("x-worker-token");
  if (!process.env.GBP_WORKER_TOKEN || token !== process.env.GBP_WORKER_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queue = await listPendingGbpPosts(20);

  const hasGbpCredentials =
    !!process.env.GBP_CLIENT_ID &&
    !!process.env.GBP_CLIENT_SECRET &&
    !!process.env.GBP_REFRESH_TOKEN &&
    !!process.env.GBP_LOCATION_ID;

  if (!hasGbpCredentials) {
    return NextResponse.json({
      processed: 0,
      pending: queue.length,
      status: "GBP not configured; queue left pending."
    });
  }

  let processed = 0;
  for (const item of queue) {
    try {
      // TODO: wire real Google Business Profile API post create call.
      // Placeholder behavior marks as sent once GBP credentials are available.
      await markGbpQueueStatus(item.id, "sent");
      processed += 1;
    } catch (error) {
      await markGbpQueueStatus(
        item.id,
        "failed",
        error instanceof Error ? error.message : "Unknown worker error"
      );
    }
  }

  return NextResponse.json({ processed, pending: Math.max(0, queue.length - processed) });
}
