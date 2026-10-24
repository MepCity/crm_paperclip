import { describe, expect, it } from "vitest";
import { fixtureDocumentsPort } from "./fixture-port";
import type { DocumentFolder, DocumentItem } from "./port";

async function findFolderWithMultipleItems(): Promise<string> {
  const folders = await fixtureDocumentsPort.listFolders();
  for (const folder of folders) {
    const items = await fixtureDocumentsPort.listItems(folder.id, {
      field: "modifiedAt",
      direction: "desc",
    });
    if (items.length >= 2) {
      return folder.id;
    }
    for (const item of items) {
      if (item.kind === "folder") {
        const subItems = await fixtureDocumentsPort.listItems(item.id, {
          field: "modifiedAt",
          direction: "desc",
        });
        if (subItems.length >= 2) {
          return item.id;
        }
      }
    }
  }
  throw new Error("No folder with at least 2 items found in fixture");
}

describe("fixtureDocumentsPort", () => {
  describe("listFolders", () => {
    it("returns every folder with a non-empty unique id, section in my|team, and boolean locked", async () => {
      const folders: readonly DocumentFolder[] = await fixtureDocumentsPort.listFolders();

      expect(folders.length).toBeGreaterThan(0);

      const ids = folders.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);

      for (const folder of folders) {
        expect(typeof folder.id).toBe("string");
        expect(folder.id.trim().length).toBeGreaterThan(0);

        expect(typeof folder.name).toBe("string");
        expect(folder.name.trim().length).toBeGreaterThan(0);

        expect(["my", "team"]).toContain(folder.section);
        expect(typeof folder.locked).toBe("boolean");

        if (folder.title !== undefined) {
          expect(typeof folder.title).toBe("string");
          expect(folder.title.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("listItems", () => {
    it("returns only direct children whose parentId matches folderId", async () => {
      const folders = await fixtureDocumentsPort.listFolders();
      let matchedItemsCount = 0;

      for (const folder of folders) {
        const items = await fixtureDocumentsPort.listItems(folder.id, {
          field: "modifiedAt",
          direction: "desc",
        });
        for (const item of items) {
          expect(item.parentId).toBe(folder.id);
          expect(typeof item.id).toBe("string");
          expect(item.id.trim().length).toBeGreaterThan(0);
          expect(typeof item.name).toBe("string");
          expect(item.name.trim().length).toBeGreaterThan(0);
          expect(["folder", "file"]).toContain(item.kind);
          expect(typeof item.uploadedBy).toBe("string");
          expect(typeof item.modifiedBy).toBe("string");
          expect(typeof item.modifiedAt).toBe("string");
          expect(Number.isNaN(Date.parse(item.modifiedAt))).toBe(false);
          matchedItemsCount++;
        }
      }

      expect(matchedItemsCount).toBeGreaterThan(0);
    });

    it("returns an empty list for an unknown folder id", async () => {
      const items = await fixtureDocumentsPort.listItems("non-existent-folder-id-xyz", {
        field: "modifiedAt",
        direction: "desc",
      });
      expect(items).toEqual([]);
    });

    it("sorts newest-first for desc and oldest-first for asc by modifiedAt values, without mutating the fixture", async () => {
      const folderId = await findFolderWithMultipleItems();

      const descFirst = await fixtureDocumentsPort.listItems(folderId, {
        field: "modifiedAt",
        direction: "desc",
      });
      const asc = await fixtureDocumentsPort.listItems(folderId, {
        field: "modifiedAt",
        direction: "asc",
      });
      const descSecond = await fixtureDocumentsPort.listItems(folderId, {
        field: "modifiedAt",
        direction: "desc",
      });

      expect(descFirst.length).toBeGreaterThanOrEqual(2);
      expect(asc.length).toBe(descFirst.length);

      // Verify descending order: newest first
      for (let i = 0; i < descFirst.length - 1; i++) {
        const currentItem = descFirst[i];
        const nextItem = descFirst[i + 1];
        expect(currentItem).toBeDefined();
        expect(nextItem).toBeDefined();
        if (currentItem && nextItem) {
          const current = new Date(currentItem.modifiedAt).getTime();
          const next = new Date(nextItem.modifiedAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }

      // Verify ascending order: oldest first
      for (let i = 0; i < asc.length - 1; i++) {
        const currentItem = asc[i];
        const nextItem = asc[i + 1];
        expect(currentItem).toBeDefined();
        expect(nextItem).toBeDefined();
        if (currentItem && nextItem) {
          const current = new Date(currentItem.modifiedAt).getTime();
          const next = new Date(nextItem.modifiedAt).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }

      // Call desc then asc then desc again; first and last results equal
      expect(descFirst).toEqual(descSecond);
      expect(descFirst).not.toBe(descSecond);
      expect(descFirst).not.toEqual(asc);
    });
  });

  describe("getItem", () => {
    it("returns the item for a known id and preserves its structural properties", async () => {
      const folders = await fixtureDocumentsPort.listFolders();
      let targetItem: DocumentItem | undefined;

      for (const folder of folders) {
        const items = await fixtureDocumentsPort.listItems(folder.id, {
          field: "modifiedAt",
          direction: "desc",
        });
        if (items.length > 0) {
          targetItem = items[0];
          break;
        }
      }

      expect(targetItem).toBeDefined();
      if (!targetItem) return;

      const item = await fixtureDocumentsPort.getItem(targetItem.id);
      expect(item).toBeDefined();
      expect(item).toEqual(targetItem);
      expect(item?.id).toBe(targetItem.id);
      expect(typeof item?.name).toBe("string");
      expect(item?.name.trim().length).toBeGreaterThan(0);
      expect(["folder", "file"]).toContain(item?.kind);
      expect(item?.parentId).toBe(targetItem.parentId);
      expect(typeof item?.uploadedBy).toBe("string");
      expect(typeof item?.modifiedBy).toBe("string");
      expect(typeof item?.modifiedAt).toBe("string");
      expect(Number.isNaN(Date.parse(item?.modifiedAt ?? ""))).toBe(false);
    });

    it("returns undefined for an unknown id", async () => {
      const result = await fixtureDocumentsPort.getItem("non-existent-item-id-xyz");
      expect(result).toBeUndefined();
    });
  });
});
