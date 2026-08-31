import { createHmac } from "node:crypto";
import { requestIp } from "./rate-limit";

export type QuoteTelemetry = {
  daily_ip_hash: string | null;
  user_agent_summary: string | null;
  device_category: "Mobile" | "Tablet" | "Desktop" | "Unknown";
  telemetry_status: "Complete" | "Partial" | "Unavailable";
  likely_automation: boolean;
};

export function dailyIpHash(ip: string, day: string, secret = process.env.QUOTE_TELEMETRY_HMAC_SECRET): string | null {
  const normalized = ip.trim().toLowerCase().replace(/^::ffff:/, "");
  if (!secret || !normalized || normalized === "unknown") return null;
  return createHmac("sha256", secret).update(`${day}|${normalized}`).digest("hex");
}

export function requestQuoteTelemetry(request: Request, browserMetadataPresent: boolean): QuoteTelemetry {
  const rawUa = request.headers.get("user-agent")?.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 240) || null;
  const device_category = !rawUa ? "Unknown" : /ipad|tablet/i.test(rawUa) ? "Tablet" : /mobile|iphone|android/i.test(rawUa) ? "Mobile" : "Desktop";
  const hash = dailyIpHash(requestIp(request), new Date().toISOString().slice(0, 10));
  const present = [browserMetadataPresent, Boolean(rawUa), Boolean(hash)].filter(Boolean).length;
  return {
    daily_ip_hash: hash,
    user_agent_summary: rawUa,
    device_category,
    telemetry_status: present === 3 ? "Complete" : present ? "Partial" : "Unavailable",
    // Missing attribution alone is never enough. This is diagnostic only.
    likely_automation: !browserMetadataPresent && !rawUa && Boolean(hash),
  };
}
