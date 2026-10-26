import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, RecordLockedError } from "../errors";
import type { RecordInput, RecordService } from "./contract";
import { createFixtureRecordService } from "./fixture";
import { supportedModules } from "./fixture/registry";

// Model locked children without adding an unsupported public lock operation.
vi.mock("./fixture/registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("./fixture/registry")>();
  const modules = { ...original.fixtureModules };
  for (const name of ["Notes", "Contact_Roles"]) {
    const bundle = modules[name];
    if (!bundle) throw new Error("Missing child bundle");
    modules[name] = {
      ...bundle,
      afterWrite(record) {
        if (
          record.fields.Note_Title === "Locked child" ||
          record.fields.Contact_Role === "Evaluator"
        )
          record.fields = { ...record.fields, Locked__s: true };
      },
    };
  }
  return { ...original, fixtureModules: modules };
});
const make = () =>
  createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "children",
    orgName: "Synthetic Children",
    userId: "child-user",
    role: "admin",
  });
const inputs: Record<string, RecordInput> = {
  Leads: { Last_Name: "Synthetic Parent", Company: "Synthetic Company" },
  Contacts: { Last_Name: "Synthetic Parent" },
  Accounts: { Account_Name: "Synthetic Parent" },
  Deals: { Deal_Name: "Synthetic Parent", Stage: "Qualification", Closing_Date: "2026-10-30" },
};
async function parent(service: RecordService, module: string) {
  const account =
    module === "Deals" ? await service.create("Accounts", inputs.Accounts ?? {}) : undefined;
  return service.create(module, {
    ...inputs[module],
    ...(account ? { Account_Name: { module: "Accounts", id: account.id } } : {}),
  });
}
async function rows(service: RecordService, module: string, field: string, id: string) {
  const view = (await service.listViews(module))[0];
  if (!view) throw new Error("Missing view");
  return (
    await service.list(module, {
      viewId: view.id,
      page: 1,
      perPage: 100,
      filters: { field, comparator: "equal", value: id },
    })
  ).records;
}

