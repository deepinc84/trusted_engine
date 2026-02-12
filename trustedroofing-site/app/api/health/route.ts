import { NextResponse } from "next/server";
import { getDataMode, probeDataRead } from "@/lib/db";

function sanitizeError(error: unknown): string | null {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/https?:\/\/\S+/g, "[redacted-url]").slice(0, 300);
}

export async function GET() {
  const dataMode = getDataMode();
  const probe = await probeDataRead();

  return NextResponse.json({
    appRootPath: process.cwd(),
    supabaseEnabled: dataMode === "supabase",
    dbReadOk: probe.ok,
    dbError: sanitizeError(probe.error),
    dataMode,
    version:
      process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_SHA ?? "unknown"
  });
}
