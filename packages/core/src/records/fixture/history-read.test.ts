import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { HistoryChange, RecordHistoryEvent } from "../history";
import { type FixtureHistoryPermissions, fixtureHistoryReader } from "./history-read";
import { fixtureHistoryStore } from "./history-store";

const ctx: OrgContext = {
  orgId: "o",
  orgSlug: "o",
  orgName: "O",
  userId: "u",
  role: "member",
};

const change = (apiName: string, over: Partial<HistoryChange> = {}): HistoryChange => ({
  apiName,
  label: apiName,
  dataType: "text" as HistoryChange["dataType"],
  old: "a",
  new: "b",
  oldDisplay: null,
  newDisplay: null,
  ...over,
});

function ev(n: number, over: Partial<RecordHistoryEvent> = {}): RecordHistoryEvent {
  return {
    id: `e${String(n).padStart(3, "0")}`,
    schemaVersion: 1,
    stream: { module: "Leads", recordId: "r1" },
    subject: { module: "Leads", recordId: "r1" },
    kind: "fields_updated",
    actor: { id: "u1", name: "User" },
    occurredAt: `2026-01-${String(n).padStart(2, "0")}T00:00:00Z`,
    sequence: n,
    operationId: `op${n}`,
    ordinal: 0,
    source: "manual",
    mechanism: null,
    changes: [change("Name")],
    payload: { secret: true },
    ...over,
  };
}

function setup(events: RecordHistoryEvent[], permissions: FixtureHistoryPermissions = {}) {
  const map = new Map<string, RecordHistoryEvent>();
  const store = fixtureHistoryStore(map);
  store.appendBatch(events);
  const known = new Set(["Leads", "Contacts"]);
  const cursors = new Map();
  const reader = fixtureHistoryReader(
    ctx,
    () => store,
    () => 1000,
    (module, id) => {
      if (!known.has(module) || id.startsWith("missing")) throw new NotFoundError();
    },
    (m) => known.has(m),
    permissions,
    cursors,
  );
  return { reader, cursors };
}

const q = (over = {}) => ({ perPage: 25, ...over });