describe("child module integration", () => {
  it("creates, filters, updates and deletes both child modules with tenant isolation", async () => {
    const service = make();
    const contact = await parent(service, "Contacts");
    const deal = await parent(service, "Deals");
    for (const [module, input, field, id, update] of [
      [
        "Notes",
        { Parent_Id: { module: "Contacts", id: contact.id }, Note_Content: "Synthetic content" },
        "Parent_Id",
        contact.id,
        { Note_Title: "Updated title" },
      ],
      [
        "Contact_Roles",
        { Deal: { module: "Deals", id: deal.id }, Contact: { module: "Contacts", id: contact.id } },
        "Deal",
        deal.id,
        { Contact_Role: "Purchasing" },
      ],
    ] as const) {
      const created = await service.create(module, input);
      expect((await rows(service, module, field, id)).map((row) => row.id)).toEqual([created.id]);
      const updated = await service.update(module, created.id, update);
      expect(updated.fields).toMatchObject(update);
      await expect(make().get(module, created.id)).rejects.toBeInstanceOf(NotFoundError);
      await service.delete(module, [created.id]);
      expect(await rows(service, module, field, id)).toEqual([]);
    }
  });
  it("hides children from implicit and explicit global/advanced search and duplicate discovery", async () => {
    const service = make();
    const contact = await parent(service, "Contacts");
    await service.create("Notes", {
      Parent_Id: { module: "Contacts", id: contact.id },
      Note_Title: "Unique child needle",
    });
    for (const query of [
      { text: "Unique child needle" },
      { text: "Unique child needle", modules: ["Notes", "Contact_Roles"] },
      {
        text: "Unique child needle",
        modules: ["Notes"],
        filters: { field: "Note_Title", comparator: "equal", value: "Unique child needle" },
      },
    ] as const)
      expect(await service.search(query)).toEqual([]);
    for (const module of ["Notes", "Contact_Roles"]) {
      expect(supportedModules).not.toContain(module);
      expect(await service.findDuplicateGroups(module, ["id"])).toEqual([]);
    }
  });
  it.each(Object.keys(inputs))(
    "cascades locked notes after validating every %s target; merge retains their IDs",
    async (module) => {
      const service = make();
      const master = await parent(service, module);
      const duplicate = await parent(service, module);
      const note = await service.create("Notes", {
        Parent_Id: { module, id: duplicate.id },
        Note_Title: "Locked child",
      });
      const activityField = ["Leads", "Contacts"].includes(module) ? "Who_Id" : "What_Id";
      const task = await service.create("Tasks", {
        Subject: "Synthetic activity",
        [activityField]: { module, id: duplicate.id },
      });
      await expect(service.delete(module, [duplicate.id, "missing"])).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(service.delete("Notes", [note.id])).rejects.toBeInstanceOf(RecordLockedError);
      await service.merge(module, {
        masterId: master.id,
        duplicateIds: [duplicate.id],
        values: {},
      });
      expect((await service.get("Notes", note.id)).fields.Parent_Id).toMatchObject({
        module,
        id: master.id,
      });
      expect((await service.get("Tasks", task.id)).fields[activityField]).toMatchObject({
        module,
        id: master.id,
      });
      await service.delete(module, [master.id]);
      for (const [name, id] of [
        ["Notes", note.id],
        ["Tasks", task.id],
      ] as const)
        await expect(service.get(name, id)).rejects.toBeInstanceOf(NotFoundError);
    },
  );
  it.each(["Deals", "Contacts"])("cascades locked role rows when %s is deleted", async (module) => {
    const service = make();
    const contact = await parent(service, "Contacts");
    const deal = await parent(service, "Deals");
    const role = await service.create("Contact_Roles", {
      Deal: { module: "Deals", id: deal.id },
      Contact: { module: "Contacts", id: contact.id },
      Contact_Role: "Evaluator",
    });
    await expect(service.delete("Contact_Roles", [role.id])).rejects.toBeInstanceOf(
      RecordLockedError,
    );
    const id = module === "Deals" ? deal.id : contact.id;
    await expect(service.delete(module, [id, "missing"])).rejects.toBeInstanceOf(NotFoundError);
    expect((await service.get("Contact_Roles", role.id)).id).toBe(role.id);
    await service.delete(module, [id]);
    await expect(service.get("Contact_Roles", role.id)).rejects.toBeInstanceOf(NotFoundError);
  });
  it("transfers contact roles and drops repeated deals, keeping the master's role", async () => {
    const service = make();
    const master = await parent(service, "Contacts");
    const duplicates = [
      await parent(service, "Contacts"),
      await parent(service, "Contacts"),
    ] as const;
    const deals = [await parent(service, "Deals"), await parent(service, "Deals")] as const;
    const role = async (contactId: string, dealId: string) =>
      service.create("Contact_Roles", {
        Deal: { module: "Deals", id: dealId },
        Contact: { module: "Contacts", id: contactId },
        Contact_Role: "Evaluator",
      });
    const retained = await role(master.id, deals[0].id);
    const removed = await role(duplicates[0].id, deals[0].id);
    const moved = await role(duplicates[0].id, deals[1].id);
    const repeated = await role(duplicates[1].id, deals[1].id);
    await service.merge("Contacts", {
      masterId: master.id,
      duplicateIds: duplicates.map((row) => row.id),
      values: {},
    });
    expect(
      (await rows(service, "Contact_Roles", "Contact", master.id)).map((row) => row.id).sort(),
    ).toEqual([retained.id, moved.id].sort());
    for (const id of [removed.id, repeated.id])
      await expect(service.get("Contact_Roles", id)).rejects.toBeInstanceOf(NotFoundError);
  });
  it("leaves child bindings intact when a staged merge fails uniqueness validation", async () => {
    const service = make();
    const master = await service.create("Contacts", {
      Last_Name: "Master",
      Email: "master@example.test",
    });
    const duplicate = await service.create("Contacts", {
      Last_Name: "Duplicate",
      Email: "duplicate@example.test",
    });
    await service.create("Contacts", { Last_Name: "Other", Email: "other@example.test" });
    const note = await service.create("Notes", {
      Parent_Id: { module: "Contacts", id: duplicate.id },
    });
    const deal = await parent(service, "Deals");
    const role = await service.create("Contact_Roles", {
      Contact: { module: "Contacts", id: duplicate.id },
      Deal: { module: "Deals", id: deal.id },
    });
    await expect(
      service.merge("Contacts", {
        masterId: master.id,
        duplicateIds: [duplicate.id],
        values: { Email: "other@example.test" },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect((await service.get("Notes", note.id)).fields.Parent_Id).toMatchObject({
      module: "Contacts",
      id: duplicate.id,
    });
    expect((await service.get("Contact_Roles", role.id)).fields.Contact).toMatchObject({
      module: "Contacts",
      id: duplicate.id,
    });
    expect((await service.get("Contacts", master.id)).fields.Email).toBe("master@example.test");
    expect((await service.get("Contacts", duplicate.id)).id).toBe(duplicate.id);
  });
  it("keeps a converted Lead's notes on that Lead when it is updated", async () => {
    const service = make();
    const lead = (await service.list("Leads", { viewId: "converted-leads", page: 1, perPage: 10 }))
      .records[0];
    if (!lead) throw new Error("Missing converted Lead");
    const note = await service.create("Notes", { Parent_Id: { module: "Leads", id: lead.id } });
    await service.update("Leads", lead.id, { Phone: "5550100" });
    expect((await service.get("Notes", note.id)).fields.Parent_Id).toMatchObject({
      module: "Leads",
      id: lead.id,
    });
  });
});
