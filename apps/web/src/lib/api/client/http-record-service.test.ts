import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import type { Criteria, ListQuery } from "@crm/core/records";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnexpectedApiError } from "@/lib/api/wire/errors";
import type { WireField } from "@/lib/api/wire/types";
import { createHttpRecordService } from "./http-record-service";

const field = (api_name: string, data_type: WireField["data_type"]): WireField => ({
  id: `field:${api_name}`,
  custom_field: false,
  api_name,
  field_label: api_name,
  data_type,
  system_mandatory: false,
  read_only: false,
  mass_update: true,
  unique: {},
  view_type: { view: true, create: true, edit: true, quick_create: false },
});
const fields = [field("id", "bigint"), field("Last_Name", "text"), field("Owner", "ownerlookup")];
const wireRecord = { id: "record-1", Last_Name: "Example", Owner: { id: "member-1" } };
const record = {
  id: "record-1",
  fields: { id: "record-1", Last_Name: "Example", Owner: "member-1" },
};
const wireView = {
  id: "view-1",
  name: "Example view",
  system_defined: true,
  default: false,
  fields: [{ api_name: "Last_Name" }],
  criteria: null,
  sort_by: "Last_Name",
  sort_order: "asc",
};
const view = {
  id: "view-1",
  name: "Example view",
  systemDefined: true,
  isDefault: false,
  columns: ["Last_Name"],
  criteria: null,
  sort: { field: "Last_Name", order: "asc" },
};
const filter: Criteria = { field: "Owner", comparator: "equal", value: { token: "CURRENTUSER" } };
const wireFilter = {
  field: { api_name: "Owner" },
  comparator: "equal",
  value: { name: `\${CURRENTUSER}` },
};
const query: ListQuery = { viewId: "view-1", page: 2, perPage: 30 };
const kanbanInput = {
  name: "Example board",
  categorizeBy: "Status",
  aggregateBy: null,
  headerStyle: "mono_color",
  fields: ["Last_Name"],
  sharedTo: "only_me" as const,
};
const wireKanbanInput = {
  name: "Example board",
  categorize_by: "Status",
  aggregate_by: null,
  header_style: "mono_color",
  fields: [{ api_name: "Last_Name" }],
  shared_to: "only_me",
};
const author = { id: "member-1", name: "Example Member" };
const kanban = { ...kanbanInput, id: "board-1", createdBy: author, modifiedBy: author };
const wireKanban = { ...wireKanbanInput, id: "board-1", created_by: author, modified_by: author };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function metadataResponse(path: string): Response | undefined {
  if (path.startsWith("/crm/v2.2/settings/modules/"))
    return json({
      modules: [
        {
          api_name: "Leads",
          singular_label: "Lead",
          plural_label: "Leads",
          business_card_fields: [{ api_name: "Owner" }],
        },
      ],
    });
  if (path === "/crm/v2.2/settings/fields?module=Leads") return json({ fields });
  if (path === "/crm/v2.1/settings/layouts?module=Leads")
    return json({
      layouts: [
        {
          sections: [
            {
              display_label: "Information",
              column_count: 2,
              columns: [["Last_Name"], ["Owner"]],
              fields: fields.slice(1),
            },
          ],
        },
      ],
    });
}

function setup(handler: (path: string, init: RequestInit) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (path: string, init: RequestInit) => {
    const metadata = metadataResponse(path);
    return metadata ?? handler(path, init);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    service: createHttpRecordService({ orgSlug: "test-org" }),
    fetchMock,
    expectRequest(path: string, method = "GET", body?: unknown) {
      const call = fetchMock.mock.calls.find(
        ([url, init]) => url === path && init.method === method,
      );
      expect(call, `Request ${method} ${path}`).toBeDefined();
      expect(call?.[1]).toMatchObject({ method, credentials: "same-origin" });
      expect(call?.[1].body).toBe(body === undefined ? undefined : JSON.stringify(body));
      const headers = call?.[1].headers as Headers;
      expect(headers.get("X-CRM-ORG")).toBe("test-org");
      expect(headers.get("Content-Type")).toBe(body === undefined ? null : "application/json");
    },
  };
}

beforeEach(() => vi.stubGlobal("window", undefined));
afterEach(() => vi.unstubAllGlobals());

