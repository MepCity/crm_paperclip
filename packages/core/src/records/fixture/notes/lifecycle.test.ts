import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../../errors";
import { createFixtureRecordService } from "../index";

describe("Notes extended parent lifecycle", () => {
  it.each(["Tasks", "Events", "Calls", "Campaigns", "Cases", "Solutions"])(
    "%s: atomically retains, restores and purges notes with the parent",
    async (module) => {
      const service = createFixtureRecordService({
        orgId: randomUUID(),
        orgSlug: "notes-lifecycle",
        orgName: "Notes Lifecycle",
        userId: "notes-user",
        role: "admin",
      });
      const view = (await service.listViews(module)).find((view) => view.criteria === null);
      if (!view) throw new Error("Missing view");
      const parent = (
        await service.list(module, { viewId: view.id, page: 1, perPage: 10 })
      ).records.find((row) => row.fields.Locked__s !== true);
      if (!parent) throw new Error("Missing parent");
      // Timeline notes remain projections; history must still accept every new parent.
      await expect(service.history.list(module, parent.id, { perPage: 10 })).resolves.toBeDefined();
      const Parent_Id = { module, id: parent.id };
      const note = await service.create("Notes", { Parent_Id, Note_Content: "Retained note" });
      await expect(service.delete(module, [parent.id, "missing"])).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(await service.get("Notes", note.id)).toEqual(note);
      await service.delete(module, [parent.id]);
      await expect(service.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.create("Notes", { Parent_Id })).rejects.toBeInstanceOf(ValidationError);
      const entry = (await service.recycleBin.list()).entries.find(
        (row) => row.module === module && row.recordId === parent.id,
      );
      if (!entry) throw new Error("Missing deletion entry");
      await service.recycleBin.restore([entry.id]);
      expect(await service.get("Notes", note.id)).toEqual(note);
      await service.delete(module, [parent.id]);
      const next = (await service.recycleBin.list()).entries.find(
        (row) => row.module === module && row.recordId === parent.id,
      );
      if (!next) throw new Error("Missing deletion entry");
      await service.recycleBin.purge([next.id]);
      await expect(service.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
      expect((await service.recycleBin.list()).entries).toEqual([]);
    },
  );
});
