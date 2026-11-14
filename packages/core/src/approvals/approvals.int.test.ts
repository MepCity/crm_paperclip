import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import pg from "pg";
import { describe, expect, it } from "vitest";
import * as access from "../access";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedForApprovalError,
  ValidationError,
} from "../errors";
import { getNotificationService } from "../notifications";
import type { RecordData } from "../records/contract";
import { WriteObserverFailure } from "../records/write-observer";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import { addAccessTestMember, addTestMember, createTestOrganization } from "../testing";
import { ApprovalService, type SystemRecords } from "./service";
import type { CreateProcessInput } from "./types";

type Setup = Awaited<ReturnType<typeof setup>>;

async function setup() {
  const { ctx: admin } = await createTestOrganization();
  const b = await addTestMember(admin, "member");
  const c = await addTestMember(admin, "member");
  const d = await addTestMember(admin, "member");
  const outsider = await addTestMember(admin, "member");
  const updates: { module: string; id: string; input: Record<string, unknown> }[] = [];
  const records = new Map<string, RecordData>();
  const systemRecords: SystemRecords = {
    get: async (module, id) => {
      const record = records.get(`${module}:${id}`);
      if (!record) throw new NotFoundError();
      return record;
    },
    update: async (module, id, input) => {
      updates.push({ module, id, input });
      const record = records.get(`${module}:${id}`);
      if (!record) throw new NotFoundError();
      return record;
    },
    getModuleProjection: async () => ({ businessCardFields: ["Deal_Name"] }) as never,
  };
  const service = new ApprovalService({ systemRecords: () => systemRecords });
  const deal = (id: string, fields: Record<string, unknown> = {}) => {
    const record = { id, fields: { Deal_Name: `Deal ${id}`, Amount: 500, Secret: "s", ...fields } };
    records.set(`Deals:${id}`, record as RecordData);
    return record as RecordData;
  };
  const write = (ctx: OrgContext, record: RecordData, kind: "create" | "edit" = "create") =>
    service.afterWrite(ctx, {
      module: "Deals",
      kind,
      record,
      previous: undefined,
      label: String(record.fields.Deal_Name),
    });
  return {
    admin,
    b: b.ctx,
    c: c.ctx,
    d: d.ctx,
    outsider: outsider.ctx,
    service,
    updates,
    deal,
    write,
  };
}

const oneStep = (refs: string[], rule: "any" | "all" = "any") => [
  { name: "Step", approvers: { kind: "users" as const, refs }, rule },
];

async function makeProcess(
  s: Setup,
  overrides: Partial<CreateProcessInput> = {},
  kind: "approval" | "review" = "approval",
) {
  const process = await s.service.processes.create(s.admin, kind, {
    name: `Process ${Math.random()}`,
    module: "Deals",
    trigger: "create_or_edit",
    steps: oneStep([s.c.userId]),
    ...(kind === "review" ? { reviewFields: ["Deal_Name"] } : {}),
    ...overrides,
  });
  return s.service.processes.update(s.admin, kind, process.id, { active: true });
}

async function onlyRequest(s: Setup, ctx: OrgContext, type = "approval") {
  const page = await s.service.listQueue(ctx, { type });
  expect(page.items).toHaveLength(1);
  return page.items[0] as NonNullable<(typeof page.items)[number]>;
}

