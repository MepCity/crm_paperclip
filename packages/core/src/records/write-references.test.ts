import { describe, expect, it } from "vitest";
import type { AccessData, AccessSnapshot } from "../access";
import { buildAccessSnapshot, standardPermissions } from "../access";
import { NotFoundError, ValidationError } from "../errors";
import { createFixtureRecordService } from "./fixture";

/** Audit leads 11, 14, 16, 20: writes must not trust ids the caller cannot read or edit. */
let ORG = "org-write-refs";
let counter = 0;
const ctxFor = (userId: string) => ({
  orgId: ORG,
  orgSlug: "write-refs",
  orgName: "Write refs",
  userId,
  role: "member" as const,
});

function snapshotFor(userId: string): AccessSnapshot {
  const data: AccessData = {
    orgId: ORG,
    userId,
    version: 1,
    profile: { id: "p", kind: "standard", permissions: standardPermissions() },
    fieldRows: [],
    roles: [{ id: "r", name: "R", parentRoleId: null, shareWithPeers: false }],
    members: [
      { userId: "alice", roleId: "r", profileId: "p" },
      { userId: "bob", roleId: "r", profileId: "p" },
    ],
    groupMembers: [],
    defaults: [],
    rules: [],
  };
  return buildAccessSnapshot(data);
}
const as = (userId: string) =>
  createFixtureRecordService(ctxFor(userId), { access: async () => snapshotFor(userId) });

async function seed() {
  ORG = `org-write-refs-${++counter}`;
  const alice = as("alice");
  const bob = as("bob");
  const account = await alice.create("Accounts", { Account_Name: "Alice Only" });
  const lead = await alice.create("Leads", { Last_Name: "Hidden", Company: "AliceCo" });
  const bobLead = await bob.create("Leads", { Last_Name: "Mine", Company: "BobCo" });
  return { alice, bob, account, lead, bobLead };
}

describe("write reference guards", () => {
  it("rejects create with a lookup to an unreadable record (leads 16/20)", async () => {
    const { bob, account } = await seed();
    await expect(
      bob.create("Contacts", {
        Last_Name: "X",
        Account_Name: { module: "Accounts", id: account.id },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects update with a lookup to an unreadable record (leads 16/20)", async () => {
    const { bob, account } = await seed();
    const contact = await bob.create("Contacts", { Last_Name: "Own" });
    await expect(
      bob.update("Contacts", contact.id, {
        Account_Name: { module: "Accounts", id: account.id },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("still allows a lookup to a readable record", async () => {
    const { alice, account } = await seed();
    const contact = await alice.create("Contacts", {
      Last_Name: "Fine",
      Account_Name: { module: "Accounts", id: account.id },
    });
    expect(contact.id).toBeTruthy();
  });

  it("rejects a note whose parent the caller cannot read (lead 11)", async () => {
    const { bob, lead } = await seed();
    await expect(
      bob.create("Notes", {
        Parent_Id: { module: "Leads", id: lead.id },
        Note_Content: "sneaky",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("conversion cannot reuse a record the caller cannot see (lead 14)", async () => {
    const { bob, bobLead, account } = await seed();
    await expect(
      bob.convertLead(bobLead.id, {
        contact: { create: { Last_Name: "C" } },
        account: { reuseId: account.id, update: { Owner: "bob" } },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const reread = await as("alice").get("Accounts", account.id);
    expect(reread.fields.Owner).not.toBe("bob");
  });
});
