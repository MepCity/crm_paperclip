import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import {
  assertRecipientAllowed,
  createInMemoryMailRepository,
  createMailService,
  MAX_INBOUND_ATTACHMENT_BYTES,
  type MailboxAccount,
  type MailMessage,
  type MailRepository,
  type MailSnapshot,
  mailAttachmentMetaSchema,
  mailboxAccountSchema,
  mailMessageSchema,
  mailRecordLinkSchema,
  mailThreadSchema,
  outboxItemSchema,
  type RecordAddressMatch,
} from "./index";

function context(userId = "owner", orgId = "org-a"): OrgContext {
  return { orgId, userId, orgSlug: "test", orgName: "Test", role: "admin" };
}
function mailbox(organizationId = "org-a", id = "box", ownerUserId = "owner") {
  return {
    organizationId,
    id,
    ownerUserId,
    provider: "google" as const,
    status: "connected" as const,
    credentialRef: "opaque-ref",
    lastSyncAt: null,
    lastError: null,
  };
}
function message(organizationId = "org-a", id = "msg", mailboxId = "box") {
  return {
    organizationId,
    id,
    mailboxId,
    providerMessageKey: "provider-1",
    threadId: null,
    messageIdHeader: "<one@example.com>",
    inReplyTo: null,
    references: [],
    subject: "Synthetic mail",
    from: [{ address: " Sender@EXAMPLE.com " }],
    to: [{ address: "reader@example.org" }],
    cc: [],
    bcc: [{ address: "hidden@example.com" }],
    sentAt: "2026-10-20T10:00:00Z",
    receivedAt: "2026-10-20T10:00:01Z",
    folder: "inbox" as const,
    summary: "Synthetic summary",
    bodyRef: "private-body",
  };
}
async function setup() {
  const repository = createInMemoryMailRepository();
  await repository.createMailbox(mailbox());
  await repository.createMailbox(mailbox("org-b"));
  await repository.createMailbox(mailbox("org-a", "peer-box", "peer"));
  await repository.upsertMessage(message());
  await repository.upsertMessage(message("org-b"));
  const canReadRecord = vi.fn(() => true);
  const findByAddress = vi.fn(async (): Promise<RecordAddressMatch[]> => []);
  const options = { repository, canReadRecord, recordAddressLookup: { findByAddress } };
  return {
    repository,
    canReadRecord,
    findByAddress,
    options,
    owner: createMailService(context(), options),
    peer: createMailService(context("peer"), options),
  };
}
const link = {
  organizationId: "org-a",
  messageId: "msg",
  module: "leads" as const,
  recordId: "lead-1",
  source: "auto" as const,
  ambiguous: false,
};