describe("HTTP record service", () => {
  it("loads, decodes and shares the metadata bundle between concurrent and subsequent calls", async () => {
    const { service, fetchMock, expectRequest } = setup(() => {
      throw new Error("Unexpected request");
    });
    const [first, second] = await Promise.all([
      service.getModule("Leads"),
      service.getModule("Leads"),
    ]);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      apiName: "Leads",
      singularLabel: "Lead",
      pluralLabel: "Leads",
      businessCardFields: ["Owner"],
      fields: [
        { apiName: "id", dataType: "bigint" },
        { apiName: "Last_Name", dataType: "text" },
        { apiName: "Owner", dataType: "ownerlookup" },
      ],
      layout: [
        {
          label: "Information",
          columnCount: 2,
          columns: [["Last_Name"], ["Owner"]],
          fields: ["Last_Name", "Owner"],
        },
      ],
    });
    await service.getModule("Leads");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expectRequest("/crm/v2.2/settings/modules/Leads");
    expectRequest("/crm/v2.2/settings/fields?module=Leads");
    expectRequest("/crm/v2.1/settings/layouts?module=Leads");
  });

  it("retries a failed metadata load rather than caching the failure", async () => {
    const { service, fetchMock } = setup(() => json({}));
    fetchMock.mockResolvedValueOnce(json({ modules: [] }));
    await expect(service.getModule("Leads")).rejects.toThrow("Module is missing");
    await expect(service.getModule("Leads")).resolves.toMatchObject({ apiName: "Leads" });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("maps the home currency", async () => {
    const { service, expectRequest } = setup(() =>
      json({
        currencies: [{ iso_code: "USD", symbol: "$", name: "US Dollar", prefix_symbol: true }],
      }),
    );
    await expect(service.getHomeCurrency()).resolves.toEqual({
      isoCode: "USD",
      symbol: "$",
      name: "US Dollar",
      prefixSymbol: true,
    });
    expectRequest("/crm/v2.2/org/currencies");
  });

  it("paginates view summaries and loads each full view", async () => {
    const { service, fetchMock, expectRequest } = setup((path) => {
      if (path.includes("custom_views/view-"))
        return json({
          custom_views: [{ ...wireView, id: path.includes("view-2") ? "view-2" : "view-1" }],
        });
      const page = new URL(path, "https://example.test").searchParams.get("page");
      return json({
        custom_views: [{ ...wireView, id: page === "1" ? "view-1" : "view-2" }],
        info: { more_records: page === "1" },
      });
    });
    await expect(service.listViewSummaries("Leads")).resolves.toEqual(
      ["view-1", "view-2"].map((id) => ({
        id,
        name: view.name,
        systemDefined: true,
        isDefault: false,
      })),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expectRequest("/crm/v9/settings/custom_views?module=Leads&page=1&per_page=200");
    expectRequest("/crm/v9/settings/custom_views?module=Leads&page=2&per_page=200");
    await expect(service.listViews("Leads")).resolves.toEqual([view, { ...view, id: "view-2" }]);
    expectRequest("/crm/v9/settings/custom_views/view-1?module=Leads");
    expectRequest("/crm/v9/settings/custom_views/view-2?module=Leads");
    await expect(service.getView("Leads", "view-1")).resolves.toEqual(view);
  });

  it.each(["views", "users"] as const)(
    "stops %s pagination on 204, retaining earlier pages",
    async (resource) => {
      const { service, fetchMock } = setup((path) =>
        path.includes("page=1&")
          ? json(
              resource === "views"
                ? { custom_views: [wireView], info: { more_records: true } }
                : {
                    users: [
                      { id: "member-1", full_name: "Example Member", email: "member@example.test" },
                    ],
                    info: { more_records: true },
                  },
            )
          : new Response(null, { status: 204 }),
      );
      const result =
        resource === "views" ? await service.listViewSummaries("Leads") : await service.listUsers();
      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it("paginates and maps active users", async () => {
    const { service, expectRequest } = setup((path) => {
      const second = path.includes("page=2&");
      return json({
        users: [
          {
            id: second ? "member-2" : "member-1",
            full_name: "Example Member",
            email: "member@example.test",
          },
        ],
        info: { more_records: !second },
      });
    });
    await expect(service.listUsers()).resolves.toEqual(
      ["member-1", "member-2"].map((userId) => ({
        userId,
        name: "Example Member",
        email: "member@example.test",
      })),
    );
    expectRequest("/crm/v9/users?type=ActiveUsers&page=1&per_page=200");
    expectRequest("/crm/v9/users?type=ActiveUsers&page=2&per_page=200");
  });

  it("sends list restrictions and maps pagination, projection and activity summaries", async () => {
    const { service, fetchMock, expectRequest } = setup(() =>
      json({
        data: [wireRecord],
        info: {
          page: 2,
          per_page: 30,
          more_records: true,
          sort_by: "Last_Name",
          sort_order: "asc",
        },
        activity_summaries: { "record-1": { kind: "task", activity_id: "activity-1", date: null } },
      }),
    );
    await expect(
      service.list("Leads", {
        ...query,
        fields: ["Last_Name"],
        sort: { field: "Last_Name", order: "asc" },
        filters: filter,
        search: "A & B",
        activityFilter: { choice: "overdue" },
        campaignFilter: { campaignIds: ["synthetic"], memberStatuses: ["Opened"] },
        includeActivitySummary: true,
      }),
    ).resolves.toEqual({
      records: [{ id: "record-1", fields: { id: "record-1", Last_Name: "Example" } }],
      page: 2,
      perPage: 30,
      moreRecords: true,
      sort: { field: "Last_Name", order: "asc" },
      activitySummaries: { "record-1": { kind: "task", activityId: "activity-1", date: null } },
    });
    expectRequest(
      "/crm/v2.2/Leads/bulk?cvid=view-1&page=2&per_page=30&sort_by=Last_Name&sort_order=asc&fields=Last_Name",
      "POST",
      {
        campaign_filter: { campaign_ids: ["synthetic"], member_statuses: ["Opened"] },
        activity_filter: { choice: "overdue" },
        include_activity_summary: true,
        filters: wireFilter,
        search: "A & B",
      },
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each([undefined, []])(
    "handles list projection %j without restrictions",
    async (projection) => {
      const { service, expectRequest } = setup(() =>
        json({
          data: [wireRecord],
          info: { page: 2, per_page: 30, more_records: false, sort_by: "id", sort_order: "desc" },
        }),
      );
      const result = await service.list("Leads", { ...query, fields: projection });
      expect(result.records).toEqual(
        projection === undefined ? [record] : [{ id: "record-1", fields: { id: "record-1" } }],
      );
      expectRequest(
        `/crm/v2.2/Leads/bulk?cvid=view-1&page=2&per_page=30${projection === undefined ? "&fields=id%2CLast_Name%2COwner" : ""}`,
        "POST",
      );
    },
  );

  it.each(["explicit", "view", "fallback"] as const)(
    "maps empty lists using the %s sort",
    async (source) => {
      const { service, fetchMock } = setup((path) =>
        path.includes("/bulk?")
          ? new Response(null, { status: 204 })
          : json({
              custom_views: [
                {
                  ...wireView,
                  ...(source === "fallback" ? { sort_by: null, sort_order: null } : {}),
                },
              ],
            }),
      );
      const sort = { field: "Owner", order: "desc" as const };
      await expect(
        service.list("Leads", {
          ...query,
          ...(source === "explicit" ? { sort } : {}),
          includeActivitySummary: true,
        }),
      ).resolves.toEqual({
        records: [],
        page: 2,
        perPage: 30,
        moreRecords: false,
        activitySummaries: {},
        sort:
          source === "explicit"
            ? sort
            : source === "view"
              ? view.sort
              : { field: "id", order: "desc" },
      });
      expect(fetchMock).toHaveBeenCalledTimes(source === "explicit" ? 4 : 5);
    },
  );

  it("counts and summarizes with encoded restrictions and escaped query parameters", async () => {
    const groups = [{ value: null, count: 3, sum: 12 }];
    const { service, expectRequest } = setup((path) =>
      json(path.includes("/count?") ? { count: 3 } : { groups }),
    );
    const restrictions = {
      viewId: "view & 1",
      filters: filter,
      search: "",
      activityFilter: { choice: "without_any_activity" as const },
    };
    const body = { activity_filter: restrictions.activityFilter, filters: wireFilter, search: "" };
    await expect(service.count("Leads", restrictions)).resolves.toBe(3);
    expectRequest("/crm/v2.2/Leads/actions/count?cvid=view+%26+1", "POST", body);
    await expect(
      service.summarize("Leads", { ...restrictions, groupBy: "Owner", sum: "Amount" }),
    ).resolves.toEqual(groups);
    expectRequest(
      "/crm/v2.2/Leads/actions/grouped_counts?cvid=view+%26+1&group_by=Owner&sum=Amount",
      "POST",
      body,
    );
    await service.count("Leads", { viewId: "view-1" });
    expectRequest("/crm/v2.2/Leads/actions/count?cvid=view-1", "POST");
    await service.summarize("Leads", { viewId: "view-1", groupBy: "Owner" });
    expectRequest("/crm/v2.2/Leads/actions/grouped_counts?cvid=view-1&group_by=Owner", "POST");
  });

  it("gets and decodes a record with an escaped ID", async () => {
    const { service, expectRequest } = setup(() => json({ data: [wireRecord] }));
    await expect(service.get("Leads", "record/1")).resolves.toEqual(record);
    expectRequest("/crm/v2.2/Leads/record%2F1");
  });

  it.each(["create", "update"] as const)(
    "encodes %s and reloads the ID returned by the write",
    async (method) => {
      const { service, fetchMock, expectRequest } = setup((_path, init) =>
        json(
          init.method === "GET"
            ? { data: [wireRecord] }
            : {
                data: [
                  {
                    code: "SUCCESS",
                    details: { id: "record-1" },
                    message: "Saved",
                    status: "success",
                  },
                ],
              },
        ),
      );
      const input = { Last_Name: "Example", Owner: "member-1" };
      await expect(
        method === "create"
          ? service.create("Leads", input)
          : service.update("Leads", "old-id", input),
      ).resolves.toEqual(record);
      expectRequest(
        method === "create" ? "/crm/v2.2/Leads" : "/crm/v2.2/Leads/old-id",
        method === "create" ? "POST" : "PUT",
        { data: [{ Last_Name: "Example", Owner: { id: "member-1" } }] },
      );
      expectRequest("/crm/v2.2/Leads/record-1");
      expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/crm/v2.2/Leads/record-1");
      expect(fetchMock).toHaveBeenCalledTimes(5);
    },
  );

  it("sends single/mass delete, mass update and owner changes", async () => {
    const { service, expectRequest } = setup(() => new Response(null, { status: 204 }));
    await expect(service.delete("Leads", ["record/1"])).resolves.toBeUndefined();
    expectRequest("/crm/v2.2/Leads/record%2F1", "DELETE");
    await expect(service.delete("Leads", ["record-1", "record-2"])).resolves.toBeUndefined();
    expectRequest("/crm/v2.2/Leads/actions/mass_delete", "POST", { ids: ["record-1", "record-2"] });
    await expect(
      service.massUpdate("Leads", ["record-1"], { Owner: "member-1" }),
    ).resolves.toBeUndefined();
    expectRequest("/crm/v2.2/Leads/actions/mass_update", "POST", {
      data: [{ Owner: { id: "member-1" } }],
      ids: ["record-1"],
    });
    await expect(service.changeOwner("Leads", ["record-1"], "member-2")).resolves.toBeUndefined();
    expectRequest("/crm/v2.2/Leads/actions/change_owner", "POST", {
      ids: ["record-1"],
      owner: { id: "member-2" },
    });
  });

  it("sends search, duplicate discovery, merge and deduplication requests", async () => {
    const responses = {
      search: [{ module: "Leads", total: 1, records: [record] }],
      duplicate_groups: [{ conflictFields: ["Owner"], records: [record] }],
      merge: record,
      deduplicate: { mergedGroups: 1, removedRecords: 1, conflicts: [] },
    };
    const { service, expectRequest } = setup((path) => {
      const action = path.split("/").at(-1) as keyof typeof responses;
      return json(responses[action]);
    });
    const search = { text: "Example", modules: ["Leads"], page: 2, perPage: 30, filters: filter };
    await expect(service.search(search)).resolves.toEqual(responses.search);
    expectRequest("/crm/v2.2/actions/search", "POST", { ...search, filters: wireFilter });
    await expect(service.findDuplicateGroups("Leads", ["Last_Name"])).resolves.toEqual(
      responses.duplicate_groups,
    );
    expectRequest("/crm/v2.2/Leads/actions/duplicate_groups", "POST", { fields: ["Last_Name"] });
    await expect(
      service.merge("Leads", {
        masterId: "record-1",
        duplicateIds: ["record-2"],
        values: { Owner: "member-1" },
      }),
    ).resolves.toEqual(record);
    expectRequest("/crm/v2.2/Leads/actions/merge", "POST", {
      masterId: "record-1",
      duplicateIds: ["record-2"],
      values: { Owner: { id: "member-1" } },
    });
    await expect(service.deduplicate("Leads", ["Last_Name"])).resolves.toEqual(
      responses.deduplicate,
    );
    expectRequest("/crm/v2.2/Leads/actions/deduplicate", "POST", { fields: ["Last_Name"] });
  });

  it("maps kanban list/detail and encodes create/update", async () => {
    const { service, expectRequest } = setup(() => json({ kanban_views: [wireKanban] }));
    await expect(service.listKanbanViews("Leads")).resolves.toEqual([kanban]);
    expectRequest("/crm/v9/settings/kanban_views?module=Leads");
    await expect(service.getKanbanView("Leads", "board/1")).resolves.toEqual(kanban);
    expectRequest("/crm/v9/settings/kanban_views/board%2F1?module=Leads");
    await expect(service.createKanbanView("Leads", kanbanInput)).resolves.toEqual(kanban);
    expectRequest("/crm/v9/settings/kanban_views?module=Leads", "POST", {
      kanban_views: [wireKanbanInput],
    });
    await expect(service.updateKanbanView("Leads", "board-1", kanbanInput)).resolves.toEqual(
      kanban,
    );
    expectRequest("/crm/v9/settings/kanban_views/board-1?module=Leads", "PUT", {
      kanban_views: [wireKanbanInput],
    });
  });

  it.each([
    [400, "DUPLICATE_DATA", ConflictError],
    [401, "AUTHENTICATION_FAILURE", UnauthenticatedError],
    [403, "NO_PERMISSION", ForbiddenError],
    [404, "not_found", NotFoundError],
  ] as const)("maps HTTP %s errors through the client", async (status, code, ErrorClass) => {
    const { service, fetchMock } = setup(() =>
      json({ code, details: {}, message: "Request rejected.", status: "error" }, status),
    );
    await expect(service.get("Leads", "record-1")).rejects.toBeInstanceOf(ErrorClass);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each(["INVALID_DATA", "MANDATORY_NOT_FOUND", "LIMIT_EXCEEDED"])(
    "preserves %s validation details and does not reload failed writes",
    async (code) => {
      const fieldErrors = {
        Last_Name: ["Required.", "Invalid value."],
        Owner: ["Choose a member."],
      };
      const { service, fetchMock } = setup(() =>
        json(
          { code, details: { fields: fieldErrors }, message: "Check fields.", status: "error" },
          400,
        ),
      );
      const result = service.create("Leads", { Last_Name: "" });
      await expect(result).rejects.toBeInstanceOf(ValidationError);
      await expect(result).rejects.toMatchObject({
        fieldErrors,
        reason:
          code === "MANDATORY_NOT_FOUND"
            ? "mandatory"
            : code === "LIMIT_EXCEEDED"
              ? "limit"
              : "invalid",
      });
      expect(fetchMock).toHaveBeenCalledTimes(4);
    },
  );

  it.each([500, 503])("maps unreadable HTTP %s responses without retrying", async (status) => {
    const { service, fetchMock } = setup(() => new Response("<html>Error</html>", { status }));
    const result = service.count("Leads", { viewId: "view-1" });
    await expect(result).rejects.toBeInstanceOf(UnexpectedApiError);
    await expect(result).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps a structured server error", async () => {
    const { service } = setup(() =>
      json(
        { code: "INTERNAL_ERROR", details: {}, message: "Something went wrong.", status: "error" },
        500,
      ),
    );
    await expect(service.listUsers()).rejects.toMatchObject({
      name: "UnexpectedApiError",
      status: 500,
    });
  });

  it("returns empty inventories when the first page is 204", async () => {
    const { service, fetchMock } = setup(() => new Response(null, { status: 204 }));
    await expect(service.listViews("Leads")).resolves.toEqual([]);
    await expect(service.listUsers()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(["record", "view", "kanban", "currency", "create", "update"] as const)(
    "rejects a missing %s response item",
    async (resource) => {
      const { service, fetchMock } = setup(() =>
        json({ data: [], custom_views: [], kanban_views: [], currencies: [] }),
      );
      const requests = {
        record: () => service.get("Leads", "record-1"),
        view: () => service.getView("Leads", "view-1"),
        kanban: () => service.getKanbanView("Leads", "board-1"),
        currency: () => service.getHomeCurrency(),
        create: () => service.create("Leads", { Last_Name: "Example" }),
        update: () => service.update("Leads", "record-1", { Last_Name: "Example" }),
      };
      await expect(requests[resource]()).rejects.toThrow("is missing from the API response.");
      expect(fetchMock).toHaveBeenCalledTimes(
        ["record", "create", "update"].includes(resource) ? 4 : 1,
      );
    },
  );

  it("preserves network failures without retrying", async () => {
    const error = new TypeError("Network unavailable");
    const { service, fetchMock } = setup(() => {
      throw error;
    });
    await expect(service.listUsers()).rejects.toBe(error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
