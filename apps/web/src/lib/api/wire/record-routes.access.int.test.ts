import { cloneProfile, getProfile, listProfiles, updateProfile } from "@crm/core/access";
import { addAccessTestMember, createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { getRecordService } from "@/lib/records";
import { encodeInput } from "./codec";
import { type Operation, operationPath, operations } from "./operations";

/** ADR 0017 §11.4: real route handlers — allowed 2xx, profile-denied 403, invisible record 404. */
const handlers = {
  create: () => import("@/app/crm/v2.2/[module]/route"),
  record: () => import("@/app/crm/v2.2/[module]/[recordId]/route"),
  update: () => import("@/app/crm/v2.2/[module]/[recordId]/route"),
  delete: () => import("@/app/crm/v2.2/[module]/[recordId]/route"),
  count: () => import("@/app/crm/v2.2/[module]/actions/count/route"),
  massDelete: () => import("@/app/crm/v2.2/[module]/actions/mass_delete/route"),
} as const;
type HandlerName = keyof typeof handlers;
type Member = Awaited<ReturnType<typeof addAccessTestMember>>;
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;

const MODULES = [
  { module: "Leads", fields: { Last_Name: "Matrix", Company: "MatrixCo" } },
  { module: "Contacts", fields: { Last_Name: "Matrix" } },
  { module: "Accounts", fields: { Account_Name: "MatrixCo" } },
  {
    module: "Deals",
    fields: { Deal_Name: "Matrix", Stage: "Qualification", Closing_Date: "2030-01-01" },
  },
] as const;

describe("record route matrix (ADR 0017 §11.4)", () => {
  let org: Awaited<ReturnType<typeof createTestOrganization>>;
  let standard: Member;
  let denied: Member;
  let noMass: Member;

  async function call(
    name: HandlerName,
    as: { headers: Headers } | Member,
    options: { module: string; recordId?: string; body?: unknown },
  ) {
    const op = operations[name as keyof typeof operations] as Operation;
    const route = (await handlers[name]()) as unknown as Record<
      string,
      (r: Request, c: { params?: Promise<Record<string, string>> }) => Promise<Response>
    >;
    const params = { module: options.module, recordId: options.recordId ?? "x" };
    const url = new URL(operationPath(op, params), origin);
    url.searchParams.set("module", options.module);
    url.searchParams.set("cvid", `all-${options.module.toLowerCase()}`);
    const headers = new Headers(as.headers);
    headers.set("Origin", origin);
    headers.set("X-CRM-ORG", org.org.slug);
    return route[op.method]?.(
      new Request(url, {
        method: op.method,
        headers,
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      }),
      { params: Promise.resolve(params) },
    ) as Promise<Response>;
  }

  beforeAll(async () => {
    org = await createTestOrganization();
    const profiles = await listProfiles(org.ctx);
    const source = profiles.find((p) => p.kind === "standard");
    if (!source) throw new Error("Standard profile missing");
    const detail = await getProfile(org.ctx, source.id);
    const strip = (modules: readonly string[], massDelete: readonly string[]) => ({
      ...detail.permissions,
      modules: Object.fromEntries(
        Object.entries(detail.permissions.modules).map(([name, value]) => [
          name,
          modules.includes(name)
            ? { view: false, create: false, edit: false, delete: false }
            : value,
        ]),
      ),
      tools: { ...detail.permissions.tools, massDelete },
    });
    const names = MODULES.map((m) => m.module);
    const noModules = await cloneProfile(org.ctx, { sourceProfileId: source.id, name: "No CRM" });
    await updateProfile(org.ctx, { profileId: noModules.id, permissions: strip(names, []) });
    const noMassDelete = await cloneProfile(org.ctx, {
      sourceProfileId: source.id,
      name: "No mass",
    });
    await updateProfile(org.ctx, { profileId: noMassDelete.id, permissions: strip([], []) });
    standard = await addAccessTestMember(org.ctx);
    denied = await addAccessTestMember(org.ctx, { profile: noModules.id });
    noMass = await addAccessTestMember(org.ctx, { profile: noMassDelete.id });
  });

  it.each(MODULES)("$module: allowed 2xx, profile-denied 403, invisible 404", async (entry) => {
    const { module, fields } = entry;
    const admin = getRecordService(org.ctx);
    const metadata = await admin.getModule(module);
    const bodyFor = async (actor: { ctx: typeof org.ctx }) => {
      if (module !== "Deals") return { data: [encodeInput({ ...fields }, metadata)] };
      const account = await getRecordService(actor.ctx).create("Accounts", {
        Account_Name: "DealCo",
      });
      return {
        data: [
          encodeInput(
            { ...fields, Account_Name: { module: "Accounts", id: account.id } },
            metadata,
          ),
        ],
      };
    };
    const body = await bodyFor(org);
    const standardBody = await bodyFor(standard);

    // allowed: an administrator creates; the Standard member creates and reads its own record
    const created = await call("create", org.admin, { module, body });
    expect(created.status).toBe(200);
    const adminId = (await created.json()).data[0].details.id as string;
    const own = await call("create", standard, { module, body: standardBody });
    expect(own.status).toBe(200);
    const ownId = (await own.json()).data[0].details.id as string;
    expect((await call("record", standard, { module, recordId: ownId })).status).toBe(200);
    expect((await call("count", standard, { module, body: {} })).status).toBe(200);

    // invisible: private default hides the administrator's record from the Standard member
    for (const name of ["record", "delete"] as const)
      expect((await call(name, standard, { module, recordId: adminId })).status).toBe(404);
    expect((await call("update", standard, { module, recordId: adminId, body })).status).toBe(404);

    // profile-denied: no module permission at all
    expect((await call("create", denied, { module, body })).status).toBe(403);
    expect((await call("record", denied, { module, recordId: adminId })).status).toBe(403);
    expect((await call("count", denied, { module, body: {} })).status).toBe(403);
    const deniedBody = await (await call("delete", denied, { module, recordId: adminId })).json();
    expect(deniedBody).toMatchObject({ code: "permission_denied", status: "error" });
  });

  it("multi-record delete needs tools.massDelete", async () => {
    const service = getRecordService(noMass.ctx);
    const ids = [
      (await service.create("Leads", { Last_Name: "Mass 1", Company: "M" })).id,
      (await service.create("Leads", { Last_Name: "Mass 2", Company: "M" })).id,
    ];
    await expect(service.delete("Leads", ids)).rejects.toMatchObject({ code: "permission_denied" });
    await expect(service.delete("Leads", [ids[0] ?? ""])).resolves.toBeUndefined();
  });
});
