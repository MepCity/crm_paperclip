import type { RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  buildAccountContactTree,
  buildNoAccountContactTree,
  getContactAccountRef,
  getContactFullName,
  getContactReportingToId,
} from "./contact-hierarchy-tree";

function makeContact(
  id: string,
  fullName: string,
  reportingTo?: string | { module?: string; id: string; name?: string } | null,
  accountName?: string | { module?: string; id: string; name?: string } | null,
): RecordData {
  return {
    id,
    fields: {
      Full_Name: fullName,
      ...(reportingTo !== undefined
        ? {
            Reporting_To:
              typeof reportingTo === "string"
                ? { module: "Contacts", id: reportingTo }
                : reportingTo
                  ? {
                      module: reportingTo.module ?? "Contacts",
                      id: reportingTo.id,
                      name: reportingTo.name,
                    }
                  : null,
          }
        : {}),
      ...(accountName !== undefined
        ? {
            Account_Name:
              typeof accountName === "string"
                ? { module: "Accounts", id: accountName, name: accountName }
                : accountName
                  ? {
                      module: accountName.module ?? "Accounts",
                      id: accountName.id,
                      name: accountName.name,
                    }
                  : null,
          }
        : {}),
    },
  };
}

describe("contact-hierarchy-tree", () => {
  const testAccount = { id: "acc-1", name: "Acme Corporation" };

  it("handles flat list: all contacts placed directly under root and sorted alphabetically", () => {
    const contacts: RecordData[] = [
      makeContact("c3", "Charlie"),
      makeContact("c1", "Alice"),
      makeContact("c2", "Bob"),
    ];

    const tree = buildAccountContactTree(testAccount, contacts);

    expect(tree.rootAccount).toEqual(testAccount);
    expect(tree.children.map((c) => c.name)).toEqual(["Alice", "Bob", "Charlie"]);
    expect(tree.children[0]?.children).toEqual([]);
    expect(tree.children[1]?.children).toEqual([]);
    expect(tree.children[2]?.children).toEqual([]);
  });

  it("handles nested 2+ levels: builds hierarchical reporting tree", () => {
    const contacts: RecordData[] = [
      makeContact("c1", "Alice CEO"), // top-level
      makeContact("c2", "Bob VP", "c1"), // reports to Alice
      makeContact("c3", "Charlie Director", "c2"), // reports to Bob
      makeContact("c4", "Diana Manager", "c3"), // reports to Charlie
      makeContact("c5", "Evan VP", "c1"), // reports to Alice
    ];

    const tree = buildAccountContactTree(testAccount, contacts);

    expect(tree.children.map((c) => c.name)).toEqual(["Alice CEO"]);
    const alice = tree.children[0];
    expect(alice?.children.map((c) => c.name)).toEqual(["Bob VP", "Evan VP"]);

    const bob = alice?.children.find((c) => c.id === "c2");
    expect(bob?.children.map((c) => c.name)).toEqual(["Charlie Director"]);

    const charlie = bob?.children[0];
    expect(charlie?.children.map((c) => c.name)).toEqual(["Diana Manager"]);
    expect(charlie?.children[0]?.children).toEqual([]);
  });

  it("handles manager outside set: contacts reporting to an external manager fall back under root", () => {
    const contacts: RecordData[] = [
      makeContact("c1", "Alice", "external-mgr-999"),
      makeContact("c2", "Bob", "c1"),
    ];

    const tree = buildAccountContactTree(testAccount, contacts);

    expect(tree.children.map((c) => c.name)).toEqual(["Alice"]);
    expect(tree.children[0]?.children.map((c) => c.name)).toEqual(["Bob"]);
  });

  it("handles cycles: contacts in a cycle fall back under root without infinite recursion", () => {
    // 2-node cycle: A -> B -> A
    const contacts2: RecordData[] = [
      makeContact("c1", "Alice", "c2"),
      makeContact("c2", "Bob", "c1"),
      makeContact("c3", "Charlie"),
    ];

    const tree2 = buildAccountContactTree(testAccount, contacts2);
    expect(tree2.children.map((c) => c.name)).toEqual(["Alice", "Bob", "Charlie"]);
    expect(tree2.children[0]?.children).toEqual([]);
    expect(tree2.children[1]?.children).toEqual([]);

    // 3-node cycle: A -> B -> C -> A
    const contacts3: RecordData[] = [
      makeContact("c1", "Alice", "c3"),
      makeContact("c2", "Bob", "c1"),
      makeContact("c3", "Charlie", "c2"),
    ];

    const tree3 = buildAccountContactTree(testAccount, contacts3);
    expect(tree3.children.map((c) => c.name)).toEqual(["Alice", "Bob", "Charlie"]);

    // Self-cycle: A -> A
    const contactsSelf: RecordData[] = [makeContact("c1", "Alice", "c1")];
    const treeSelf = buildAccountContactTree(testAccount, contactsSelf);
    expect(treeSelf.children.map((c) => c.name)).toEqual(["Alice"]);
    expect(treeSelf.children[0]?.children).toEqual([]);
  });

  it("preserves non-cycle child under a manager who is in a cycle", () => {
    // 2-node cycle between Alice and Bob; Cara reports to Alice
    const contacts: RecordData[] = [
      makeContact("c1", "Alice", "c2"),
      makeContact("c2", "Bob", "c1"),
      makeContact("c3", "Cara", "c1"),
    ];

    const tree = buildAccountContactTree(testAccount, contacts);

    // Root level has Alice and Bob
    expect(tree.children.map((c) => c.name)).toEqual(["Alice", "Bob"]);
    const alice = tree.children.find((c) => c.id === "c1");
    // Cara is nested under Alice
    expect(alice?.children.map((c) => c.name)).toEqual(["Cara"]);
    expect(alice?.children[0]?.children).toEqual([]);
    const bob = tree.children.find((c) => c.id === "c2");
    expect(bob?.children).toEqual([]);
  });

  it("handles empty list: only rootAccount rendered, empty children", () => {
    const tree = buildAccountContactTree(testAccount, []);

    expect(tree.rootAccount).toEqual(testAccount);
    expect(tree.children).toEqual([]);
  });

  it("preserves sibling alphabetical ordering at all depths", () => {
    const contacts: RecordData[] = [
      makeContact("c1", "Manager"),
      makeContact("c4", "Zoe", "c1"),
      makeContact("c2", "Adam", "c1"),
      makeContact("c3", "Maya", "c1"),
    ];

    const tree = buildAccountContactTree(testAccount, contacts);

    expect(tree.children[0]?.name).toBe("Manager");
    expect(tree.children[0]?.children.map((c) => c.name)).toEqual(["Adam", "Maya", "Zoe"]);
  });

  it("builds tree for Contacts entry without account (Rule 5)", () => {
    const current = { id: "curr-1", name: "Current Contact" };
    const manager = { id: "mgr-1", name: "Manager Person" };
    const directReports: RecordData[] = [
      makeContact("rep-2", "Zack Report"),
      makeContact("rep-1", "Anna Report"),
    ];

    // With manager
    const treeWithMgr = buildNoAccountContactTree(current, manager, directReports);
    expect(treeWithMgr.rootAccount).toBeUndefined();
    expect(treeWithMgr.children.length).toBe(1);
    expect(treeWithMgr.children[0]?.name).toBe("Manager Person");
    expect(treeWithMgr.children[0]?.children.length).toBe(1);
    expect(treeWithMgr.children[0]?.children[0]?.name).toBe("Current Contact");
    expect(treeWithMgr.children[0]?.children[0]?.children.map((c) => c.name)).toEqual([
      "Anna Report",
      "Zack Report",
    ]);

    // Without manager
    const treeNoMgr = buildNoAccountContactTree(current, null, directReports);
    expect(treeNoMgr.rootAccount).toBeUndefined();
    expect(treeNoMgr.children.length).toBe(1);
    expect(treeNoMgr.children[0]?.name).toBe("Current Contact");
    expect(treeNoMgr.children[0]?.children.map((c) => c.name)).toEqual([
      "Anna Report",
      "Zack Report",
    ]);

    // Without manager and without direct reports
    const treeSolo = buildNoAccountContactTree(current, null, []);
    expect(treeSolo.children.length).toBe(1);
    expect(treeSolo.children[0]?.name).toBe("Current Contact");
    expect(treeSolo.children[0]?.children).toEqual([]);
  });

  it("extracts contact full name and fallbacks", () => {
    expect(getContactFullName({ id: "c1", fields: { Full_Name: "John Doe" } })).toBe("John Doe");
    expect(
      getContactFullName({ id: "c2", fields: { First_Name: "Jane", Last_Name: "Smith" } }),
    ).toBe("Jane Smith");
    expect(getContactFullName({ id: "c3", fields: {} })).toBe("c3");
  });

  it("extracts Reporting_To and Account_Name refs safely", () => {
    expect(
      getContactReportingToId({
        id: "c1",
        fields: { Reporting_To: { module: "Contacts", id: "mgr-1" } },
      }),
    ).toBe("mgr-1");
    expect(getContactReportingToId({ id: "c2", fields: { Reporting_To: "mgr-2" } })).toBe("mgr-2");
    expect(getContactReportingToId({ id: "c3", fields: { Reporting_To: null } })).toBeNull();

    expect(getContactAccountRef({ module: "Accounts", id: "acc-1", name: "Acme" })).toEqual({
      id: "acc-1",
      name: "Acme",
    });
    expect(getContactAccountRef("acc-2")).toEqual({ id: "acc-2", name: "acc-2" });
    expect(getContactAccountRef(null)).toBeNull();
  });
});
