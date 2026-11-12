import { randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "../errors";
import { createFixtureRecordService } from "../records/fixture";
import type { RecordWriteObserver } from "../records/write-observer";
import type { OrgContext } from "../tenancy/types";
import { addTestMember, createTestOrganization } from "../testing";
import {
  createPortalAdminService,
  createPortalDataService,
  PORTAL_NOT_FOUND_BODY,
  type PortalDataPrincipal,
  type PortalDataResult,
  type PortalListPage,
  type PortalModules,
} from "./index";

/**
 * ADR 0019a security test list — "Proof", "Projection" and "Writes" (Portals B). The portal
 * reads/writes are exercised through the data service with principals the session layer
 * (Portals A) would produce; route-level checks live in the web portal route tests.
 */

const LOOKUP_MODULES = ["Deals", "Cases", "Quotes", "Invoices"] as const;
type LookupModule = (typeof LOOKUP_MODULES)[number];
const CONTACT_FIELD: Record<LookupModule, string> = {
  Deals: "Contact_Name",
  Cases: "Related_To",
  Quotes: "Contact_Name",
  Invoices: "Contact_Name",
};

function fields(list: [string, "read" | "edit"][]) {
  return list.map(([apiName, mode]) => ({ apiName, mode }));
}

function matrix(scope: "contact" | "account", overrides: PortalModules = {}): PortalModules {
  const lookupScope = scope;
  return {
    Contacts: {
      enabled: true,
      scope: "contact",
      actions: { view: true, edit: true },
      fields: fields([
        ["First_Name", "edit"],
        ["Last_Name", "read"],
        ["Email", "read"],
        ["Phone", "edit"],
        ["Account_Name", "read"],
      ]),
    },
    Accounts: {
      enabled: true,
      scope: "contact",
      actions: { view: true },
      fields: fields([
        ["Account_Name", "read"],
        ["Phone", "read"],
      ]),
    },
    Deals: {
      enabled: true,
      scope: lookupScope,
      actions: { view: true },
      fields: fields([
        ["Deal_Name", "read"],
        ["Stage", "read"],
        ["Account_Name", "read"],
        ["Contact_Name", "read"],
      ]),
    },
    Cases: {
      enabled: true,
      scope: lookupScope,
      actions: { view: true, create: true },
      fields: fields([
        ["Subject", "edit"],
        ["Description", "edit"],
        ["Status", "read"],
        ["Related_To", "read"],
        ["Account_Name", "read"],
      ]),
    },
    Quotes: {
      enabled: true,
      scope: lookupScope,
      actions: { view: true },
      fields: fields([
        ["Subject", "read"],
        ["Contact_Name", "read"],
        ["Account_Name", "read"],
        ["Quoted_Items", "read"],
      ]),
    },
    Invoices: {
      enabled: true,
      scope: lookupScope,
      actions: { view: true },
      fields: fields([
        ["Subject", "read"],
        ["Contact_Name", "read"],
        ["Account_Name", "read"],
      ]),
    },
    ...overrides,
  };
}

const ref = (module: string, id: string) => ({ module, id });

async function seedOrg() {
  const { ctx, admin: member } = await createTestOrganization();
  const system = createFixtureRecordService(ctx, { system: true });
  const products = await system.list("Products", {
    viewId: "all-products",
    page: 1,
    perPage: 10,
  });
  const product = ref("Products", products.records[0]?.id ?? "");
  const tag = randomBytes(3).toString("hex");
  const account = async (name: string) =>
    (await system.create("Accounts", { Account_Name: `${name} ${tag}` })).id;
  const accA = await account("Alpha");
  const accB = await account("Beta");
  const contact = async (name: string, accountId: string | null) =>
    (
      await system.create("Contacts", {
        Last_Name: `${name} ${tag}`,
        Email: `${name.toLowerCase()}-${tag}@example.test`,
        ...(accountId ? { Account_Name: ref("Accounts", accountId) } : {}),
      })
    ).id;
  const c1 = await contact("One", accA);
  const c2 = await contact("Two", accA);
  const c3 = await contact("Three", null);
  const c4 = await contact("Four", accB);
  const make = async (
    module: LookupModule,
    name: string,
    contactId: string | null,
    accountId: string | null,
  ) => {
    const link = {
      ...(contactId ? { [CONTACT_FIELD[module]]: ref("Contacts", contactId) } : {}),
      ...(accountId ? { Account_Name: ref("Accounts", accountId) } : {}),
    };
    const subject = `${name} ${module} ${tag}`;
    const input =
      module === "Deals"
        ? {
            Deal_Name: subject,
            Stage: "Qualification",
            Closing_Date: "2026-12-31",
            Next_Step: `hidden-${tag}`,
            Account_Name: ref("Accounts", accountId ?? accB),
            ...link,
          }
        : module === "Cases"
          ? { Subject: subject, Status: "New", Case_Origin: "Web", ...link }
          : module === "Quotes"
            ? {
                Subject: subject,
                ...link,
                Quoted_Items: [{ Product_Name: product, Quantity: 1, List_Price: 10 }],
              }
            : {
                Subject: subject,
                ...link,
                Invoiced_Items: [{ Product_Name: product, Quantity: 1, List_Price: 10 }],
              };
    return (await system.create(module, input)).id;
  };
  const rows = {} as Record<
    LookupModule,
    {
      own: string;
      sameAccount: string;
      other: string;
      trashed: string;
      ownOtherAccount: string;
      c3own: string;
      orphan: string | null;
    }
  >;
  for (const module of LOOKUP_MODULES) {
    const trashed = await make(module, "Trashed", c1, accA);
    rows[module] = {
      own: await make(module, "Own", c1, accA),
      sameAccount: await make(module, "Same", c2, accA),
      other: await make(module, "Other", c4, accB),
      trashed,
      ownOtherAccount: await make(module, "OwnB", c1, accB),
      c3own: await make(module, "Three", c3, module === "Deals" ? accB : null),
      // Deals require an Account; the others can point at nothing at all.
      orphan: module === "Deals" ? null : await make(module, "Orphan", null, null),
    };
    await system.delete(module, [trashed]);
  }
  const admin = createPortalAdminService({});
  const slug = `d-${randomBytes(5).toString("hex")}`;
  const portal = await admin.createPortal(ctx, { name: "Data Portal", slug });
  const contactType = await admin.createUserType(ctx, {
    name: "Contact scope",
    modules: matrix("contact"),
  });
  const accountType = await admin.createUserType(ctx, {
    name: "Account scope",
    modules: matrix("account"),
  });
  const principal = (
    contactId: string,
    userTypeId: string = contactType.id,
  ): PortalDataPrincipal => ({
    orgId: ctx.orgId,
    portalId: portal.id,
    identityId: randomUUID(),
    userTypeId,
    displayName: `Portal Person ${tag}`,
    recordId: contactId,
  });
  return {
    ctx,
    member,
    system,
    admin,
    portal,
    contactType,
    accountType,
    principal,
    ids: { accA, accB, c1, c2, c3, c4 },
    rows,
    tag,
  };
}

type Org = Awaited<ReturnType<typeof seedOrg>>;
let shared: Promise<Org> | undefined;
const org = () => {
  shared ??= seedOrg();
  return shared;
};

/**
 * A Case that exists in another organisation under an id this organisation does not use
 * (record ids are per-organisation sequences, so the first ids of two orgs coincide).
 */
async function foreignRecord(env: Org) {
  const other = await createTestOrganization();
  const foreign = createFixtureRecordService(other.ctx, { system: true });
  const contactId = (await foreign.create("Contacts", { Last_Name: "Foreign" })).id;
  for (let i = 0; i < 100; i++) {
    const caseId = (
      await foreign.create("Cases", {
        Subject: "Foreign",
        Status: "New",
        Case_Origin: "Web",
        Related_To: ref("Contacts", contactId),
      })
    ).id;
    const local = await env.system.get("Cases", caseId).then(
      () => true,
      () => false,
    );
    if (!local) return { contactId, caseId };
  }
  throw new Error("no free foreign id");
}

function ok<T>(result: PortalDataResult<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.status} ${JSON.stringify(result)}`);
  return result.data;
}

function ids(result: PortalDataResult<PortalListPage>): string[] {
  return ok(result)
    .data.map((row) => row.id)
    .sort();
}

const data = createPortalDataService();
const sorted = (list: (string | null)[]) => list.filter((v): v is string => v !== null).sort();

describe("portal proof per module and scope (ADR 0019a §3)", () => {
  describe.each(LOOKUP_MODULES)("%s", (module) => {
    it("contact scope: own record visible, same-Account and other records 404", async () => {
      const env = await org();
      const p = env.principal(env.ids.c1);
      const r = env.rows[module];
      expect(ids(await data.list(p, module, { perPage: "50" }))).toEqual(
        sorted([r.own, r.ownOtherAccount]),
      );
      expect(ok(await data.get(p, module, r.own)).data.id).toBe(r.own);
      for (const id of [r.sameAccount, r.other, r.c3own, r.trashed, r.orphan, "999999999"]) {
        if (id === null) continue;
        expect(await data.get(p, module, id)).toEqual({
          ok: false,
          status: 404,
          body: PORTAL_NOT_FOUND_BODY,
        });
      }
    });

    it("account scope: same-Account records visible too, never another Account's", async () => {
      const env = await org();
      const p = env.principal(env.ids.c1, env.accountType.id);
      const r = env.rows[module];
      expect(ids(await data.list(p, module, { perPage: "50" }))).toEqual(
        sorted([r.own, r.sameAccount, r.ownOtherAccount]),
      );
      expect(ok(await data.get(p, module, r.sameAccount)).data.id).toBe(r.sameAccount);
      expect((await data.get(p, module, r.other)).ok).toBe(false);
      expect((await data.get(p, module, r.trashed)).ok).toBe(false);
    });

    it("account scope with a null Account matches only the Contact's own records", async () => {
      const env = await org();
      const p = env.principal(env.ids.c3, env.accountType.id);
      const r = env.rows[module];
      expect(ids(await data.list(p, module, { perPage: "50" }))).toEqual([r.c3own]);
      if (r.orphan) expect((await data.get(p, module, r.orphan)).ok).toBe(false);
    });
  });

  it("Contacts: only the identity's own Contact, in either scope", async () => {
    const env = await org();
    for (const type of [env.contactType.id, env.accountType.id]) {
      const p = env.principal(env.ids.c1, type);
      expect(ids(await data.list(p, "Contacts", {}))).toEqual([env.ids.c1]);
      expect((await data.get(p, "Contacts", env.ids.c2)).ok).toBe(false);
    }
  });

  it("Accounts: only the linked Contact's Account; a null Account matches nothing", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    expect(ids(await data.list(p, "Accounts", {}))).toEqual([env.ids.accA]);
    expect((await data.get(p, "Accounts", env.ids.accB)).ok).toBe(false);
    const none = env.principal(env.ids.c3);
    expect(ids(await data.list(none, "Accounts", {}))).toEqual([]);
    expect((await data.get(none, "Accounts", env.ids.accA)).ok).toBe(false);
  });

  it("reads the Account live from the Contact, never from the session", async () => {
    const env = await org();
    const contactId = (
      await env.system.create("Contacts", {
        Last_Name: `Mover ${env.tag}`,
        Account_Name: ref("Accounts", env.ids.accA),
      })
    ).id;
    const p = env.principal(contactId);
    expect(ids(await data.list(p, "Accounts", {}))).toEqual([env.ids.accA]);
    await env.system.update("Contacts", contactId, { Account_Name: ref("Accounts", env.ids.accB) });
    expect(ids(await data.list(p, "Accounts", {}))).toEqual([env.ids.accB]);
  });

  it("a trashed linked Contact proves nothing", async () => {
    const env = await org();
    const contactId = (
      await env.system.create("Contacts", {
        Last_Name: `Gone ${env.tag}`,
        Account_Name: ref("Accounts", env.ids.accA),
      })
    ).id;
    await env.system.delete("Contacts", [contactId]);
    const p = env.principal(contactId, env.accountType.id);
    expect(ids(await data.list(p, "Accounts", {}))).toEqual([]);
    expect(ids(await data.list(p, "Deals", { perPage: "50" }))).toEqual([]);
    expect((await data.get(p, "Contacts", contactId)).ok).toBe(false);
  });

  it("another organisation's record id is a 404", async () => {
    const env = await org();
    const foreign = await foreignRecord(env);
    const p = env.principal(env.ids.c1);
    expect(await data.get(p, "Cases", foreign.caseId)).toEqual({
      ok: false,
      status: 404,
      body: PORTAL_NOT_FOUND_BODY,
    });
    // Even pointing the principal at the foreign Contact proves nothing in this organisation.
    const crossed = { ...p, recordId: foreign.contactId };
    expect((await data.get(crossed, "Cases", foreign.caseId)).ok).toBe(false);
    expect(ids(await data.list(crossed, "Cases", {}))).not.toContain(foreign.caseId);
  });

  it("disabled module and unknown module: list and detail 404", async () => {
    const env = await org();
    const type = await env.admin.createUserType(env.ctx, {
      name: "No deals",
      modules: matrix("contact", {
        Deals: { enabled: false, scope: "contact", actions: { view: true }, fields: [] },
      }),
    });
    const p = env.principal(env.ids.c1, type.id);
    expect(await data.list(p, "Deals", {})).toEqual({
      ok: false,
      status: 404,
      body: PORTAL_NOT_FOUND_BODY,
    });
    expect((await data.get(p, "Deals", env.rows.Deals.own)).ok).toBe(false);
    expect((await data.list(p, "Leads", {})).ok).toBe(false);
    expect((await data.get(p, "Products", "1")).ok).toBe(false);
  });

  it("every not-found case has a byte-identical body", async () => {
    const env = await org();
    const type = await env.admin.createUserType(env.ctx, {
      name: "Identical",
      modules: matrix("contact", {
        Quotes: { enabled: false, scope: "contact", actions: { view: true }, fields: [] },
      }),
    });
    const p = env.principal(env.ids.c1, type.id);
    const foreign = await foreignRecord(env);
    const bodies = await Promise.all([
      data.get(p, "Cases", "987654321"), // missing
      data.get(p, "Cases", foreign.caseId), // other organisation
      data.get(p, "Cases", env.rows.Cases.other), // failed proof
      data.get(p, "Cases", env.rows.Cases.trashed), // recycle bin
      data.get(p, "Quotes", env.rows.Quotes.own), // module not enabled
      data.list(p, "Quotes", {}), // disabled module list
      data.get(p, "Leads", "1"), // module outside the portal
      data.update(p, "Contacts", env.ids.c2, { First_Name: "X" }), // write to another Contact
      data.related(p, "Accounts", env.ids.accB, "Deals", {}), // related of an unproved parent
    ]);
    const serialised = bodies.map((b) => {
      expect(b.ok).toBe(false);
      if (b.ok) return "";
      expect(b.status).toBe(404);
      return JSON.stringify(b.body);
    });
    expect(new Set(serialised)).toEqual(new Set([JSON.stringify(PORTAL_NOT_FOUND_BODY)]));
  });

  it("related lists run the child's own proof, never the parent's", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    // The Account is visible, but its Deals list only shows Deals proved for C (contact scope).
    const deals = ids(await data.related(p, "Accounts", env.ids.accA, "Deals", { perPage: "50" }));
    expect(deals).toEqual([env.rows.Deals.own]);
    expect(deals).not.toContain(env.rows.Deals.sameAccount);
    // In account scope the child proof widens on its own terms.
    const wide = env.principal(env.ids.c1, env.accountType.id);
    expect(
      ids(await data.related(wide, "Accounts", env.ids.accA, "Deals", { perPage: "50" })),
    ).toEqual(sorted([env.rows.Deals.own, env.rows.Deals.sameAccount]));
    // Contacts of the Account: only the identity itself, never C2.
    expect(ids(await data.related(wide, "Accounts", env.ids.accA, "Contacts", {}))).toEqual([
      env.ids.c1,
    ]);
    expect(ids(await data.related(p, "Contacts", env.ids.c1, "Cases", { perPage: "50" }))).toEqual(
      sorted([env.rows.Cases.own, env.rows.Cases.ownOtherAccount]),
    );
    expect((await data.related(p, "Accounts", env.ids.accB, "Deals", {})).ok).toBe(false);
    expect((await data.related(p, "Deals", env.rows.Deals.own, "Quotes", {})).ok).toBe(false);
  });
});

describe("portal projection (ADR 0019a §4.1–§4.2)", () => {
  it("returns only projected fields in list and detail; owner and system fields absent", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    for (const module of ["Contacts", "Accounts", ...LOOKUP_MODULES]) {
      const expected = (matrix("contact")[module as keyof PortalModules]?.fields ?? [])
        .map((f) => f.apiName)
        .sort();
      const list = ok(await data.list(p, module, { perPage: "50" }));
      expect(list.data.length).toBeGreaterThan(0);
      for (const row of list.data) {
        expect(Object.keys(row.fields).sort()).toEqual(expected);
        for (const hidden of ["Owner", "Created_By", "Modified_By", "Tag", "Locked__s"])
          expect(row.fields).not.toHaveProperty(hidden);
      }
      const first = list.data[0];
      if (!first) continue;
      const detail = ok(await data.get(p, module, first.id)).data;
      expect(Object.keys(detail.fields).sort()).toEqual(expected);
    }
  });

  it("rejects sort and filter on non-projected, owner and system fields with 422", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    for (const field of ["Owner", "Next_Step", "Created_By", "Modified_Time", "Amount"]) {
      const sort = await data.list(p, "Deals", { sortBy: field });
      expect(sort.ok ? 200 : sort.status).toBe(422);
      const filter = await data.list(p, "Deals", {
        filters: JSON.stringify({ field, comparator: "equal", value: "x" }),
      });
      expect(filter.ok ? 200 : filter.status).toBe(422);
      if (!filter.ok && filter.status === 422)
        expect(JSON.stringify(filter.body.errors)).toContain(field);
    }
    const nested = await data.list(p, "Deals", {
      filters: JSON.stringify({
        groupOperator: "or",
        group: [
          { field: "Deal_Name", comparator: "equal", value: "x" },
          { field: "Owner", comparator: "equal", value: "x" },
        ],
      }),
    });
    expect(nested.ok ? 200 : nested.status).toBe(422);
  });

  it("sorts, filters and searches on projected fields only", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    const asc = ok(await data.list(p, "Deals", { sortBy: "Deal_Name", sortOrder: "asc" }));
    const names = asc.data.map((row) => String(row.fields.Deal_Name));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    const own = await data.get(p, "Deals", env.rows.Deals.own);
    const ownName = String(ok(own).data.fields.Deal_Name);
    expect(
      ids(
        await data.list(p, "Deals", {
          filters: JSON.stringify({ field: "Deal_Name", comparator: "equal", value: ownName }),
        }),
      ),
    ).toEqual([env.rows.Deals.own]);
    expect(ids(await data.list(p, "Deals", { search: ownName }))).toEqual([env.rows.Deals.own]);
    // The Deals' Next_Step holds this text, but it is not projected: search never sees it.
    expect(ids(await data.list(p, "Deals", { search: `hidden-${env.tag}` }))).toEqual([]);
    const noSearchable = await data.list(p, "Accounts", { search: "x" });
    expect(noSearchable.ok).toBe(true);
  });

  it("pages lists at most 50 rows", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    const tooMany = await data.list(p, "Cases", { perPage: "51" });
    expect(tooMany.ok ? 200 : tooMany.status).toBe(422);
    const one = ok(await data.list(p, "Cases", { perPage: "1" }));
    expect(one.data).toHaveLength(1);
    expect(one.info.more_records).toBe(true);
    expect(ok(await data.list(p, "Cases", { perPage: "50" })).info.per_page).toBe(50);
  });

  it("lookups render the display name; links only to records that pass their own proof", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    const own = ok(await data.get(p, "Deals", env.rows.Deals.own)).data.fields;
    expect(own.Account_Name).toEqual({
      name: `Alpha ${env.tag}`,
      module: "Accounts",
      id: env.ids.accA,
    });
    expect(own.Contact_Name).toMatchObject({ module: "Contacts", id: env.ids.c1 });
    const unrelated = ok(await data.get(p, "Deals", env.rows.Deals.ownOtherAccount)).data.fields;
    expect(unrelated.Account_Name).toEqual({ name: `Beta ${env.tag}` });
    // Line items keep their values; the product lookup is name-only (Products not in a portal).
    const quote = ok(await data.get(p, "Quotes", env.rows.Quotes.own)).data.fields;
    const items = quote.Quoted_Items as unknown as Record<string, unknown>[];
    expect(items.length).toBe(1);
    const product = items[0]?.Product_Name as Record<string, unknown>;
    expect(Object.keys(product)).toEqual(["name"]);
    // Accounts disabled → the Account lookup becomes name-only even for A.
    const type = await env.admin.createUserType(env.ctx, {
      name: "No accounts",
      modules: matrix("contact", {
        Accounts: { enabled: false, scope: "contact", actions: { view: true }, fields: [] },
      }),
    });
    const narrow = env.principal(env.ids.c1, type.id);
    const nameOnly = ok(await data.get(narrow, "Deals", env.rows.Deals.own)).data.fields;
    expect(nameOnly.Account_Name).toEqual({ name: `Alpha ${env.tag}` });
  });
});

describe("portal writes (ADR 0019a §4.3)", () => {
  it("Contacts self-edit accepts only projected edit keys; history shows the portal identity", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    const updated = ok(await data.update(p, "Contacts", env.ids.c1, { First_Name: "Self" }));
    expect(updated.data.fields.First_Name).toBe("Self");
    for (const key of ["Last_Name", "Owner", "Email", "Description", "Unknown_Key"]) {
      const result = await data.update(p, "Contacts", env.ids.c1, { [key]: "x" });
      expect(result.ok ? 200 : result.status).toBe(422);
      if (!result.ok && result.status === 422)
        expect(Object.keys(result.body.errors)).toEqual([key]);
    }
    const history = await env.system.history.list("Contacts", env.ids.c1, { perPage: 10 });
    const event = history.events.find((e) => e.actor.id === p.identityId);
    expect(event?.actor.name).toBe(p.displayName);
    expect(event?.source).toBe("portal");
  });

  it("refuses edits to any other Contact or module as a 404", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    expect((await data.update(p, "Contacts", env.ids.c2, { First_Name: "X" })).ok).toBe(false);
    const deal = await data.update(p, "Deals", env.rows.Deals.own, { Deal_Name: "X" });
    expect(deal).toEqual({ ok: false, status: 404, body: PORTAL_NOT_FOUND_BODY });
    expect((await data.create(p, "Deals", { Deal_Name: "X" })).ok).toBe(false);
  });

  it("Case create sets the relationship server-side and the owner from the user type", async () => {
    const env = await org();
    const caseOwner = await addTestMember(env.ctx, "member");
    const type = await env.admin.createUserType(env.ctx, {
      name: "Owner set",
      modules: matrix("contact"),
      settings: { caseOwner: { kind: "user", userId: caseOwner.user.id } },
    });
    const observer: RecordWriteObserver = {
      assertEditable: vi.fn(async () => {}),
      afterWrite: vi.fn(async () => {}),
    };
    const observed = createPortalDataService({ writeObserver: () => observer });
    const p = env.principal(env.ids.c1, type.id);
    const created = await observed.create(p, "Cases", { Subject: `Portal case ${env.tag}` });
    expect(created.ok ? created.status : created.status).toBe(201);
    const row = ok(created).data;
    expect(row.fields.Related_To).toMatchObject({ module: "Contacts", id: env.ids.c1 });
    expect(row.fields.Account_Name).toMatchObject({ module: "Accounts", id: env.ids.accA });
    expect(row.fields).not.toHaveProperty("Owner");
    const stored = await env.system.get("Cases", row.id);
    expect(stored.fields.Owner).toBe(caseOwner.user.id);
    expect(stored.fields.Status).toBe("New");
    // Automation / approvals observe the write as for any create.
    expect(observer.afterWrite).toHaveBeenCalledWith(
      expect.objectContaining({ module: "Cases", kind: "create" }),
    );
    const history = await env.system.history.list("Cases", row.id, { perPage: 10 });
    expect(history.events[0]?.actor).toEqual({ id: p.identityId, name: p.displayName });
  });

  it("Case owner falls back to the portal creator", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    const row = ok(await data.create(p, "Cases", { Subject: `Fallback ${env.tag}` })).data;
    expect((await env.system.get("Cases", row.id)).fields.Owner).toBe(env.ctx.userId);
  });

  it("a Contact without Account creates Cases with an empty Account", async () => {
    const env = await org();
    const p = env.principal(env.ids.c3, env.accountType.id);
    const row = ok(await data.create(p, "Cases", { Subject: `No account ${env.tag}` })).data;
    expect(row.fields.Account_Name).toBeNull();
    expect(row.fields.Related_To).toMatchObject({ id: env.ids.c3 });
  });

  it("rejects client relationship, read-only and unknown keys on Case create", async () => {
    const env = await org();
    const p = env.principal(env.ids.c1);
    for (const [key, value] of [
      ["Related_To", ref("Contacts", env.ids.c2)],
      ["Account_Name", ref("Accounts", env.ids.accB)],
      ["Status", "Closed"],
      ["Owner", env.ctx.userId],
      ["Internal_Comments", "x"],
      ["Nope", "x"],
    ] as const) {
      const result = await data.create(p, "Cases", { Subject: "S", [key]: value });
      expect(result.ok ? 200 : result.status).toBe(422);
      if (!result.ok && result.status === 422)
        expect(Object.keys(result.body.errors)).toEqual([key]);
    }
    const invalid = await data.create(p, "Cases", { Subject: "" });
    expect(invalid.ok ? 200 : invalid.status).toBe(422);
  });
});

describe("portal actor in the record service (ADR 0019a §4.3)", () => {
  async function portalService(env: Org) {
    const ctx: OrgContext = { ...env.ctx };
    return createFixtureRecordService(ctx, {
      actor: {
        kind: "portal",
        identityId: randomUUID(),
        userTypeId: env.contactType.id,
        contactId: env.ids.c1,
        editableFields: { Contacts: ["First_Name"], Cases: ["Subject"] },
      },
    });
  }

  it("is neither a member with an AccessSnapshot nor the system bypass", async () => {
    const env = await org();
    const actor = {
      kind: "portal" as const,
      identityId: randomUUID(),
      userTypeId: env.contactType.id,
      contactId: env.ids.c1,
      editableFields: {},
    };
    expect(() => createFixtureRecordService(env.ctx, { actor, system: true })).toThrow();
    expect(() =>
      createFixtureRecordService(env.ctx, { actor, access: async () => Promise.reject() }),
    ).toThrow();
  });

  it("throws for every operation outside portal read, self-edit and Case create", async () => {
    const env = await org();
    const service = await portalService(env);
    const denied = [
      service.list("Deals", { viewId: "all-deals", page: 1, perPage: 10 }),
      service.get("Contacts", env.ids.c1),
      service.update("Contacts", env.ids.c2, { First_Name: "X" }),
      service.update("Deals", env.rows.Deals.own, { Deal_Name: "X" }),
      service.create("Deals", { Deal_Name: "X" }),
      service.delete("Cases", [env.rows.Cases.own]),
      service.massUpdate("Contacts", [env.ids.c1], { First_Name: "X" }),
      service.changeOwner("Cases", [env.rows.Cases.own], env.ctx.userId),
      service.search({ word: "x", page: 1, perPage: 10 } as never),
      service.history.list("Contacts", env.ids.c1, { perPage: 10 }),
      service.tags.addTags("Contacts", env.ids.c1, ["t"]),
      service.recycleBin.list({ page: 1, perPage: 10 } as never),
      service.convertQuoteToInvoice(env.rows.Quotes.own),
    ];
    for (const attempt of denied) await expect(attempt).rejects.toBeInstanceOf(ForbiddenError);
    // Inside the allowed operations, keys and relationships are enforced again.
    await expect(service.update("Contacts", env.ids.c1, { Last_Name: "X" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      service.create("Cases", { Subject: "S", Related_To: ref("Contacts", env.ids.c2) }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(() =>
      createFixtureRecordService(env.ctx, { system: true }).portalSelect({
        module: "Contacts",
        proof: { op: "eq", field: "id", ref: "contact" },
        columns: [],
        sort: { field: "id", order: "desc" },
        page: 1,
        perPage: 1,
        linkProofs: {},
      }),
    ).toThrow(ForbiddenError);
  });
});