describe("fixtureHistoryReader", () => {
  it("returns newest first and strips payload", async () => {
    const { reader } = setup([ev(1), ev(2)]);
    const page = await reader.list("Leads", "r1", q());
    expect(page.events.map((e) => e.sequence)).toEqual([2, 1]);
    expect(page.events[0]?.payload).toBeNull();
    expect(page.nextPageToken).toBeNull();
    expect(page.moreRecords).toBe(false);
  });

  it("returns an empty page for an empty history", async () => {
    const { reader } = setup([]);
    expect(await reader.list("Leads", "r1", q())).toEqual({
      events: [],
      nextPageToken: null,
      moreRecords: false,
    });
  });

  it("throws NotFound for unknown records and modules", async () => {
    const { reader } = setup([ev(1)]);
    await expect(reader.list("Leads", "missing1", q())).rejects.toBeInstanceOf(NotFoundError);
    await expect(reader.list("Nope", "r1", q())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFound when the parent record is not readable", async () => {
    const { reader } = setup([ev(1)], { canReadRecord: () => false });
    await expect(reader.list("Leads", "r1", q())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("paginates with a page token across pages", async () => {
    const { reader, cursors } = setup([1, 2, 3, 4, 5].map((n) => ev(n)));
    const p1 = await reader.list("Leads", "r1", q({ perPage: 2 }));
    expect(p1.events.map((e) => e.sequence)).toEqual([5, 4]);
    expect(p1.moreRecords).toBe(true);
    expect(p1.nextPageToken).toBeTruthy();
    expect(cursors.size).toBe(1);
    const p2 = await reader.list("Leads", "r1", q({ perPage: 2, pageToken: p1.nextPageToken }));
    expect(p2.events.map((e) => e.sequence)).toEqual([3, 2]);
    const p3 = await reader.list("Leads", "r1", q({ perPage: 2, pageToken: p2.nextPageToken }));
    expect(p3.events.map((e) => e.sequence)).toEqual([1]);
    expect(p3.nextPageToken).toBeNull();
    expect(p3.moreRecords).toBe(false);
  });

  it("rejects unknown, expired and scope-mismatched tokens", async () => {
    const { reader, cursors } = setup([1, 2, 3].map((n) => ev(n)));
    await expect(reader.list("Leads", "r1", q({ pageToken: "bogus" }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    const p1 = await reader.list("Leads", "r1", q({ perPage: 1 }));
    const token = p1.nextPageToken as string;
    await expect(
      reader.list("Leads", "r1", q({ perPage: 2, pageToken: token })),
    ).rejects.toBeInstanceOf(ValidationError);
    const cursor = cursors.get(token);
    cursors.set(token, { ...cursor, expires: Date.now() - 1 });
    await expect(
      reader.list("Leads", "r1", q({ perPage: 1, pageToken: token })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it.each([
    { perPage: 0 },
    { perPage: 201 },
    { perPage: 1.5 },
    { modules: ["Nope"] },
    { sources: ["bad"] },
    { actorId: "" },
    { from: "yesterday" },
    { to: "2026-01-01" },
    { from: "2026-02-01T00:00:00Z", to: "2026-01-01T00:00:00Z" },
  ])("rejects invalid query %j", async (bad) => {
    const { reader } = setup([ev(1)]);
    await expect(reader.list("Leads", "r1", q(bad) as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("filters by source, actor, module and date range", async () => {
    const { reader } = setup([
      ev(1, { source: "api" }),
      ev(2, { actor: { id: "u2", name: "Other" } }),
      ev(3, { subject: { module: "Contacts", recordId: "c1" } }),
      ev(4),
    ]);
    const seq = async (query: object) =>
      (await reader.list("Leads", "r1", q(query) as never)).events.map((e) => e.sequence);
    expect(await seq({ sources: ["api"] })).toEqual([1]);
    expect(await seq({ actorId: "u2" })).toEqual([2]);
    expect(await seq({ modules: ["Contacts"] })).toEqual([3]);
    expect(await seq({ from: "2026-01-02T00:00:00Z", to: "2026-01-04T00:00:00Z" })).toEqual([3, 2]);
  });

  it("filters hidden fields and drops events left with no changes", async () => {
    const { reader } = setup(
      [
        ev(1, { changes: [change("Secret")] }),
        ev(2, { changes: [change("Name"), change("Secret")] }),
      ],
      { canReadField: (_m, field) => field !== "Secret" },
    );
    const page = await reader.list("Leads", "r1", q());
    expect(page.events.map((e) => e.sequence)).toEqual([2]);
    expect(page.events[0]?.changes.map((c) => c.apiName)).toEqual(["Name"]);
  });

  it("keeps non-update events even when all changes are hidden", async () => {
    const { reader } = setup([ev(1, { kind: "record_created", changes: [change("Secret")] })], {
      canReadField: () => false,
    });
    const page = await reader.list("Leads", "r1", q());
    expect(page.events).toHaveLength(1);
    expect(page.events[0]?.changes).toEqual([]);
  });

  it("hides changes that reference unreadable records", async () => {
    const { reader } = setup(
      [
        ev(1, {
          changes: [change("Account", { new: { module: "Contacts", id: "hidden" } as never })],
        }),
        ev(2, { changes: [change("Account", { new: { module: "Contacts", id: "ok" } as never })] }),
        ev(3, {
          changes: [change("Account", { new: { module: "Contacts", id: "missing9" } as never })],
        }),
      ],
      { canReadRecord: (_m, id) => id !== "hidden" },
    );
    expect((await reader.list("Leads", "r1", q())).events.map((e) => e.sequence)).toEqual([2]);
  });

  it("drops events whose subject record is not readable", async () => {
    const { reader } = setup(
      [ev(1, { subject: { module: "Contacts", recordId: "hidden" } }), ev(2)],
      { canReadRecord: (_m, id) => id !== "hidden" },
    );
    expect((await reader.list("Leads", "r1", q())).events.map((e) => e.sequence)).toEqual([2]);
  });

  it("returns clones that do not alias stored events", async () => {
    const { reader } = setup([ev(1)]);
    const first = await reader.list("Leads", "r1", q());
    (first.events[0] as { kind: string }).kind = "record_deleted";
    expect((await reader.list("Leads", "r1", q())).events[0]?.kind).toBe("fields_updated");
  });
});
