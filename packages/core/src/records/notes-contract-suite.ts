import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordService } from "./contract";
import {
  callsRecordServiceContractModule,
  campaignsRecordServiceContractModule,
  casesRecordServiceContractModule,
  eventsRecordServiceContractModule,
  solutionsRecordServiceContractModule,
  tasksRecordServiceContractModule,
} from "./contract-suite-module";

type Options = { canReadRecord?: (module: string, id: string) => boolean };
type Factory = (ctx: OrgContext, options?: Options) => RecordService | Promise<RecordService>;
const modules = ["Tasks", "Events", "Calls", "Campaigns", "Cases", "Solutions"] as const;
const definitions = {
  Tasks: tasksRecordServiceContractModule,
  Events: eventsRecordServiceContractModule,
  Calls: callsRecordServiceContractModule,
  Campaigns: campaignsRecordServiceContractModule,
  Cases: casesRecordServiceContractModule,
  Solutions: solutionsRecordServiceContractModule,
};
const context = (): OrgContext => ({
  orgId: randomUUID(),
  orgSlug: "notes-contract",
  orgName: "Notes Contract",
  userId: "notes-user",
  role: "admin",
});

/** The same parent-bound CRUD, visibility and tenant contract over both adapters. */
export function describeNotesContract(name: string, factory: Factory) {
  describe(`${name}: notes parent contract`, () => {
    for (const module of modules) {
      it(`${module}: CRUD, parent validation and tenant isolation`, async () => {
        const service = await factory(context());
        const view = (await service.listViews(module)).find((view) => view.criteria === null);
        if (!view) throw new Error("Missing parent view");
        const parent = (
          await service.list(module, { viewId: view.id, page: 1, perPage: 10 })
        ).records.find((record) => record.fields.Locked__s !== true);
        if (!parent) throw new Error("Missing synthetic parent");
        const Parent_Id = { module, id: parent.id };
        const note = await service.create("Notes", { Parent_Id, Note_Content: "Synthetic note" });
        const query = {
          viewId: "all-notes",
          page: 1,
          perPage: 100,
          filters: { field: "Parent_Id", comparator: "equal", value: Parent_Id },
        } as const;
        expect((await service.list("Notes", query)).records.map((row) => row.id)).toContain(
          note.id,
        );
        expect((await service.get("Notes", note.id)).fields.Parent_Id).toMatchObject(Parent_Id);
        expect(
          (await service.update("Notes", note.id, { Note_Title: "Updated" })).fields.Note_Title,
        ).toBe("Updated");
        const other = await factory(context());
        await expect(other.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
        const privateParent = await service.create(
          module,
          definitions[module].buildMinimalValidInput(),
        );
        await expect(
          other.create("Notes", { Parent_Id: { module, id: privateParent.id } }),
        ).rejects.toBeInstanceOf(ValidationError);
        await expect(
          service.create("Notes", { Parent_Id: { module, id: "missing" } }),
        ).rejects.toBeInstanceOf(ValidationError);
        await service.delete("Notes", [note.id]);
        await expect(service.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
        const retained = await service.create("Notes", { Parent_Id, Note_Content: "Cascade" });
        await service.delete(module, [parent.id]);
        await expect(service.get("Notes", retained.id)).rejects.toBeInstanceOf(NotFoundError);
        expect((await service.list("Notes", query)).records).toEqual([]);
        await expect(service.create("Notes", { Parent_Id })).rejects.toBeInstanceOf(
          ValidationError,
        );
      });

      it(`${module}: denies hidden-parent reads and every note mutation`, async () => {
        const ctx = context();
        const service = await factory(ctx);
        const view = (await service.listViews(module)).find((view) => view.criteria === null);
        if (!view) throw new Error("Missing view");
        const parent = (await service.list(module, { viewId: view.id, page: 1, perPage: 10 }))
          .records[0];
        if (!parent) throw new Error("Missing parent");
        const Parent_Id = { module, id: parent.id };
        const note = await service.create("Notes", { Parent_Id, Note_Content: "Private" });
        const reader = await factory(ctx, {
          canReadRecord: (target, id) => target !== module || id !== parent.id,
        });
        await expect(reader.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
        expect(
          (
            await reader.list("Notes", {
              viewId: "all-notes",
              page: 1,
              perPage: 100,
              filters: { field: "Parent_Id", comparator: "equal", value: Parent_Id },
            })
          ).records,
        ).toEqual([]);
        await expect(reader.create("Notes", { Parent_Id })).rejects.toBeInstanceOf(NotFoundError);
        await expect(
          reader.update("Notes", note.id, { Note_Title: "Denied" }),
        ).rejects.toBeInstanceOf(NotFoundError);
        await expect(
          reader.massUpdate("Notes", [note.id], { Note_Title: "Denied" }),
        ).rejects.toBeInstanceOf(NotFoundError);
        await expect(reader.delete("Notes", [note.id])).rejects.toBeInstanceOf(NotFoundError);
        expect((await service.get("Notes", note.id)).fields.Note_Content).toBe("Private");
      });
    }
    it("retains the unsupported-parent validation error", async () => {
      const service = await factory(context());
      await expect(
        service.create("Notes", { Parent_Id: { module: "Unknown", id: "missing" } }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
}