describe("mail storage", () => {
  it("defaults to 30 days and Inbox/Sent, rejects a second personal mailbox including disconnected ones", async () => {
    const repo = createInMemoryMailRepository();
    expect(await repo.createMailbox({ ...mailbox(), status: "disconnected" })).toMatchObject({
      syncWindowDays: 30,
      folders: ["inbox", "sent"],
      status: "disconnected",
    });
    await expect(repo.createMailbox(mailbox("org-a", "second"))).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(repo.createMailbox(mailbox("org-b"))).resolves.toMatchObject({
      organizationId: "org-b",
    });
    await expect(repo.createMailbox(mailbox("org-a", "other", "peer"))).resolves.toMatchObject({
      ownerUserId: "peer",
    });
    const concurrent = await Promise.allSettled([
      repo.createMailbox(mailbox("org-a", "race-1", "third")),
      repo.createMailbox(mailbox("org-a", "race-2", "third")),
    ]);
    expect(concurrent.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
  });

  it("replays are unchanged, preserve owner sharing, and use the complete tenant/mailbox/provider key", async () => {
    const { repository } = await setup();
    await repository.setShared("org-a", "msg", true);
    const original = (await repository.read("org-a")).messages[0];
    expect(
      await repository.upsertMessage({
        ...message(),
        id: "ignored",
        subject: "Changed",
        bodyRef: null,
      }),
    ).toEqual(original);
    const peer = await repository.upsertMessage(message("org-a", "peer-msg", "peer-box"));
    expect(peer.id).toBe("peer-msg");
    expect((await repository.read("org-a")).messages).toHaveLength(2);
    expect((await repository.read("org-b")).messages).toHaveLength(1);
    await expect(
      repository.upsertMessage({ ...message(), providerMessageKey: "different" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("forces new provider messages private and isolates mutable inputs/outputs", async () => {
    const repo = createInMemoryMailRepository();
    const inputBox = { ...mailbox(), folders: ["inbox" as const] };
    const box = await repo.createMailbox(inputBox);
    inputBox.folders.length = 0;
    box.folders.length = 0;
    const input = { ...message(), sharedByOwner: true };
    const saved = await repo.upsertMessage(input);
    expect(saved.sharedByOwner).toBe(false);
    input.from.splice(0, 1, { address: "changed@example.com" });
    saved.from.length = 0;
    const snapshot = await repo.read("org-a");
    expect(snapshot.mailboxes[0]?.folders).toEqual(["inbox"]);
    expect(snapshot.messages[0]?.from[0]?.address).toBe("Sender@EXAMPLE.com");
    snapshot.messages[0]?.references.push("changed");
    expect((await repo.read("org-a")).messages[0]?.references).toEqual([]);
  });

  it("rejects cross-tenant and cross-mailbox parents", async () => {
    const { repository } = await setup();
    await expect(repository.upsertMessage(message("org-c"))).rejects.toBeInstanceOf(NotFoundError);
    await repository.putThread({
      organizationId: "org-b",
      id: "thread-b",
      mailboxId: "box",
      source: "headers",
      providerThreadKey: null,
    });
    await expect(
      repository.upsertMessage({
        ...message(),
        id: "new",
        providerMessageKey: "new",
        threadId: "thread-b",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await repository.putThread({
      organizationId: "org-a",
      id: "thread",
      mailboxId: "box",
      source: "provider",
      providerThreadKey: "provider-thread",
    });
    await expect(
      repository.putThread({
        organizationId: "org-a",
        id: "thread",
        mailboxId: "peer-box",
        source: "headers",
        providerThreadKey: null,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      repository.upsertMessage({
        ...message(),
        id: "new",
        providerMessageKey: "new",
        threadId: "thread",
      }),
    ).resolves.toMatchObject({ threadId: "thread" });
    await expect(
      repository.putOutboxItem({
        organizationId: "org-a",
        id: "out",
        mailboxId: "peer-box",
        messageId: "msg",
        status: "queued",
        attempts: 0,
        scheduledAt: null,
        nextAttemptAt: null,
        lastError: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(repository.putLink({ ...link, organizationId: "org-c" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("stores over-limit inbound attachments as metadata only and models outbox state", async () => {
    const { repository } = await setup();
    const attachment = {
      organizationId: "org-a",
      id: "attachment",
      messageId: "msg",
      name: "file.txt",
      size: MAX_INBOUND_ATTACHMENT_BYTES + 1,
      contentType: "text/plain",
      storage: "not_stored" as const,
      blobRef: null,
    };
    await expect(repository.putAttachment(attachment)).resolves.toEqual(attachment);
    await expect(
      repository.putAttachment({ ...attachment, storage: "stored", blobRef: "private-blob" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repository.putAttachment({
        ...attachment,
        storage: "stored",
        size: MAX_INBOUND_ATTACHMENT_BYTES,
        blobRef: "private-blob",
      }),
    ).resolves.toMatchObject({ storage: "stored" });
    await expect(
      repository.putAttachment({ ...attachment, blobRef: "private-blob" }),
    ).rejects.toBeInstanceOf(ValidationError);
    for (const status of ["queued", "sending", "sent", "failed", "cancelled"] as const) {
      await expect(
        repository.putOutboxItem({
          organizationId: "org-a",
          id: "out",
          mailboxId: "box",
          messageId: "msg",
          status,
          attempts: 2,
          scheduledAt: "2026-10-21T10:00:00Z",
          nextAttemptAt: null,
          lastError: "Delivery unavailable.",
        }),
      ).resolves.toMatchObject({ status });
    }
  });
});

describe("mail user boundary", () => {
  it("reveals private mail only to its owner, with identical absent/invisible errors even for admins", async () => {
    const { owner, peer } = await setup();
    expect((await owner.getMessage("msg")).id).toBe("msg");
    expect(await peer.listMessages()).toEqual([]);
    const absent = await peer.getMessage("missing").catch((e: unknown) => e);
    const invisible = await peer.getMessage("msg").catch((e: unknown) => e);
    expect(absent).toBeInstanceOf(NotFoundError);
    expect(invisible).toBeInstanceOf(NotFoundError);
    expect(JSON.stringify(invisible)).toEqual(JSON.stringify(absent));
    for (const action of [
      () => peer.listLinks("msg"),
      () => peer.listAttachments("msg"),
      () => peer.setShared("msg", true),
      () => peer.linkParticipants("msg"),
      () => peer.linkRecord("msg", "leads", "lead-1"),
      () => peer.unlinkRecord("msg", "leads", "lead-1"),
    ]) {
      await expect(action()).rejects.toBeInstanceOf(NotFoundError);
    }
  });

  it("rechecks sharing AND record visibility, and allows sharing/link mutations only by the owner", async () => {
    const { owner, peer, canReadRecord } = await setup();
    await owner.setShared("msg", true);
    await expect(peer.getMessage("msg")).rejects.toBeInstanceOf(NotFoundError);
    await owner.linkRecord("msg", "leads", "lead-1");
    await expect(peer.getMessage("msg")).resolves.toMatchObject({ id: "msg" });
    expect(await peer.listMessages()).toHaveLength(1);
    expect(canReadRecord).toHaveBeenCalledWith(context("peer"), "leads", "lead-1");
    await expect(peer.setShared("msg", false)).rejects.toBeInstanceOf(NotFoundError);
    await expect(peer.unlinkRecord("msg", "leads", "lead-1")).rejects.toBeInstanceOf(NotFoundError);
    canReadRecord.mockReturnValue(false);
    await expect(peer.getMessage("msg")).rejects.toBeInstanceOf(NotFoundError);
    await expect(owner.getMessage("msg")).resolves.toMatchObject({ id: "msg" });
    await expect(owner.linkRecord("msg", "contacts", "hidden")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    canReadRecord.mockReturnValue(true);
    await owner.setShared("msg", false);
    await expect(peer.getMessage("msg")).rejects.toBeInstanceOf(NotFoundError);
    await owner.setShared("msg", true);
    await owner.unlinkRecord("msg", "leads", "lead-1");
    await expect(peer.getMessage("msg")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("filters foreign tenant rows even from an overbroad repository, and snapshots context", async () => {
    const { repository, options } = await setup();
    await repository.setShared("org-b", "msg", true);
    await repository.putLink({ ...link, organizationId: "org-b" });
    const broad: MailSnapshot = await repository.read("org-b");
    const untrusted: MailRepository = { ...repository, read: async () => broad };
    const mutable = context();
    const service = createMailService(mutable, { ...options, repository: untrusted });
    mutable.orgId = "org-b";
    expect(await service.listMessages()).toEqual([]);
    await expect(service.getMessage("msg")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("attachment metadata follows sharing, while unreadable record links stay hidden", async () => {
    const { repository, owner, options } = await setup();
    await repository.putAttachment({
      organizationId: "org-a",
      id: "att",
      messageId: "msg",
      name: "file.txt",
      size: 1,
      contentType: "text/plain",
      storage: "stored",
      blobRef: "private-blob",
    });
    await repository.putLink(link);
    await repository.putLink({ ...link, recordId: "hidden" });
    await owner.setShared("msg", true);
    const peer = createMailService(context("peer"), {
      ...options,
      canReadRecord: async (_ctx, _module, id) => id === "lead-1",
    });
    expect(await peer.listAttachments("msg")).toHaveLength(1);
    expect(await peer.listLinks("msg")).toEqual([link]);
    await owner.setShared("msg", false);
    await expect(peer.listAttachments("msg")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("record linking", () => {
  it("normalizes exact email matches, deduplicates, links all ambiguous matches and excludes domains/BCC/other tenants", async () => {
    const { owner, findByAddress } = await setup();
    findByAddress.mockImplementation(async () => [
      {
        organizationId: "org-a",
        module: "leads",
        recordId: "lead-1",
        address: " sender@EXAMPLE.com ",
      },
      {
        organizationId: "org-a",
        module: "contacts",
        recordId: "contact-1",
        address: "sender@example.com",
      },
      {
        organizationId: "org-a",
        module: "contacts",
        recordId: "contact-1",
        address: "sender@example.com",
      },
      {
        organizationId: "org-a",
        module: "accounts",
        recordId: "domain",
        address: "other@example.com",
      },
      {
        organizationId: "org-b",
        module: "leads",
        recordId: "foreign",
        address: "sender@example.com",
      },
    ]);
    const links = await owner.linkParticipants("msg");
    expect(links).toHaveLength(2);
    expect(links.every((r) => r.ambiguous && r.source === "auto")).toBe(true);
    expect(findByAddress.mock.calls).toEqual([
      ["org-a", "sender@example.com"],
      ["org-a", "reader@example.org"],
    ]);
    expect(await owner.linkParticipants("msg")).toEqual(links);
    expect(await owner.listLinks("msg")).toHaveLength(2);
    await owner.linkRecord("msg", "leads", "lead-1");
    await owner.linkParticipants("msg");
    expect((await owner.listLinks("msg")).find((r) => r.recordId === "lead-1")?.source).toBe(
      "manual",
    );
    await owner.unlinkRecord("msg", "leads", "lead-1");
    await owner.unlinkRecord("msg", "leads", "lead-1");
    expect(await owner.listLinks("msg")).toHaveLength(1);
  });

  it("single matches are unambiguous; empty lookup adds no links", async () => {
    const { owner, findByAddress } = await setup();
    expect(await owner.linkParticipants("msg")).toEqual([]);
    findByAddress.mockImplementation(async () => [
      {
        organizationId: "org-a",
        module: "accounts",
        recordId: "account",
        address: "sender@example.com",
      },
    ]);
    expect(await owner.linkParticipants("msg")).toMatchObject([
      { module: "accounts", ambiguous: false },
    ]);
  });
});

describe("development recipient lock and secret surface", () => {
  it("allows only one configured test address across the complete recipient list", () => {
    expect(() =>
      assertRecipientAllowed(
        [" TEST@EXAMPLE.com ", { address: "test@example.com" }],
        ["test@example.com"],
      ),
    ).not.toThrow();
    for (const allowed of [
      [],
      ["test@example.com", "other@example.com"],
      ["test@example.com", "test@example.com"],
      ["invalid"],
    ]) {
      expect(() => assertRecipientAllowed(["test@example.com"], allowed)).toThrow(ValidationError);
    }
    for (const recipients of [
      [],
      ["other@example.com"],
      ["test@example.com", "hidden@example.com"],
      ["Test <test@example.com>"],
      ["test@example.com, other@example.com"],
      new Array<string>(1),
    ]) {
      expect(() => assertRecipientAllowed(recipients, ["test@example.com"])).toThrow(
        ValidationError,
      );
    }
    try {
      assertRecipientAllowed(["denied@example.org"], ["test@example.com"]);
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain("example");
    }
  });

  it("does not model raw credentials and rejects extra credential fields at runtime without echoing them", async () => {
    expectTypeOf<
      Extract<keyof MailboxAccount, "accessToken" | "refreshToken" | "password" | "token">
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Extract<keyof MailMessage, "credentialRef" | "accessToken" | "refreshToken" | "password">
    >().toEqualTypeOf<never>();
    const { repository, owner } = await setup();
    for (const field of ["accessToken", "refreshToken", "password", "token"]) {
      const input = { ...mailbox("org-c"), [field]: "synthetic-secret-marker" };
      await expect(repository.createMailbox(input)).rejects.toBeInstanceOf(ValidationError);
      try {
        await repository.createMailbox(input);
      } catch (error) {
        expect(JSON.stringify(error)).not.toContain("synthetic-secret-marker");
        expect(String(error)).not.toContain("synthetic-secret-marker");
      }
    }
    const validRows = [
      { schema: mailboxAccountSchema, row: mailbox() },
      {
        schema: mailThreadSchema,
        row: {
          organizationId: "org-a",
          id: "thread",
          mailboxId: "box",
          source: "headers",
          providerThreadKey: null,
        },
      },
      { schema: mailMessageSchema, row: message() },
      {
        schema: mailAttachmentMetaSchema,
        row: {
          organizationId: "org-a",
          id: "att",
          messageId: "msg",
          name: "file.txt",
          size: 1,
          contentType: "text/plain",
          storage: "not_stored",
          blobRef: null,
        },
      },
      { schema: mailRecordLinkSchema, row: link },
      {
        schema: outboxItemSchema,
        row: {
          organizationId: "org-a",
          id: "out",
          mailboxId: "box",
          messageId: "msg",
          status: "queued",
          attempts: 0,
          nextAttemptAt: null,
          lastError: null,
          scheduledAt: null,
        },
      },
    ];
    for (const { schema, row } of validRows) {
      expect(schema.safeParse(row).success).toBe(true);
      for (const field of ["accessToken", "refreshToken", "password", "token"]) {
        expect(schema.safeParse({ ...row, [field]: "synthetic-secret-marker" }).success).toBe(
          false,
        );
      }
    }
    await expect(
      repository.upsertMessage({
        ...message(),
        id: "unsafe",
        providerMessageKey: "unsafe",
        from: [{ address: "sender@example.com", password: "synthetic-secret-marker" }],
      } as unknown as MailMessage),
    ).rejects.toBeInstanceOf(ValidationError);
    const response = {
      snapshot: await repository.read("org-a"),
      message: await owner.getMessage("msg"),
    };
    function inspect(value: unknown) {
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        expect(["accessToken", "refreshToken", "password", "token"]).not.toContain(key);
        inspect(child);
      }
    }
    inspect(response);
    expect(JSON.stringify(response)).not.toContain("synthetic-secret-marker");
  });
});