describe("approval setup", () => {
  it("is limited to administrators, validates shape and keeps names unique", async () => {
    const s = await setup();
    await expect(
      s.service.processes.create(s.b, "approval", {
        name: "x",
        module: "Deals",
        trigger: "create",
        steps: oneStep([s.c.userId]),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(s.service.processes.list(s.b, "approval")).rejects.toBeInstanceOf(ForbiddenError);
    const first = await s.service.processes.create(s.admin, "approval", {
      name: "Dup",
      module: "Deals",
      trigger: "create",
      steps: oneStep([s.c.userId]),
    });
    expect(first.active).toBe(false);
    await expect(
      s.service.processes.create(s.admin, "approval", {
        name: "dup",
        module: "Deals",
        trigger: "edit",
        steps: oneStep([s.c.userId]),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    // Review processes need exactly one reviewer step and review fields.
    await expect(
      s.service.processes.create(s.admin, "review", {
        name: "R",
        module: "Deals",
        trigger: "edit",
        steps: oneStep([s.c.userId]),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      s.service.processes.create(s.admin, "approval", {
        name: "Bad",
        module: "Deals",
        trigger: "edit",
        steps: [],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("reorders, deactivates through the cache version and refuses to delete used processes", async () => {
    const s = await setup();
    const one = await makeProcess(s, { name: "One", trigger: "create" });
    const two = await makeProcess(s, { name: "Two", trigger: "create" });
    const reordered = await s.service.processes.reorder(s.admin, "approval", [two.id, one.id]);
    expect(reordered.map((process) => process.name)).toEqual(["Two", "One"]);
    // The first active process by position (Two) takes the submission.
    await s.write(s.b, s.deal("1"));
    const request = await onlyRequest(s, s.c);
    expect(request.processName).toBe("Two");
    await expect(s.service.processes.remove(s.admin, "approval", two.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
    // Deactivating invalidates the cache: no new request for the next record.
    await s.service.processes.update(s.admin, "approval", two.id, { active: false });
    await s.service.processes.update(s.admin, "approval", one.id, { active: false });
    await s.write(s.b, s.deal("2"));
    expect((await s.service.listQueue(s.c, { type: "approval" })).items).toHaveLength(1);
    await s.service.processes.remove(s.admin, "approval", one.id);
  });
});

describe("approval submission and decisions", () => {
  it("opens one request when trigger and criteria match, and resolves approvers", async () => {
    const s = await setup();
    await makeProcess(s, {
      trigger: "create",
      criteria: {
        kind: "criteria",
        criteria: { field: "Amount", comparator: "greater_than", value: 100 },
      },
    });
    await s.write(s.b, s.deal("1", { Amount: 50 }));
    expect((await s.service.counts(s.c)).approval).toBe(0);
    await s.write(s.b, s.deal("2", { Amount: 500 }));
    await s.write(s.b, s.deal("2", { Amount: 600 }), "edit"); // edit does not match the create trigger
    expect(await s.service.counts(s.c)).toEqual({
      blueprint: 0,
      approval: 1,
      review: 0,
      image_validation: 0,
    });
    expect((await s.service.listQueue(s.b, { type: "approval" })).items).toHaveLength(0);
    const notes = await getNotificationService().list(s.c);
    expect(notes.items.map((item) => item.kind)).toEqual(["approval_assigned"]);
    expect(await getNotificationService().unseenCount(s.c)).toEqual({ count: 1 });
  });

  it("allows only one open request per record (database index and observer)", async () => {
    const s = await setup();
    await makeProcess(s);
    await s.write(s.b, s.deal("1"));
    await s.write(s.b, s.deal("1"), "edit");
    expect(
      (await s.service.listQueue(s.admin, { type: "approval", scope: "all" })).items,
    ).toHaveLength(1);
    await expect(
      withOrg(s.admin, (tx) =>
        tx.execute(
          sql`INSERT INTO approval_requests (organization_id, process_id, kind, record_module, record_id,
                submitter_user_id, status)
              SELECT organization_id, process_id, kind, record_module, record_id, submitter_user_id, status
              FROM approval_requests WHERE organization_id = ${s.admin.orgId}`,
        ),
      ),
    ).rejects.toThrow();
  });

  it("locks the record for everyone but administrators and current approvers, until it is decided", async () => {
    const s = await setup();
    await makeProcess(s);
    s.deal("1");
    await s.write(s.b, s.deal("1"));
    await expect(s.service.assertEditable(s.b, "Deals", ["1"], "update")).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
    await expect(s.service.assertEditable(s.outsider, "Deals", ["1"], "update")).rejects.toThrow();
    await s.service.assertEditable(s.admin, "Deals", ["1"], "update");
    await s.service.assertEditable(s.c, "Deals", ["1"], "update");
    await expect(s.service.assertEditable(s.c, "Deals", ["1"], "delete")).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
    await s.service.assertEditable(s.b, "Deals", ["other"], "update");
    const item = await onlyRequest(s, s.c);
    await s.service.decide(s.c, item.id, "approve");
    await s.service.assertEditable(s.b, "Deals", ["1"], "update");
  });

  it("runs 'any' and 'all' steps, notifies the submitter and applies on-approve updates as the system", async () => {
    const s = await setup();
    await makeProcess(s, {
      steps: [
        { name: "All", approvers: { kind: "users", refs: [s.c.userId, s.d.userId] }, rule: "all" },
        { name: "Any", approvers: { kind: "users", refs: [s.c.userId, s.d.userId] }, rule: "any" },
      ],
      onApprove: [{ kind: "field_update", field: "Stage", value: "Approved" }],
    });
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    let detail = await s.service.decide(s.c, item.id, "approve");
    expect(detail.request.step).toBe(1);
    expect(detail.permissions.canDecide).toBe(false);
    detail = await s.service.decide(s.d, item.id, "approve");
    expect(detail.request.step).toBe(2);
    expect(detail.request.status).toBe("pending");
    detail = await s.service.decide(s.c, item.id, "approve");
    expect(detail.request.status).toBe("approved");
    // "any": the other approver's row was skipped, so they can no longer decide.
    await expect(s.service.decide(s.d, item.id, "approve")).rejects.toBeInstanceOf(ConflictError);
    expect(s.updates).toEqual([{ module: "Deals", id: "1", input: { Stage: "Approved" } }]);
    const kinds = (await getNotificationService().list(s.b)).items.map((n) => n.kind);
    expect(kinds).toEqual(["approval_decided"]);
    expect(detail.actions.map((a) => a.action)).toEqual([
      "submitted",
      "approved",
      "approved",
      "approved",
    ]);
  });

  it("rejects with a mandatory comment and applies on-reject updates", async () => {
    const s = await setup();
    await makeProcess(s, { onReject: [{ kind: "field_update", field: "Stage", value: "Lost" }] });
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    await expect(s.service.decide(s.c, item.id, "reject")).rejects.toBeInstanceOf(ValidationError);
    const detail = await s.service.decide(s.c, item.id, "reject", { comment: "No budget" });
    expect(detail.request.status).toBe("rejected");
    expect(s.updates[0]?.input).toEqual({ Stage: "Lost" });
    expect(detail.actions.at(-1)?.comment).toBe("No budget");
    // A rejected request frees the record for a new submission.
    await s.write(s.b, s.deal("1"), "edit");
    expect((await s.service.listQueue(s.c, { type: "approval" })).items).toHaveLength(1);
  });

  it("delegates to an active member and refuses outsiders and self", async () => {
    const s = await setup();
    await makeProcess(s);
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    await expect(
      s.service.decide(s.c, item.id, "delegate", { targetUserId: s.c.userId }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      s.service.decide(s.c, item.id, "delegate", { targetUserId: crypto.randomUUID() }),
    ).rejects.toBeInstanceOf(ValidationError);
    const detail = await s.service.decide(s.c, item.id, "delegate", {
      targetUserId: s.d.userId,
      comment: "Please take it",
    });
    const states = Object.fromEntries(
      (detail.steps[0]?.approvers ?? []).map((a) => [a.id, a.state]),
    );
    expect(states).toEqual({ [s.c.userId]: "delegated", [s.d.userId]: "pending" });
    expect(detail.steps[0]?.approvers.find((a) => a.id === s.d.userId)?.delegatedFrom?.id).toBe(
      s.c.userId,
    );
    await expect(s.service.decide(s.c, item.id, "approve")).rejects.toBeInstanceOf(ForbiddenError);
    expect((await getNotificationService().list(s.d)).items[0]?.kind).toBe("approval_assigned");
    expect((await s.service.decide(s.d, item.id, "approve")).request.status).toBe("approved");
  });

  it("lets the submitter or an administrator recall, and nobody else", async () => {
    const s = await setup();
    await makeProcess(s);
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    await expect(s.service.decide(s.c, item.id, "recall")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(s.service.decide(s.outsider, item.id, "recall")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const detail = await s.service.decide(s.b, item.id, "recall");
    expect(detail.request.status).toBe("recalled");
    expect(detail.permissions.canRecall).toBe(false);
    await s.service.assertEditable(s.b, "Deals", ["1"], "update");
  });

  it("keeps a step with no approvers pending and never applies the on-approve update", async () => {
    const s = await setup();
    // An owner in the top role has no manager: the step resolves to nobody (MEP-1518).
    await makeProcess(s, {
      steps: [
        { name: "Managers", approvers: { kind: "record_owner_manager", refs: [] }, rule: "any" },
      ],
      onApprove: [{ kind: "field_update", field: "Stage", value: "Auto" }],
    });
    await s.write(s.b, s.deal("1", { Owner: s.admin.userId }));
    const all = await s.service.listQueue(s.admin, { type: "approval", scope: "all" });
    expect(all.items).toHaveLength(1);
    expect(all.items[0]?.status).toBe("pending");
    const detail = await s.service.detail(s.admin, all.items[0]?.id ?? "");
    expect(detail.actions.map((action) => action.action)).not.toContain("auto_approved");
    expect(detail.actions[0]?.comment).toContain("resolution_error");
    expect(s.updates).toHaveLength(0);
    await expect(s.service.assertEditable(s.b, "Deals", ["1"], "update")).rejects.toBeInstanceOf(
      RecordLockedForApprovalError,
    );
  });

  it("keeps a later step with no approvers pending after the earlier step approves", async () => {
    const s = await setup();
    await makeProcess(s, {
      steps: [
        { name: "First", approvers: { kind: "users", refs: [s.c.userId] }, rule: "any" },
        { name: "Nobody", approvers: { kind: "users", refs: [randomUUID()] }, rule: "any" },
      ],
      onApprove: [{ kind: "field_update", field: "Stage", value: "Auto" }],
    });
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    const detail = await s.service.decide(s.c, item.id, "approve");
    expect(detail.request.status).toBe("pending");
    expect(detail.request.step).toBe(2);
    expect(s.updates).toHaveLength(0);
  });

  it("resolves group steps through the organisation's groups and roles", async () => {
    const s = await setup();
    const group = await access.createGroup(s.admin, {
      name: `Approvers ${randomUUID()}`,
      members: [{ kind: "user", id: s.c.userId }],
    });
    await makeProcess(s, {
      steps: [{ name: "Group", approvers: { kind: "groups", refs: [group.id] }, rule: "any" }],
    });
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    expect((await s.service.listQueue(s.d, { type: "approval" })).items).toHaveLength(0);
    expect((await s.service.decide(s.c, item.id, "approve")).request.status).toBe("approved");
  });

  it("resolves the owner's manager from the parent role", async () => {
    const s = await setup();
    const rep = await addAccessTestMember(s.admin, { profile: "standard", role: "Manager" });
    await makeProcess(s, {
      steps: [
        { name: "Manager", approvers: { kind: "record_owner_manager", refs: [] }, rule: "any" },
      ],
    });
    await s.write(rep.ctx, s.deal("1", { Owner: rep.ctx.userId }));
    const item = await onlyRequest(s, s.admin);
    expect((await s.service.listQueue(rep.ctx, { type: "approval" })).items).toHaveLength(0);
    expect((await s.service.decide(s.admin, item.id, "approve")).request.status).toBe("approved");
  });

  it("rejects group steps that name no existing group at save time", async () => {
    const s = await setup();
    for (const refs of [["admin"], [randomUUID()]])
      await expect(
        s.service.processes.create(s.admin, "approval", {
          name: `Bad ${Math.random()}`,
          module: "Deals",
          trigger: "create",
          steps: [{ name: "G", approvers: { kind: "groups", refs }, rule: "any" }],
        }),
      ).rejects.toBeInstanceOf(ValidationError);
  });

  it("fails closed when the request cannot be stored", async () => {
    const s = await setup();
    await makeProcess(s);
    const record = s.deal("1");
    await expect(
      s.service.afterWrite(s.b, {
        module: "Deals",
        kind: "create",
        record,
        previous: undefined,
        label: "Bad\u0000label",
      }),
    ).rejects.toBeInstanceOf(WriteObserverFailure);
    expect(
      (await s.service.listQueue(s.admin, { type: "approval", scope: "all" })).items,
    ).toHaveLength(0);
  });

  it("records a failed approver resolution as an admin-visible request without approvers", async () => {
    const s = await setup();
    const failing = new ApprovalService({
      directory: {
        groupMembers: async () => {
          throw new Error("directory down");
        },
        ownerManagers: async () => [],
      },
    });
    const group = await access.createGroup(s.admin, { name: `Grp ${randomUUID()}` });
    const process = await failing.processes.create(s.admin, "approval", {
      name: "Grp",
      module: "Deals",
      trigger: "create",
      steps: [{ name: "G", approvers: { kind: "groups", refs: [group.id] }, rule: "any" }],
    });
    await failing.processes.update(s.admin, "approval", process.id, { active: true });
    const quiet = console.error;
    console.error = () => {};
    try {
      await failing.afterWrite(s.b, {
        module: "Deals",
        kind: "create",
        record: s.deal("1"),
        previous: undefined,
        label: "Deal 1",
      });
    } finally {
      console.error = quiet;
    }
    const all = await failing.listQueue(s.admin, { type: "approval", scope: "all" });
    expect(all.items).toHaveLength(1);
    const detail = await failing.detail(s.admin, all.items[0]?.id ?? "");
    expect(detail.actions[0]?.comment).toContain("resolution_error");
    expect(detail.steps[0]?.approvers).toEqual([]);
  });
});

describe("review processes", () => {
  it("cycles reject → owner edit → re-review → approve", async () => {
    const s = await setup();
    await makeProcess(s, {}, "review");
    const record = s.deal("1", { Owner: s.b.userId });
    await s.write(s.b, record);
    const item = await onlyRequest(s, s.c, "review");
    expect(item.status).toBe("waiting_review");
    expect((await s.service.counts(s.c)).review).toBe(1);
    const rejected = await s.service.decide(s.c, item.id, "reject", { comment: "Fix the name" });
    expect(rejected.request.status).toBe("waiting_rereview");
    expect(rejected.permissions.canDecide).toBe(false);
    expect((await s.service.counts(s.c)).review).toBe(0);
    await expect(s.service.decide(s.c, item.id, "approve")).rejects.toBeInstanceOf(ConflictError);
    // Another user's edit does not restart the review; the owner's does.
    await s.write(s.outsider, record, "edit");
    expect((await s.service.counts(s.c)).review).toBe(0);
    await s.write(s.b, record, "edit");
    expect((await s.service.counts(s.c)).review).toBe(1);
    const approved = await s.service.decide(s.c, item.id, "approve");
    expect(approved.request.status).toBe("approved");
    expect(approved.record?.fields).toEqual({ Deal_Name: "Deal 1" });
    const kinds = (await getNotificationService().list(s.b)).items.map((n) => n.kind);
    expect(kinds).toEqual(["review_decided", "review_decided"]);
  });
});

describe("approval permission paths", () => {
  it("hides requests from non-involved users and limits the all-scope to administrators", async () => {
    const s = await setup();
    await makeProcess(s);
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    await expect(s.service.detail(s.outsider, item.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(s.service.decide(s.outsider, item.id, "approve")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(s.service.detail(s.outsider, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      s.service.listQueue(s.outsider, { type: "approval", scope: "all" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect((await s.service.history(s.outsider, {})).items).toHaveLength(0);
    expect((await s.service.history(s.c, {})).items).toHaveLength(1);
    expect((await s.service.detail(s.admin, item.id)).request.id).toBe(item.id);
    // The submitter can see but not decide.
    await expect(s.service.decide(s.b, item.id, "approve")).rejects.toBeInstanceOf(ForbiddenError);
    expect((await s.service.listQueue(s.admin, { type: "blueprint" })).items).toEqual([]);
  });

  it("gives approvers a scoped read: only card fields, and only while pending", async () => {
    const s = await setup();
    await makeProcess(s);
    await s.write(s.b, s.deal("1"));
    const item = await onlyRequest(s, s.c);
    expect(await s.service.hasApproverGrant(s.c, "Deals", "1")).toBe(true);
    expect(await s.service.hasApproverGrant(s.outsider, "Deals", "1")).toBe(false);
    const detail = await s.service.detail(s.c, item.id);
    expect(detail.record?.fields).toEqual({ Deal_Name: "Deal 1" });
    expect(detail.record?.fields).not.toHaveProperty("Secret");
    await s.service.decide(s.c, item.id, "approve");
    expect(await s.service.hasApproverGrant(s.c, "Deals", "1")).toBe(false);
  });

  it("pages the queue, history and notifications with cursors", async () => {
    const s = await setup();
    await makeProcess(s);
    for (const id of ["1", "2", "3"]) await s.write(s.b, s.deal(id));
    const first = await s.service.listQueue(s.c, { type: "approval", limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();
    const second = await s.service.listQueue(s.c, {
      type: "approval",
      limit: 2,
      cursor: first.nextCursor ?? "",
    });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items, ...second.items].map((i) => i.id)).size).toBe(3);
    const h1 = await s.service.history(s.admin, { limit: 2 });
    const h2 = await s.service.history(s.admin, { limit: 2, cursor: h1.nextCursor ?? "" });
    expect(h1.items.length + h2.items.length).toBe(3);
    const notes = getNotificationService();
    const n1 = await notes.list(s.c, { limit: 2 });
    const n2 = await notes.list(s.c, { limit: 2, cursor: n1.nextCursor ?? "" });
    expect(n1.items.length + n2.items.length).toBe(3);
    await expect(
      s.service.listQueue(s.c, { type: "approval", cursor: "garbage" }),
    ).rejects.toBeInstanceOf(ValidationError);
    const meta = await s.service.historyMeta(s.admin);
    expect(meta.modules).toEqual(["Deals"]);
    expect(meta.users.map((u) => u.id)).toEqual([s.b.userId]);
  });
});

describe("notifications", () => {
  it("de-duplicates recipients, skips the actor and tracks seen/read per recipient", async () => {
    const s = await setup();
    const notes = getNotificationService();
    const written = await withOrg(s.admin, (tx) =>
      notes.notify(tx, s.admin.orgId, {
        recipients: [s.b.userId, s.b.userId, s.c.userId, s.admin.userId],
        kind: "mention",
        subject: { postId: "p1" },
        actorUserId: s.admin.userId,
      }),
    );
    expect(written).toBe(2);
    const mine = await notes.list(s.b);
    expect(mine.items).toHaveLength(1);
    expect(mine.items[0]?.actor?.id).toBe(s.admin.userId);
    expect(await notes.unseenCount(s.b)).toEqual({ count: 1 });
    await expect(notes.markRead(s.c, mine.items[0]?.id ?? "")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect((await notes.markSeen(s.b, [mine.items[0]?.id ?? ""])).updated).toBe(1);
    expect(await notes.unseenCount(s.b)).toEqual({ count: 0 });
    expect((await notes.markRead(s.b, mine.items[0]?.id ?? "")).readAt).toBeTruthy();
    expect(await notes.unseenCount(s.c)).toEqual({ count: 1 });
  });
});

describe("approval tables", () => {
  it("isolate tenants, keep the history append-only and block updates of other tenants", async () => {
    const s = await setup();
    await makeProcess(s);
    await s.write(s.b, s.deal("1"));
    const other = await createTestOrganization();
    const owner = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await owner.connect();
    try {
      await owner.query("alter role crm_app password 'test-runtime'");
      const url = new URL(process.env.DATABASE_URL ?? "");
      url.username = "crm_app";
      url.password = "test-runtime";
      const app = new pg.Client({ connectionString: url.toString() });
      await app.connect();
      try {
        await app.query("begin");
        await app.query("select set_config('app.org_id', $1, true)", [other.ctx.orgId]);
        for (const table of [
          "approval_processes",
          "approval_requests",
          "approval_request_approvers",
          "approval_actions",
          "notifications",
        ]) {
          const rows = await app.query(`select 1 from ${table}`);
          expect(rows.rows, table).toHaveLength(0);
        }
        await app.query("rollback");
        await app.query("begin");
        await app.query("select set_config('app.org_id', $1, true)", [s.admin.orgId]);
        const seen = await app.query("select count(*)::int as n from approval_actions");
        expect(seen.rows[0].n).toBeGreaterThan(0);
        await expect(app.query("update approval_actions set comment = 'x'")).rejects.toThrow(
          /permission denied/,
        );
        await app.query("rollback");
        await app.query("begin");
        await app.query("select set_config('app.org_id', $1, true)", [s.admin.orgId]);
        await expect(app.query("delete from approval_actions")).rejects.toThrow(
          /permission denied/,
        );
        await app.query("rollback");
        await app.query("begin");
        await app.query("select set_config('app.org_id', $1, true)", [s.admin.orgId]);
        await expect(app.query("delete from approval_requests")).rejects.toThrow(
          /permission denied/,
        );
        await app.query("rollback");
      } finally {
        await app.end();
      }
    } finally {
      await owner.end();
    }
  });
});
