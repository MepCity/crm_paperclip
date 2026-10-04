import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type {
  Criteria,
  FieldValue,
  ListView,
  ModuleMetadata,
  RecordInput,
  RecordService,
} from "./contract";

type ContractFactory = (ctx: OrgContext) => RecordService | Promise<RecordService>;
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
function criterionInput(criteria: Criteria): Record<string, FieldValue> {
  if ("group" in criteria) return Object.assign({}, ...criteria.group.map(criterionInput));
  return {
    [criteria.field]: Array.isArray(criteria.value)
      ? (criteria.value[0] ?? null)
      : (criteria.value as FieldValue),
  };
}
function unmetCriteria(criteria: Criteria): Record<string, FieldValue> {
  if ("group" in criteria) {
    const [child] = criteria.group;
    if (!child) return {};
    return criteria.groupOperator === "or"
      ? Object.assign({}, ...criteria.group.map(unmetCriteria))
      : unmetCriteria(child);
  }
  const matched = Array.isArray(criteria.value) ? criteria.value[0] : criteria.value;
  return { [criteria.field]: matched === null ? "present" : null };
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
      input({ ...(view.criteria ? criterionInput(view.criteria) : {}), ...extra });
    const validation = async (promise: Promise<unknown>, field: string) => {
      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toMatchObject({ fieldErrors: { [field]: expect.any(Array) } });
    };
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
        expect(field.unique).toBe(false);
        if (field.picklist)
          for (const option of field.picklist) {
            expect(typeof option.displayValue).toBe("string");
            expect(typeof option.storedValue).toBe("string");
          }
      }
      for (const section of metadata.layout) {
        expect(section.columnCount).toBeGreaterThan(0);
        for (const field of section.fields) expect(names).toContain(field);
      }
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
          comparator: "is" as const,
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
    for (const perPage of [10, 20, 30, 40, 50, 100]) {
      it(`paginates at ${perPage}, with consistent counts and no duplicate or missing records`, async () => {
        const query = {
          viewId: defaultView.id,
          page: 1,
          perPage,
          filters: { field: "Company", comparator: "is" as const, value: `Page-${randomUUID()}` },
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
          expect(result).not.toHaveProperty("count");
          expect(result).not.toHaveProperty("total");
          expect(await service.list("Leads", { ...query, page })).toEqual(result);
          ids.push(...result.records.map((record) => record.id));
        }
        expect(ids.length).toBe(count);
        expect(new Set(ids).size).toBe(count);
        expect(
          await service.list("Leads", { ...query, page: Math.ceil(count / perPage) + 1 }),
        ).toMatchObject({ records: [], moreRecords: false });
      });
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
          const records = [];
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
            filters: { field: "Email", comparator: "is" as const, value: `${marker}@example.org` },
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
      const view = views.find((view) => view.criteria !== null);
      expect(view).toBeDefined();
      if (!view?.criteria) throw new Error("A criteria-bearing view is required.");
      const marker = `Criteria-${randomUUID()}`;
      const values = criterionInput(view.criteria);
      const included = await service.create("Leads", input({ ...values, Company: marker }));
      await service.create("Leads", input({ ...values, Company: `${marker}-other` }));
      const excluded = await service.create(
        "Leads",
        input({ ...unmetCriteria(view.criteria), Company: marker }),
      );
      const query = {
        viewId: view.id,
        page: 1,
        perPage: 100,
        search: marker,
        filters: { field: "Company", comparator: "is" as const, value: marker },
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
  });
}
