import tls from "node:tls";
import { getServiceClient } from "@/lib/db";

type ImapResult = {
  processed: number;
  replies: number;
  bounces: number;
};

type ParsedMessage = {
  from: string;
  subject: string;
  raw: string;
};

function extractEmail(value: string) {
  const bracketed = value.match(/<([^<>\s]+@[^<>\s]+)>/i)?.[1];
  const plain = value.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  return (bracketed ?? plain ?? "").trim().toLowerCase();
}

function parseHeader(raw: string, name: string) {
  const headerBlock = raw.split(/\r?\n\r?\n/, 1)[0] ?? "";
  const unfolded = headerBlock.replace(/\r?\n[ \t]+/g, " ");
  const match = unfolded.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function parseMessage(raw: string): ParsedMessage {
  return {
    from: extractEmail(parseHeader(raw, "From")),
    subject: parseHeader(raw, "Subject"),
    raw,
  };
}

function isBounce(message: ParsedMessage) {
  const fromLocal = message.from.split("@")[0] ?? "";
  if (["mailer-daemon", "postmaster"].some((part) => fromLocal.includes(part))) return true;
  const haystack = `${message.subject}\n${message.raw}`.toLowerCase();
  return [
    "delivery status notification",
    "mail delivery failed",
    "undeliverable",
    "returned mail",
    "delivery failure",
    "message delivery failure",
  ].some((needle) => haystack.includes(needle));
}

function extractAllEmails(raw: string) {
  const matches = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return Array.from(new Set(matches.map((email) => email.toLowerCase())));
}

class SimpleImapClient {
  private socket: tls.TLSSocket;
  private buffer = Buffer.alloc(0);
  private tagCounter = 1;
  private waiter: (() => void) | null = null;

  private constructor(socket: tls.TLSSocket) {
    this.socket = socket;
    socket.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.waiter?.();
      this.waiter = null;
    });
  }

  static async connect(host: string, port: number) {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true });
    socket.setTimeout(10000, () => socket.destroy(new Error("IMAP socket timeout")));
    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", () => resolve());
      socket.once("error", reject);
    });
    const client = new SimpleImapClient(socket);
    await client.readUntil(/(?:^|\r\n)\* (?:OK|PREAUTH)\b/i);
    return client;
  }

  close() {
    this.socket.end();
  }

  private async waitForData() {
    if (this.buffer.length) return;
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = () => {
        cleanup();
        reject(new Error("IMAP connection closed"));
      };
      const cleanup = () => {
        this.socket.off("error", onError);
        this.socket.off("close", onClose);
      };
      this.socket.once("error", onError);
      this.socket.once("close", onClose);
      this.waiter = () => {
        cleanup();
        resolve();
      };
    });
  }

  private async readUntil(pattern: RegExp) {
    for (;;) {
      const text = this.buffer.toString("utf8");
      if (pattern.test(text)) return text;
      await this.waitForData();
    }
  }

  async command(command: string) {
    const tag = `A${String(this.tagCounter++).padStart(4, "0")}`;
    this.buffer = Buffer.alloc(0);
    this.socket.write(`${tag} ${command}\r\n`);
    const text = await this.readUntil(new RegExp(`(?:^|\\r\\n)${tag} (?:OK|NO|BAD)\\b`, "i"));
    const completion = text.match(new RegExp(`(?:^|\\r\\n)${tag} (OK|NO|BAD)\\b[^\\r\\n]*`, "i"));
    if (!completion || completion[1].toUpperCase() !== "OK") {
      throw new Error(`IMAP command failed: ${command}`);
    }
    return text;
  }

  async login(user: string, password: string) {
    const quote = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    await this.command(`LOGIN ${quote(user)} ${quote(password)}`);
  }

  async selectInbox() {
    await this.command('SELECT "INBOX"');
  }

  async recentUids() {
    const response = await this.command("UID SEARCH ALL");
    const match = response.match(/\* SEARCH([^\r\n]*)/i);
    return (match?.[1] ?? "")
      .trim()
      .split(/\s+/)
      .filter((value) => /^\d+$/.test(value))
      .slice(-20);
  }

  async fetchRaw(uid: string) {
    const response = await this.command(`UID FETCH ${uid} (BODY.PEEK[])`);
    const literal = response.match(/\{(\d+)\}\r\n/);
    if (!literal || literal.index == null) return "";
    const start = literal.index + literal[0].length;
    const length = Number(literal[1]);
    return Buffer.from(response, "utf8").subarray(start, start + length).toString("utf8");
  }
}

