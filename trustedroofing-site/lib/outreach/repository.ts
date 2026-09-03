import crypto from "node:crypto";
import { getServiceClient } from "@/lib/db";

function getDb() {
  const client = getServiceClient();
  if (!client) throw new Error("Supabase service client unavailable");
  return client;
}

export async function listOutreachProspects(limit = 250) {
  const { data, error } = await getDb().from("outreach_prospects").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function outreachDashboardStats() {
  const client = getDb();
  const result: Record<string, number> = {};
  for (const table of ["outreach_prospects", "outreach_enrollments", "outreach_messages", "outreach_suppressions"] as const) {
    const { count, error } = await client.from(table).select("id", { count: "exact", head: true });
    if (error) throw error;
    result[table] = count ?? 0;
  }
  const { count: won, error } = await client.from("outreach_prospects").select("id", { count: "exact", head: true }).eq("status", "won");
  if (error) throw error;
  return { prospects: result.outreach_prospects, enrollments: result.outreach_enrollments, messages: result.outreach_messages, suppressions: result.outreach_suppressions, won: won ?? 0 };
}

export async function ensureUnsubscribeToken(prospectId: string) {
  const client = getDb();
  const { data } = await client.from("outreach_unsubscribe_tokens").select("token").eq("prospect_id", prospectId).maybeSingle();
  if (data?.token) return data.token as string;
  const token = crypto.randomBytes(24).toString("hex");
  const { error } = await client.from("outreach_unsubscribe_tokens").insert({ prospect_id: prospectId, token });
  if (error) throw error;
  return token;
}

export async function suppressByToken(token: string) {
  const client = getDb();
  const { data, error } = await client.from("outreach_unsubscribe_tokens").select("prospect_id,outreach_prospects(email)").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const email = (data as any).outreach_prospects?.email;
  if (!email) return false;
  await client.from("outreach_suppressions").upsert({ email, reason: "Recipient unsubscribed", source: "unsubscribe" }, { onConflict: "email" });
  await client.from("outreach_prospects").update({ status: "suppressed", updated_at: new Date().toISOString() }).eq("id", data.prospect_id);
  await client.from("outreach_enrollments").update({ state: "unsubscribed", updated_at: new Date().toISOString() }).eq("prospect_id", data.prospect_id).eq("state", "active");
  return true;
}
