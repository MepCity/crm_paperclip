import { schema } from "@crm/db";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { getAccessSnapshot } from "../access";
import { getDb } from "../database";
import { getFeedService } from "../feeds/service";
import { createFixtureRecordService } from "../records/fixture";
import { addTestMember, createTestOrganization } from "../testing";
import { createRenderToken, submitWebform } from "../webforms";
import { createWebformService } from "../webforms/service";
import { insideOrgTransaction, withOrg } from "./index";

// MEP-1519: a path that holds one pooled connection while it waits for a second one starves
// the pool. With two connections and no checkout timeout, the old nested `withOrg` hangs
// forever here, so these tests fail on their own timeout instead of passing slowly.
const POOL_MAX = 2;
vi.stubEnv("DB_POOL_MAX", String(POOL_MAX));
vi.stubEnv("DB_POOL_CONNECTION_TIMEOUT_MS", "600000");
afterAll(() => {
  vi.unstubAllEnvs();
});

const CONCURRENCY = POOL_MAX * 3;
const TIMEOUT = 20_000;

describe("withOrg without nested pool checkouts", () => {
  it(
    "runs more concurrent nested calls than the pool size",
    async () => {
      const { ctx } = await createTestOrganization();
      const results = await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) =>
          withOrg(ctx, async () => {
            const snapshot = await getAccessSnapshot({ ...ctx, accessVersion: undefined });
            return withOrg(ctx, async (tx) => {
              const [row] = await tx
                .select({ id: schema.organizations.id })
                .from(schema.organizations)
                .where(eq(schema.organizations.id, ctx.orgId));
              return `${i}:${row?.id === ctx.orgId}:${snapshot.userId === ctx.userId}`;
            });
          }),
        ),
      );
      expect(results).toEqual(Array.from({ length: CONCURRENCY }, (_, i) => `${i}:true:true`));
      expect(getDb().$client.options.max).toBe(POOL_MAX);
    },
    TIMEOUT,
  );

  it("rolls back only the failed nested call and commits the rest with the outer one", async () => {
    const { ctx } = await createTestOrganization();
    const name = (suffix: string) => `MEP-1519 ${suffix}`;
    await withOrg(ctx, async (tx) => {
      await tx
        .update(schema.organizations)
        .set({ name: name("outer") })
        .where(eq(schema.organizations.id, ctx.orgId));
      await expect(
        withOrg(ctx, async (nested) => {
          await nested
            .update(schema.organizations)
            .set({ name: name("failed") })
            .where(eq(schema.organizations.id, ctx.orgId));
          throw new Error("nested failure");
        }),
      ).rejects.toThrow("nested failure");
      // The nested call sees the outer transaction's uncommitted write.
      const seen = await withOrg(ctx, async (nested) => {
        const [row] = await nested
          .select({ name: schema.organizations.name })
          .from(schema.organizations)
          .where(eq(schema.organizations.id, ctx.orgId));
        return row?.name;
      });
      expect(seen).toBe(name("outer"));
    });
    const [row] = await getDb()
      .select({ name: schema.organizations.name })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, ctx.orgId));
    expect(row?.name).toBe(name("outer"));
  });

  it("never shares a connection with another organisation or after the outer call ended", async () => {
    const one = await createTestOrganization();
    const two = await createTestOrganization();
    const orgOf = () =>
      getDb().execute<{ org: string }>("select current_setting('app.org_id', true) as org");
    let stray: Promise<string | undefined> | undefined;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await withOrg(one.ctx, async () => {
      const other = await withOrg(two.ctx, async (tx) => {
        const result = await tx.execute<{ org: string }>(
          "select current_setting('app.org_id', true) as org",
        );
        return result.rows[0]?.org;
      });
      expect(other).toBe(two.ctx.orgId);
      stray = gate.then(() =>
        withOrg(one.ctx, async (tx) => {
          expect(insideOrgTransaction()).toBe(true);
          const result = await tx.execute<{ org: string }>(
            "select current_setting('app.org_id', true) as org",
          );
          return result.rows[0]?.org;
        }),
      );
    });
    expect(insideOrgTransaction()).toBe(false);
    release();
    // Started inside the outer call but run after it committed: it opens its own transaction.
    expect(await stray).toBe(one.ctx.orgId);
    expect((await orgOf()).rows[0]?.org ?? "").toBe("");
  });

  it(
    "accepts more concurrent public web-form submits than the pool size",
    async () => {
      const { ctx } = await createTestOrganization();
      const service = createWebformService();
      const form = await service.createForm(ctx, { name: "Pool Form", module: "Leads" });
      await service.updateDraft(ctx, form.id, {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
        ],
      });
      const published = await service.publish(ctx, form.id);
      const { publicKey } = await service.regeneratePublicKey(ctx, form.id);
      const versionId = published.publishedVersion?.id ?? "";

      const results = await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) =>
          submitWebform({
            publicKey,
            data: {
              _token: createRenderToken({
                orgId: ctx.orgId,
                formId: form.id,
                versionId,
                issuedAt: Date.now() - 5000,
              }),
              _hp: "",
              Last_Name: `Pool ${i}`,
              Company: "Pool Company",
            },
            isHostedRoute: true,
            ip: `10.15.19.${i + 1}`,
          }),
        ),
      );
      expect(results.map((r) => r.outcome)).toEqual(
        Array.from({ length: CONCURRENCY }, () => "accepted"),
      );
    },
    TIMEOUT,
  );

  it(
    "posts more concurrent record mentions than the pool size",
    async () => {
      const { ctx } = await createTestOrganization();
      const reader = await addTestMember(ctx, "member");
      const records = createFixtureRecordService(ctx);
      const account = await records.create("Accounts", { Account_Name: "Pool Account" });
      const deal = await records.create("Deals", {
        Deal_Name: "Pool Deal",
        Stage: "Qualification",
        Closing_Date: "2030-01-01",
        Account_Name: { module: "Accounts", id: account.id },
      });
      const notified: string[] = [];
      const feed = getFeedService(ctx, {
        records,
        history: records.history,
        // Same chain as the web adapter: the record read loads the reader's access snapshot.
        canUserRead: async (userId) => {
          const snapshot = await getAccessSnapshot({ ...ctx, userId, accessVersion: undefined });
          return snapshot.userId === userId;
        },
        notify: async (_tx, list) => {
          notified.push(...list.map((n) => n.recipientUserId));
        },
      });

      await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) =>
          feed.createPost({
            body: `<p>Pool ${i}</p>`,
            mentionUserIds: [reader.ctx.userId],
            recordModule: "Deals",
            recordId: deal.id,
          }),
        ),
      );
      expect(notified).toEqual(Array.from({ length: CONCURRENCY }, () => reader.ctx.userId));
    },
    TIMEOUT,
  );
});
