import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { fence, InMemoryJobQueue, JobExecutionError } from "../jobs";
import type { OrgContext } from "../tenancy/types";
import type { ImportJob } from "../transfer/types";
import {
  assertRecipientAllowed,
  createInMemoryMailRepository,
  createMailJobCatalog,
  createMailOutbox,
  createMailSendHandler,
  DELIVERY_UNKNOWN,
  MAX_OUTBOUND_ATTACHMENT_BYTES,
  type MailSender,
  type MailSendResult,
} from "./index";

const ctx = (orgId = "org-a", userId = "owner"): OrgContext => ({
  orgId,
  userId,
  orgSlug: "t",
  orgName: "T",
  role: "member",
});
const MB = 1024 * 1024;

async function setup(
  sendImpl: () => Promise<MailSendResult> = async () => ({
    status: "accepted",
    providerMessageId: "prov-1",
  }),
) {
  const repository = createInMemoryMailRepository();
  const queue = new InMemoryJobQueue(createMailJobCatalog());
  const calls: number[] = [];
  const sender: MailSender = {
    send: async () => {
      calls.push(1);
      return sendImpl();
    },
  };
  const options = {
    repository,
    queue,
    sender,
    recordAddressLookup: { findByAddress: async () => [] },
    canReadRecord: () => true,
  };
  for (const [org, user] of [
    ["org-a", "owner"],
    ["org-a", "other"],
    ["org-b", "owner"],
  ] as const) {
    await repository.createMailbox({
      organizationId: org,
      id: `box-${org}-${user}`,
      ownerUserId: user,
      provider: "google",
      status: "connected",
      credentialRef: "ref",
      lastSyncAt: null,
      lastError: null,
    });
  }
  const outbox = createMailOutbox(ctx(), options);
  const handler = createMailSendHandler(options);
  const mail = (over: object = {}) => ({
    idempotencyKey: "send-1",
    mailboxId: "box-org-a-owner",
    from: { address: "me@example.test" },
    to: [{ address: "you@example.test" }],
    subject: "Hi",
    ...over,
  });
  async function runNext() {
    const [job] = await queue.claim({ workerId: "w", limit: 1, leaseMs: 60000 });
    if (!job) throw new Error("no job");
    const c = {
      organizationId: job.organizationId,
      job,
      fence: fence(job),
      signal: new AbortController().signal,
      checkpoint: async () => {},
    };
    return handler.run(c);
  }
  return { repository, queue, options, outbox, handler, mail, calls, runNext };
}

