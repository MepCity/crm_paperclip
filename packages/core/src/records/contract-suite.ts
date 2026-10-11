import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, RecordLockedError, ValidationError } from "../errors";
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
import type { RecordServiceContractModuleDefinition } from "./contract-suite-module";

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
export function describeRecordServiceContract(
  name: string,
  makeService: ContractFactory,
  moduleDef: RecordServiceContractModuleDefinition,
): void {
  describe(`${name}: record service contract`, () => {
    const {
      apiName: moduleApiName,
      singularLabel: moduleSingularLabel,
      pluralLabel: modulePluralLabel,
      expectedFieldCount,
      buildMinimalValidInput,
      systemFields: sys,
      filterMarker,
      sortFields,
      duplicatePermittedField,
      expectedUniqueFields,
      typeValidationCases,
      optional: moduleOptional,
    } = moduleDef;
    const markerField = filterMarker.field;
    const markerSample = filterMarker.sample;
    const markerUpdated = filterMarker.updated;
    const markerTenantOther = filterMarker.tenantOther;
    const categoryView = moduleOptional?.categoryView;
    const picklistPanel = moduleOptional?.picklistPanel;
    const statusCategoryTokens = moduleOptional?.statusCategoryTokens;
    const massUpdateInvalidPicklist = moduleOptional?.massUpdateInvalidPicklist;
    const panelFilters = moduleOptional?.panelFilters;
    const sortWithNumeric = moduleOptional?.sortWithNumeric;
    const connectedLookup = moduleOptional?.connectedLookup;
    const connectedField = connectedLookup?.field;
    const ownerInvalidConnectedReference = moduleOptional?.ownerInvalidConnectedReference;
    const massUpdateClearablePhone = moduleOptional?.massUpdateClearablePhone;
    const massUpdateInvalidNumeric = moduleOptional?.massUpdateInvalidNumeric;
    const lengthValidationField = moduleOptional?.lengthValidationField ?? markerField;
    const filterValidationPicklist = moduleOptional?.filterValidationPicklist;
    const filterValidationBoolean = moduleOptional?.filterValidationBoolean;
    const isolateField = sortWithNumeric?.isolateField ?? duplicatePermittedField;
    const numericSortField = sortWithNumeric?.numericField;

    let service: RecordService;
    let ctx: OrgContext;
    let metadata: ModuleMetadata;
    let views: readonly ListView[];
    let defaultView: ListView;
    beforeEach(async () => {
      ctx = context();
      service = await makeService(ctx);
      metadata = await service.getModule(moduleApiName);
      views = await service.listViews(moduleApiName);
      const view = views.find((view) => view.isDefault);
      if (!view) throw new Error("A default view is required.");
      defaultView = view;
    });
    const input = (extra: RecordInput = {}): RecordInput => buildMinimalValidInput(extra);
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
      expect(metadata.apiName).toBe(moduleApiName);
      expect(metadata.singularLabel).toBe(moduleSingularLabel);
      expect(metadata.pluralLabel).toBe(modulePluralLabel);
      const names = metadata.fields.map((field) => field.apiName);
      expect(new Set(names).size).toBe(names.length);
      expect(names.length).toBe(expectedFieldCount);
      for (const field of metadata.fields) {
        expect(field.label).not.toBe("");
        expect(typeof field.required).toBe("boolean");
        expect(typeof field.readOnly).toBe("boolean");
        expect(typeof field.massUpdate).toBe("boolean");
        expect(Object.keys(field.views).sort()).toEqual(["create", "edit", "quickCreate", "view"]);
        for (const value of Object.values(field.views)) expect(typeof value).toBe("boolean");
        if (expectedUniqueFields !== undefined) {
          expect(field.unique).toBe(expectedUniqueFields.includes(field.apiName));
        }
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
        expect(await service.getView(moduleApiName, view.id)).toEqual(view);
      }
    });
    it("projects fields, always includes id and rejects unknown names", async () => {
      const created = await service.create(moduleApiName, forView(defaultView));
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
      const projected = await service.list(moduleApiName, {
        ...query,
        fields: [markerField],
      });
      expect(projected.records).toEqual([
        {
          id: created.id,
          fields: { id: created.id, [markerField]: created.fields[markerField] },
        },
      ]);
      expect((await service.list(moduleApiName, { ...query, fields: [] })).records).toEqual([
        { id: created.id, fields: { id: created.id } },
      ]);
      expect((await service.list(moduleApiName, query)).records).toEqual([created]);
      await validation(
        service.list(moduleApiName, { ...query, fields: ["Unknown_Field"] }),
        "fields",
      );
      const fields = projected.records[0]?.fields as Record<string, FieldValue>;
      fields[markerField] = "Changed";
      expect(await service.get(moduleApiName, created.id)).toEqual(created);
    });
    // The HTTP harness performs hundreds of JSON write/read round trips per size.
    for (const perPage of [10, 20, 30, 40, 50, 100]) {
      it(`paginates at ${perPage}, with consistent counts and no duplicate or missing records`, async () => {
        const query = {
          viewId: defaultView.id,
          page: 1,
          perPage,
          filters: {
            field: markerField,
            comparator: "equal" as const,
            value: `Page-${randomUUID()}`,
          },
        };
        for (let index = 0; index < 211; index++) {
          await service.create(
            moduleApiName,
            forView(defaultView, { [markerField]: query.filters.value }),
          );
        }
        const count = await service.count(moduleApiName, query);
        expect(count).toBe(211);
        const ids: string[] = [];
        for (let page = 1; page <= Math.ceil(count / perPage); page++) {
          const result = await service.list(moduleApiName, { ...query, page });
          expect(result.page).toBe(page);
          expect(result.perPage).toBe(perPage);
          expect(result.records).toHaveLength(Math.min(perPage, count - (page - 1) * perPage));
          expect(result.moreRecords).toBe(page * perPage < count);
          expect(result.sort).toEqual({ field: "id", order: "desc" });
          expect(result).not.toHaveProperty("count");
          expect(result).not.toHaveProperty("total");
          expect(await service.list(moduleApiName, { ...query, page })).toEqual(result);
          ids.push(...result.records.map((record) => record.id));
        }
        expect(ids.length).toBe(count);
        expect(new Set(ids).size).toBe(count);
        expect(
          await service.list(moduleApiName, { ...query, page: Math.ceil(count / perPage) + 1 }),
        ).toMatchObject({
          records: [],
          moreRecords: false,
          sort: { field: "id", order: "desc" },
        });
      }, 15_000);
    }
    it("finds created records by case-insensitive search and counts an empty result", async () => {
      const marker = `Search-${randomUUID()}`;
      const record = await service.create(
        moduleApiName,
        forView(defaultView, { [markerField]: marker }),
      );
      const query = { viewId: defaultView.id, search: marker.toUpperCase(), page: 1, perPage: 10 };
      expect((await service.list(moduleApiName, query)).records.map((row) => row.id)).toContain(
        record.id,
      );
      expect(await service.count(moduleApiName, query)).toBe(1);
      const absent = { ...query, search: `absent-${randomUUID()}` };
      expect((await service.list(moduleApiName, absent)).records).toEqual([]);
      expect(await service.count(moduleApiName, absent)).toBe(0);
    });
    for (const field of sortFields as readonly [string, string])
      for (const order of ["asc", "desc"] as const) {
        it.skipIf(!sortWithNumeric)(`sorts own nonempty ${field} values ${order}`, async () => {
          if (!numericSortField) throw new Error("Numeric sort scenario is required.");
          const marker = `Sort-${randomUUID()}`;
          const records: RecordData[] = [];
          for (const [text, number] of [
            ["C", 30],
            ["A", 2],
            ["B", 10],
          ] as const)
            records.push(
              await service.create(
                moduleApiName,
                forView(defaultView, {
                  [markerField]: `${marker}-${text}`,
                  [isolateField]: `${marker}@example.org`,
                  [numericSortField]: number,
                }),
              ),
            );
          const query = {
            viewId: defaultView.id,
            filters: {
              field: isolateField,
              comparator: "equal" as const,
              value: `${marker}@example.org`,
            },
            page: 1,
            perPage: 10,
            sort: { field, order },
          };
          const expected = [records[1]?.id, records[2]?.id, records[0]?.id];
          expect(
            (await service.list(moduleApiName, query)).records.map((record) => record.id),
          ).toEqual(order === "asc" ? expected : expected.reverse());
        });
      }
    it.skipIf(!categoryView)(
      "applies a discovered view's criteria and combines extra filters with and",
      async () => {
        const viewScenario = categoryView;
        if (!viewScenario) throw new Error("A category view scenario is required.");
        const view = views.find(
          (candidate) =>
            candidate.criteria &&
            mentionsCategory(candidate.criteria, viewScenario.categoryTokenName),
        );
        expect(view).toBeDefined();
        if (!view?.criteria) throw new Error("A category view is required.");
        const marker = `Criteria-${randomUUID()}`;
        const included = await service.create(
          moduleApiName,
          input({
            [viewScenario.picklistField]: viewScenario.includedStatus,
            [markerField]: marker,
          }),
        );
        await service.create(
          moduleApiName,
          input({
            [viewScenario.picklistField]: viewScenario.siblingStatus,
            [markerField]: `${marker}-other`,
          }),
        );
        const excluded = await service.create(
          moduleApiName,
          input({
            [viewScenario.picklistField]: viewScenario.excludedStatus,
            [markerField]: marker,
          }),
        );
        const query = {
          viewId: view.id,
          page: 1,
          perPage: 100,
          search: marker,
          filters: { field: markerField, comparator: "equal" as const, value: marker },
        };
        const result = await service.list(moduleApiName, query);
        expect(result.records.map((record) => record.id)).toEqual([included.id]);
        expect(result.records.map((record) => record.id)).not.toContain(excluded.id);
        expect(await service.count(moduleApiName, query)).toBe(1);
      },
    );
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
        service.massUpdate("Unknown", ["missing"], { [markerField]: "Example" }),
        service.changeOwner("Unknown", ["missing"], ctx.userId),
      ])
        await expect(request).rejects.toBeInstanceOf(NotFoundError);
    });
    it("returns NotFoundError for unknown views and records", async () => {
      await expect(service.getView(moduleApiName, "missing")).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        service.list(moduleApiName, { viewId: "missing", page: 1, perPage: 10 }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.count(moduleApiName, { viewId: "missing" })).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(service.get(moduleApiName, "missing")).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.update(moduleApiName, "missing", {})).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(service.delete(moduleApiName, ["missing"])).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
    it("validates required, length, picklist membership and field types with field keys", async () => {
      for (const field of metadata.fields.filter((field) => field.required))
        await validation(
          service.create(moduleApiName, input({ [field.apiName]: null })),
          field.apiName,
        );
      const lengthFieldMeta = metadata.fields.find(
        (field) => field.apiName === lengthValidationField,
      );
      await validation(
        service.create(
          moduleApiName,
          input({
            [lengthValidationField]: "x".repeat((lengthFieldMeta?.maxLength ?? 0) + 1),
          }),
        ),
        lengthValidationField,
      );
      for (const field of metadata.fields.filter((field) => field.picklist && !field.readOnly))
        await validation(
          service.create(moduleApiName, input({ [field.apiName]: "not-a-listed-option" })),
          field.apiName,
        );
      for (const [field, value] of typeValidationCases)
        await validation(service.create(moduleApiName, input({ [field]: value })), field);
    });
    it("accepts duplicate permitted field values on creation and partial update", async () => {
      const email = `${randomUUID()}@example.org`;
      const first = await service.create(
        moduleApiName,
        input({ [duplicatePermittedField]: email }),
      );
      const second = await service.create(
        moduleApiName,
        input({ [duplicatePermittedField]: email }),
      );
      const third = await service.create(moduleApiName, input());
      expect(first.id).not.toBe(second.id);
      expect(
        (await service.update(moduleApiName, third.id, { [duplicatePermittedField]: email }))
          .fields[duplicatePermittedField],
      ).toBe(email);
    });
    it("uses context for system fields, preserves omitted fields, and shares state within an org", async () => {
      const created = await service.create(
        moduleApiName,
        input({ [isolateField]: "contract@example.org" }),
      );
      expect(created.fields).toMatchObject({
        [sys.owner]: ctx.userId,
        [sys.createdBy]: ctx.userId,
        [sys.modifiedBy]: ctx.userId,
      });
      expect(Number.isFinite(Date.parse(String(created.fields[sys.createdTime])))).toBe(true);
      const nextUser = await makeService({ ...ctx, userId: "second-user" });
      const updated = await nextUser.update(moduleApiName, created.id, {
        [markerField]: markerUpdated,
      });
      expect(updated.fields).toMatchObject({
        [markerField]: markerUpdated,
        [isolateField]: "contract@example.org",
        [sys.owner]: ctx.userId,
        [sys.createdBy]: ctx.userId,
        [sys.modifiedBy]: "second-user",
        [sys.createdTime]: created.fields[sys.createdTime],
      });
      expect(Date.parse(String(updated.fields[sys.modifiedTime]))).toBeGreaterThanOrEqual(
        Date.parse(String(created.fields[sys.modifiedTime])),
      );
      expect(await service.get(moduleApiName, created.id)).toEqual(updated);
      await validation(
        service.update(moduleApiName, created.id, { [markerField]: null }),
        markerField,
      );
      expect(await service.get(moduleApiName, created.id)).toEqual(updated);
    });
    it("creates and updates Owner using organization members, with a context default", async () => {
      const secondMember = await makeService({ ...ctx, userId: "second-member" });
      await secondMember.getModule(moduleApiName);
      const created = await service.create(moduleApiName, input({ [sys.owner]: "second-member" }));
      expect(created.fields[sys.owner]).toBe("second-member");
      expect(created.fields[sys.createdBy]).toBe(ctx.userId);
      const updated = await service.update(moduleApiName, created.id, {
        [sys.owner]: ctx.userId,
      });
      expect(updated.fields[sys.owner]).toBe(ctx.userId);
      expect(updated.fields[sys.createdBy]).toBe(ctx.userId);
      expect(updated.fields[sys.modifiedBy]).toBe(ctx.userId);
      expect((await service.create(moduleApiName, input())).fields[sys.owner]).toBe(ctx.userId);
      const foreign = await makeService({ ...context(), userId: "foreign-member" });
      // A known user in another organization must not qualify for this one.
      await foreign.create(moduleApiName, input({ [sys.owner]: "foreign-member" }));
      await validation(
        service.create(moduleApiName, input({ [sys.owner]: "foreign-member" })),
        sys.owner,
      );
      await validation(
        service.update(moduleApiName, created.id, { [sys.owner]: "foreign-member" }),
        sys.owner,
      );
      const invalidOwners: FieldValue[] = [null, "", 3];
      if (ownerInvalidConnectedReference) invalidOwners.push(ownerInvalidConnectedReference);
      for (const Owner of invalidOwners) {
        await validation(service.create(moduleApiName, input({ [sys.owner]: Owner })), sys.owner);
        await validation(
          service.update(moduleApiName, created.id, { [sys.owner]: Owner }),
          sys.owner,
        );
      }
      expect(await service.get(moduleApiName, created.id)).toEqual(updated);
      for (const name of [sys.createdBy, sys.modifiedBy])
        await validation(service.update(moduleApiName, created.id, { [name]: ctx.userId }), name);
    });
    it("mass updates one eligible field and applies ordinary update validation", async () => {
      const first = await service.create(moduleApiName, input());
      const second = await service.create(moduleApiName, input());
      const ids = [second.id, first.id];
      await service.massUpdate(moduleApiName, ids, { [markerField]: "Mass Updated" });
      for (const id of ids)
        expect((await service.get(moduleApiName, id)).fields[markerField]).toBe("Mass Updated");
      await validation(service.massUpdate(moduleApiName, ids, {}), "data");
      const massUpdateSecondFieldKey = massUpdateClearablePhone ?? "Second_Mass_Update_Field";
      await validation(
        service.massUpdate(moduleApiName, ids, {
          [markerField]: "Example",
          [massUpdateSecondFieldKey]: "123",
        }),
        "data",
      );
      for (const field of metadata.fields.filter((field) => !field.massUpdate))
        await validation(
          service.massUpdate(moduleApiName, ids, { [field.apiName]: null }),
          field.apiName,
        );
      await validation(
        service.massUpdate(moduleApiName, ids, { Unknown_Field: "Example" }),
        "Unknown_Field",
      );
      const markerFieldMeta = metadata.fields.find((field) => field.apiName === markerField);
      const massUpdateInvalidValues: FieldValue[] = [null, "", " ", 42];
      if (markerFieldMeta?.maxLength != null)
        massUpdateInvalidValues.push("x".repeat(markerFieldMeta.maxLength + 1));
      for (const value of massUpdateInvalidValues)
        await validation(
          service.massUpdate(moduleApiName, ids, { [markerField]: value }),
          markerField,
        );
      if (massUpdateInvalidPicklist)
        await validation(
          service.massUpdate(moduleApiName, ids, {
            [massUpdateInvalidPicklist.field]: massUpdateInvalidPicklist.value,
          }),
          massUpdateInvalidPicklist.field,
        );
      if (massUpdateInvalidNumeric)
        await validation(
          service.massUpdate(moduleApiName, ids, { [massUpdateInvalidNumeric]: 1.5 }),
          massUpdateInvalidNumeric,
        );
      if (massUpdateClearablePhone) {
        await service.massUpdate(moduleApiName, ids, { [massUpdateClearablePhone]: "" });
        for (const id of ids)
          expect(
            (await service.get(moduleApiName, id)).fields[massUpdateClearablePhone],
          ).toBeNull();
      }
      expect((await service.get(moduleApiName, first.id)).fields[markerField]).toBe("Mass Updated");
    });

    it("changes ownership only to an active organization member", async () => {
      await makeService({ ...ctx, userId: "batch-owner" });
      const first = await service.create(moduleApiName, input());
      const second = await service.create(moduleApiName, input());
      await service.changeOwner(moduleApiName, [first.id, second.id], "batch-owner");
      for (const id of [first.id, second.id]) {
        const record = await service.get(moduleApiName, id);
        expect(record.fields[sys.owner]).toBe("batch-owner");
        expect(record.fields[sys.modifiedBy]).toBe(ctx.userId);
        expect(record.fields[sys.createdBy]).toBe(ctx.userId);
      }
      for (const owner of ["unknown-user", ""])
        await validation(
          service.changeOwner(moduleApiName, [first.id, second.id], owner),
          sys.owner,
        );
      expect((await service.get(moduleApiName, first.id)).fields[sys.owner]).toBe("batch-owner");
    });

    if (moduleOptional?.lockedRecords) {
      const lockedField = moduleOptional.lockedRecords.field;
      it.each(["update", "massUpdate", "changeOwner", "delete"] as const)(
        "rejects %s on locked records without changing any target",
        async (operation) => {
          const locked = (
            await service.list(moduleApiName, {
              viewId: defaultView.id,
              page: 1,
              perPage: 10,
              filters: { field: lockedField, comparator: "equal", value: true },
            })
          ).records[0];
          if (!locked) throw new Error("The contract harness must provision a locked record.");
          const unlocked = await service.create(moduleApiName, input());
          await makeService({ ...ctx, userId: "lock-test-owner" });
          const run = (ids: string[]) => {
            switch (operation) {
              case "update":
                return service.update(moduleApiName, locked.id, { [markerField]: markerUpdated });
              case "massUpdate":
                return service.massUpdate(moduleApiName, ids, { [markerField]: markerUpdated });
              case "changeOwner":
                return service.changeOwner(moduleApiName, ids, "lock-test-owner");
              case "delete":
                return service.delete(moduleApiName, ids);
            }
          };
          const targetSets =
            operation === "update"
              ? [[locked.id]]
              : [[locked.id], [unlocked.id, locked.id], [locked.id, unlocked.id]];
          for (const ids of targetSets) {
            await expect(run(ids)).rejects.toBeInstanceOf(RecordLockedError);
            expect(await service.get(moduleApiName, locked.id)).toEqual(locked);
            expect(await service.get(moduleApiName, unlocked.id)).toEqual(unlocked);
          }
        },
      );
    }

    it("validates all batch targets before changing any record", async () => {
      const first = await service.create(moduleApiName, input());
      const foreign = await makeService(context());
      await foreign.create(moduleApiName, input());
      const foreignRecord = await foreign.create(moduleApiName, input());
      for (const missing of ["missing", foreignRecord.id]) {
        const ids = [first.id, missing];
        for (const run of [
          () => service.massUpdate(moduleApiName, ids, { [markerField]: "Must Not Persist" }),
          () => service.changeOwner(moduleApiName, ids, ctx.userId),
          () => service.delete(moduleApiName, ids),
        ]) {
          await expect(run()).rejects.toBeInstanceOf(NotFoundError);
          expect(await service.get(moduleApiName, first.id)).toEqual(first);
        }
      }
      expect(await foreign.get(moduleApiName, foreignRecord.id)).toEqual(foreignRecord);
    });

    it("enforces 1–500 IDs for every batch operation, including deletion", async () => {
      const record = await service.create(moduleApiName, input());
      for (const ids of [[], Array.from({ length: 501 }, () => record.id)]) {
        await validation(
          service.massUpdate(moduleApiName, ids, { [markerField]: "Rejected" }),
          "ids",
        );
        await validation(service.changeOwner(moduleApiName, ids, ctx.userId), "ids");
        await validation(service.delete(moduleApiName, ids), "ids");
        expect(await service.get(moduleApiName, record.id)).toEqual(record);
      }
      const records = await Promise.all(
        Array.from({ length: 500 }, () => service.create(moduleApiName, input())),
      );
      const ids = records.map((row) => row.id);
      await service.massUpdate(moduleApiName, ids, { [markerField]: "Boundary" });
      await service.changeOwner(moduleApiName, ids, ctx.userId);
      expect((await service.get(moduleApiName, ids[499] as string)).fields[markerField]).toBe(
        "Boundary",
      );
      await service.delete(moduleApiName, ids);
      await expect(service.get(moduleApiName, ids[0] as string)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    }, 15_000);

    it("deletes records and updates count", async () => {
      const created = await service.create(moduleApiName, forView(defaultView));
      const before = await service.count(moduleApiName, { viewId: defaultView.id });
      await service.delete(moduleApiName, [created.id]);
      await expect(service.get(moduleApiName, created.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(await service.count(moduleApiName, { viewId: defaultView.id })).toBe(before - 1);
    });
    it("isolates two organizations across queries and mutations", async () => {
      const other = await makeService(context());
      const marker = `Tenant-${randomUUID()}`;
      const query = { viewId: defaultView.id, search: marker, page: 1, perPage: 10 };
      const created = await service.create(
        moduleApiName,
        forView(defaultView, { [markerField]: marker }),
      );
      expect(await other.count(moduleApiName, query)).toBe(0);
      expect((await other.list(moduleApiName, query)).records).toEqual([]);
      await expect(other.get(moduleApiName, created.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        other.update(moduleApiName, created.id, { [markerField]: markerTenantOther }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(other.delete(moduleApiName, [created.id])).rejects.toBeInstanceOf(NotFoundError);
      expect(await service.get(moduleApiName, created.id)).toEqual(created);
    });
    it.skipIf(!connectedLookup)(
      "detaches metadata, views, records, nested values and mutation inputs",
      async () => {
        if (!connectedLookup) throw new Error("Connected lookup scenario is required.");
        const lookupField = connectedLookup.field;
        const reference = {
          module: connectedLookup.linkedModuleApiName,
          id: connectedLookup.syntheticReferenceId,
        };
        const created = await service.create(moduleApiName, input({ [lookupField]: reference }));
        reference.id = "changed-input";
        (created.fields as Record<string, FieldValue>)[markerField] = "changed-return";
        (created.fields[lookupField] as { id: string }).id = "changed-reference";
        const reread = await service.get(moduleApiName, created.id);
        expect(reread.fields[markerField]).toBe(markerSample);
        expect(reread.fields[lookupField]).toEqual({
          module: connectedLookup.linkedModuleApiName,
          id: connectedLookup.syntheticReferenceId,
        });
        (reread.fields as Record<string, FieldValue>)[markerField] = "changed-get";
        const page = await service.list(moduleApiName, {
          viewId: defaultView.id,
          page: 1,
          perPage: 10,
        });
        const row = page.records[0];
        if (!row) throw new Error("Expected records.");
        const original = await service.get(moduleApiName, row.id);
        (row.fields as Record<string, FieldValue>)[markerField] = "changed-list";
        expect(await service.get(moduleApiName, row.id)).toEqual(original);
        const definition = metadata.fields[0];
        if (!definition) throw new Error("Expected fields.");
        const originalModule = await service.getModule(moduleApiName);
        definition.views.view = !definition.views.view;
        const column = metadata.layout[0]?.columns[0];
        if (!column) throw new Error("Expected a layout column.");
        (column as string[]).push("changed-placement");
        (metadata.businessCardFields as string[]).push("changed-card");
        expect(await service.getModule(moduleApiName)).toEqual(originalModule);
        definition.label = "changed-metadata";
        (defaultView.columns as string[]).push("changed-columns");
        expect((await service.getModule(moduleApiName)).fields[0]?.label).not.toBe(
          "changed-metadata",
        );
        expect((await service.getView(moduleApiName, defaultView.id)).columns).not.toContain(
          "changed-columns",
        );
        const source = views.find((view) => view.criteria);
        if (!source) throw new Error("Expected a criteria-bearing view.");
        const originalView = await service.getView(moduleApiName, source.id);
        const detachedView = await service.getView(moduleApiName, source.id);
        if (detachedView.criteria && "field" in detachedView.criteria)
          detachedView.criteria.value = "changed-criteria";
        expect(await service.getView(moduleApiName, source.id)).toEqual(originalView);
        const picklist = metadata.fields.find((field) => field.picklist)?.picklist;
        const option = picklist?.[0];
        if (!option) throw new Error("Expected picklist options.");
        option.storedValue = "changed-picklist";
        expect(
          (await service.getModule(moduleApiName)).fields
            .flatMap((field) => field.picklist ?? [])
            .map((option) => option.storedValue),
        ).not.toContain("changed-picklist");
        const updateInput = {
          [lookupField]: {
            module: connectedLookup.linkedModuleApiName,
            id: connectedLookup.updatedReferenceId,
          },
        };
        const updated = await service.update(moduleApiName, created.id, updateInput);
        (updateInput[lookupField] as { id: string }).id = "changed-update-input";
        (updated.fields as Record<string, FieldValue>)[markerField] = "changed-update-return";
        expect((await service.get(moduleApiName, created.id)).fields).toMatchObject({
          [markerField]: markerSample,
          [lookupField]: {
            module: connectedLookup.linkedModuleApiName,
            id: connectedLookup.updatedReferenceId,
          },
        });
      },
    );
    it("orders an unsorted list by id descending and echoes an explicit sort", async () => {
      const created = await service.create(moduleApiName, forView(defaultView));
      const page = await service.list(moduleApiName, {
        viewId: defaultView.id,
        page: 1,
        perPage: 10,
      });
      expect(page.sort).toEqual({ field: "id", order: "desc" });
      expect(page.records[0]?.id).toBe(created.id);
      const sorted = await service.list(moduleApiName, {
        viewId: defaultView.id,
        page: 1,
        perPage: 10,
        sort: { field: markerField, order: "asc" },
      });
      expect(sorted.sort).toEqual({ field: markerField, order: "asc" });
    });
    const panelCases: {
      label: string;
      field: string;
      comparator: Comparator;
      value: CriteriaValue;
      indexes: number[];
    }[] = [];
    if (panelFilters) {
      for (const field of panelFilters.textFields) {
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
      for (const field of panelFilters.numberFields) {
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
      if (picklistPanel) {
        panelCases.push(
          {
            label: "picklist is",
            field: picklistPanel.picklistField,
            comparator: "equal",
            value: [...picklistPanel.membershipValues],
            indexes: [0, 3],
          },
          {
            label: "picklist is not",
            field: picklistPanel.picklistField,
            comparator: "not_equal",
            value: [...picklistPanel.membershipValues],
            indexes: [1, 2],
          },
        );
      }
      panelCases.push(
        {
          label: "boolean is true",
          field: panelFilters.booleanField,
          comparator: "equal",
          value: true,
          indexes: [0, 3],
        },
        {
          label: "boolean is false",
          field: panelFilters.booleanField,
          comparator: "equal",
          value: false,
          indexes: [1],
        },
        {
          label: "owner is",
          field: sys.owner,
          comparator: "equal",
          value: ["contract-user"],
          indexes: [0, 2, 3],
        },
        {
          label: "owner is not",
          field: sys.owner,
          comparator: "not_equal",
          value: ["contract-user"],
          indexes: [1],
        },
      );
      for (const field of panelFilters.emptyCheckFields)
        for (const comparator of ["is_empty", "is_not_empty"] as const)
          panelCases.push({
            label: `${field} ${comparator}`,
            field,
            comparator,
            value: null,
            indexes: comparator === "is_empty" ? [2] : [0, 1, 3],
          });
    }

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
            { field: markerField, comparator: "equal" as const, value: marker },
            {
              groupOperator: "and" as const,
              group: [
                filters,
                { field: markerField, comparator: "is_not_empty" as const, value: null },
              ],
            },
          ],
        },
      };
      const result = await adapter.list(moduleApiName, query);
      expect(result.records.map((record) => record.id).sort()).toEqual([...expected].sort());
      expect(await adapter.count(moduleApiName, query)).toBe(expected.length);
    };
    it.skipIf(!panelFilters).each(panelCases)(
      "panel $label: exact set and count with nested and",
      async ({ field, comparator, value, indexes }) => {
        if (!panelFilters) throw new Error("Panel filter scenario is required.");
        const marker = `Panel-${randomUUID()}`;
        const other = await makeService({ ...ctx, userId: "panel-other" });
        const records: RecordData[] = [];
        const textSeed = ["AlphaBeta", "Gamma", null, "Delta"];
        const numberSeed = [10, 20, null, 30];
        const booleanSeed = [true, false, null, true];
        for (const index of [0, 1, 2, 3]) {
          const adapter = index === 1 ? other : service;
          const seedInput: Record<string, FieldValue> = { [markerField]: marker };
          for (const seedField of panelFilters.seedTextFields)
            seedInput[seedField] = textSeed[index] ?? null;
          for (const seedField of panelFilters.seedNumberFields)
            seedInput[seedField] = numberSeed[index] ?? null;
          seedInput[panelFilters.booleanField] = booleanSeed[index] ?? null;
          seedInput[panelFilters.picklistField] = panelFilters.picklistRowStatuses[index] ?? null;
          records.push(await adapter.create(moduleApiName, input(seedInput)));
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
          records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
        }
        now = new Date("2026-01-05T12:00:00.000Z");
        await assertPanelSet(
          adapter,
          marker,
          { field: sys.createdTime, comparator: "equal", value: token },
          [records[1]?.id as string, records[2]?.id as string],
        );
        await assertPanelSet(
          adapter,
          marker,
          { field: sys.lastActivityTime, comparator: "equal", value: token },
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
        records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
      }
      now = new Date("2026-01-05T12:00:00.000Z");
      for (const [name, indexes] of [
        ["TILL_YESTERDAY", [0, 1]],
        ["STARTING_TOMORROW", [4, 5]],
      ] as const)
        await assertPanelSet(
          adapter,
          marker,
          { field: sys.createdTime, comparator: "equal", value: { token: "PERIOD", name } },
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
        records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
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
          { field: sys.createdTime, comparator: "less_equal", value: { token, offset } },
          indexes.map((index) => records[index]?.id as string),
        );
      for (const token of ["AGEINDAYS", "DUEINDAYS"] as const)
        await assertPanelSet(
          adapter,
          marker,
          {
            field: sys.lastActivityTime,
            comparator: "less_equal",
            value: { token, offset: 1 },
          },
          [],
        );
      await assertPanelSet(
        adapter,
        marker,
        { field: sys.lastActivityTime, comparator: "is_empty", value: null },
        records.map((record) => record.id),
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: sys.createdTime, comparator: "is_not_empty", value: null },
        records.map((record) => record.id),
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: sys.owner, comparator: "is_empty", value: null },
        [],
      );
      await assertPanelSet(
        adapter,
        marker,
        { field: sys.owner, comparator: "is_not_empty", value: null },
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
        records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
      }
      now = queryAt;
      const withCount = async (filters: Criteria, expected: string[]) => {
        await assertPanelSet(adapter, marker, filters, expected);
        const wrapped = {
          groupOperator: "and" as const,
          group: [{ field: markerField, comparator: "equal" as const, value: marker }, filters],
        };
        expect(
          await adapter.count(moduleApiName, { viewId: defaultView.id, filters: wrapped }),
        ).toBe(expected.length);
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
          await adapter.list(moduleApiName, {
            viewId: defaultView.id,
            page: 1,
            perPage: 100,
            filters: {
              groupOperator: "and",
              group: [
                { field: markerField, comparator: "equal", value: marker },
                { field: sys.createdTime, comparator: "equal", value: relative },
              ],
            },
          })
        ).records.map((record) => record.id);
        const periodIds = (
          await adapter.list(moduleApiName, {
            viewId: defaultView.id,
            page: 1,
            perPage: 100,
            filters: {
              groupOperator: "and",
              group: [
                { field: markerField, comparator: "equal", value: marker },
                { field: sys.createdTime, comparator: "equal", value: period },
              ],
            },
          })
        ).records.map((record) => record.id);
        expect(relativeIds.sort()).toEqual(periodIds.sort());
      }
      await withCount({ field: sys.createdTime, comparator: "equal", value: "2026-01-05" }, [
        records[4]?.id as string,
        records[5]?.id as string,
      ]);
      await withCount(
        { field: sys.createdTime, comparator: "less_than", value: "2026-01-05" },
        stamps
          .map((stamp, index) =>
            Date.parse(stamp) < Date.parse("2026-01-05T00:00:00.000Z") ? index : -1,
          )
          .filter((index) => index >= 0)
          .map((index) => records[index]?.id as string),
      );
      await withCount({ field: sys.createdTime, comparator: "greater_than", value: "2026-01-05" }, [
        records[6]?.id as string,
        records[7]?.id as string,
        records[8]?.id as string,
        records[9]?.id as string,
      ]);
      await withCount(
        {
          field: sys.createdTime,
          comparator: "between",
          value: ["2026-01-04", "2026-01-05"],
        },
        [
          records[2]?.id as string,
          records[3]?.id as string,
          records[4]?.id as string,
          records[5]?.id as string,
        ],
      );
      await withCount(
        {
          field: sys.createdTime,
          comparator: "not_between",
          value: ["2026-01-04", "2026-01-05"],
        },
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
      await withCount({ field: sys.createdTime, comparator: "equal", value: "2024-02-29" }, [
        records[10]?.id as string,
      ]);
      await withCount(
        {
          field: sys.createdTime,
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
          field: sys.createdTime,
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
        monthRecords.push(
          await adapter.create(moduleApiName, input({ [markerField]: monthMarker })),
        );
      }
      now = new Date("2026-03-31T12:00:00.000Z");
      await assertPanelSet(
        adapter,
        monthMarker,
        {
          field: sys.createdTime,
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "months" },
        },
        [monthRecords[1]?.id as string],
      );
      if (connectedField) {
        await assertPanelSet(
          adapter,
          marker,
          { field: connectedField, comparator: "is_empty", value: null },
          records.map((record) => record.id),
        );
        await validation(
          service.list(moduleApiName, {
            viewId: defaultView.id,
            page: 1,
            perPage: 10,
            filters: { field: connectedField, comparator: "equal", value: "x" },
          }),
          "filters",
        );
      }
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
        records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
      }
      now = queryAt;
      const expectedIds = [records[1]?.id as string];
      await assertPanelSet(
        adapter,
        marker,
        {
          field: sys.createdTime,
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "weeks" },
        },
        expectedIds,
      );
      await assertPanelSet(
        adapter,
        marker,
        {
          field: sys.createdTime,
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 7 },
        },
        expectedIds,
      );
      const wrapped = {
        groupOperator: "and" as const,
        group: [
          { field: markerField, comparator: "equal" as const, value: marker },
          {
            field: sys.createdTime,
            comparator: "less_equal" as const,
            value: { token: "AGEINDAYS" as const, offset: 1, unit: "weeks" as const },
          },
        ],
      };
      expect(await adapter.count(moduleApiName, { viewId: defaultView.id, filters: wrapped })).toBe(
        1,
      );
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
        records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
      }
      now = queryAt;
      await assertPanelSet(
        adapter,
        marker,
        {
          field: sys.createdTime,
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
        records.push(await adapter.create(moduleApiName, input({ [markerField]: marker })));
      }
      now = queryAt;
      await assertPanelSet(
        adapter,
        marker,
        {
          field: sys.createdTime,
          comparator: "less_equal",
          value: { token: "DUEINDAYS", offset: 1, unit: "months" },
        },
        [records[1]?.id as string],
      );
      await assertPanelSet(
        adapter,
        marker,
        {
          field: sys.createdTime,
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
          const record = await adapter.create(moduleApiName, input({ [markerField]: marker }));
          byStamp.set(timestamp, record.id);
        }
        now = queryAt;
        const expectedInside = boundaryStamps.inside.map((stamp) => byStamp.get(stamp) as string);
        await assertPanelSet(
          adapter,
          marker,
          { field: sys.createdTime, comparator: "equal", value: relative },
          expectedInside,
        );
        const wrapped = {
          groupOperator: "and" as const,
          group: [
            { field: markerField, comparator: "equal" as const, value: marker },
            { field: sys.createdTime, comparator: "equal" as const, value: relative },
          ],
        };
        expect(
          await adapter.count(moduleApiName, { viewId: defaultView.id, filters: wrapped }),
        ).toBe(expectedInside.length);
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
    it.skipIf(!connectedLookup)(
      "panel multi_module_lookup is_not_empty and extra datetime filter rejections",
      async () => {
        if (!connectedLookup) throw new Error("Connected lookup scenario is required.");
        const lookupField = connectedLookup.field;
        const adapter = await makeService(ctx);
        const marker = `Lookup-empty-${randomUUID()}`;
        const empty = await adapter.create(moduleApiName, input({ [markerField]: marker }));
        const linked = await adapter.create(
          moduleApiName,
          input({
            [markerField]: marker,
            [lookupField]: {
              module: connectedLookup.linkedModuleApiName,
              id: connectedLookup.contractLinkedReferenceId,
            },
          }),
        );
        await assertPanelSet(
          adapter,
          marker,
          { field: lookupField, comparator: "is_not_empty", value: null },
          [linked.id],
        );
        await assertPanelSet(
          adapter,
          marker,
          { field: lookupField, comparator: "is_empty", value: null },
          [empty.id],
        );
        const extraInvalid = [
          { field: sys.createdTime, comparator: "between", value: ["2026-01-05"] },
          {
            field: sys.createdTime,
            comparator: "between",
            value: ["2026-01-04", "2026-01-05", "2026-01-06"],
          },
          { field: sys.createdTime, comparator: "less_than", value: { token: "TODAY" } },
          {
            field: sys.createdTime,
            comparator: "greater_than",
            value: "2026-01-05T12:00:00.000Z",
          },
          {
            field: sys.createdTime,
            comparator: "equal",
            value: { token: "RELATIVE", direction: "previous", count: 1.5, unit: "days" },
          },
          {
            field: sys.createdTime,
            comparator: "less_equal",
            value: { token: "RELATIVE", direction: "next", count: 1, unit: "days" },
          },
          {
            field: markerField,
            comparator: "equal",
            value: { token: "RELATIVE", direction: "previous", count: 1, unit: "days" },
          },
        ] as unknown as Criteria[];
        for (const filters of extraInvalid) {
          const query = { viewId: defaultView.id, page: 1, perPage: 10, filters };
          await validation(adapter.list(moduleApiName, query), "filters");
          await validation(adapter.count(moduleApiName, query), "filters");
        }
      },
    );
    it("panel rejects invalid field / comparator / value combinations on list and count", async () => {
      const betweenFields = [
        markerField,
        ...(filterValidationPicklist ? [filterValidationPicklist] : []),
        ...(filterValidationBoolean ? [filterValidationBoolean] : []),
        sys.owner,
        sys.createdTime,
      ];
      const invalidCriteria = [
        { field: markerField, comparator: "unknown", value: "x" },
        ...betweenFields.map((field) => ({
          field,
          comparator: "between",
          value: [1, 2],
        })),
        ...(panelFilters?.numberFields ?? []).flatMap((field) => [
          { field, comparator: "equal", value: "10" },
          { field, comparator: "less_equal", value: null },
          ...[[20, 10], [10], [10, 20, 30], [10, "20"], [null, 20]].map((value) => ({
            field,
            comparator: "between",
            value,
          })),
          { field, comparator: "contains", value: "10" },
        ]),
        ...(massUpdateInvalidNumeric
          ? [{ field: massUpdateInvalidNumeric, comparator: "equal", value: 1.5 }]
          : []),
        ...(filterValidationBoolean
          ? [
              { field: filterValidationBoolean, comparator: "equal", value: "true" },
              { field: filterValidationBoolean, comparator: "not_equal", value: true },
            ]
          : []),
        { field: markerField, comparator: "equal", value: ["x"] },
        { field: markerField, comparator: "is_empty", value: "" },
        ...(panelFilters?.numberFields[0]
          ? [
              {
                field: panelFilters.numberFields[0],
                comparator: "not_between",
                value: [20, 10],
              },
            ]
          : []),
        ...(filterValidationPicklist
          ? [
              {
                field: filterValidationPicklist,
                comparator: "equal",
                value: { token: "CATEGORY", offset: 1 },
              },
              { field: filterValidationPicklist, comparator: "equal", value: [] },
            ]
          : []),
        { field: sys.createdTime, comparator: "less_than", value: { token: "TODAY" } },
        { field: sys.owner, comparator: "not_equal", value: "contract-user" },
        { field: sys.owner, comparator: "equal", value: [true] },
        {
          field: sys.createdTime,
          comparator: "equal",
          value: { token: "PERIOD", name: "CURRENT_FY" },
        },
        { field: markerField, comparator: "equal", value: { token: "UNKNOWN" } },
        ...["AGEINDAYS", "DUEINDAYS"].flatMap((token) =>
          [-1, 1.5, "1"].map((offset) => ({
            field: sys.createdTime,
            comparator: "less_equal",
            value: { token, offset },
          })),
        ),
        { field: sys.createdTime, comparator: "equal", value: "2026-02-30" },
        { field: sys.createdTime, comparator: "equal", value: "2026-01-05T00:00:00.000Z" },
        {
          field: sys.createdTime,
          comparator: "between",
          value: ["2026-01-05", "2026-01-04"],
        },
        {
          field: sys.createdTime,
          comparator: "equal",
          value: { token: "RELATIVE", direction: "previous", count: 0, unit: "days" },
        },
        {
          field: sys.createdTime,
          comparator: "equal",
          value: { token: "RELATIVE", direction: "sideways", count: 1, unit: "days" },
        },
        {
          field: sys.createdTime,
          comparator: "less_equal",
          value: { token: "AGEINDAYS", offset: 1, unit: "years" },
        },
        ...(connectedField ? [{ field: connectedField, comparator: "contains", value: "x" }] : []),
      ] as unknown as Criteria[];
      for (const filters of invalidCriteria) {
        const query = { viewId: defaultView.id, page: 1, perPage: 10, filters };
        await validation(service.list(moduleApiName, query), "filters");
        await validation(service.count(moduleApiName, query), "filters");
      }
    });
    it.skipIf(!statusCategoryTokens)(
      "resolves the four tokens, four comparators and null fields from a fixed clock",
      async () => {
        const tokens = statusCategoryTokens;
        if (!tokens) throw new Error("Status category token scenario is required.");
        let now = new Date("2026-05-14T00:00:00.000Z");
        const timed = context();
        const timedService = await makeService(timed, { now: () => now });
        const marker = `Token-${randomUUID()}`;
        const outside = await timedService.create(
          moduleApiName,
          input({
            [markerField]: marker,
            [tokens.picklistField]: tokens.junkStatus,
            [tokens.textField]: "Alpha",
          }),
        );
        now = new Date("2026-05-15T00:00:00.000Z");
        const inside = await timedService.create(
          moduleApiName,
          input({
            [markerField]: marker,
            [tokens.picklistField]: tokens.contactedStatus,
            [tokens.textField]: null,
          }),
        );
        now = new Date("2026-06-15T00:30:00.000Z");
        const today = await timedService.create(
          moduleApiName,
          input({
            [markerField]: marker,
            [tokens.picklistField]: tokens.notQualifiedStatus,
            [tokens.textField]: "Later",
          }),
        );
        const ids = async (filters: Criteria) =>
          (
            await timedService.list(moduleApiName, {
              viewId: defaultView.id,
              page: 1,
              perPage: 20,
              filters: {
                groupOperator: "and",
                group: [{ field: markerField, comparator: "equal", value: marker }, filters],
              },
            })
          ).records.map((record) => record.id);
        expect(
          await ids({
            field: sys.createdTime,
            comparator: "equal",
            value: { token: "TODAY" },
          }),
        ).toEqual([today.id]);
        expect(
          await ids({
            field: sys.createdTime,
            comparator: "less_equal",
            value: { token: "AGEINDAYS", offset: 31 },
          }),
        ).toEqual([today.id, inside.id]);
        expect(
          await ids({
            field: sys.owner,
            comparator: "equal",
            value: { token: "CURRENTUSER" },
          }),
        ).toEqual([today.id, inside.id, outside.id]);
        expect(await ids({ field: sys.owner, comparator: "equal", value: "someone-else" })).toEqual(
          [],
        );
        expect(
          await ids({
            field: tokens.picklistField,
            comparator: "equal",
            value: { token: "CATEGORY", name: tokens.junkCategoryName },
          }),
        ).toEqual([outside.id]);
        expect(
          await ids({
            field: tokens.picklistField,
            comparator: "equal",
            value: { token: "CATEGORY", name: tokens.openCategoryName },
          }),
        ).toEqual([inside.id]);
        expect(
          await ids({ field: tokens.textField, comparator: "contains", value: "alp" }),
        ).toEqual([outside.id]);
        expect(
          await ids({ field: tokens.textField, comparator: "not_contains", value: "alp" }),
        ).toEqual([today.id, inside.id]);
        expect(await ids({ field: tokens.textField, comparator: "equal", value: null })).toEqual([
          inside.id,
        ]);
        expect(
          await ids({
            field: sys.lastActivityTime,
            comparator: "less_equal",
            value: { token: "AGEINDAYS", offset: 31 },
          }),
        ).toEqual([]);
        expect(
          await ids({
            groupOperator: "or",
            group: [
              {
                field: tokens.picklistField,
                comparator: "equal",
                value: { token: "CATEGORY", name: tokens.junkCategoryName },
              },
              {
                groupOperator: "and",
                group: [
                  {
                    field: tokens.picklistField,
                    comparator: "equal",
                    value: { token: "CATEGORY", name: tokens.openCategoryName },
                  },
                  { field: tokens.textField, comparator: "not_contains", value: "z" },
                ],
              },
            ],
          }),
        ).toEqual([inside.id, outside.id]);
        const query = { viewId: defaultView.id, page: 1, perPage: 10 };
        for (const filters of [
          { field: markerField, comparator: "between" as Comparator, value: marker },
          { field: "Missing", comparator: "equal" as const, value: null },
          ...(filterValidationBoolean
            ? [
                {
                  field: filterValidationBoolean,
                  comparator: "contains" as const,
                  value: "true",
                },
              ]
            : []),
          {
            field: markerField,
            comparator: "less_equal" as const,
            value: { token: "AGEINDAYS" as const, offset: 1 },
          },
          {
            field: sys.createdTime,
            comparator: "less_equal" as const,
            value: "2026-06-15T00:00:00.000Z",
          },
          {
            field: markerField,
            comparator: "equal" as const,
            value: { token: "TODAY" as const },
          },
        ])
          await validation(timedService.list(moduleApiName, { ...query, filters }), "filters");
      },
    );
  });
}
