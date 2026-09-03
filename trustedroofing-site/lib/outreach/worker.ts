import { getServiceClient } from "@/lib/db";
import { sendOutreachEmail } from "./smtp";
import { ensureUnsubscribeToken } from "./repository";
import { escapeHtml, renderTemplate } from "./templates";

function isCanadianBusinessSendWindow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "-1");
  const weekdayAllowed = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);

  // 10:00-15:59 Mountain keeps sends inside normal business hours
  // from Vancouver through Toronto without relying on the HostPapa server timezone.
  return weekdayAllowed && hour >= 10 && hour < 16;
}

export async function runOutreachWorker(limit = 10) {
  if (!isCanadianBusinessSendWindow()) {
    return { processed: 0, skipped: "outside_business_send_window", results: [] };
  }

  const client = getServiceClient();
  if (!client) throw new Error("Supabase service client unavailable");

  const postalAddress = process.env.OUTREACH_POSTAL_ADDRESS?.trim();
  if (!postalAddress) throw new Error("OUTREACH_POSTAL_ADDRESS missing");

  const now = new Date().toISOString();
  const { data: enrollments, error } = await client
    .from("outreach_enrollments")
    .select("id,current_step,campaign_id,prospect_id,next_send_at,outreach_prospects(*),outreach_campaigns(active)")
    .eq("state", "active")
    .lte("next_send_at", now)
    .eq("outreach_campaigns.active", true)
    .order("next_send_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 25)));
  if (error) throw error;

  const results: Array<{ prospect: string; status: string; error?: string }> = [];

  for (const enrollment of enrollments ?? []) {
    const prospect = (enrollment as any).outreach_prospects;
    if (!prospect?.email) continue;

    const { data: suppression } = await client.from("outreach_suppressions").select("id").ilike("email", prospect.email).maybeSingle();
    if (suppression) {
      await client.from("outreach_enrollments").update({ state: "unsubscribed", updated_at: now }).eq("id", enrollment.id);
      continue;
    }

    const { data: step, error: stepError } = await client
      .from("outreach_campaign_steps")
      .select("id,step_number,delay_days,subject_template,text_template,html_template,active")
      .eq("campaign_id", enrollment.campaign_id)
      .eq("step_number", enrollment.current_step)
      .eq("active", true)
      .maybeSingle();
    if (stepError) throw stepError;
    if (!step) {
      await client.from("outreach_enrollments").update({ state: "completed", next_send_at: null, updated_at: now }).eq("id", enrollment.id);
      continue;
    }

    const token = await ensureUnsubscribeToken(prospect.id);
    const base = process.env.OUTREACH_PUBLIC_BASE_URL ?? "https://trusted-engine.vercel.app";
    const unsubscribeUrl = `${base.replace(/\/$/, "")}/api/outreach/unsubscribe/${token}`;
    const values = {
      company: prospect.company_name,
      contact: prospect.contact_name ?? "",
      metro: prospect.metro ?? "",
      website: prospect.website ?? "",
      observation: prospect.website_observation ?? "",
      unsubscribe_url: unsubscribeUrl,
    };

    const subject = renderTemplate(step.subject_template, values);
    const textCore = renderTemplate(step.text_template, values);
    const htmlCore = step.html_template ? renderTemplate(step.html_template, values) : `<p>${escapeHtml(textCore).replace(/\n/g, "<br>")}</p>`;
    const phone = process.env.OUTREACH_CONTACT_PHONE ?? "587-288-3351";
    const text = `${textCore}\n\nTrusted Exteriors SEO | ${postalAddress} | ${phone}\nUnsubscribe: ${unsubscribeUrl}`;
    const html = `${htmlCore}<hr><p style="font-size:12px;color:#64748b">Trusted Exteriors SEO · ${escapeHtml(postalAddress)} · ${escapeHtml(phone)}<br><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`;

    const { data: message, error: messageError } = await client.from("outreach_messages").insert({
      enrollment_id: enrollment.id,
      prospect_id: prospect.id,
      campaign_step_id: step.id,
      recipient_email: prospect.email,
      subject,
      status: "sending",
    }).select("id").single();
    if (messageError) throw messageError;

    try {
      const providerMessageId = await sendOutreachEmail({ to: prospect.email, subject, text, html });
      await client.from("outreach_messages").update({ status: "sent", provider_message_id: providerMessageId, sent_at: new Date().toISOString() }).eq("id", message.id);

      const nextStep = enrollment.current_step + 1;
      const { data: next } = await client.from("outreach_campaign_steps").select("delay_days").eq("campaign_id", enrollment.campaign_id).eq("step_number", nextStep).eq("active", true).maybeSingle();
      if (next) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + Number(next.delay_days ?? 0));
        await client.from("outreach_enrollments").update({ current_step: nextStep, next_send_at: nextDate.toISOString(), updated_at: new Date().toISOString() }).eq("id", enrollment.id);
      } else {
        await client.from("outreach_enrollments").update({ state: "completed", next_send_at: null, updated_at: new Date().toISOString() }).eq("id", enrollment.id);
      }

      await client.from("outreach_prospects").update({ status: "contacted", updated_at: new Date().toISOString() }).eq("id", prospect.id).in("status", ["verified", "qualified", "enrolled", "contacted"]);
      results.push({ prospect: prospect.email, status: "sent" });
    } catch (sendError) {
      const messageText = sendError instanceof Error ? sendError.message : "Unknown SMTP error";
      await client.from("outreach_messages").update({ status: "failed", error_message: messageText }).eq("id", message.id);
      results.push({ prospect: prospect.email, status: "failed", error: messageText });
    }
  }

  return { processed: results.length, results };
}
