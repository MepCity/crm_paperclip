import { describe, expect, it, vi } from "vitest";
import { createInvitationProcessor } from "../calendar/invitation-store";
import { fence, InMemoryJobQueue, safeFailure } from "../jobs";
import { mapGmailMessage } from "./connectors/gmail/mapping";
import { ConnectorError, type MailConnector } from "./connectors/gmail/port";
import { createMailJobCatalog } from "./outbox";
import { createInMemoryMailRepository } from "./repository";
import { createMailboxSyncScheduler, createMailSyncHandler, type MailSyncOptions } from "./sync";
import type { MailRepository, RecordAddressMatch } from "./types";

const org = { organizationId: "org" };
const now = new Date("2026-10-22T12:00:00.000Z");
// Same synthetic provider shape as the connector fixtures; no real mailbox.
function mapped(id: string, folder = "INBOX") {
  return mapGmailMessage("org", "box", {
    id,
    threadId: `t-${id}`,
    labelIds: [folder],
    internalDate: "1760000000000",
    payload: {
      headers: [
        { name: "From", value: "Ann <Ann@Example.test>" },
        { name: "To", value: "you@example.test" },
        { name: "Subject", value: "Synthetic mail" },
      ],
      parts: [
        { filename: "a.pdf", mimeType: "application/pdf", body: { attachmentId: "A1", size: 100 } },
      ],
    },
  });
}
async function setup(
  matches: RecordAddressMatch[] = [],
  invitations?: MailSyncOptions["invitations"],
) {
  const repository = createInMemoryMailRepository();
  for (const organizationId of ["org", "other"])
    await repository.createMailbox({
      organizationId,
      id: "box",
      ownerUserId: "owner",
      provider: "google",
      status: "connected",
      credentialRef: "cred",
      lastSyncAt: null,
      lastError: null,
      folders: ["inbox", "sent"],
    });
  const connector: MailConnector = {
    listChanges: vi.fn(async (box) => ({
      messageIds: box.folder === "sent" ? [] : ["m1", "m2"],
      nextCursor: "next",
    })),
    fetchMessage: vi.fn(async (box, id) => mapped(id, box.folder === "sent" ? "SENT" : "INBOX")),
    sendRaw: vi.fn(),
    revoke: vi.fn(),
    disconnect: vi.fn(),
  };
  const queue = new InMemoryJobQueue(
    createMailJobCatalog(),
    () => now.getTime(),
    () => 0,
  );
  const scheduler = createMailboxSyncScheduler(org, queue);
  const options = {
    repository,
    connector,
    recordAddressLookup: { findByAddress: vi.fn(async () => matches) },
    now: () => now,
    ...(invitations ? { invitations } : {}),
  };
  async function run(repo: MailRepository = repository) {
    await scheduler.enqueueMailboxSync("box");
    const [job] = await queue.claim({ workerId: "w", limit: 1, leaseMs: 60000 });
    if (!job) throw new Error("No job");
    const context = {
      ...org,
      job,
      fence: fence(job),
      signal: new AbortController().signal,
      checkpoint: vi.fn(async () => {}),
    };
    const handler = createMailSyncHandler({ ...options, repository: repo });
    try {
      await handler.run(context);
      await queue.succeed(context.fence);
    } catch (error) {
      await queue.fail(context.fence, safeFailure(error));
    }
    return { job: await queue.get(org, job.id), handler, context };
  }
  return { ...options, queue, scheduler, run };
}

