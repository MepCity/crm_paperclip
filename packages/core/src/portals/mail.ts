import { sql } from "drizzle-orm";
import { ValidationError } from "../errors";
import { JobCatalog, type JobDefinition, type JobQueue } from "../jobs";
import { systemOrgContext, withOrg } from "../tenancy";

export interface PortalMailSender {
  address: string;
  name?: string;
}

export interface PortalMail {
  /** `portal_tokens.id` (ADR 0019a §5). */
  idempotencyKey: string;
  kind: "invite" | "reset";
  from: PortalMailSender;
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** ADR 0010 job queue + outbox seam for portal mails (ADR 0019a §5). */
export interface PortalMailer {
  resolveSender(orgId: string): Promise<PortalMailSender | null>;
  /** Called after the token's transaction committed. */
  deliver(orgId: string, mail: PortalMail): Promise<void>;
}

export const PORTAL_MAIL_JOB_KIND = "portal_mail";
export const PORTAL_MAIL_JOB_VERSION = 1;
export const portalMailJobDefinition: JobDefinition = {
  kind: PORTAL_MAIL_JOB_KIND,
  version: PORTAL_MAIL_JOB_VERSION,
  referenceKeys: ["portalMailId"],
  // A crash after provider acceptance must never send the link twice.
  retrySafe: false,
};
export function createPortalMailJobCatalog(): JobCatalog {
  return new JobCatalog([portalMailJobDefinition]);
}

export function senderMissingError(): ValidationError {
  return new ValidationError(
    { mail: ["No sender address is configured for this organization. Add one in email settings."] },
    "No sender address is configured for portal mails.",
  );
}

/** The organisation's configured sender: its first organisation email address. */
export async function organizationSender(orgId: string): Promise<PortalMailSender | null> {
  return withOrg(systemOrgContext(orgId), async (tx) => {
    const result = await tx.execute(
      sql`select display_name, address_normalized from organization_email_addresses
          where organization_id = ${orgId} order by created_at asc limit 1`,
    );
    const row = result.rows[0] as
      | { display_name?: string; address_normalized?: string }
      | undefined;
    if (!row?.address_normalized) return null;
    return {
      address: String(row.address_normalized),
      ...(row.display_name ? { name: String(row.display_name) } : {}),
    };
  });
}

/**
 * Queue-backed mailer: the rendered message is kept by the outbox store and the job carries
 * only its opaque id; the idempotency key is the token id, so a replay never sends twice.
 */
export function createQueuedPortalMailer(options: {
  queue: JobQueue;
  resolveSender?: (orgId: string) => Promise<PortalMailSender | null>;
  outbox?: Map<string, PortalMail & { orgId: string }>;
}): PortalMailer & { outbox: Map<string, PortalMail & { orgId: string }> } {
  const outbox = options.outbox ?? new Map();
  return {
    outbox,
    resolveSender: options.resolveSender ?? organizationSender,
    async deliver(orgId, mail) {
      outbox.set(`${orgId}:${mail.idempotencyKey}`, { ...mail, orgId });
      await options.queue.enqueue(
        { organizationId: orgId },
        {
          kind: PORTAL_MAIL_JOB_KIND,
          payloadVersion: PORTAL_MAIL_JOB_VERSION,
          payload: { portalMailId: mail.idempotencyKey },
          idempotencyKey: mail.idempotencyKey,
        },
      );
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const TEXTS = {
  en: {
    invite: {
      subject: (p: string) => `Your invitation to ${p}`,
      lead: (p: string) => `You have been invited to ${p}.`,
      action: "Open the link below to set your password. The link is valid for 7 days.",
    },
    reset: {
      subject: (p: string) => `Reset your ${p} password`,
      lead: (p: string) => `A password reset was requested for your ${p} account.`,
      action:
        "Open the link below to choose a new password. The link is valid for 1 hour. If you did not ask for this, ignore this message.",
    },
  },
  tr: {
    invite: {
      subject: (p: string) => `${p} davetiniz`,
      lead: (p: string) => `${p} portalına davet edildiniz.`,
      action: "Parolanızı belirlemek için aşağıdaki bağlantıyı açın. Bağlantı 7 gün geçerlidir.",
    },
    reset: {
      subject: (p: string) => `${p} parolanızı sıfırlayın`,
      lead: (p: string) => `${p} hesabınız için parola sıfırlama istendi.`,
      action:
        "Yeni parola seçmek için aşağıdaki bağlantıyı açın. Bağlantı 1 saat geçerlidir. Bu isteği siz yapmadıysanız bu iletiyi yok sayın.",
    },
  },
} as const;

/** Fixed templates: portal name and link only, never record data (ADR 0019a §5). */
export function buildPortalMail(input: {
  kind: "invite" | "reset";
  portalName: string;
  link: string;
  language: string;
}): { subject: string; text: string; html: string } {
  const t = (input.language === "tr" ? TEXTS.tr : TEXTS.en)[input.kind];
  const subject = t.subject(input.portalName);
  const text = `${t.lead(input.portalName)}\n\n${t.action}\n\n${input.link}\n`;
  const html = `<!DOCTYPE html><html><body><p>${escapeHtml(t.lead(input.portalName))}</p><p>${escapeHtml(
    t.action,
  )}</p><p><a href="${escapeHtml(input.link)}">${escapeHtml(input.link)}</a></p></body></html>`;
  return { subject, text, html };
}

/** Links carry the token in the fragment so it never reaches server logs (ADR 0019a §2.2). */
export function portalLink(appUrl: string, slug: string, kind: "invite" | "reset", token: string) {
  const base = new URL(appUrl).origin;
  return `${base}/portal/${slug}/${kind === "invite" ? "accept" : "reset"}#t=${token}`;
}
