import { createHash } from "node:crypto";
import type { OrgContext } from "@crm/core";
import { ForbiddenError, NotFoundError, parseInput, ValidationError } from "@crm/core/errors";
import { composeMailSchema, createMailOutbox } from "@crm/core/mail/outbox";
import { parseRecipientList } from "@crm/core/mail/recipient-list";
import { assertRecipientAllowed } from "@crm/core/mail/recipient-policy";
import { createMailService } from "@crm/core/mail/service";
import { mailRecordModuleSchema } from "@crm/core/mail/types";
import { z } from "zod";
import { mailReadSource } from "./service";
import { getMailState } from "./state";

const MAX_BODY_BYTES = 1024 * 1024;
const recipients = z.union([z.string(), composeMailSchema.shape.to]);
const composeRequest = composeMailSchema.omit({ bodyRef: true }).extend({
  body: z.string().refine((value) => Buffer.byteLength(value, "utf8") <= MAX_BODY_BYTES, {
    message: "The body exceeds the 1 MB limit.",
  }),
  to: recipients.default([]),
  cc: recipients.default([]),
  bcc: recipients.default([]),
});
const sharingRequest = z.object({ shared: z.boolean() }).strict();
const linkRequest = z
  .object({ module: mailRecordModuleSchema, recordId: z.string().min(1).max(256) })
  .strict();

export const mailWriteSource = {
  async create(ctx: OrgContext) {
    return { ...(await getMailState(ctx)), ...(await mailReadSource.create(ctx)) };
  },
};

export async function readMailJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError({ input: ["A valid JSON body is required."] });
  }
}

async function ownMailbox(
  ctx: OrgContext,
  source: Awaited<ReturnType<typeof mailWriteSource.create>>,
  mailboxId: string,
) {
  const data = await source.repository.read(ctx.orgId);
  const box = data.mailboxes.find((m) => m.organizationId === ctx.orgId && m.id === mailboxId);
  if (!box) throw new NotFoundError();
  if (box.ownerUserId !== ctx.userId) throw new ForbiddenError();
}

export async function composeMail(ctx: OrgContext, input: unknown) {
  const parsed = parseInput(composeRequest, input);
  const source = await mailWriteSource.create(ctx);
  await ownMailbox(ctx, source, parsed.mailboxId);
  const normalize = (field: "to" | "cc" | "bcc") => {
    const value = parsed[field];
    if (typeof value === "string") {
      const result = parseRecipientList(value);
      if (result.invalid.length) throw new ValidationError({ [field]: ["Invalid recipient."] });
      return result.recipients;
    }
    return value.map((recipient) => {
      const result = parseRecipientList(recipient.address);
      const normalized = result.recipients[0];
      if (result.invalid.length || result.recipients.length !== 1 || !normalized)
        throw new ValidationError({ [field]: ["Invalid recipient."] });
      return { ...recipient, address: normalized.address };
    });
  };
  const { body, ...fields } = parsed;
  const compose = { ...fields, to: normalize("to"), cc: normalize("cc"), bcc: normalize("bcc") };
  return source.exclusive(async () => {
    // Content-addressed within a tenant store: replay keeps the same private reference.
    const bodyRef = createHash("sha256").update(body).digest("hex");
    const existed = source.bodies.has(bodyRef);
    source.bodies.set(bodyRef, body);
    try {
      const item = await createMailOutbox(ctx, {
        ...source,
        // No live sending in this adapter, even if a caller accidentally invokes the port.
        sender: {
          send: async () => ({ status: "rejected", reason: "not_connected", retryable: false }),
        },
        recipientGuard: (targets) =>
          assertRecipientAllowed(
            targets,
            process.env.MAIL_TEST_RECIPIENT ? [process.env.MAIL_TEST_RECIPIENT] : [],
          ),
      }).compose({ ...compose, bodyRef });
      source.content.set(item.messageId, { body, unread: false });
      return { data: { id: item.messageId, status: item.status, scheduledAt: item.scheduledAt } };
    } catch (error) {
      if (!existed) source.bodies.delete(bodyRef);
      throw error;
    }
  });
}

export async function mutateMail(
  ctx: OrgContext,
  messageId: string,
  action: "sharing" | "link" | "unlink",
  input: unknown,
) {
  const body =
    action === "sharing" ? parseInput(sharingRequest, input) : parseInput(linkRequest, input);
  const source = await mailWriteSource.create(ctx);
  const data = await source.repository.read(ctx.orgId);
  const message = data.messages.find((m) => m.organizationId === ctx.orgId && m.id === messageId);
  if (!message) throw new NotFoundError();
  await ownMailbox(ctx, source, message.mailboxId);
  const service = createMailService(ctx, source);
  if ("shared" in body) {
    await service.setShared(messageId, body.shared);
    return { data: { id: messageId, shared: body.shared } };
  }
  // Unlink, like link, must re-check current record visibility before changing associations.
  if (!(await source.canReadRecord(ctx, body.module, body.recordId))) throw new NotFoundError();
  if (action === "link") await service.linkRecord(messageId, body.module, body.recordId);
  else await service.unlinkRecord(messageId, body.module, body.recordId);
  return {
    data: {
      id: messageId,
      module: body.module,
      recordId: body.recordId,
      linked: action === "link",
    },
  };
}
