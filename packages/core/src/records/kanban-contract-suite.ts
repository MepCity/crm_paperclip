import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordService } from "./contract";
import type { KanbanViewInput } from "./kanban-views";

type Factory = (
  ctx: OrgContext,
  options?: { now?: () => Date },
) => RecordService | Promise<RecordService>;

const valid: KanbanViewInput = {
  name: "Pipeline board",
  categorizeBy: "Stage",
  aggregateBy: "Amount",
  headerStyle: "mono_color",
  fields: ["Deal_Name", "Stage", "Amount"],
};

async function fieldCodes(promise: Promise<unknown>): Promise<string[]> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(ValidationError);
  return Object.keys((error as ValidationError).fieldErrors).sort();
}

/** Kanban view tests shared by fixture and future persistent adapters (Deals). */
export function describeKanbanViewContract(name: string, makeService: Factory): void {
  describe(`${name}: kanban view contract`, () => {
    let service: RecordService;
    let ctx: OrgContext;
    beforeEach(async () => {
      const id = randomUUID();
      ctx = {
        orgId: id,
        orgSlug: `kanban-${id}`,
        orgName: "Kanban Organization",
        userId: "kanban-user",
        role: "admin",
      };
      service = await makeService(ctx);
    });

    it("seeds the stage view for Deals and nothing for other modules", async () => {
      const views = await service.listKanbanViews("Deals");
      expect(views).toHaveLength(1);
      expect(views[0]).toMatchObject({
        name: "STAGEVIEW",
        categorizeBy: "Stage",
        aggregateBy: "Amount",
        headerStyle: "mono_color",
        sharedTo: "everyone",
        createdBy: { id: "kanban-user" },
        modifiedBy: { id: "kanban-user" },
        fields: [
          "Deal_Name",
          "Stage",
          "Account_Name",
          "Owner",
          "Contact_Name",
          "Amount",
          "Closing_Date",
        ],
      });
      expect(await service.listKanbanViews("Leads")).toEqual([]);
      expect(await service.getKanbanView("Deals", (views[0] as { id: string }).id)).toEqual(
        views[0],
      );
    });

    it("rejects an unknown module and an unknown view", async () => {
      await expect(service.listKanbanViews("Nope")).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.getKanbanView("Deals", "missing")).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.updateKanbanView("Deals", "missing", valid)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("creates a view, trims the name, keeps field order and persists it", async () => {
      const created = await service.createKanbanView("Deals", {
        ...valid,
        name: "  Pipeline board  ",
        fields: ["Amount", "Deal_Name", "Stage"],
      });
      expect(created.name).toBe("Pipeline board");
      expect(created.fields).toEqual(["Amount", "Deal_Name", "Stage"]);
      expect(await service.getKanbanView("Deals", created.id)).toEqual(created);
      expect(await service.listKanbanViews("Deals")).toHaveLength(2);
    });

    it("defaults sharedTo to only_me and shows only_me views to their creator alone", async () => {
      const created = await service.createKanbanView("Deals", valid);
      expect(created).toMatchObject({
        sharedTo: "only_me",
        createdBy: { id: "kanban-user" },
        modifiedBy: { id: "kanban-user" },
      });
      const shared = await service.createKanbanView("Deals", {
        ...valid,
        name: "Shared board",
        sharedTo: "everyone",
      });
      expect(shared.sharedTo).toBe("everyone");
      const other = await makeService({ ...ctx, userId: "other-user" });
      const names = (await other.listKanbanViews("Deals")).map((view) => view.name);
      expect(names).toEqual(["STAGEVIEW", "Shared board"]);
      await expect(other.getKanbanView("Deals", created.id)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("ignores sharedTo on update and records the modifier", async () => {
      const created = await service.createKanbanView("Deals", valid);
      const updated = await service.updateKanbanView("Deals", created.id, {
        ...valid,
        sharedTo: "everyone",
      });
      expect(updated.sharedTo).toBe("only_me");
      expect(updated.createdBy).toEqual(created.createdBy);
    });

    it("rejects an unknown sharedTo value", async () => {
      expect(
        await fieldCodes(
          service.createKanbanView("Deals", { ...valid, sharedTo: "selected_users" as never }),
        ),
      ).toEqual(["sharedTo"]);
    });

    it("keeps views per organization", async () => {
      await service.createKanbanView("Deals", valid);
      const other = await makeService({ ...ctx, orgId: randomUUID(), orgSlug: "other-org" });
      expect(await other.listKanbanViews("Deals")).toHaveLength(1);
    });

    it("updates a view and allows aggregateBy null", async () => {
      const created = await service.createKanbanView("Deals", valid);
      const updated = await service.updateKanbanView("Deals", created.id, {
        ...valid,
        aggregateBy: null,
        fields: ["Deal_Name", "Stage"],
      });
      expect(updated).toMatchObject({
        id: created.id,
        aggregateBy: null,
        fields: ["Deal_Name", "Stage"],
      });
      expect(await service.getKanbanView("Deals", created.id)).toEqual(updated);
    });

    it("requires a name and keeps names unique ignoring case", async () => {
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, name: "   " })),
      ).toEqual(["name"]);
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, name: "stageview" })),
      ).toEqual(["name"]);
      const created = await service.createKanbanView("Deals", valid);
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, name: "PIPELINE BOARD" })),
      ).toEqual(["name"]);
      // Renaming a view to its own name (any case) is not a duplicate.
      await service.updateKanbanView("Deals", created.id, { ...valid, name: "pipeline board" });
    });

    it("validates categorizeBy as a picklist field", async () => {
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, categorizeBy: "Amount" })),
      ).toEqual(["categorizeBy"]);
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, categorizeBy: "Nope" })),
      ).toEqual(["categorizeBy"]);
    });

    it("validates aggregateBy as null or a number/currency field", async () => {
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, aggregateBy: "Stage" })),
      ).toEqual(["aggregateBy"]);
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, aggregateBy: "Nope" })),
      ).toEqual(["aggregateBy"]);
    });

    it("validates the header style", async () => {
      expect(
        await fieldCodes(service.createKanbanView("Deals", { ...valid, headerStyle: "rainbow" })),
      ).toEqual(["headerStyle"]);
    });

    it("validates the card fields", async () => {
      const bad = (fields: string[]) =>
        fieldCodes(service.createKanbanView("Deals", { ...valid, fields }));
      expect(await bad([])).toEqual(["fields"]);
      expect(await bad(["Deal_Name", "Nope"])).toEqual(["fields"]);
      expect(await bad(["Deal_Name", "Deal_Name"])).toEqual(["fields"]);
      expect(await bad(["Stage", "Amount"])).toEqual(["fields"]);
    });
  });
}
