import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type {
  Comparator,
  Criteria,
  CriteriaToken,
  CriteriaValue,
  FieldValue,
  ListView,
  ModuleMetadata,
  RecordData,
  RecordInput,
  RecordService,
} from "./contract";

type ContractFactory = (
  ctx: OrgContext,
  options?: { now?: () => Date },
) => RecordService | Promise<RecordService>;
function context(): OrgContext {
  const id = randomUUID();
  return {
    orgId: id,
    orgSlug: `contract-${id}`,
    orgName: "Contract Organization",
    userId: "contract-user",
    role: "admin",
  };
}
function isToken(value: CriteriaValue): value is CriteriaToken {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "token" in value;
}
function criterionInput(criteria: Criteria, metadata: ModuleMetadata): Record<string, FieldValue> {
  if ("group" in criteria)
    return Object.assign({}, ...criteria.group.map((child) => criterionInput(child, metadata)));
  if (isToken(criteria.value) || Array.isArray(criteria.value)) return {};
  const field = metadata.fields.find((item) => item.apiName === criteria.field);
  if (!field || field.readOnly || typeof criteria.value === "object") return {};
  return { [criteria.field]: criteria.value };
}
function mentionsCategory(criteria: Criteria, name: string): boolean {
  if ("group" in criteria) return criteria.group.some((child) => mentionsCategory(child, name));
  return (
    isToken(criteria.value) && criteria.value.token === "CATEGORY" && criteria.value.name === name
  );
}

