import { listLeadEmailNotifications, type LeadRecord, type InstantQuoteRecord, upsertLeadEmailNotification } from "@/lib/db";

type SendResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Trusted Roofing <noreply@trustedexteriors.ca>";
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html
      })
    });

    const payload = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!res.ok) {
      return { ok: false, error: payload.error?.message ?? `Email HTTP ${res.status}` };
    }

    return { ok: true, id: payload.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown send error" };
  }
}

export async function processLeadSubmissionEmails(input: {
  lead: LeadRecord;
  instantQuote: InstantQuoteRecord;
  submittedForm: Record<string, unknown>;
}) {
  const existing = await listLeadEmailNotifications(input.lead.id);
  const alreadySent = new Set(
    existing.filter((entry) => entry.status === "sent").map((entry) => entry.recipient_type)
  );

  const timestamp = new Date(input.lead.created_at).toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const range = input.instantQuote.quote_low !== null && input.instantQuote.quote_high !== null
    ? `$${input.instantQuote.quote_low.toLocaleString()} - $${input.instantQuote.quote_high.toLocaleString()}`
    : "Range pending";

  if (!alreadySent.has("internal")) {
    const internalBody = {
      to: "info@trustedexteriors.ca",
      subject: `New instant quote lead: ${input.instantQuote.address}`,
      text: [
        `Address: ${input.instantQuote.address}`,
        `Quote range: ${range}`,
        `Service type: ${input.instantQuote.service_type ?? "unknown"}`,
        `Customer email: ${input.lead.email}`,
        `Timestamp: ${timestamp}`,
        `Form data: ${JSON.stringify(input.submittedForm, null, 2)}`
      ].join("\n"),
      html: `<p><strong>Address:</strong> ${input.instantQuote.address}</p>
<p><strong>Quote range:</strong> ${range}</p>
<p><strong>Service type:</strong> ${input.instantQuote.service_type ?? "unknown"}</p>
<p><strong>Customer email:</strong> ${input.lead.email}</p>
<p><strong>Timestamp:</strong> ${timestamp}</p>
<pre>${JSON.stringify(input.submittedForm, null, 2)}</pre>`
    };
    const internalResult = await sendEmail(internalBody);
    await upsertLeadEmailNotification({
      lead_id: input.lead.id,
      recipient_type: "internal",
      recipient_email: internalBody.to,
      status: internalResult.ok ? "sent" : "failed",
      provider_message_id: internalResult.id ?? null,
      error_message: internalResult.error ?? null
    });
  }

  if (!alreadySent.has("customer")) {
    const customerBody = {
      to: input.lead.email,
      subject: "We received your estimate request",
      text: `Thanks for your submission. We've received your request for ${input.instantQuote.address}.\n\nOur team is reviewing your site-specific details and preparing a proposal. We'll follow up shortly.`,
      html: `<p>Thanks for your submission.</p>
<p>We received your estimate request for <strong>${input.instantQuote.address}</strong>.</p>
<p>Our team is now reviewing your site-specific details and preparing your proposal. We'll follow up shortly.</p>`
    };
    const customerResult = await sendEmail(customerBody);
    await upsertLeadEmailNotification({
      lead_id: input.lead.id,
      recipient_type: "customer",
      recipient_email: customerBody.to,
      status: customerResult.ok ? "sent" : "failed",
      provider_message_id: customerResult.id ?? null,
      error_message: customerResult.error ?? null
    });
  }
}