describe("mail outbox compose", () => {
  it("writes the outbox item and one job; duplicate compose does not enqueue twice", async () => {
    const s = await setup();
    const a = await s.outbox.compose(s.mail());
    const b = await s.outbox.compose(s.mail());
    expect(b.id).toBe(a.id);
    expect(a.status).toBe("queued");
    const jobs = await s.queue.claim({ workerId: "w", limit: 10, leaseMs: 1000 });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.payload).toEqual({ outboxId: "send-1" });
    expect((await s.repository.read("org-a")).outbox).toHaveLength(1);
  });
  it("replay with different content conflicts and leaves draft and files untouched", async () => {
    const s = await setup();
    const file = {
      id: "f1",
      name: "a.pdf",
      size: 10,
      contentType: "application/pdf",
      blobRef: "blob-1",
    };
    await s.outbox.compose(s.mail({ attachments: [file] }));
    const before = await s.repository.read("org-a");
    for (const over of [
      { to: [{ address: "other@example.test" }], attachments: [file] },
      { subject: "Changed", attachments: [file] },
      { attachments: [file, { ...file, id: "f2" }] },
    ]) {
      await expect(s.outbox.compose(s.mail(over))).rejects.toMatchObject({ name: "ConflictError" });
    }
    expect(await s.repository.read("org-a")).toEqual(before);
    const same = await s.outbox.compose(s.mail({ attachments: [file] }));
    expect(same.id).toBe("send-1");
    expect((await s.repository.read("org-a")).outbox).toHaveLength(1);
  });
  it("rejects a mailbox that is not the caller's, other tenants' and disconnected ones", async () => {
    const s = await setup();
    await expect(s.outbox.compose(s.mail({ mailboxId: "box-org-a-other" }))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(s.outbox.compose(s.mail({ mailboxId: "box-org-b-owner" }))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await s.repository.createMailbox({
      organizationId: "org-a",
      id: "off",
      ownerUserId: "third",
      provider: "google",
      status: "disconnected",
      credentialRef: null,
      lastSyncAt: null,
      lastError: null,
    });
    await expect(
      createMailOutbox(ctx("org-a", "third"), s.options).compose(s.mail({ mailboxId: "off" })),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it("enforces Q7 total 20 MB and the file allowlist", async () => {
    const s = await setup();
    const file = (id: string, size: number, name = "a.pdf", contentType = "application/pdf") => ({
      id,
      name,
      size,
      contentType,
      blobRef: `b-${id}`,
    });
    await expect(
      s.outbox.compose(s.mail({ attachments: [file("1", 12 * MB), file("2", 9 * MB)] })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      s.outbox.compose(
        s.mail({ attachments: [file("1", 10, "x.exe", "application/octet-stream")] }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      s.outbox.compose(s.mail({ attachments: [file("1", 10, "x.pdf", "image/png")] })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      s.outbox.compose(s.mail({ attachments: [file("1", MAX_OUTBOUND_ATTACHMENT_BYTES)] })),
    ).resolves.toBeTruthy();
  });
  it("requires a recipient and rejects the same key on another mailbox", async () => {
    const s = await setup();
    await expect(s.outbox.compose(s.mail({ to: [] }))).rejects.toBeInstanceOf(ValidationError);
    await s.outbox.compose(s.mail());
    await s.repository.createMailbox({
      organizationId: "org-a",
      id: "box2",
      ownerUserId: "owner2",
      provider: "google",
      status: "connected",
      credentialRef: null,
      lastSyncAt: null,
      lastError: null,
    });
    await expect(
      createMailOutbox(ctx("org-a", "owner2"), s.options).compose(s.mail({ mailboxId: "box2" })),
    ).rejects.toBeInstanceOf(ConflictError);
  });
  it("applies the recipient guard at compose", async () => {
    const s = await setup();
    const guarded = createMailOutbox(ctx(), {
      ...s.options,
      recipientGuard: (r) => assertRecipientAllowed(r, ["ok@example.test"]),
    });
    await expect(guarded.compose(s.mail())).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("mail.send handler", () => {
  it("sends once, records the private Sent message and is replay-safe", async () => {
    const s = await setup();
    await s.outbox.compose(s.mail());
    await s.runNext();
    const data = await s.repository.read("org-a");
    expect(data.outbox[0]?.status).toBe("sent");
    const sent = data.messages.find((m) => m.folder === "sent");
    expect(sent?.providerMessageKey).toBe("prov-1");
    expect(sent?.sharedByOwner).toBe(false);
    expect(s.calls).toHaveLength(1);
    // Same intent re-enqueued by hand must not resend.
    const job = await s.queue.enqueue(
      { organizationId: "org-a" },
      {
        kind: "mail_send",
        payloadVersion: 1,
        payload: { outboxId: "send-1" },
        idempotencyKey: "send-1",
      },
    );
    expect(job.status).toBe("running");
  });
  it("links participants of the Sent message but not BCC", async () => {
    const s = await setup();
    const options = {
      ...s.options,
      recordAddressLookup: {
        findByAddress: async (org: string, address: string) => [
          { organizationId: org, module: "contacts" as const, recordId: `r-${address}`, address },
        ],
      },
    };
    const outbox = createMailOutbox(ctx(), options);
    const handler = createMailSendHandler(options);
    await outbox.compose(s.mail({ bcc: [{ address: "hidden@example.test" }] }));
    const [job] = await s.queue.claim({ workerId: "w", limit: 1, leaseMs: 1000 });
    if (!job) throw new Error("no job");
    await handler.run({
      organizationId: "org-a",
      job,
      fence: fence(job),
      signal: new AbortController().signal,
      checkpoint: async () => {},
    });
    const links = (await s.repository.read("org-a")).links.map((l) => l.recordId).sort();
    expect(links).toEqual(["r-me@example.test", "r-you@example.test"]);
  });
  it("holds delivery_unknown on a provider timeout and never resends", async () => {
    const s = await setup(async () => {
      throw new Error("timeout secret");
    });
    await s.outbox.compose(s.mail());
    await expect(s.runNext()).rejects.toMatchObject({
      failure: { code: "delivery_unknown", retryable: false },
    });
    const item = (await s.repository.read("org-a")).outbox[0];
    expect(item).toMatchObject({ status: "failed", lastError: DELIVERY_UNKNOWN });
    expect((await s.repository.read("org-a")).messages.some((m) => m.folder === "sent")).toBe(
      false,
    );
  });
  it("treats a crash while `sending` as uncertain on replay", async () => {
    const s = await setup();
    await s.outbox.compose(s.mail());
    const row = (await s.repository.read("org-a")).outbox[0];
    if (!row) throw new Error("x");
    await s.repository.putOutboxItem({ ...row, status: "sending", attempts: 1 });
    await expect(s.runNext()).rejects.toBeInstanceOf(JobExecutionError);
    expect(s.calls).toHaveLength(0);
    expect((await s.repository.read("org-a")).outbox[0]?.lastError).toBe(DELIVERY_UNKNOWN);
  });
  it("maps rejections to safe states; retryable ones requeue", async () => {
    const perm = await setup(async () => ({
      status: "rejected",
      reason: "bad_address",
      retryable: false,
    }));
    await perm.outbox.compose(perm.mail());
    await expect(perm.runNext()).rejects.toMatchObject({ failure: { code: "permanent" } });
    expect((await perm.repository.read("org-a")).outbox[0]).toMatchObject({
      status: "failed",
      lastError: "bad_address",
    });
    const soft = await setup(async () => ({
      status: "rejected",
      reason: "Raw Provider Detail: token=abc",
      retryable: true,
    }));
    await soft.outbox.compose(soft.mail());
    await expect(soft.runNext()).rejects.toMatchObject({
      failure: { code: "transient", retryable: true },
    });
    expect((await soft.repository.read("org-a")).outbox[0]).toMatchObject({
      status: "queued",
      lastError: "rejected",
    });
  });
  it("marks the outbox failed when the last attempt gets a retryable rejection", async () => {
    const s = await setup(async () => ({ status: "rejected", reason: "busy", retryable: true }));
    await s.outbox.compose(s.mail());
    const [job] = await s.queue.claim({ workerId: "w", limit: 1, leaseMs: 60000 });
    if (!job) throw new Error("no job");
    const last = { ...job, attempts: job.maxAttempts };
    await expect(
      s.handler.run({
        organizationId: job.organizationId,
        job: last,
        fence: fence(job),
        signal: new AbortController().signal,
        checkpoint: async () => {},
      }),
    ).rejects.toMatchObject({ failure: { code: "transient" } });
    expect((await s.repository.read("org-a")).outbox[0]).toMatchObject({
      status: "failed",
      lastError: "busy",
    });
  });
  it("cancels when the mailbox disconnects and never calls the sender", async () => {
    const s = await setup();
    await s.outbox.compose(s.mail());
    const data = await s.repository.read("org-a");
    const box = data.mailboxes.find((m) => m.id === "box-org-a-owner");
    if (!box) throw new Error("x");
    // Replace the mailbox status through a fresh repository view is not possible; use a wrapper.
    const wrapped = {
      ...s.repository,
      read: async (o: string) => {
        const d = await s.repository.read(o);
        return {
          ...d,
          mailboxes: d.mailboxes.map((m) => ({ ...m, status: "disconnected" as const })),
        };
      },
    };
    const handler = createMailSendHandler({ ...s.options, repository: wrapped });
    const [job] = await s.queue.claim({ workerId: "w", limit: 1, leaseMs: 1000 });
    if (!job) throw new Error("no job");
    const c = {
      organizationId: "org-a",
      job,
      fence: fence(job),
      signal: new AbortController().signal,
      checkpoint: async () => {},
    };
    expect(await handler.isCurrent(c)).toBe(false);
    expect((await s.repository.read("org-a")).outbox[0]?.status).toBe("cancelled");
    await handler.run(c);
    expect(s.calls).toHaveLength(0);
  });
});

describe("Notify Email (CSV-09)", () => {
  const job = (status: ImportJob["status"] = "completed"): ImportJob => ({
    id: "imp-1",
    module: "Leads",
    fileName: "a.csv",
    createdBy: { id: "owner", name: "Own" },
    createdAt: "2026-10-01T00:00:00.000Z",
    status,
    counts: { created: 1, updated: 0, skipped: 0, errors: 0 },
    undoable: true,
    rows: [],
  });
  const input = (j = job()) => ({
    job: j,
    recipient: { address: "me@example.test" },
    historyUrl: "https://app.test/history",
  });
  it("queues one mail through the user's mailbox, once per import", async () => {
    const s = await setup();
    const a = await s.outbox.enqueueImportNotification(input());
    const b = await s.outbox.enqueueImportNotification(input());
    expect(a.status).toBe("queued");
    expect(b.status).toBe("queued");
    expect((await s.repository.read("org-a")).outbox).toHaveLength(1);
    expect((await s.repository.read("org-a")).messages[0]?.subject).toBe("Import completed: a.csv");
  });
  it("skips without a connected mailbox, for undone imports, and for another user's import", async () => {
    const s = await setup();
    const lonely = createMailOutbox(ctx("org-a", "nobody"), s.options);
    expect(
      await lonely.enqueueImportNotification({
        ...input(),
        job: { ...job(), createdBy: { id: "nobody", name: "N" } },
      }),
    ).toMatchObject({ status: "skipped", reason: "no_connected_mailbox" });
    expect(await s.outbox.enqueueImportNotification(input(job("undone")))).toMatchObject({
      status: "skipped",
    });
    await expect(
      s.outbox.enqueueImportNotification(
        input({ ...job(), createdBy: { id: "other", name: "O" } }),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("tenant isolation", () => {
  it("runs the job against the job's tenant, not another org's outbox", async () => {
    const s = await setup();
    await s.outbox.compose(s.mail());
    const [job] = await s.queue.claim({ workerId: "w", limit: 1, leaseMs: 1000 });
    if (!job) throw new Error("no job");
    const foreign = {
      organizationId: "org-b",
      job: { ...job, organizationId: "org-b" },
      fence: fence(job),
      signal: new AbortController().signal,
      checkpoint: async () => {},
    };
    await expect(s.handler.run(foreign)).rejects.toMatchObject({
      failure: { code: "resource_missing" },
    });
    expect(s.calls).toHaveLength(0);
  });
});