/** Public-method tests shared by fixture and future persistent adapters. */
export function describeRecordServiceContract(name: string, makeService: ContractFactory): void {
  describe(`${name}: record service contract`, () => {
    let service: RecordService;
    let ctx: OrgContext;
    let metadata: ModuleMetadata;
    let views: readonly ListView[];
    let defaultView: ListView;
    beforeEach(async () => {
      ctx = context();
      service = await makeService(ctx);
      metadata = await service.getModule("Leads");
      views = await service.listViews("Leads");
      const view = views.find((view) => view.isDefault);
      if (!view) throw new Error("A default view is required.");
      defaultView = view;
    });
    const input = (extra: RecordInput = {}): RecordInput => ({
      Last_Name: "Contract Lead",
      Company: "Contract Company",
      ...extra,
    });
    const forView = (view: ListView, extra: RecordInput = {}): RecordInput =>
      input({ ...(view.criteria ? criterionInput(view.criteria, metadata) : {}), ...extra });
    const validation = async (promise: Promise<unknown>, field: string) => {
      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toMatchObject({ fieldErrors: { [field]: expect.any(Array) } });
    };
    it("publishes the four home currency fields without exposing mutable state", async () => {
      const currency = await service.getHomeCurrency();
      expect(Object.keys(currency).sort()).toEqual(["isoCode", "name", "prefixSymbol", "symbol"]);
      expect(currency.isoCode).toMatch(/^[A-Z]{3}$/);
      expect(currency.symbol.trim().length).toBeGreaterThan(0);
      expect(typeof currency.name).toBe("string");
      expect(typeof currency.prefixSymbol).toBe("boolean");
      const original = { ...currency };
      currency.symbol = "changed";
      expect(await service.getHomeCurrency()).toEqual(original);
    });
    it("publishes consistent metadata, layouts and view definitions", async () => {
      expect(metadata.apiName).toBe("Leads");
      expect(metadata.singularLabel).toBe("Lead");
      expect(metadata.pluralLabel).toBe("Leads");
      const names = metadata.fields.map((field) => field.apiName);
      expect(new Set(names).size).toBe(names.length);
      expect(names.length).toBe(56);
      for (const field of metadata.fields) {
        expect(field.label).not.toBe("");
        expect(typeof field.required).toBe("boolean");
        expect(typeof field.readOnly).toBe("boolean");
        expect(typeof field.massUpdate).toBe("boolean");
        expect(Object.keys(field.views).sort()).toEqual(["create", "edit", "quickCreate", "view"]);
        for (const value of Object.values(field.views)) expect(typeof value).toBe("boolean");
        expect(field.unique).toBe(false);
        if (field.picklist)
          for (const option of field.picklist) {
            expect(typeof option.displayValue).toBe("string");
            expect(typeof option.storedValue).toBe("string");
          }
      }
      for (const section of metadata.layout) {
        expect(section.columnCount).toBeGreaterThan(0);
        expect(section.columns).toHaveLength(section.columnCount);
        const placed = section.columns.flat();
        expect(new Set(placed).size).toBe(placed.length);
        for (const field of placed) expect(section.fields).toContain(field);
        for (const field of section.fields) expect(names).toContain(field);
      }
      for (const name of metadata.businessCardFields)
        expect(metadata.fields.find((field) => field.apiName === name)?.views.view).toBe(true);
      expect(new Set(views.map((view) => view.id)).size).toBe(views.length);
      expect(views.filter((view) => view.isDefault)).toHaveLength(1);
      for (const view of views) {
        expect(view.id).not.toBe("");
        expect(typeof view.systemDefined).toBe("boolean");
        for (const field of view.columns) expect(names).toContain(field);
        expect(await service.getView("Leads", view.id)).toEqual(view);
      }
    });
    it("projects fields, always includes id and rejects unknown names", async () => {
      const created = await service.create("Leads", forView(defaultView));
      const query = {
        viewId: defaultView.id,
        page: 1,
        perPage: 10,
        filters: {
          field: "id",
          comparator: "equal" as const,
          value: created.id,
        },
      };
      const projected = await service.list("Leads", { ...query, fields: ["Company"] });
      expect(projected.records).toEqual([
        { id: created.id, fields: { id: created.id, Company: created.fields.Company } },
      ]);
      expect((await service.list("Leads", { ...query, fields: [] })).records).toEqual([
        { id: created.id, fields: { id: created.id } },
      ]);
      expect((await service.list("Leads", query)).records).toEqual([created]);
      await validation(service.list("Leads", { ...query, fields: ["Unknown_Field"] }), "fields");
      const fields = projected.records[0]?.fields as Record<string, FieldValue>;
      fields.Company = "Changed";
      expect(await service.get("Leads", created.id)).toEqual(created);
    });
    // The HTTP harness performs hundreds of JSON write/read round trips per size.
    for (const perPage of [10, 20, 30, 40, 50, 100]) {
      it(`paginates at ${perPage}, with consistent counts and no duplicate or missing records`, async () => {
        const query = {
          viewId: defaultView.id,
          page: 1,
          perPage,
          filters: {
            field: "Company",
            comparator: "equal" as const,
            value: `Page-${randomUUID()}`,
          },
        };
        for (let index = 0; index < 211; index++) {
          await service.create("Leads", forView(defaultView, { Company: query.filters.value }));
        }
        const count = await service.count("Leads", query);
        expect(count).toBe(211);
        const ids: string[] = [];
        for (let page = 1; page <= Math.ceil(count / perPage); page++) {
          const result = await service.list("Leads", { ...query, page });
          expect(result.page).toBe(page);
          expect(result.perPage).toBe(perPage);
          expect(result.records).toHaveLength(Math.min(perPage, count - (page - 1) * perPage));
          expect(result.moreRecords).toBe(page * perPage < count);
          expect(result.sort).toEqual({ field: "id", order: "desc" });
          expect(result).not.toHaveProperty("count");
          expect(result).not.toHaveProperty("total");
          expect(await service.list("Leads", { ...query, page })).toEqual(result);
          ids.push(...result.records.map((record) => record.id));
        }
        expect(ids.length).toBe(count);
        expect(new Set(ids).size).toBe(count);
        expect(
          await service.list("Leads", { ...query, page: Math.ceil(count / perPage) + 1 }),
        ).toMatchObject({
          records: [],
          moreRecords: false,
          sort: { field: "id", order: "desc" },
        });
      }, 15_000);
    }
    it("finds created records by case-insensitive Company search and counts an empty result", async () => {
      const marker = `Search-${randomUUID()}`;
      const record = await service.create("Leads", forView(defaultView, { Company: marker }));
      const query = { viewId: defaultView.id, search: marker.toUpperCase(), page: 1, perPage: 10 };
      expect((await service.list("Leads", query)).records.map((row) => row.id)).toContain(
        record.id,
      );
      expect(await service.count("Leads", query)).toBe(1);
      const absent = { ...query, search: `absent-${randomUUID()}` };
      expect((await service.list("Leads", absent)).records).toEqual([]);
      expect(await service.count("Leads", absent)).toBe(0);
    });
    for (const field of ["Company", "No_of_Employees"] as const)
      for (const order of ["asc", "desc"] as const) {
        it(`sorts own nonempty ${field} values ${order}`, async () => {
          const marker = `Sort-${randomUUID()}`;
          const records: RecordData[] = [];
          for (const [text, number] of [
            ["C", 30],
            ["A", 2],
            ["B", 10],
          ] as const)
            records.push(
              await service.create(
                "Leads",
                forView(defaultView, {
                  Company: `${marker}-${text}`,
                  Email: `${marker}@example.org`,
                  No_of_Employees: number,
                }),
              ),
            );
          const query = {
            viewId: defaultView.id,
            filters: {
              field: "Email",
              comparator: "equal" as const,
              value: `${marker}@example.org`,
            },
            page: 1,
            perPage: 10,
            sort: { field, order },
          };
          const expected = [records[1]?.id, records[2]?.id, records[0]?.id];
          expect((await service.list("Leads", query)).records.map((record) => record.id)).toEqual(
            order === "asc" ? expected : expected.reverse(),
          );
        });
      }
    it("applies a discovered view's criteria and combines extra filters with and", async () => {
      const view = views.find(
        (candidate) => candidate.criteria && mentionsCategory(candidate.criteria, "Junk"),
      );
      expect(view).toBeDefined();
      if (!view?.criteria) throw new Error("A category view is required.");
      const marker = `Criteria-${randomUUID()}`;
      const included = await service.create(
        "Leads",
        input({ Lead_Status: "Junk Lead", Company: marker }),
      );
      await service.create(
        "Leads",
        input({ Lead_Status: "Junk Lead", Company: `${marker}-other` }),
      );
      const excluded = await service.create(
        "Leads",
        input({ Lead_Status: "Not Qualified", Company: marker }),
      );
      const query = {
        viewId: view.id,
        page: 1,
        perPage: 100,
        search: marker,
        filters: { field: "Company", comparator: "equal" as const, value: marker },
      };
      const result = await service.list("Leads", query);
      expect(result.records.map((record) => record.id)).toEqual([included.id]);
      expect(result.records.map((record) => record.id)).not.toContain(excluded.id);
      expect(await service.count("Leads", query)).toBe(1);
    });
    it("returns NotFoundError for every unknown module entry point", async () => {
      for (const request of [
        service.getModule("Unknown"),
        service.listViews("Unknown"),
        service.getView("Unknown", defaultView.id),
        service.list("Unknown", { viewId: defaultView.id, page: 1, perPage: 10 }),
        service.count("Unknown", { viewId: defaultView.id }),
        service.get("Unknown", "missing"),
        service.create("Unknown", input()),
        service.update("Unknown", "missing", {}),
        service.delete("Unknown", []),
        service.massUpdate("Unknown", ["missing"], { Company: "Example" }),
        service.changeOwner("Unknown", ["missing"], ctx.userId),
      ])
        await expect(request).rejects.toBeInstanceOf(NotFoundError);
    });
    it("returns NotFoundError for unknown views and records", async () => {
      await expect(service.getView("Leads", "missing")).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        service.list("Leads", { viewId: "missing", page: 1, perPage: 10 }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.count("Leads", { viewId: "missing" })).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(service.get("Leads", "missing")).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.update("Leads", "missing", {})).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.delete("Leads", ["missing"])).rejects.toBeInstanceOf(NotFoundError);
    });
    it("validates required, length, picklist membership and field types with field keys", async () => {
      for (const field of metadata.fields.filter((field) => field.required))
        await validation(service.create("Leads", input({ [field.apiName]: null })), field.apiName);
      const company = metadata.fields.find((field) => field.apiName === "Company");
      await validation(
        service.create("Leads", input({ Company: "x".repeat((company?.maxLength ?? 0) + 1) })),
        "Company",
      );
      for (const field of metadata.fields.filter((field) => field.picklist && !field.readOnly))
        await validation(
          service.create("Leads", input({ [field.apiName]: "not-a-listed-option" })),
          field.apiName,
        );
      for (const [field, value] of [
        ["Company", 3],
        ["No_of_Employees", 1.5],
        ["Annual_Revenue", "3"],
        ["Email_Opt_Out", "false"],
        ["Connected_To__s", 3],
      ] as const)
        await validation(service.create("Leads", input({ [field]: value })), field);
    });
    it("accepts duplicate Email on creation and partial update", async () => {
      const email = `${randomUUID()}@example.org`;
      const first = await service.create("Leads", input({ Email: email }));
      const second = await service.create("Leads", input({ Email: email }));
      const third = await service.create("Leads", input());
      expect(first.id).not.toBe(second.id);
      expect((await service.update("Leads", third.id, { Email: email })).fields.Email).toBe(email);
    });
    it("uses context for system fields, preserves omitted fields, and shares state within an org", async () => {
      const created = await service.create("Leads", input({ Email: "contract@example.org" }));
      expect(created.fields).toMatchObject({
        Owner: ctx.userId,
        Created_By: ctx.userId,
        Modified_By: ctx.userId,
      });
      expect(Number.isFinite(Date.parse(String(created.fields.Created_Time)))).toBe(true);
      const nextUser = await makeService({ ...ctx, userId: "second-user" });
      const updated = await nextUser.update("Leads", created.id, { Company: "Updated Company" });
      expect(updated.fields).toMatchObject({
        Company: "Updated Company",
        Email: "contract@example.org",
        Owner: ctx.userId,
        Created_By: ctx.userId,
        Modified_By: "second-user",
        Created_Time: created.fields.Created_Time,
      });
      expect(Date.parse(String(updated.fields.Modified_Time))).toBeGreaterThanOrEqual(
        Date.parse(String(created.fields.Modified_Time)),
      );
      expect(await service.get("Leads", created.id)).toEqual(updated);
      await validation(service.update("Leads", created.id, { Company: null }), "Company");
      expect(await service.get("Leads", created.id)).toEqual(updated);
    });
    it("creates and updates Owner using organization members, with a context default", async () => {
      const secondMember = await makeService({ ...ctx, userId: "second-member" });
      await secondMember.getModule("Leads");
      const created = await service.create("Leads", input({ Owner: "second-member" }));
      expect(created.fields.Owner).toBe("second-member");
      expect(created.fields.Created_By).toBe(ctx.userId);
      const updated = await service.update("Leads", created.id, { Owner: ctx.userId });
      expect(updated.fields.Owner).toBe(ctx.userId);
      expect(updated.fields.Created_By).toBe(ctx.userId);
      expect(updated.fields.Modified_By).toBe(ctx.userId);
      expect((await service.create("Leads", input())).fields.Owner).toBe(ctx.userId);
      const foreign = await makeService({ ...context(), userId: "foreign-member" });
      // A known user in another organization must not qualify for this one.
      await foreign.create("Leads", input({ Owner: "foreign-member" }));
      await validation(service.create("Leads", input({ Owner: "foreign-member" })), "Owner");
      await validation(service.update("Leads", created.id, { Owner: "foreign-member" }), "Owner");
      for (const Owner of [null, "", 3, { module: "Contacts", id: "second-member" }]) {
        await validation(service.create("Leads", input({ Owner })), "Owner");
        await validation(service.update("Leads", created.id, { Owner }), "Owner");
      }
      expect(await service.get("Leads", created.id)).toEqual(updated);
      for (const name of ["Created_By", "Modified_By"])
        await validation(service.update("Leads", created.id, { [name]: ctx.userId }), name);
    });
    it("mass updates one eligible field and applies ordinary update validation", async () => {
      const first = await service.create("Leads", input());
      const second = await service.create("Leads", input());
      const ids = [second.id, first.id];
      await service.massUpdate("Leads", ids, { Company: "Mass Updated" });
      for (const id of ids)
        expect((await service.get("Leads", id)).fields.Company).toBe("Mass Updated");
      await validation(service.massUpdate("Leads", ids, {}), "data");
      await validation(
        service.massUpdate("Leads", ids, { Company: "Example", Phone: "123" }),
        "data",
      );
      for (const field of metadata.fields.filter((field) => !field.massUpdate))
        await validation(
          service.massUpdate("Leads", ids, { [field.apiName]: null }),
          field.apiName,
        );
      await validation(
        service.massUpdate("Leads", ids, { Unknown_Field: "Example" }),
        "Unknown_Field",
      );
      for (const value of [null, "", " ", 42, "x".repeat(201)])
        await validation(service.massUpdate("Leads", ids, { Company: value }), "Company");
      await validation(
        service.massUpdate("Leads", ids, { Lead_Status: "Unknown Option" }),
        "Lead_Status",
      );
      await validation(
        service.massUpdate("Leads", ids, { No_of_Employees: 1.5 }),
        "No_of_Employees",
      );
      await service.massUpdate("Leads", ids, { Phone: "" });
      for (const id of ids) expect((await service.get("Leads", id)).fields.Phone).toBeNull();
      expect((await service.get("Leads", first.id)).fields.Company).toBe("Mass Updated");
    });

    it("changes ownership only to an active organization member", async () => {
      await makeService({ ...ctx, userId: "batch-owner" });
      const first = await service.create("Leads", input());
      const second = await service.create("Leads", input());
      await service.changeOwner("Leads", [first.id, second.id], "batch-owner");
      for (const id of [first.id, second.id]) {
        const record = await service.get("Leads", id);
        expect(record.fields.Owner).toBe("batch-owner");
        expect(record.fields.Modified_By).toBe(ctx.userId);
        expect(record.fields.Created_By).toBe(ctx.userId);
      }
      for (const owner of ["unknown-user", ""])
        await validation(service.changeOwner("Leads", [first.id, second.id], owner), "Owner");
      expect((await service.get("Leads", first.id)).fields.Owner).toBe("batch-owner");
    });

    it("validates all batch targets before changing any record", async () => {
      const first = await service.create("Leads", input());
      const foreign = await makeService(context());
      await foreign.create("Leads", input());
      const foreignRecord = await foreign.create("Leads", input());
      for (const missing of ["missing", foreignRecord.id]) {
        const ids = [first.id, missing];
        for (const run of [
          () => service.massUpdate("Leads", ids, { Company: "Must Not Persist" }),
          () => service.changeOwner("Leads", ids, ctx.userId),
          () => service.delete("Leads", ids),
        ]) {
          await expect(run()).rejects.toBeInstanceOf(NotFoundError);
          expect(await service.get("Leads", first.id)).toEqual(first);
        }
      }
      expect(await foreign.get("Leads", foreignRecord.id)).toEqual(foreignRecord);
    });

    it("enforces 1–500 IDs for every batch operation, including deletion", async () => {
      const record = await service.create("Leads", input());
      for (const ids of [[], Array.from({ length: 501 }, () => record.id)]) {
        await validation(service.massUpdate("Leads", ids, { Company: "Rejected" }), "ids");
        await validation(service.changeOwner("Leads", ids, ctx.userId), "ids");
        await validation(service.delete("Leads", ids), "ids");
        expect(await service.get("Leads", record.id)).toEqual(record);
      }
      const records = await Promise.all(
        Array.from({ length: 500 }, () => service.create("Leads", input())),
      );
      const ids = records.map((row) => row.id);
      await service.massUpdate("Leads", ids, { Company: "Boundary" });
      await service.changeOwner("Leads", ids, ctx.userId);
      expect((await service.get("Leads", ids[499] as string)).fields.Company).toBe("Boundary");
      await service.delete("Leads", ids);
      await expect(service.get("Leads", ids[0] as string)).rejects.toBeInstanceOf(NotFoundError);
    }, 15_000);

    it("deletes records and updates count", async () => {
      const created = await service.create("Leads", forView(defaultView));
      const before = await service.count("Leads", { viewId: defaultView.id });
      await service.delete("Leads", [created.id]);
      await expect(service.get("Leads", created.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(await service.count("Leads", { viewId: defaultView.id })).toBe(before - 1);
    });
    it("isolates two organizations across queries and mutations", async () => {
      const other = await makeService(context());
      const marker = `Tenant-${randomUUID()}`;
      const query = { viewId: defaultView.id, search: marker, page: 1, perPage: 10 };
      const created = await service.create("Leads", forView(defaultView, { Company: marker }));
      expect(await other.count("Leads", query)).toBe(0);
      expect((await other.list("Leads", query)).records).toEqual([]);
      await expect(other.get("Leads", created.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        other.update("Leads", created.id, { Company: "Other Company" }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(other.delete("Leads", [created.id])).rejects.toBeInstanceOf(NotFoundError);
      expect(await service.get("Leads", created.id)).toEqual(created);
    });
    it("detaches metadata, views, records, nested values and mutation inputs", async () => {
      const reference = { module: "Contacts", id: "synthetic-contact" };
      const created = await service.create("Leads", input({ Connected_To__s: reference }));
      reference.id = "changed-input";
      (created.fields as Record<string, FieldValue>).Company = "changed-return";
      (created.fields.Connected_To__s as { id: string }).id = "changed-reference";
      const reread = await service.get("Leads", created.id);
      expect(reread.fields.Company).toBe("Contract Company");
      expect(reread.fields.Connected_To__s).toEqual({
        module: "Contacts",
        id: "synthetic-contact",
      });
      (reread.fields as Record<string, FieldValue>).Company = "changed-get";
      const page = await service.list("Leads", { viewId: defaultView.id, page: 1, perPage: 10 });
      const row = page.records[0];
      if (!row) throw new Error("Expected records.");
      const original = await service.get("Leads", row.id);
      (row.fields as Record<string, FieldValue>).Company = "changed-list";
      expect(await service.get("Leads", row.id)).toEqual(original);
      const definition = metadata.fields[0];
      if (!definition) throw new Error("Expected fields.");
      const originalModule = await service.getModule("Leads");
      definition.views.view = !definition.views.view;
      const column = metadata.layout[0]?.columns[0];
      if (!column) throw new Error("Expected a layout column.");
      (column as string[]).push("changed-placement");
      (metadata.businessCardFields as string[]).push("changed-card");
      expect(await service.getModule("Leads")).toEqual(originalModule);
      definition.label = "changed-metadata";
      (defaultView.columns as string[]).push("changed-columns");
      expect((await service.getModule("Leads")).fields[0]?.label).not.toBe("changed-metadata");
      expect((await service.getView("Leads", defaultView.id)).columns).not.toContain(
        "changed-columns",
      );
      const source = views.find((view) => view.criteria);
      if (!source) throw new Error("Expected a criteria-bearing view.");
      const originalView = await service.getView("Leads", source.id);
      const detachedView = await service.getView("Leads", source.id);
      if (detachedView.criteria && "field" in detachedView.criteria)
        detachedView.criteria.value = "changed-criteria";
      expect(await service.getView("Leads", source.id)).toEqual(originalView);
      const picklist = metadata.fields.find((field) => field.picklist)?.picklist;
      const option = picklist?.[0];
      if (!option) throw new Error("Expected picklist options.");
      option.storedValue = "changed-picklist";
      expect(
        (await service.getModule("Leads")).fields
          .flatMap((field) => field.picklist ?? [])
          .map((option) => option.storedValue),
      ).not.toContain("changed-picklist");
      const updateInput = { Connected_To__s: { module: "Contacts", id: "updated-contact" } };
      const updated = await service.update("Leads", created.id, updateInput);
      updateInput.Connected_To__s.id = "changed-update-input";
      (updated.fields as Record<string, FieldValue>).Company = "changed-update-return";
      expect((await service.get("Leads", created.id)).fields).toMatchObject({
        Company: "Contract Company",
        Connected_To__s: { module: "Contacts", id: "updated-contact" },
      });
    });
    it("orders an unsorted list by id descending and echoes an explicit sort", async () => {
      const created = await service.create("Leads", forView(defaultView));
      const page = await service.list("Leads", { viewId: defaultView.id, page: 1, perPage: 10 });
      expect(page.sort).toEqual({ field: "id", order: "desc" });
      expect(page.records[0]?.id).toBe(created.id);
      const sorted = await service.list("Leads", {
        viewId: defaultView.id,
        page: 1,
        perPage: 10,
        sort: { field: "Company", order: "asc" },
      });
      expect(sorted.sort).toEqual({ field: "Company", order: "asc" });
    });
    const panelCases: {
      label: string;
      field: string;
      comparator: Comparator;
      value: CriteriaValue;
      indexes: number[];
    }[] = [];
    for (const field of ["First_Name", "Email", "Phone", "Website", "Description"]) {
      for (const [label, comparator, value, indexes] of [
        ["is", "equal", "ALPHABETA", [0]],
        ["isn't", "not_equal", "ALPHABETA", [1, 2, 3]],
        ["contains", "contains", "PHAB", [0]],
        ["doesn't contain", "not_contains", "PHAB", [1, 2, 3]],
        ["starts with", "starts_with", "ALPHA", [0]],
        ["ends with", "ends_with", "BETA", [0]],
      ] as const)
        panelCases.push({
          label: `${field} ${label}`,
          field,
          comparator,
          value,
          indexes: [...indexes],
        });
    }
    for (const field of ["Annual_Revenue", "No_of_Employees", "Latitude"]) {
      for (const [label, comparator, value, indexes] of [
        ["=", "equal", 20, [1]],
        ["!=", "not_equal", 20, [0, 2, 3]],
        ["<", "less_than", 20, [0]],
        ["<=", "less_equal", 20, [0, 1]],
        [">", "greater_than", 20, [3]],
        [">=", "greater_equal", 20, [1, 3]],
        ["between", "between", [10, 20], [0, 1]],
        ["not between", "not_between", [10, 20], [3]],
      ] as const)
        panelCases.push({
          label: `${field} ${label}`,
          field,
          comparator,
          value,
          indexes: [...indexes],
        });
    }
    panelCases.push(
      {
        label: "picklist is",
        field: "Lead_Status",
        comparator: "equal",
        value: ["Contacted", "Not Qualified"],
        indexes: [0, 3],
      },
      {
        label: "picklist is not",
        field: "Lead_Status",
        comparator: "not_equal",
        value: ["Contacted", "Not Qualified"],
        indexes: [1, 2],
      },
      {
        label: "boolean is true",
        field: "Email_Opt_Out",
        comparator: "equal",
        value: true,
        indexes: [0, 3],
      },
      {
        label: "boolean is false",
        field: "Email_Opt_Out",
        comparator: "equal",
        value: false,
        indexes: [1],
      },
      {
        label: "owner is",
        field: "Owner",
        comparator: "equal",
        value: ["contract-user"],
        indexes: [0, 2, 3],
      },
      {
        label: "owner is not",
        field: "Owner",
        comparator: "not_equal",
        value: ["contract-user"],
        indexes: [1],
      },
    );
    for (const field of ["First_Name", "Lead_Status", "Annual_Revenue", "Email_Opt_Out"])
      for (const comparator of ["is_empty", "is_not_empty"] as const)
        panelCases.push({
          label: `${field} ${comparator}`,
          field,
          comparator,
          value: null,
          indexes: comparator === "is_empty" ? [2] : [0, 1, 3],
        });

    const assertPanelSet = async (
      adapter: RecordService,
      marker: string,
      filters: Criteria,
      expected: string[],
    ) => {
      const query = {
        viewId: defaultView.id,
        page: 1,
        perPage: 100,
        filters: {
          groupOperator: "and" as const,
          group: [
            { field: "Company", comparator: "equal" as const, value: marker },
            {
              groupOperator: "and" as const,
              group: [
                filters,
                { field: "Company", comparator: "is_not_empty" as const, value: null },
              ],
            },
          ],
        },
      };
      const result = await adapter.list("Leads", query);
      expect(result.records.map((record) => record.id).sort()).toEqual([...expected].sort());
      expect(await adapter.count("Leads", query)).toBe(expected.length);
    };
    it.each(panelCases)(
      "panel $label: exact set and count with nested and",
      async ({ field, comparator, value, indexes }) => {
        const marker = `Panel-${randomUUID()}`;
        const other = await makeService({ ...ctx, userId: "panel-other" });
        const records: RecordData[] = [];
        for (const index of [0, 1, 2, 3]) {
          const adapter = index === 1 ? other : service;
          records.push(
            await adapter.create(
              "Leads",
              input({
                Company: marker,
                First_Name: ["AlphaBeta", "Gamma", null, "Delta"][index] ?? null,
                Email: ["AlphaBeta", "Gamma", null, "Delta"][index] ?? null,
                Phone: ["AlphaBeta", "Gamma", null, "Delta"][index] ?? null,
                Website: ["AlphaBeta", "Gamma", null, "Delta"][index] ?? null,
                Description: ["AlphaBeta", "Gamma", null, "Delta"][index] ?? null,
                Annual_Revenue: [10, 20, null, 30][index] ?? null,
                No_of_Employees: [10, 20, null, 30][index] ?? null,
                Latitude: [10, 20, null, 30][index] ?? null,
                Email_Opt_Out: [true, false, null, true][index] ?? null,
                Lead_Status: ["Contacted", "Junk Lead", null, "Contacted"][index] ?? null,
              }),
            ),
          );
        }
        await assertPanelSet(
          service,
          marker,
          { field, comparator, value },
          indexes.map((index) => records[index]?.id as string),
        );
      },
    );

    const calendarCases: { name: string; token: CriteriaToken; start: string; end: string }[] = [
      {
        name: "Today",
        token: { token: "TODAY" },
        start: "2026-01-05T00:00:00.000Z",
        end: "2026-01-06T00:00:00.000Z",
      },
      {
        name: "Tomorrow",
        token: { token: "PERIOD", name: "TOMORROW" },
        start: "2026-01-06T00:00:00.000Z",
        end: "2026-01-07T00:00:00.000Z",
      },
      {
        name: "Yesterday",
        token: { token: "PERIOD", name: "YESTERDAY" },
        start: "2026-01-04T00:00:00.000Z",
        end: "2026-01-05T00:00:00.000Z",
      },
      {
        name: "This Week",
        token: { token: "PERIOD", name: "THIS_WEEK" },
        start: "2026-01-05T00:00:00.000Z",
        end: "2026-01-12T00:00:00.000Z",
      },
      {
        name: "Previous Week",
        token: { token: "PERIOD", name: "PREVIOUS_WEEK" },
        start: "2025-12-29T00:00:00.000Z",
        end: "2026-01-05T00:00:00.000Z",
      },
      {
        name: "This Month",
        token: { token: "PERIOD", name: "THIS_MONTH" },
        start: "2026-01-01T00:00:00.000Z",
        end: "2026-02-01T00:00:00.000Z",
      },
      {
        name: "Previous Month",
        token: { token: "PERIOD", name: "PREVIOUS_MONTH" },
        start: "2025-12-01T00:00:00.000Z",
        end: "2026-01-01T00:00:00.000Z",
      },
      {
        name: "This Year",
        token: { token: "PERIOD", name: "THIS_YEAR" },
        start: "2026-01-01T00:00:00.000Z",
        end: "2027-01-01T00:00:00.000Z",
      },
      {
        name: "Previous Year",
        token: { token: "PERIOD", name: "PREVIOUS_YEAR" },
        start: "2025-01-01T00:00:00.000Z",
        end: "2026-01-01T00:00:00.000Z",
      },
      {
        name: "Next Year",
        token: { token: "PERIOD", name: "NEXT_YEAR" },
        start: "2027-01-01T00:00:00.000Z",
        end: "2028-01-01T00:00:00.000Z",
      },
    ];
    it.each(calendarCases)(
      "panel $name: UTC boundaries and count",
      async ({ token, start, end }) => {
        let now = new Date(start);
        const adapter = await makeService(ctx, { now: () => now });
        const marker = `Calendar-${randomUUID()}`;
        const records: RecordData[] = [];
        for (const timestamp of [
          Date.parse(start) - 1,
          Date.parse(start),
          Date.parse(end) - 1,
          Date.parse(end),
        ]) {
          now = new Date(timestamp);
          records.push(await adapter.create("Leads", input({ Company: marker })));
        }
        now = new Date("2026-01-05T12:00:00.000Z");
        await assertPanelSet(
          adapter,
          marker,
          { field: "Created_Time", comparator: "equal", value: token },
          [records[1]?.id as string, records[2]?.id as string],
        );
        await assertPanelSet(
          adapter,
          marker,
          { field: "Last_Activity_Time", comparator: "equal", value: token },
          [],
        );
      },
    );
    it("panel Till Yesterday / Starting tomorrow: UTC midnight and open ends", async () => {
      let now = new Date("2026-01-05T00:00:00.000Z");
      const adapter = await makeService(ctx, { now: () => now });
      const marker = `Open-period-${randomUUID()}`;
      const records: RecordData[] = [];
      for (const timestamp of [
        "2025-01-01T00:00:00.000Z",
        "2026-01-04T23:59:59.999Z",
        "2026-01-05T00:00:00.000Z",
        "2026-01-05T23:59:59.999Z",
        "2026-01-06T00:00:00.000Z",
        "2027-01-01T00:00:00.000Z",
      ]) {
        now = new Date(timestamp);
        records.push(await adapter.create("Leads", input({ Company: marker })));
      }
      now = new Date("2026-01-05T12:00:00.000Z");
      for (const [name, indexes] of [
        ["TILL_YESTERDAY", [0, 1]],
        ["STARTING_TOMORROW", [4, 5]],
      ] as const)
        await assertPanelSet(
          adapter,
          marker,
          { field: "Created_Time", comparator: "equal", value: { token: "PERIOD", name } },
          indexes.map((index) => records[index]?.id as string),
        );
    });
    it("panel age in / due in: whole days, inclusive upper limit and zero", async () => {
      const base = Date.parse("2026-01-05T12:00:00.000Z");
      let now = new Date(base);
      const adapter = await makeService(ctx, { now: () => now });
      const marker = `Day-offset-${randomUUID()}`;
      const records: RecordData[] = [];
      for (const offset of [
        -2 * 86_400_000,
        -2 * 86_400_000 + 1,
        0,
        1,
        86_400_000,
        86_400_000 + 1,
      ]) {
        now = new Date(base + offset);
        records.push(await adapter.create("Leads", input({ Company: marker })));
      }
      now = new Date(base);
      for (const [token, offset, indexes] of [
        ["AGEINDAYS", 1, [1, 2, 3, 4, 5]],
        ["DUEINDAYS", 1, [3, 4]],
        ["DUEINDAYS", 0, []],
        ["AGEINDAYS", 0, [2, 3, 4, 5]],
      ] as const)
        await assertPanelSet(
          adapter,
          marker,
          { field: "Created_Time", comparator: "less_equal", value: { token, offset } },
          indexes.map((index) => records[index]?.id as string),
        );
      for (const token of ["AGEINDAYS", "DUEINDAYS"] as const)
        await assertPanelSet(
          adapter,
          marker,
          { field: "Last_Activity_Time", comparator: "less_equal", value: { token, offset: 1 } },
          [],
        );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Last_Activity_Time", comparator: "is_empty", value: null },
        records.map((record) => record.id),
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Created_Time", comparator: "is_not_empty", value: null },
        records.map((record) => record.id),
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Owner", comparator: "is_empty", value: null },
        [],
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Owner", comparator: "is_not_empty", value: null },
        records.map((record) => record.id),
      );
    });
    it("panel datetime extended filters: units, relative, calendar dates and count parity", async () => {
      const queryAt = new Date("2026-01-05T12:00:00.000Z");
      let now = queryAt;
      const adapter = await makeService(ctx, { now: () => now });
      const marker = `Datetime-ext-${randomUUID()}`;
      const stamps = [
        "2025-12-29T00:00:00.000Z",
        "2025-12-30T23:59:59.999Z",
        "2026-01-04T00:00:00.000Z",
        "2026-01-04T23:59:59.999Z",
        "2026-01-05T00:00:00.000Z",
        "2026-01-05T23:59:59.999Z",
        "2026-01-06T00:00:00.000Z",
        "2026-01-12T00:00:00.000Z",
        "2026-02-01T00:00:00.000Z",
        "2026-03-01T00:00:00.000Z",
        "2024-02-29T00:00:00.000Z",
        "2024-03-01T00:00:00.000Z",
      ];
      const records: RecordData[] = [];
      for (const timestamp of stamps) {
        now = new Date(timestamp);
        records.push(await adapter.create("Leads", input({ Company: marker })));
      }
      now = queryAt;
      const withCount = async (filters: Criteria, expected: string[]) => {
        await assertPanelSet(adapter, marker, filters, expected);
        const wrapped = {
          groupOperator: "and" as const,
          group: [{ field: "Company", comparator: "equal" as const, value: marker }, filters],
        };
        expect(await adapter.count("Leads", { viewId: defaultView.id, filters: wrapped })).toBe(
          expected.length,
        );
      };
      for (const [relative, period] of [
        [
          {
            token: "RELATIVE" as const,
            direction: "previous" as const,
            count: 1,
            unit: "days" as const,
          },
          { token: "PERIOD" as const, name: "YESTERDAY" as const },
        ],
        [
          {
            token: "RELATIVE" as const,
            direction: "previous" as const,
            count: 1,
            unit: "weeks" as const,
          },
          { token: "PERIOD" as const, name: "PREVIOUS_WEEK" as const },
        ],
        [
          {
            token: "RELATIVE" as const,
            direction: "next" as const,
            count: 1,
            unit: "days" as const,
          },
          { token: "PERIOD" as const, name: "TOMORROW" as const },
        ],
      ] as const) {
        const relativeIds = (
          await adapter.list("Leads", {
            viewId: defaultView.id,
            page: 1,
            perPage: 100,
            filters: {
              groupOperator: "and",
              group: [
                { field: "Company", comparator: "equal", value: marker },
                { field: "Created_Time", comparator: "equal", value: relative },
              ],
            },
          })
        ).records.map((record) => record.id);
        const periodIds = (
          await adapter.list("Leads", {
            viewId: defaultView.id,
            page: 1,
            perPage: 100,
            filters: {
              groupOperator: "and",
              group: [
                { field: "Company", comparator: "equal", value: marker },
                { field: "Created_Time", comparator: "equal", value: period },
              ],
            },
          })
        ).records.map((record) => record.id);
        expect(relativeIds.sort()).toEqual(periodIds.sort());
      }
      await withCount({ field: "Created_Time", comparator: "equal", value: "2026-01-05" }, [
        records[4]?.id as string,
        records[5]?.id as string,
      ]);
      await withCount(
        { field: "Created_Time", comparator: "less_than", value: "2026-01-05" },
        stamps
          .map((stamp, index) =>
            Date.parse(stamp) < Date.parse("2026-01-05T00:00:00.000Z") ? index : -1,
          )
          .filter((index) => index >= 0)
          .map((index) => records[index]?.id as string),
      );
      await withCount({ field: "Created_Time", comparator: "greater_than", value: "2026-01-05" }, [
        records[6]?.id as string,
        records[7]?.id as string,
        records[8]?.id as string,
        records[9]?.id as string,
      ]);
      await withCount(
        { field: "Created_Time", comparator: "between", value: ["2026-01-04", "2026-01-05"] },
        [
          records[2]?.id as string,
          records[3]?.id as string,
          records[4]?.id as string,
          records[5]?.id as string,
        ],
      );
      await withCount(
        { field: "Created_Time", comparator: "not_between", value: ["2026-01-04", "2026-01-05"] },
        [
          records[0]?.id as string,
          records[1]?.id as string,
          records[6]?.id as string,
          records[7]?.id as string,
          records[8]?.id as string,
          records[9]?.id as string,
          records[10]?.id as string,
          records[11]?.id as string,
        ],
      );
      await withCount({ field: "Created_Time", comparator: "equal", value: "2024-02-29" }, [
        records[10]?.id as string,
      ]);
      await withCount(
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 2, unit: "days" },
        },
        [
          records[2]?.id as string,
          records[3]?.id as string,
          records[4]?.id as string,
          records[5]?.id as string,
          records[6]?.id as string,
          records[7]?.id as string,
          records[8]?.id as string,
          records[9]?.id as string,
        ],
      );
      await withCount(
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "DUEINDAYS", offset: 1, unit: "weeks" },
        },
        [records[5]?.id as string, records[6]?.id as string, records[7]?.id as string],
      );
      now = new Date("2026-03-31T12:00:00.000Z");
      const monthMarker = `Datetime-month-${randomUUID()}`;
      const monthRecords: RecordData[] = [];
      for (const timestamp of [
        "2025-12-31T12:00:00.000Z",
        "2026-03-30T12:00:00.000Z",
        "2026-02-01T12:00:00.000Z",
      ]) {
        now = new Date(timestamp);
        monthRecords.push(await adapter.create("Leads", input({ Company: monthMarker })));
      }
      now = new Date("2026-03-31T12:00:00.000Z");
      await assertPanelSet(
        adapter,
        monthMarker,
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "months" },
        },
        [monthRecords[1]?.id as string],
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Connected_To__s", comparator: "is_empty", value: null },
        records.map((record) => record.id),
      );
      await validation(
        service.list("Leads", {
          viewId: defaultView.id,
          page: 1,
          perPage: 10,
          filters: { field: "Connected_To__s", comparator: "equal", value: "x" },
        }),
        "filters",
      );
    });
    it("panel age in N weeks: same window as N×7 days", async () => {
      const queryAt = new Date("2026-01-05T12:00:00.000Z");
      let now = queryAt;
      const adapter = await makeService(ctx, { now: () => now });
      const marker = `Age-weeks-${randomUUID()}`;
      const stamps = ["2025-12-28T12:00:00.000Z", "2025-12-28T12:00:00.001Z"];
      const records: RecordData[] = [];
      for (const timestamp of stamps) {
        now = new Date(timestamp);
        records.push(await adapter.create("Leads", input({ Company: marker })));
      }
      now = queryAt;
      const expectedIds = [records[1]?.id as string];
      await assertPanelSet(
        adapter,
        marker,
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "weeks" },
        },
        expectedIds,
      );
      await assertPanelSet(
        adapter,
        marker,
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 7 },
        },
        expectedIds,
      );
      const wrapped = {
        groupOperator: "and" as const,
        group: [
          { field: "Company", comparator: "equal" as const, value: marker },
          {
            field: "Created_Time",
            comparator: "less_equal" as const,
            value: { token: "AGEINDAYS" as const, offset: 1, unit: "weeks" as const },
          },
        ],
      };
      expect(await adapter.count("Leads", { viewId: defaultView.id, filters: wrapped })).toBe(1);
    });
    it("panel age in N months: month-end clip on lower bound", async () => {
      const queryAt = new Date("2026-03-31T12:00:00.000Z");
      let now = queryAt;
      const adapter = await makeService(ctx, { now: () => now });
      const marker = `Age-month-end-${randomUUID()}`;
      const stamps = ["2026-02-28T11:59:59.999Z", "2026-02-28T12:00:00.000Z"];
      const records: RecordData[] = [];
      for (const timestamp of stamps) {
        now = new Date(timestamp);
        records.push(await adapter.create("Leads", input({ Company: marker })));
      }
      now = queryAt;
      await assertPanelSet(
        adapter,
        marker,
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "months" },
        },
        [records[1]?.id as string],
      );
    });
    it("panel due in N months: open upper bound and zero offset", async () => {
      const queryAt = new Date("2026-01-31T12:00:00.000Z");
      let now = queryAt;
      const adapter = await makeService(ctx, { now: () => now });
      const marker = `Due-months-${randomUUID()}`;
      const stamps = [
        "2026-01-31T12:00:00.000Z",
        "2026-02-28T12:00:00.000Z",
        "2026-02-28T12:00:00.001Z",
      ];
      const records: RecordData[] = [];
      for (const timestamp of stamps) {
        now = new Date(timestamp);
        records.push(await adapter.create("Leads", input({ Company: marker })));
      }
      now = queryAt;
      await assertPanelSet(
        adapter,
        marker,
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "DUEINDAYS", offset: 1, unit: "months" },
        },
        [records[1]?.id as string],
      );
      await assertPanelSet(
        adapter,
        marker,
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "DUEINDAYS", offset: 0, unit: "months" },
        },
        [],
      );
    });
    it("panel Previous / Next: N>1, month unit, leap year and range ends", async () => {
      const runRelative = async (
        queryAt: Date,
        relative: CriteriaToken & { token: "RELATIVE" },
        boundaryStamps: { inside: string[]; outside: string[] },
      ) => {
        let now = queryAt;
        const adapter = await makeService(ctx, { now: () => now });
        const marker = `Relative-${randomUUID()}`;
        const byStamp = new Map<string, string>();
        for (const timestamp of [...boundaryStamps.inside, ...boundaryStamps.outside]) {
          now = new Date(timestamp);
          const record = await adapter.create("Leads", input({ Company: marker }));
          byStamp.set(timestamp, record.id);
        }
        now = queryAt;
        const expectedInside = boundaryStamps.inside.map((stamp) => byStamp.get(stamp) as string);
        await assertPanelSet(
          adapter,
          marker,
          { field: "Created_Time", comparator: "equal", value: relative },
          expectedInside,
        );
        const wrapped = {
          groupOperator: "and" as const,
          group: [
            { field: "Company", comparator: "equal" as const, value: marker },
            { field: "Created_Time", comparator: "equal" as const, value: relative },
          ],
        };
        expect(await adapter.count("Leads", { viewId: defaultView.id, filters: wrapped })).toBe(
          expectedInside.length,
        );
      };
      await runRelative(
        new Date("2026-01-05T12:00:00.000Z"),
        { token: "RELATIVE", direction: "previous", count: 2, unit: "days" },
        {
          inside: ["2026-01-03T00:00:00.000Z", "2026-01-04T23:59:59.999Z"],
          outside: ["2026-01-05T00:00:00.000Z", "2026-01-02T23:59:59.999Z"],
        },
      );
      await runRelative(
        new Date("2026-01-05T12:00:00.000Z"),
        { token: "RELATIVE", direction: "previous", count: 2, unit: "months" },
        {
          inside: ["2025-11-01T00:00:00.000Z", "2025-12-31T23:59:59.999Z"],
          outside: ["2025-10-31T23:59:59.999Z", "2026-01-01T00:00:00.000Z"],
        },
      );
      await runRelative(
        new Date("2026-01-05T12:00:00.000Z"),
        { token: "RELATIVE", direction: "next", count: 2, unit: "weeks" },
        {
          inside: ["2026-01-12T00:00:00.000Z", "2026-01-25T23:59:59.999Z"],
          outside: ["2026-01-11T23:59:59.999Z", "2026-01-26T00:00:00.000Z"],
        },
      );
      await runRelative(
        new Date("2026-01-05T12:00:00.000Z"),
        { token: "RELATIVE", direction: "next", count: 2, unit: "months" },
        {
          inside: ["2026-02-01T00:00:00.000Z", "2026-03-31T23:59:59.999Z"],
          outside: ["2026-01-31T23:59:59.999Z", "2026-04-01T00:00:00.000Z"],
        },
      );
      await runRelative(
        new Date("2024-03-15T12:00:00.000Z"),
        { token: "RELATIVE", direction: "previous", count: 1, unit: "months" },
        {
          inside: ["2024-02-29T23:59:59.999Z"],
          outside: ["2024-03-01T00:00:00.000Z"],
        },
      );
    });
    it("panel multi_module_lookup is_not_empty and extra datetime filter rejections", async () => {
      const adapter = await makeService(ctx);
      const marker = `Lookup-empty-${randomUUID()}`;
      const empty = await adapter.create("Leads", input({ Company: marker }));
      const linked = await adapter.create(
        "Leads",
        input({
          Company: marker,
          Connected_To__s: { module: "Contacts", id: "contract-linked-contact" },
        }),
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Connected_To__s", comparator: "is_not_empty", value: null },
        [linked.id],
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: "Connected_To__s", comparator: "is_empty", value: null },
        [empty.id],
      );
      const extraInvalid = [
        { field: "Created_Time", comparator: "between", value: ["2026-01-05"] },
        {
          field: "Created_Time",
          comparator: "between",
          value: ["2026-01-04", "2026-01-05", "2026-01-06"],
        },
        { field: "Created_Time", comparator: "less_than", value: { token: "TODAY" } },
        { field: "Created_Time", comparator: "greater_than", value: "2026-01-05T12:00:00.000Z" },
        {
          field: "Created_Time",
          comparator: "equal",
          value: { token: "RELATIVE", direction: "previous", count: 1.5, unit: "days" },
        },
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "RELATIVE", direction: "next", count: 1, unit: "days" },
        },
        {
          field: "Company",
          comparator: "equal",
          value: { token: "RELATIVE", direction: "previous", count: 1, unit: "days" },
        },
      ] as unknown as Criteria[];
      for (const filters of extraInvalid) {
        const query = { viewId: defaultView.id, page: 1, perPage: 10, filters };
        await validation(adapter.list("Leads", query), "filters");
        await validation(adapter.count("Leads", query), "filters");
      }
    });
    it("panel rejects invalid field / comparator / value combinations on list and count", async () => {
      const invalidCriteria = [
        { field: "Company", comparator: "unknown", value: "x" },
        ...["Company", "Lead_Status", "Email_Opt_Out", "Owner", "Created_Time"].map((field) => ({
          field,
          comparator: "between",
          value: [1, 2],
        })),
        ...["Annual_Revenue", "No_of_Employees", "Latitude"].flatMap((field) => [
          { field, comparator: "equal", value: "10" },
          { field, comparator: "less_equal", value: null },
          ...[[20, 10], [10], [10, 20, 30], [10, "20"], [null, 20]].map((value) => ({
            field,
            comparator: "between",
            value,
          })),
          { field, comparator: "contains", value: "10" },
        ]),
        { field: "No_of_Employees", comparator: "equal", value: 1.5 },
        { field: "Email_Opt_Out", comparator: "equal", value: "true" },
        { field: "Email_Opt_Out", comparator: "not_equal", value: true },
        { field: "Company", comparator: "equal", value: ["x"] },
        { field: "Company", comparator: "is_empty", value: "" },
        { field: "Annual_Revenue", comparator: "not_between", value: [20, 10] },
        { field: "Lead_Status", comparator: "equal", value: { token: "CATEGORY", offset: 1 } },
        { field: "Created_Time", comparator: "less_than", value: { token: "TODAY" } },
        { field: "Owner", comparator: "not_equal", value: "contract-user" },
        { field: "Lead_Status", comparator: "equal", value: [] },
        { field: "Owner", comparator: "equal", value: [true] },
        {
          field: "Created_Time",
          comparator: "equal",
          value: { token: "PERIOD", name: "CURRENT_FY" },
        },
        { field: "Company", comparator: "equal", value: { token: "UNKNOWN" } },
        ...["AGEINDAYS", "DUEINDAYS"].flatMap((token) =>
          [-1, 1.5, "1"].map((offset) => ({
            field: "Created_Time",
            comparator: "less_equal",
            value: { token, offset },
          })),
        ),
        { field: "Created_Time", comparator: "equal", value: "2026-02-30" },
        { field: "Created_Time", comparator: "equal", value: "2026-01-05T00:00:00.000Z" },
        { field: "Created_Time", comparator: "between", value: ["2026-01-05", "2026-01-04"] },
        {
          field: "Created_Time",
          comparator: "equal",
          value: { token: "RELATIVE", direction: "previous", count: 0, unit: "days" },
        },
        {
          field: "Created_Time",
          comparator: "equal",
          value: { token: "RELATIVE", direction: "sideways", count: 1, unit: "days" },
        },
        {
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "years" },
        },
        { field: "Connected_To__s", comparator: "contains", value: "x" },
      ] as unknown as Criteria[];
      for (const filters of invalidCriteria) {
        const query = { viewId: defaultView.id, page: 1, perPage: 10, filters };
        await validation(service.list("Leads", query), "filters");
        await validation(service.count("Leads", query), "filters");
      }
    });
    it("resolves the four tokens, four comparators and null fields from a fixed clock", async () => {
      let now = new Date("2026-05-14T00:00:00.000Z");
      const timed = context();
      const timedService = await makeService(timed, { now: () => now });
      const marker = `Token-${randomUUID()}`;
      const outside = await timedService.create(
        "Leads",
        input({ Company: marker, Lead_Status: "Junk Lead", First_Name: "Alpha" }),
      );
      now = new Date("2026-05-15T00:00:00.000Z");
      const inside = await timedService.create(
        "Leads",
        input({ Company: marker, Lead_Status: "Contacted", First_Name: null }),
      );
      now = new Date("2026-06-15T00:30:00.000Z");
      const today = await timedService.create(
        "Leads",
        input({ Company: marker, Lead_Status: "Not Qualified", First_Name: "Later" }),
      );
      const ids = async (filters: Criteria) =>
        (
          await timedService.list("Leads", {
            viewId: defaultView.id,
            page: 1,
            perPage: 20,
            filters: {
              groupOperator: "and",
              group: [{ field: "Company", comparator: "equal", value: marker }, filters],
            },
          })
        ).records.map((record) => record.id);
      expect(
        await ids({ field: "Created_Time", comparator: "equal", value: { token: "TODAY" } }),
      ).toEqual([today.id]);
      expect(
        await ids({
          field: "Created_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 31 },
        }),
      ).toEqual([today.id, inside.id]);
      expect(
        await ids({ field: "Owner", comparator: "equal", value: { token: "CURRENTUSER" } }),
      ).toEqual([today.id, inside.id, outside.id]);
      expect(await ids({ field: "Owner", comparator: "equal", value: "someone-else" })).toEqual([]);
      expect(
        await ids({
          field: "Lead_Status",
          comparator: "equal",
          value: { token: "CATEGORY", name: "Junk" },
        }),
      ).toEqual([outside.id]);
      expect(
        await ids({
          field: "Lead_Status",
          comparator: "equal",
          value: { token: "CATEGORY", name: "Open" },
        }),
      ).toEqual([inside.id]);
      expect(await ids({ field: "First_Name", comparator: "contains", value: "alp" })).toEqual([
        outside.id,
      ]);
      expect(await ids({ field: "First_Name", comparator: "not_contains", value: "alp" })).toEqual([
        today.id,
        inside.id,
      ]);
      expect(await ids({ field: "First_Name", comparator: "equal", value: null })).toEqual([
        inside.id,
      ]);
      expect(
        await ids({
          field: "Last_Activity_Time",
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 31 },
        }),
      ).toEqual([]);
      expect(
        await ids({
          groupOperator: "or",
          group: [
            {
              field: "Lead_Status",
              comparator: "equal",
              value: { token: "CATEGORY", name: "Junk" },
            },
            {
              groupOperator: "and",
              group: [
                {
                  field: "Lead_Status",
                  comparator: "equal",
                  value: { token: "CATEGORY", name: "Open" },
                },
                { field: "First_Name", comparator: "not_contains", value: "z" },
              ],
            },
          ],
        }),
      ).toEqual([inside.id, outside.id]);
      const query = { viewId: defaultView.id, page: 1, perPage: 10 };
      for (const filters of [
        { field: "Company", comparator: "between" as Comparator, value: marker },
        { field: "Missing", comparator: "equal" as const, value: null },
        { field: "Email_Opt_Out", comparator: "contains" as const, value: "true" },
        {
          field: "Company",
          comparator: "less_equal" as const,
          value: { token: "AGEINDAYS" as const, offset: 1 },
        },
        {
          field: "Created_Time",
          comparator: "less_equal" as const,
          value: "2026-06-15T00:00:00.000Z",
        },
        { field: "Company", comparator: "equal" as const, value: { token: "TODAY" as const } },
      ])
        await validation(timedService.list("Leads", { ...query, filters }), "filters");
    });
  });
}
