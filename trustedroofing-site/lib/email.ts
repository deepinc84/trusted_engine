import { listLeadEmailNotifications, type LeadRecord, type InstantQuoteRecord, upsertLeadEmailNotification } from "@/lib/db";

type SendResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

export async function sendEmail(input: {
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function valueFromForm(form: Record<string, unknown>, key: string, fallback = "n/a") {
  const value = form[key];
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function currencyRange(low: unknown, high: unknown) {
  const lowNumber = typeof low === "number" ? low : Number(low);
  const highNumber = typeof high === "number" ? high : Number(high);
  if (!Number.isFinite(lowNumber) || !Number.isFinite(highNumber)) return "n/a";
  return `$${Math.round(lowNumber).toLocaleString()} - $${Math.round(highNumber).toLocaleString()}`;
}

function serviceLabel(scope: unknown) {
  if (scope === "all") return "Full exterior";
  if (scope === "vinyl_siding") return "Vinyl siding";
  if (scope === "hardie_siding") return "Hardie siding";
  if (scope === "eavestrough") return "Eavestrough";
  if (scope === "roofing") return "Roofing";
  return String(scope ?? "unknown");
}

function yesNo(value: unknown) {
  return value === true ? "Yes" : "No";
}

function buildInstantQuoteSummary(input: {
  lead: LeadRecord;
  instantQuote: InstantQuoteRecord;
  submittedForm: Record<string, unknown>;
  timestamp: string;
}) {
  const form = input.submittedForm;
  const requestedScope = valueFromForm(form, "serviceScope", input.lead.service_type ?? input.instantQuote.service_type ?? "unknown");
  const leadSource = valueFromForm(form, "quoteLeadSource", "initial_step_2");
  const pdfDownloaded = form.pdfDownloaded === true;
  const pdfStatus = valueFromForm(
    form,
    "pdfDownloadStatus",
    pdfDownloaded ? "downloaded_before_submission" : "not_downloaded_before_submission"
  );

  return [
    { label: "Full address", value: input.instantQuote.address || valueFromForm(form, "address") },
    { label: "Quote requested", value: serviceLabel(requestedScope) },
    { label: "Lead source", value: leadSource === "resumed_step_2" ? "Resumed step 2 lead" : "Initial instant quote step 2 lead" },
    { label: "Resumed lead", value: yesNo(form.isResumedLead === true || leadSource === "resumed_step_2") },
    { label: "PDF downloaded before submitting", value: yesNo(pdfDownloaded) },
    { label: "PDF download status", value: pdfStatus },
    { label: "Name", value: input.lead.name ?? valueFromForm(form, "name") },
    { label: "Phone", value: input.lead.phone ?? valueFromForm(form, "phone") },
    { label: "Email", value: input.lead.email },
    { label: "Budget / process answer", value: input.lead.budget_response ?? valueFromForm(form, "budgetResponse") },
    { label: "Timeline", value: input.lead.timeline ?? valueFromForm(form, "timeline") },
    { label: "Primary range", value: currencyRange(input.lead.quote_low ?? form.goodLow, input.lead.quote_high ?? form.goodHigh) },
    { label: "Better roof range", value: currencyRange(form.betterLow, form.betterHigh) },
    { label: "Best roof range", value: currencyRange(form.bestLow, form.bestHigh) },
    { label: "Eavestrough range", value: currencyRange(form.eavesLow, form.eavesHigh) },
    { label: "Siding range", value: currencyRange(form.sidingLow, form.sidingHigh) },
    { label: "Roof area", value: `${valueFromForm(form, "roofAreaSqft")} sq ft` },
    { label: "Roof squares", value: valueFromForm(form, "roofSquares") },
    { label: "Pitch", value: valueFromForm(form, "pitch") },
    { label: "Lead score", value: valueFromForm(form, "leadScore") },
    { label: "Model / data source", value: valueFromForm(form, "dataSource", input.instantQuote.service_type ?? "n/a") },
    { label: "Place ID", value: valueFromForm(form, "placeId") },
    { label: "Coordinates", value: `${valueFromForm(form, "lat")}, ${valueFromForm(form, "lng")}` },
    { label: "Submitted at", value: input.timestamp }
  ];
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
  const summary = buildInstantQuoteSummary({ ...input, timestamp });

  if (!alreadySent.has("internal")) {
    const requestedScope = valueFromForm(input.submittedForm, "serviceScope", input.lead.service_type ?? "unknown");
    const leadSource = valueFromForm(input.submittedForm, "quoteLeadSource", "initial_step_2");
    const textRows = summary.map((row) => `${row.label}: ${row.value}`);
    const htmlRows = summary.map((row) => `<tr><th align="left" style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(row.label)}</th><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(row.value)}</td></tr>`).join("");
    const internalBody = {
      to: "info@trustedexteriors.ca",
      subject: `${leadSource === "resumed_step_2" ? "Resumed" : "New"} instant quote lead: ${serviceLabel(requestedScope)} - ${input.instantQuote.address}`,
      text: [
        ...textRows,
        "",
        `All submitted instant quote data: ${JSON.stringify(input.submittedForm, null, 2)}`
      ].join("\n"),
      html: `<h2>Instant quote lead</h2>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px;">${htmlRows}</table>
<h3>All submitted instant quote data</h3>
<pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;padding:12px;border-radius:8px;">${escapeHtml(JSON.stringify(input.submittedForm, null, 2))}</pre>`
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
<p>We received your estimate request for <strong>${escapeHtml(input.instantQuote.address)}</strong>.</p>
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


export async function sendSolarSuitabilityLeadEmail(input: {
  to: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  neighborhood: string | null;
  preferredAppointments: Array<{ date: string; timeWindow: string }>;
  notes: string | null;
  billSignedUrl: string | null;
  source: string;
}) {
  const subjectLocation = input.propertyAddress || input.neighborhood || "property address pending";
  const rows = [
    { label: "Name", value: input.name },
    { label: "Email", value: input.email },
    { label: "Phone", value: input.phone },
    { label: "Property address", value: input.propertyAddress },
    ...input.preferredAppointments.map((appointment, index) => ({
      label: `Preferred appointment ${index + 1}`,
      value: `${appointment.date} — ${appointment.timeWindow}`
    })),
    { label: "Notes", value: input.notes || "n/a" },
    { label: "Uploaded bill", value: input.billSignedUrl || "No signed link available" },
    { label: "Source", value: input.source }
  ];

  const text = rows.map((row) => `${row.label}: ${row.value}`).join("\n");
  const htmlRows = rows.map((row) => `<tr><th align="left" style="padding:6px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${escapeHtml(row.label)}</th><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${row.label === "Uploaded bill" && input.billSignedUrl ? `<a href="${escapeHtml(input.billSignedUrl)}">Secure signed bill link</a>` : escapeHtml(row.value)}</td></tr>`).join("");

  return sendEmail({
    to: input.to,
    subject: `New solar suitability request - ${subjectLocation}`,
    text,
    html: `<h2>Solar suitability request</h2>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px;">${htmlRows}</table>
<p style="color:#64748b;font-size:13px;">The bill link is a private Supabase signed URL and may expire.</p>`
  });
}