describe("inbound sync jobs", () => {
  it("commits folder cursors only after attachments and links; isolates tenant state", async () => {
    const s = await setup();
    const put = vi.spyOn(s.repository, "putSyncState");
    const original = s.repository.putAttachment;
    vi.spyOn(s.repository, "putAttachment").mockImplementation(async (input) => {
      expect(put.mock.calls.filter(([state]) => state.folder === "inbox")).toHaveLength(0);
      return original(input);
    });
    await s.run();
    expect(await s.repository.getSyncState("org", "box", "inbox")).toMatchObject({
      cursor: "next",
      lastSyncedAt: now.toISOString(),
      lastError: null,
    });
    expect(await s.repository.getSyncState("org", "box", "sent")).toMatchObject({ cursor: "next" });
    expect(await s.repository.getSyncState("other", "box", "inbox")).toMatchObject({
      cursor: null,
      lastSyncedAt: null,
    });
    expect(s.connector.listChanges).toHaveBeenCalledWith(
      expect.objectContaining({ folder: "inbox" }),
      null,
    );
  });

  it("keeps the old cursor on mid-batch failure and replays without duplicate messages or attachments", async () => {
    const s = await setup();
    await s.repository.putSyncState({
      ...org,
      mailboxId: "box",
      folder: "inbox",
      cursor: "old",
      lastSyncedAt: null,
      lastError: null,
    });
    const original = s.repository.putAttachment;
    let calls = 0;
    vi.spyOn(s.repository, "putAttachment").mockImplementation(async (input) => {
      if (++calls === 2) {
        throw new Error("private storage detail");
      }
      return original(input);
    });
    const first = await s.run();
    expect(first.job).toMatchObject({ status: "queued", lastErrorCode: "transient" });
    expect(await s.repository.getSyncState("org", "box", "inbox")).toMatchObject({
      cursor: "old",
      lastError: "storage_failed",
    });
    expect((await s.repository.read("org")).messages).toHaveLength(2);
    expect((await s.repository.read("org")).attachments).toHaveLength(1);
    await s.run();
    const data = await s.repository.read("org");
    expect(data.messages).toHaveLength(2);
    expect(data.attachments).toHaveLength(2);
    expect(await s.repository.getSyncState("org", "box", "inbox")).toMatchObject({
      cursor: "next",
      lastError: null,
    });
  });

  it("does not advance the cursor if record lookup fails after message storage", async () => {
    const s = await setup();
    s.recordAddressLookup.findByAddress.mockRejectedValueOnce(new Error("lookup unavailable"));
    await s.run();
    expect(await s.repository.getSyncState("org", "box", "inbox")).toMatchObject({
      cursor: null,
      lastError: "storage_failed",
    });
    await s.run();
    expect((await s.repository.read("org")).messages).toHaveLength(2);
  });

  it("marks revoked authorization and fails permanently without a retry loop", async () => {
    const s = await setup();
    vi.mocked(s.connector.listChanges).mockRejectedValue(new ConnectorError("auth_revoked"));
    const result = await s.run();
    expect(result.job).toMatchObject({ status: "failed", lastErrorCode: "authorization_revoked" });
    expect((await s.repository.read("org")).mailboxes[0]).toMatchObject({
      status: "error",
      lastError: "auth_revoked",
    });
    expect(await s.repository.getSyncState("org", "box", "inbox")).toMatchObject({
      cursor: null,
      lastError: "auth_revoked",
    });
    expect(await result.handler.isCurrent(result.context)).toBe(false);
    expect(await s.queue.claim({ workerId: "w", limit: 1, leaseMs: 60000 })).toEqual([]);
  });

  it("respects connector Retry-After and stores only a safe classification", async () => {
    const s = await setup();
    vi.mocked(s.connector.listChanges).mockRejectedValue(new ConnectorError("retryable", 60));
    const { job } = await s.run();
    expect(job).toMatchObject({ status: "queued", runAt: now.getTime() + 60000 });
    expect(await s.repository.getSyncState("org", "box", "inbox")).toMatchObject({
      lastError: "retryable",
    });
  });

  it.each([1, 3])(
    "links all %i exact matches and preserves a manual association on replay",
    async (count) => {
      const matches: RecordAddressMatch[] = (["leads", "contacts", "accounts"] as const)
        .slice(0, count)
        .map((module) => ({ ...org, module, recordId: module, address: "ANN@example.test" }));
      const s = await setup([
        ...matches,
        {
          organizationId: "other",
          module: "leads",
          recordId: "foreign",
          address: "ann@example.test",
        },
        { ...org, module: "accounts", recordId: "domain", address: "else@example.test" },
      ]);
      await s.run();
      const message = (await s.repository.read("org")).messages[0];
      if (!message) throw new Error("No message");
      const links = (await s.repository.read("org")).links.filter(
        (l) => l.messageId === message.id,
      );
      expect(links).toHaveLength(count);
      expect(links.every((l) => l.ambiguous === count > 1)).toBe(true);
      const firstLink = links[0];
      if (!firstLink) throw new Error("No link");
      await s.repository.putLink({ ...firstLink, source: "manual", ambiguous: false });
      const unrelatedManual = {
        ...firstLink,
        recordId: "manual-only",
        source: "manual" as const,
        ambiguous: false,
      };
      await s.repository.putLink(unrelatedManual);
      await s.run();
      expect(
        (await s.repository.read("org")).links.filter((l) => l.messageId === message.id),
      ).toHaveLength(count + 1);
      expect((await s.repository.read("org")).links).toContainEqual(unrelatedManual);
      expect((await s.repository.read("org")).links).toContainEqual({
        ...links[0],
        source: "manual",
        ambiguous: false,
      });
    },
  );

  it("creates no links for unknown participants", async () => {
    const s = await setup();
    await s.run();
    expect((await s.repository.read("org")).links).toEqual([]);
  });

  it("deduplicates concurrent pending/running requests and allows a fresh sync after completion", async () => {
    const s = await setup();
    const jobs = await Promise.all(
      Array.from({ length: 10 }, () => s.scheduler.enqueueMailboxSync("box")),
    );
    expect(new Set(jobs.map((j) => j.id)).size).toBe(1);
    const sameQueueScheduler = createMailboxSyncScheduler(org, s.queue);
    expect((await sameQueueScheduler.enqueueMailboxSync("box")).id).toBe(jobs[0]?.id);

    const [running] = await s.queue.claim({ workerId: "w", limit: 10, leaseMs: 60000 });
    if (!running) throw new Error("No job");
    expect((await s.scheduler.enqueueMailboxSync("box")).id).toBe(running.id);
    await s.queue.succeed(fence(running));
    const next = await Promise.all(
      Array.from({ length: 10 }, () => s.scheduler.enqueueMailboxSync("box")),
    );
    expect(new Set(next.map((j) => j.id)).size).toBe(1);
    expect(next[0]?.id).not.toBe(running.id);
    const otherTenant = await createMailboxSyncScheduler(
      { organizationId: "other" },
      s.queue,
    ).enqueueMailboxSync("box");
    expect(otherTenant.id).not.toBe(jobs[0]?.id);
  });
});

describe("incoming invitations during sync", () => {
  const ics =
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Example//EN\r\nMETHOD:REQUEST\r\nBEGIN:VEVENT\r\nUID:e@example.com\r\nDTSTAMP:20261005T090000Z\r\nDTSTART:20261008T130000Z\r\nDTEND:20261008T140000Z\r\nSUMMARY:S\r\nORGANIZER:mailto:a@example.com\r\nATTENDEE:mailto:b@example.org\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
  it("stores the request, survives bad parts and does not repeat on re-sync", async () => {
    const processor = createInvitationProcessor();
    const s = await setup([], {
      processor,
      calendarParts: async (m) =>
        m.id.includes("m1") ? [ics] : ["BEGIN:VCALENDAR\r\nMETHOD:REPLY\r\n"],
    });
    const { job } = await s.run();
    expect(job?.status).toBe("succeeded");
    expect(processor.stats).toMatchObject({ requestStored: 1, parseFailures: 1 });
    await s.run();
    expect(processor.stats).toMatchObject({ requestStored: 1, parseFailures: 1, duplicates: 2 });
  });
});
