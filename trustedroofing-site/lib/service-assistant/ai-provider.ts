import type { ServiceState } from "./service-types";

export async function cloudflareReply(state: ServiceState, recentMessages: Array<{role:string; content:string}>, authoritativeReply: string) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) return null;
  const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  const prompt = `You are a concise service estimator. Never change, calculate, or itemize prices. Never diagnose leaks. Preserve the authoritative price and policy statement exactly. Answer naturally, then ask at most one useful missing question.\nState: ${JSON.stringify(state)}\nRecent: ${JSON.stringify(recentMessages.slice(-4))}\nAuthoritative response: ${authoritativeReply}`;
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ prompt, max_tokens: 180, temperature: 0.2 }), signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const json = await response.json() as { result?: { response?: string } };
    return json.result?.response?.trim() || null;
  } catch { return null; }
}
