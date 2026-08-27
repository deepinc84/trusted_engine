import { NextResponse } from "next/server";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { cloudflareReply } from "@/lib/service-assistant/ai-provider";
import { normalizeMessage, priceState, rulesReply } from "@/lib/service-assistant/conversation";
import type { ServiceState } from "@/lib/service-assistant/service-types";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!checkRateLimit(`service-assistant:${requestIp(request)}`, 25, 60_000).allowed) return NextResponse.json({ error: "Too many messages. Please wait a minute." }, { status: 429 });
  const body = await request.json() as { message?: string; state?: ServiceState; messages?: Array<{role:string;content:string}> };
  if (!body.message || !body.state) return NextResponse.json({ error: "Message and test state are required." }, { status: 400 });
  let state = priceState(normalizeMessage(body.message.slice(0, 1500), body.state));
  const fallback = rulesReply(state);
  const ai = await cloudflareReply(state, body.messages ?? [], fallback);
  state = { ...state, aiProvider: ai ? "cloudflare_ai" : "rules_fallback" };
  return NextResponse.json({ reply: ai ?? fallback, state });
}