async function findProspectByEmail(email: string) {
  const client = getServiceClient();
  if (!client) throw new Error("Supabase service client unavailable");
  const { data, error } = await client
    .from("outreach_prospects")
    .select("id,email,status")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function stopSequence(prospect: any, state: "replied" | "bounced", subject: string) {
  const client = getServiceClient();
  if (!client) throw new Error("Supabase service client unavailable");
  const now = new Date().toISOString();

  await client
    .from("outreach_enrollments")
    .update({ state, next_send_at: null, updated_at: now })
    .eq("prospect_id", prospect.id)
    .in("state", ["active", "paused"]);

  await client
    .from("outreach_prospects")
    .update({ status: state === "replied" ? "replied" : "suppressed", updated_at: now })
    .eq("id", prospect.id);

  if (state === "bounced") {
    await client.from("outreach_suppressions").upsert(
      {
        email: prospect.email,
        reason: "Mailbox bounce detected",
        source: "imap_bounce",
      },
      { onConflict: "email" },
    );
  }

  await client.from("outreach_messages").insert({
    prospect_id: prospect.id,
    direction: "inbound",
    status: state,
    recipient_email: prospect.email,
    subject: subject || (state === "replied" ? "Inbound reply" : "Delivery failure"),
  });
}

export async function processInboundMailbox(): Promise<ImapResult> {
  const host = process.env.OUTREACH_IMAP_HOST ?? process.env.OUTREACH_SMTP_HOST ?? "mail.trustedexteriors.ca";
  const port = Number(process.env.OUTREACH_IMAP_PORT ?? "993");
  const user = process.env.OUTREACH_IMAP_USER ?? process.env.OUTREACH_SMTP_USER;
  const password = process.env.OUTREACH_IMAP_PASSWORD ?? process.env.OUTREACH_SMTP_PASSWORD;
  if (!user || !password) throw new Error("Outreach IMAP credentials unavailable");

  const result: ImapResult = { processed: 0, replies: 0, bounces: 0 };
  const imap = await SimpleImapClient.connect(host, port);

  try {
    await imap.login(user, password);
    await imap.selectInbox();
    const uids = await imap.recentUids();

    for (const uid of uids) {
      const raw = await imap.fetchRaw(uid);
      if (!raw) continue;
      const message = parseMessage(raw);
      let prospect: any = null;
      let state: "replied" | "bounced" | null = null;

      if (isBounce(message)) {
        const ownAddress = user.toLowerCase();
        const candidates = extractAllEmails(raw).filter((email) => email !== ownAddress);
        for (const candidate of candidates) {
          prospect = await findProspectByEmail(candidate);
          if (prospect) break;
        }
        if (prospect) state = "bounced";
      } else if (message.from) {
        prospect = await findProspectByEmail(message.from);
        if (prospect) state = "replied";
      }

      if (prospect && state) {
        const alreadyHandled =
          (state === "replied" && prospect.status === "replied") ||
          (state === "bounced" && prospect.status === "suppressed");

        if (!alreadyHandled) {
          await stopSequence(prospect, state, message.subject);
          result.processed += 1;
          if (state === "replied") result.replies += 1;
          else result.bounces += 1;
        }
      }
    }
  } finally {
    imap.close();
  }

  return result;
}
