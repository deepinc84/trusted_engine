import crypto from "crypto";

export type QuoteResumePayload = {
  requestedScope: string;
  sidingMaterial?: "vinyl" | "hardie";
  estimate: Record<string, unknown>;
  issuedAt: number;
};

const EXPIRY_MS = 1000 * 60 * 60 * 24 * 7;

function base64urlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const withPadding = pad === 0 ? normalized : `${normalized}${"=".repeat(4 - pad)}`;
  return Buffer.from(withPadding, "base64");
}

function signingSecret() {
  return process.env.QUOTE_RESUME_SECRET || process.env.GOOGLE_SECRET_KEY || "trusted-quote-resume-secret";
}

export function createQuoteResumeToken(payload: Omit<QuoteResumePayload, "issuedAt">) {
  const fullPayload: QuoteResumePayload = {
    ...payload,
    issuedAt: Date.now()
  };
  const encoded = base64urlEncode(JSON.stringify(fullPayload));
  const sig = base64urlEncode(
    crypto
      .createHmac("sha256", signingSecret())
      .update(encoded)
      .digest()
  );
  return `${encoded}.${sig}`;
}

export function verifyQuoteResumeToken(token: string): QuoteResumePayload | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = base64urlEncode(
    crypto
      .createHmac("sha256", signingSecret())
      .update(encoded)
      .digest()
  );

  const expectedBuffer = Buffer.from(expected);
  const sigBuffer = Buffer.from(sig);
  if (expectedBuffer.length !== sigBuffer.length || !crypto.timingSafeEqual(expectedBuffer, sigBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64urlDecode(encoded).toString("utf8")) as QuoteResumePayload;
    if (!parsed?.estimate || typeof parsed.requestedScope !== "string") return null;
    if (typeof parsed.issuedAt !== "number" || Date.now() - parsed.issuedAt > EXPIRY_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
