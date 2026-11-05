import {
  cloneProfile,
  createRole,
  getProfile,
  listProfiles,
  listRoles,
  putFieldPermissions,
  updateProfile,
} from "@crm/core/access";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { addAccessTestMember, createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { getRecordService } from "@/lib/records";

/**
 * MEP-1468 security probe (ADR 0017 §4.5, §11.4): drives the real route handlers of every
 * read and write path as a Standard user in a lower role whose profile hides one Leads field
 * and makes another read-only. Leak detection is format-agnostic: sentinels live in the hidden
 * field and in the names of records the user cannot see, and no response body may contain them.
 */
type Handler = (r: Request, c: { params?: Promise<Record<string, string>> }) => Promise<Response>;
type RouteModule = Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", Handler>>;
const routes = {
  bulk: () => import("@/app/crm/v2.2/[module]/bulk/route"),
  create: () => import("@/app/crm/v2.2/[module]/route"),
  record: () => import("@/app/crm/v2.2/[module]/[recordId]/route"),
  count: () => import("@/app/crm/v2.2/[module]/actions/count/route"),
  groupedCounts: () => import("@/app/crm/v2.2/[module]/actions/grouped_counts/route"),
  duplicateGroups: () => import("@/app/crm/v2.2/[module]/actions/duplicate_groups/route"),
  massUpdate: () => import("@/app/crm/v2.2/[module]/actions/mass_update/route"),
  massDelete: () => import("@/app/crm/v2.2/[module]/actions/mass_delete/route"),
  changeOwner: () => import("@/app/crm/v2.2/[module]/actions/change_owner/route"),
  merge: () => import("@/app/crm/v2.2/[module]/actions/merge/route"),
  exportRun: () => import("@/app/crm/v2.2/[module]/actions/export/route"),
  exportDownload: () => import("@/app/crm/v9/settings/exports/[exportId]/download/route"),
  importRun: () => import("@/app/crm/v2.2/[module]/actions/import/route"),
  importSample: () => import("@/app/crm/v2.2/[module]/actions/import_sample/route"),
  convert: () => import("@/app/crm/v2.2/[module]/[recordId]/actions/convert/route"),
  addTags: () => import("@/app/crm/v2.2/[module]/[recordId]/actions/add_tags/route"),
  attachments: () => import("@/app/crm/v2.2/[module]/[recordId]/Attachments/route"),
  search: () => import("@/app/crm/v2.2/actions/search/route"),
  timelines: () => import("@/app/crm/v9/[module]/[recordId]/timelines/route"),
  recycleBin: () => import("@/app/crm/v2.2/settings/recycle_bin/route"),
  feedRecord: () => import("@/app/crm/v2.2/feeds/records/[module]/[recordId]/route"),
  users: () => import("@/app/crm/v9/users/route"),
  profiles: () => import("@/app/crm/v9/settings/profiles/route"),
  profile: () => import("@/app/crm/v9/settings/profiles/[profileId]/route"),
  fieldPermissions: () =>
    import("@/app/crm/v9/settings/profiles/[profileId]/field_permissions/[module]/route"),
  roles: () => import("@/app/crm/v9/settings/roles/route"),
  role: () => import("@/app/crm/v9/settings/roles/[roleId]/route"),
  groups: () => import("@/app/crm/v9/settings/groups/route"),
  sharingRules: () => import("@/app/crm/v9/settings/sharing_rules/route"),
  moduleDefaults: () => import("@/app/crm/v9/settings/module_defaults/route"),
  memberAccess: () => import("@/app/crm/v9/settings/member_access/route"),
  memberAccessUser: () => import("@/app/crm/v9/settings/member_access/[userId]/route"),
} as const;
type RouteName = keyof typeof routes;
type Member = Awaited<ReturnType<typeof addAccessTestMember>>;
type Actor = { headers: Headers };
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;

const HIDDEN = "zzhiddenprobe";
const HIDDEN_EMAIL = `${HIDDEN}@example.test`;
const INVISIBLE = "ZZINVISPROBE";

describe("access security probe (MEP-1468)", () => {
  let org: Awaited<ReturnType<typeof createTestOrganization>>;
  let manager: Member;
  let rep: Member;
  let denied: Member;
  /** Leads: admin-owned, manager-owned (both invisible to rep), rep-owned with hidden Email. */
  const ids = { admin: "", manager: "", rep: "", repSecond: "" };
  const others: Record<string, string> = {};
  let tagId = "";
  let noteId = "";

  async function call(
    name: RouteName,
    as: Actor,
    method: keyof RouteModule,
    path: string,
    options: {
      params?: Record<string, string>;
      body?: unknown;
      query?: Record<string, string>;
    } = {},
  ): Promise<{ status: number; text: string }> {
    const route = (await routes[name]()) as unknown as RouteModule;
    const handler = route[method];
    if (!handler) throw new Error(`${name} has no ${method}`);
    const url = new URL(path, origin);
    for (const [key, value] of Object.entries(options.query ?? {}))
      url.searchParams.set(key, value);
    const headers = new Headers(as.headers);
    headers.set("Origin", origin);
    headers.set("X-CRM-ORG", org.org.slug);
    headers.set("Content-Type", "application/json");
    const response = await handler(
      new Request(url, {
        method,
        headers,
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      }),
      { params: Promise.resolve(options.params ?? {}) },
    );
    return { status: response.status, text: await response.text() };
  }

  /** No hidden-field value and no invisible record name in any response body. */
  function expectNoLeak(result: { text: string }, label: string) {
    expect(result.text, `${label}: hidden field value leaked`).not.toContain(HIDDEN);
    expect(result.text, `${label}: invisible record leaked`).not.toContain(INVISIBLE);
  }

  const lead = (module = "Leads", recordId = "") => ({
    params: { module, recordId },
    query: { module, cvid: `all-${module.toLowerCase()}` },
  });

  beforeAll(async () => {
    org = await createTestOrganization();
    const roles = await listRoles(org.ctx);
    const managerRole = roles.find((role) => role.name === "Manager");
    if (!managerRole) throw new Error("Manager role missing");
    await createRole(org.ctx, { name: "Probe Rep", parentRoleId: managerRole.id });

    const standard = (await listProfiles(org.ctx)).find((p) => p.kind === "standard");
    if (!standard) throw new Error("Standard profile missing");
    const hiddenProfile = await cloneProfile(org.ctx, {
      sourceProfileId: standard.id,
      name: "Probe hidden email",
    });
    await putFieldPermissions(org.ctx, {
      profileId: hiddenProfile.id,
      module: "Leads",
      fields: [
        { field: "Email", access: "hidden" },
        { field: "Mobile", access: "read_only" },
      ],
    });
    const detail = await getProfile(org.ctx, standard.id);
    const noLeads = await cloneProfile(org.ctx, { sourceProfileId: standard.id, name: "No leads" });
    await updateProfile(org.ctx, {
      profileId: noLeads.id,
      permissions: {
        ...detail.permissions,
        modules: {
          ...detail.permissions.modules,
          Leads: { view: false, create: false, edit: false, delete: false },
        },
      },
    });

    manager = await addAccessTestMember(org.ctx);
    rep = await addAccessTestMember(org.ctx, { profile: hiddenProfile.id, role: "Probe Rep" });
    denied = await addAccessTestMember(org.ctx, { profile: noLeads.id });

    const admin = getRecordService(org.ctx);
    const make = async (name: string, owner?: string) => {
      const row = await admin.create("Leads", {
        Last_Name: name,
        Company: `${name} Co`,
        Email: HIDDEN_EMAIL,
        Mobile: "555 0100",
      });
      if (owner) await admin.changeOwner("Leads", [row.id], owner);
      return row.id;
    };
    ids.admin = await make(`${INVISIBLE} Admin`);
    ids.manager = await make(`${INVISIBLE} Manager`, manager.user.id);
    ids.rep = await make("Probe Visible", rep.user.id);
    ids.repSecond = await make("Probe Visible Two", rep.user.id);
    // A history diff on the hidden field of a record the rep can read.
    await admin.update("Leads", ids.rep, { Email: `second-${HIDDEN_EMAIL}` });

    for (const [module, fields] of [
      ["Contacts", { Last_Name: `${INVISIBLE} Contact` }],
      ["Accounts", { Account_Name: `${INVISIBLE} Account` }],
    ] as const)
      others[module] = (await admin.create(module, { ...fields })).id;

    noteId = (
      await admin.create("Notes", {
        Parent_Id: { module: "Leads", id: ids.admin },
        Note_Title: `${INVISIBLE} note`,
        Note_Content: `${INVISIBLE} note body`,
      })
    ).id;
    tagId = (
      await createFixtureRecordService(org.ctx).tags.createTag("Leads", { name: "Probe tag" })
    ).id;
    const binned = await admin.create("Leads", { Last_Name: `${INVISIBLE} Bin`, Company: "Bin" });
    await admin.delete("Leads", [binned.id]);
  });

  it("list, count, kanban-style grouping and search show only visible rows", async () => {
    const list = await call("bulk", rep, "POST", "/crm/v2.2/Leads/bulk", {
      ...lead(),
      query: { ...lead().query, fields: "Email,Mobile,Last_Name" },
    });
    expect(list.status).toBe(200);
    expect(list.text).toContain("Probe Visible");
    expectNoLeak(list, "list");

    const count = await call("count", rep, "POST", "/crm/v2.2/Leads/actions/count", {
      ...lead(),
      body: {},
    });
    expect(count.status).toBe(200);
    expect(JSON.parse(count.text).count).toBe(JSON.parse(list.text).data.length);

    const grouped = await call(
      "groupedCounts",
      rep,
      "POST",
      "/crm/v2.2/Leads/actions/grouped_counts",
      {
        ...lead(),
        query: { ...lead().query, group_by: "Lead_Status" },
        body: {},
      },
    );
    expect(grouped.status).toBe(200);
    expectNoLeak(grouped, "grouped counts");

    for (const text of [INVISIBLE, HIDDEN]) {
      const search = await call("search", rep, "POST", "/crm/v2.2/actions/search", {
        body: { text },
      });
      expect(search.status).toBe(200);
      expectNoLeak(search, `search ${text}`);
    }
    // A search on the hidden value must not reveal which visible record holds it.
    const byHidden = await call("search", rep, "POST", "/crm/v2.2/actions/search", {
      body: { text: HIDDEN },
    });
    expect(byHidden.text).not.toContain(ids.rep);

    // Manager sees the rep's record through the role hierarchy, not the admin's.
    const managerList = await call("bulk", manager, "POST", "/crm/v2.2/Leads/bulk", lead());
    expect(managerList.text).toContain("Probe Visible");
    expect(managerList.text).not.toContain(`${INVISIBLE} Admin`);
    expect(managerList.text).toContain(`${INVISIBLE} Manager`);

    for (const module of ["Contacts", "Accounts"]) {
      const rows = await call("bulk", rep, "POST", `/crm/v2.2/${module}/bulk`, lead(module));
      expect([200, 204]).toContain(rows.status);
      expectNoLeak(rows, `${module} list`);
      const get = await call(
        "record",
        rep,
        "GET",
        `/crm/v2.2/${module}/x`,
        lead(module, others[module]),
      );
      expect(get.status).toBe(404);
    }
  });

  it("hidden fields are refused in filters, grouping and duplicate scans", async () => {
    const grouped = await call(
      "groupedCounts",
      rep,
      "POST",
      "/crm/v2.2/Leads/actions/grouped_counts",
      {
        ...lead(),
        query: { ...lead().query, group_by: "Email" },
        body: {},
      },
    );
    expect(grouped.status).toBe(403);
    expectNoLeak(grouped, "group by hidden");

    const duplicates = await call(
      "duplicateGroups",
      rep,
      "POST",
      "/crm/v2.2/Leads/actions/duplicate_groups",
      {
        ...lead(),
        body: { fields: ["Email"] },
      },
    );
    expect(duplicates.status).toBe(403);
    expectNoLeak(duplicates, "duplicate scan on hidden");

    const sorted = await call("bulk", rep, "POST", "/crm/v2.2/Leads/bulk", {
      ...lead(),
      query: { ...lead().query, sort_by: "Email", sort_order: "asc" },
    });
    expect(sorted.status).toBe(403);
  });

  it("detail, timeline, attachments, feed and tags: invisible 404, hidden field absent", async () => {
    const visible = await call("record", rep, "GET", "/crm/v2.2/Leads/x", lead("Leads", ids.rep));
    expect(visible.status).toBe(200);
    expectNoLeak(visible, "detail");
    expect(visible.text).toContain("555 0100");

    for (const recordId of [ids.admin, ids.manager]) {
      const get = await call("record", rep, "GET", "/crm/v2.2/Leads/x", lead("Leads", recordId));
      expect(get.status).toBe(404);
      expectNoLeak(get, "invisible detail");
      for (const name of ["timelines", "attachments", "feedRecord"] as const) {
        const path =
          name === "timelines"
            ? `/crm/v9/Leads/${recordId}/timelines`
            : name === "attachments"
              ? `/crm/v2.2/Leads/${recordId}/Attachments`
              : `/crm/v2.2/feeds/records/Leads/${recordId}`;
        const result = await call(name, rep, "GET", path, lead("Leads", recordId));
        expect(result.status, `${name} of an invisible record`).toBe(404);
        expectNoLeak(result, name);
      }
      const tags = await call("addTags", rep, "POST", "/crm/v2.2/Leads/x/actions/add_tags", {
        ...lead("Leads", recordId),
        body: { ids: [tagId] },
      });
      expect(tags.status).toBe(404);
      const convert = await call("convert", rep, "POST", "/crm/v2.2/Leads/x/actions/convert", {
        ...lead("Leads", recordId),
        body: { account: { create: { Account_Name: "Probe convert" } } },
      });
      expect(convert.status).toBe(404);
    }

    const timeline = await call(
      "timelines",
      rep,
      "GET",
      `/crm/v9/Leads/${ids.rep}/timelines`,
      lead("Leads", ids.rep),
    );
    expect(timeline.status).toBe(200);
    expectNoLeak(timeline, "timeline diff");
  });

  it("export CSV holds visible rows only and no hidden column", async () => {
    const run = await call("exportRun", rep, "POST", "/crm/v2.2/Leads/actions/export", {
      ...lead(),
      body: { fields: "all" },
    });
    expect(run.status).toBe(200);
    const job = JSON.parse(run.text);
    const download = await call(
      "exportDownload",
      rep,
      "GET",
      `/crm/v9/settings/exports/${job.id}/download`,
      {
        params: { exportId: job.id },
      },
    );
    expect(download.status).toBe(200);
    expect(download.text).toContain("Probe Visible");
    expectNoLeak(download, "export CSV");

    const deniedExport = await call("exportRun", denied, "POST", "/crm/v2.2/Leads/actions/export", {
      ...lead(),
      body: { fields: "all" },
    });
    expect(deniedExport.status).toBe(403);
    // Another member's export job is not downloadable.
    const foreign = await call(
      "exportDownload",
      manager,
      "GET",
      `/crm/v9/settings/exports/${job.id}/download`,
      {
        params: { exportId: job.id },
      },
    );
    expect(foreign.status).toBe(404);
  });

  it("notes of an invisible parent are invisible (child-module inheritance)", async () => {
    const service = getRecordService(rep.ctx);
    await expect(service.get("Notes", noteId)).rejects.toMatchObject({ code: "not_found" });
    for (const view of await service.listViews("Notes")) {
      const page = await service.list("Notes", { viewId: view.id, page: 1, perPage: 100 });
      expect(JSON.stringify(page)).not.toContain(INVISIBLE);
    }
  });

  it("import is refused without the module's import permission", async () => {
    for (const [name, method, path] of [
      ["importRun", "POST", "/crm/v2.2/Leads/actions/import"],
      ["importSample", "GET", "/crm/v2.2/Leads/actions/import_sample"],
    ] as const) {
      const result = await call(name, denied, method, path, {
        ...lead(),
        ...(method === "POST" ? { body: { uploadId: "probe-upload" } } : {}),
      });
      expect(result.status, name).toBe(403);
    }
  });

  it("recycle bin shows no other member's deleted records", async () => {
    const bin = await call("recycleBin", rep, "GET", "/crm/v2.2/settings/recycle_bin", {
      query: { module: "Leads" },
    });
    expect([200, 204]).toContain(bin.status);
    expectNoLeak(bin, "recycle bin");
  });

  it("writes: hidden and read-only fields, invisible ids, atomic multi-record actions", async () => {
    const hiddenWrite = await call("record", rep, "PUT", "/crm/v2.2/Leads/x", {
      ...lead("Leads", ids.rep),
      body: { data: [{ Email: "new@example.test" }] },
    });
    // The viewer's projected metadata has no hidden field, so the wire decoder refuses it
    // before the service's 403 field_forbidden; either way nothing is written.
    expect([400, 403]).toContain(hiddenWrite.status);
    expect((await getRecordService(org.ctx).get("Leads", ids.rep)).fields.Email).toBe(
      `second-${HIDDEN_EMAIL}`,
    );
    const readOnlyWrite = await call("record", rep, "PUT", "/crm/v2.2/Leads/x", {
      ...lead("Leads", ids.rep),
      body: { data: [{ Mobile: "555 0199" }] },
    });
    expect(readOnlyWrite.status).toBe(403);
    const allowed = await call("record", rep, "PUT", "/crm/v2.2/Leads/x", {
      ...lead("Leads", ids.rep),
      body: { data: [{ Company: "Probe Visible Co 2" }] },
    });
    expect(allowed.status).toBe(200);
    expectNoLeak(allowed, "update response");

    const invisibleWrite = await call("record", rep, "PUT", "/crm/v2.2/Leads/x", {
      ...lead("Leads", ids.admin),
      body: { data: [{ Company: "x" }] },
    });
    expect(invisibleWrite.status).toBe(404);

    const mixed = [ids.repSecond, ids.admin];
    for (const [name, path, body] of [
      [
        "massUpdate",
        "/crm/v2.2/Leads/actions/mass_update",
        { ids: mixed, data: [{ Company: "x" }] },
      ],
      ["massDelete", "/crm/v2.2/Leads/actions/mass_delete", { ids: mixed }],
      [
        "changeOwner",
        "/crm/v2.2/Leads/actions/change_owner",
        { ids: mixed, owner: { id: rep.user.id } },
      ],
      [
        "merge",
        "/crm/v2.2/Leads/actions/merge",
        { masterId: ids.repSecond, duplicateIds: [ids.admin], values: {} },
      ],
    ] as const) {
      const result = await call(name, rep, "POST", path, { ...lead(), body });
      expect(result.status, name).toBeGreaterThanOrEqual(403);
      expect(result.status, name).toBeLessThan(405);
      expectNoLeak(result, name);
    }
    // Atomic: the visible record was not touched by the refused mass update.
    const second = await getRecordService(org.ctx).get("Leads", ids.repSecond);
    expect(second.fields.Company).not.toBe("x");
    // The manager reaches the subordinate's records through the hierarchy (RWD).
    const managerEdit = await call("record", manager, "PUT", "/crm/v2.2/Leads/x", {
      ...lead("Leads", ids.repSecond),
      body: { data: [{ Company: "Manager edit" }] },
    });
    expect(managerEdit.status).toBe(200);
  });

  it("profile without the module is refused everywhere with 403", async () => {
    for (const [name, method, path, extra] of [
      ["bulk", "POST", "/crm/v2.2/Leads/bulk", {}],
      ["count", "POST", "/crm/v2.2/Leads/actions/count", { body: {} }],
      ["record", "GET", "/crm/v2.2/Leads/x", {}],
      ["timelines", "GET", `/crm/v9/Leads/${ids.rep}/timelines`, {}],
      ["attachments", "GET", `/crm/v2.2/Leads/${ids.rep}/Attachments`, {}],
      ["create", "POST", "/crm/v2.2/Leads", { body: { data: [{ Last_Name: "x" }] } }],
    ] as const) {
      const result = await call(name, denied, method, path, {
        ...lead("Leads", ids.rep),
        ...extra,
      });
      expect(result.status, name).toBe(403);
      expectNoLeak(result, name);
    }
    const search = await call("search", denied, "POST", "/crm/v2.2/actions/search", {
      body: { text: "Probe Visible" },
    });
    expect(search.text).not.toContain("Probe Visible");
  });

  it("non-administrators cannot read or write any access setting (no escalation)", async () => {
    const standard = (await listProfiles(org.ctx)).find((p) => p.kind === "administrator");
    const managerRole = (await listRoles(org.ctx)).find((r) => r.name === "Manager");
    const probes: [RouteName, keyof RouteModule, string, Record<string, string>, unknown][] = [
      ["profiles", "GET", "/crm/v9/settings/profiles", {}, undefined],
      [
        "profiles",
        "POST",
        "/crm/v9/settings/profiles",
        {},
        { source_profile_id: standard?.id, name: "Mine" },
      ],
      [
        "profile",
        "PUT",
        "/crm/v9/settings/profiles/x",
        { profileId: standard?.id ?? "" },
        { name: "x" },
      ],
      [
        "fieldPermissions",
        "GET",
        "/crm/v9/settings/profiles/x/field_permissions/Leads",
        { profileId: standard?.id ?? "", module: "Leads" },
        undefined,
      ],
      ["roles", "GET", "/crm/v9/settings/roles", {}, undefined],
      [
        "roles",
        "POST",
        "/crm/v9/settings/roles",
        {},
        { name: "Mine", parent_role_id: managerRole?.id },
      ],
      ["role", "DELETE", "/crm/v9/settings/roles/x", { roleId: managerRole?.id ?? "" }, undefined],
      ["groups", "GET", "/crm/v9/settings/groups", {}, undefined],
      ["groups", "POST", "/crm/v9/settings/groups", {}, { name: "Mine" }],
      ["sharingRules", "GET", "/crm/v9/settings/sharing_rules", {}, undefined],
      ["moduleDefaults", "GET", "/crm/v9/settings/module_defaults", {}, undefined],
      [
        "moduleDefaults",
        "PUT",
        "/crm/v9/settings/module_defaults",
        {},
        { defaults: [{ module: "Leads", level: "public_read_write_delete" }] },
      ],
      ["memberAccess", "GET", "/crm/v9/settings/member_access", {}, undefined],
      [
        "memberAccessUser",
        "PUT",
        "/crm/v9/settings/member_access/x",
        { userId: rep.user.id },
        { profile_id: standard?.id },
      ],
      [
        "memberAccessUser",
        "PUT",
        "/crm/v9/settings/member_access/x",
        { userId: rep.user.id },
        { role_id: managerRole?.id },
      ],
    ];
    for (const actor of [rep, manager]) {
      for (const [name, method, path, params, body] of probes) {
        const route = (await routes[name]()) as unknown as RouteModule;
        if (!route[method]) continue;
        const result = await call(name, actor, method, path, { params, body });
        expect(result.status, `${method} ${path}`).toBe(403);
      }
    }
    // Still Standard in Probe Rep after every attempt.
    const admin = getRecordService(org.ctx);
    expect(admin).toBeDefined();
    const after = await call("memberAccess", org.admin, "GET", "/crm/v9/settings/member_access");
    expect(after.status).toBe(200);
    const row = JSON.parse(after.text).members.find(
      (m: { user_id?: string; userId?: string }) => (m.user_id ?? m.userId) === rep.user.id,
    );
    expect(row).toBeDefined();
    expect(JSON.stringify(row)).not.toContain(standard?.id ?? "-");
  });
});
