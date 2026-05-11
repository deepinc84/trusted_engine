import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";
import { sendSolarSuitabilityLeadEmail } from "@/lib/email";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeMultilineText, sanitizeText } from "@/lib/sanitize";
import {
  SOLAR_BILL_ALLOWED_MIME_TYPES,
  SOLAR_BILL_MAX_FILE_SIZE_BYTES,
  getSolarBillsBucketName,
  uploadSolarBillToSupabase
} from "@/lib/storage";

export const dynamic = "force-dynamic";

const EMAIL_RECIPIENT = "peter@trustedexteriors.ca";
const SOURCE_PATH = "/solar-suitability";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

type SolarLeadInsert = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_snapshot: string;
  city: string | null;
  neighborhood: string | null;
  neighborhood_slug: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_date_1: string;
  preferred_time_window_1: string;
  preferred_date_2: string;
  preferred_time_window_2: string;
  preferred_date_3: string;
  preferred_time_window_3: string;
  notes: string | null;
  bill_file_url: string | null;
  bill_file_path: string | null;
  bill_file_mime_type: string | null;
  bill_file_size: number | null;
  status: string;
  emailed_to: string | null;
  emailed_at: string | null;
};

function formValue(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return sanitizeText(value).slice(0, maxLength);
}

function optionalMultilineValue(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const sanitized = sanitizeMultilineText(value).slice(0, maxLength);
  return sanitized || null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugFromNeighborhood(value: string | null) {
  if (!value) return null;
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || null;
}

function likelyCityFromAddress(address: string) {
  const lower = address.toLowerCase();
  if (lower.includes("calgary")) return "Calgary";
  if (lower.includes("airdrie")) return "Airdrie";
  if (lower.includes("cochrane")) return "Cochrane";
  if (lower.includes("okotoks")) return "Okotoks";
  if (lower.includes("chestermere")) return "Chestermere";
  return null;
}

function validateBillFile(value: FormDataEntryValue | null): File {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Upload a latest utility/electricity bill.");
  }

  if (value.size > SOLAR_BILL_MAX_FILE_SIZE_BYTES) {
    throw new Error("Bill file is too large. Maximum upload size is 10 MB.");
  }

  if (!SOLAR_BILL_ALLOWED_MIME_TYPES.has(value.type)) {
    throw new Error("Unsupported bill file type. Upload a PDF, JPG, JPEG, PNG, HEIC, HEIF, or WEBP file.");
  }

  return value;
}

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limit = checkRateLimit(`solar-suitability:${ip}`, 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const client = getServiceClient();
  if (!client) {
    return NextResponse.json({ error: "Solar lead capture is not configured." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const name = formValue(formData, "name", 120);
    const email = formValue(formData, "email", 160).toLowerCase();
    const phone = formValue(formData, "phone", 40);
    const propertyAddress = formValue(formData, "propertyAddress", 240);
    const notes = optionalMultilineValue(formData, "notes", 1200);
    const preferredAppointments = [1, 2, 3].map((number) => ({
      date: formValue(formData, `preferredDate${number}`, 20),
      timeWindow: formValue(formData, `preferredTimeWindow${number}`, 80)
    }));

    const missing = [
      ["name", name],
      ["email", email],
      ["phone", phone],
      ["property address", propertyAddress],
      ...preferredAppointments.flatMap((appointment, index) => [
        [`preferred date ${index + 1}`, appointment.date],
        [`preferred time window ${index + 1}`, appointment.timeWindow]
      ])
    ].filter(([, value]) => !value).map(([label]) => label);

    if (missing.length) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const billFile = validateBillFile(formData.get("billFile"));
    const leadId = crypto.randomUUID();
    const uploadedBill = await uploadSolarBillToSupabase({ client, leadId, file: billFile });

    const { data: signedData, error: signedError } = await client.storage
      .from(getSolarBillsBucketName())
      .createSignedUrl(uploadedBill.path, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (signedError) {
      throw new Error(`Unable to create secure bill link: ${signedError.message}`);
    }

    const signedUrl = signedData?.signedUrl ?? null;
    const now = new Date().toISOString();
    const leadPayload: SolarLeadInsert = {
      id: leadId,
      name,
      email,
      phone,
      address_snapshot: propertyAddress,
      city: likelyCityFromAddress(propertyAddress),
      neighborhood: null,
      neighborhood_slug: slugFromNeighborhood(null),
      latitude: null,
      longitude: null,
      preferred_date_1: preferredAppointments[0].date,
      preferred_time_window_1: preferredAppointments[0].timeWindow,
      preferred_date_2: preferredAppointments[1].date,
      preferred_time_window_2: preferredAppointments[1].timeWindow,
      preferred_date_3: preferredAppointments[2].date,
      preferred_time_window_3: preferredAppointments[2].timeWindow,
      notes,
      bill_file_url: signedUrl,
      bill_file_path: uploadedBill.path,
      bill_file_mime_type: uploadedBill.mime_type,
      bill_file_size: uploadedBill.file_size,
      status: "new",
      emailed_to: null,
      emailed_at: null
    };

    const { error: insertError } = await client.from("solar_suitability_leads").insert(leadPayload);
    if (insertError) {
      throw new Error(`Unable to save solar suitability request: ${insertError.message}`);
    }

    const emailResult = await sendSolarSuitabilityLeadEmail({
      to: EMAIL_RECIPIENT,
      name,
      email,
      phone,
      propertyAddress,
      neighborhood: null,
      preferredAppointments,
      notes,
      billSignedUrl: signedUrl,
      source: SOURCE_PATH
    });

    const updatePayload = {
      emailed_to: EMAIL_RECIPIENT,
      emailed_at: emailResult.ok ? now : null,
      status: emailResult.ok ? "new" : "email_failed"
    };

    await client.from("solar_suitability_leads").update(updatePayload).eq("id", leadId);

    if (!emailResult.ok) {
      console.error("solar suitability email failed", emailResult.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("solar suitability submission failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit solar suitability request." },
      { status: 400 }
    );
  }
}
