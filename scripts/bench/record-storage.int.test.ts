import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEARCH_TERMS, universe } from "./dataset";
import { assertSame, executeCount, executeFull, executeList, executeReport } from "./exec";
import type { ListKind, ListParams } from "./queries";
import {
  configureClient,
  createTables,
  generateAndLoad,
  installRls,
  roleUrl,
  verifyRls,
} from "./storage";

const scale = { leadsA: 800, contactsA: 200, leadsB: 200 };
const world = universe(11);

let admin: pg.Client;
let loadedLeadId = "";
let contactId = "";

function params(overrides: Partial<ListParams> = {}): ListParams {
  return {
    orgId: world.orgA,
    moduleId: world.moduleLeads,
    leadStatus: "lead_status_0",
    ownerId: world.usersA[0] ?? world.orgA,
    revenueMin: "0.00",
    industries: ["industry_00", "industry_01", "industry_02"],
    rating: "rating_0",
    country: "country_000",
    contactId,
    cursorCompany: null,
    cursorId: null,
    searchLike: `%${SEARCH_TERMS.common3}%`,
    prefixQuery: SEARCH_TERMS.prefixQuery,
    offset: 5000,
    ...overrides,
  };
}

beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  admin = new pg.Client({ connectionString: url });
  await admin.connect();
  await configureClient(admin);
  await admin.query("drop schema if exists bench_a cascade");
  await admin.query("drop schema if exists bench_b cascade");
  await admin.query("drop schema if exists bench_c cascade");
  await createTables(admin);
  const loaded = await generateAndLoad(admin, { seed: 11, scale });
  const leadId = loaded.orgALeadIds[0];
  if (!leadId) throw new Error("expected a lead");
  loadedLeadId = leadId;
  contactId = loaded.lookupContactIds[0] ?? loaded.universe.orgA;
  await admin.query(
    "vacuum analyze bench_a.records, bench_b.leads, bench_b.contacts, bench_c.records, bench_c.record_values",
  );
}, 120_000);

afterAll(async () => {
  if (!admin) return;
  await admin.query("drop schema if exists bench_a cascade");
  await admin.query("drop schema if exists bench_b cascade");
  await admin.query("drop schema if exists bench_c cascade");
  await admin.query(`
    do $$ begin
      if exists (select 1 from pg_roles where rolname = 'bench_app') then
        execute 'drop owned by bench_app';
        drop role bench_app;
      end if;
    end $$
  `);
  await admin.end();
});

describe("storage options", () => {
  it("returns the same rows for the list, count, report, and search scenarios", async () => {
    const input = params();
    const kinds: ListKind[] = [
      "s1",
      "s2",
      "s2-offset",
      "s3",
      "s4",
      "s5",
      "s7-like",
      "s7-prefix",
      "s11",
    ];
    for (const kind of kinds) {
      const rows = [
        await executeList(admin, "A", kind, input),
        await executeList(admin, "B", kind, input),
        await executeList(admin, "C", kind, input),
      ];
      assertSame(`${kind} A/B`, rows[0], rows[1]);
      assertSame(`${kind} A/C`, rows[0], rows[2]);
    }

    const first = await executeList(admin, "A", "s2", input);
    const last = first.at(-1);
    if (last) {
      const next = params({
        offset: first.length,
        cursorCompany: last.company,
        cursorId: last.id,
      });
      for (const option of ["A", "B", "C"] as const) {
        const byOffset = await executeList(admin, option, "s2-offset", next);
        const byKey = await executeList(admin, option, "s2-keyset", next);
        assertSame(`${option} keyset`, byOffset, byKey);
      }
      const across = [
        await executeList(admin, "A", "s2-keyset", next),
        await executeList(admin, "B", "s2-keyset", next),
        await executeList(admin, "C", "s2-keyset", next),
      ];
      assertSame("keyset A/B", across[0], across[1]);
      assertSame("keyset A/C", across[0], across[2]);
    }

    for (const kind of ["s2", "s4"] as const) {
      for (const capped of [false, true]) {
        const counts = [
          await executeCount(admin, "A", kind, input, capped),
          await executeCount(admin, "B", kind, input, capped),
          await executeCount(admin, "C", kind, input, capped),
        ];
        expect(counts[1]).toBe(counts[0]);
        expect(counts[2]).toBe(counts[0]);
      }
    }

    for (const byOwner of [false, true]) {
      const reports = [
        await executeReport(admin, "A", byOwner, input),
        await executeReport(admin, "B", byOwner, input),
        await executeReport(admin, "C", byOwner, input),
      ];
      assertSame(`report ${byOwner} A/B`, reports[0], reports[1]);
      assertSame(`report ${byOwner} A/C`, reports[0], reports[2]);
    }

    for (const like of [`%${SEARCH_TERMS.rare8}%`, `%${SEARCH_TERMS.common8}%`]) {
      const search = params({ searchLike: like });
      const rows = [
        await executeList(admin, "A", "s7-like", search),
        await executeList(admin, "B", "s7-like", search),
        await executeList(admin, "C", "s7-like", search),
      ];
      assertSame(`search ${like} A/B`, rows[0], rows[1]);
      assertSame(`search ${like} A/C`, rows[0], rows[2]);
    }

    const full = [
      await executeFull(admin, "A", loadedLeadId),
      await executeFull(admin, "B", loadedLeadId),
      await executeFull(admin, "C", loadedLeadId),
    ];
    assertSame("full A/B", full[0], full[1]);
    assertSame("full A/C", full[0], full[2]);
  }, 120_000);

  it("isolates organizations with row level security", async () => {
    await installRls(admin);
    const app = new pg.Client({ connectionString: roleUrl(process.env.DATABASE_URL ?? "") });
    await app.connect();
    try {
      await configureClient(app);
      const checks = await verifyRls(admin, app, world, loadedLeadId);
      for (const check of checks)
        expect(check.pass, `${check.option} ${check.name} ${check.detail}`).toBe(true);
    } finally {
      await app.end();
    }
  }, 60_000);
});
