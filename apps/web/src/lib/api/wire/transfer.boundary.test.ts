import { describe, expect, it, vi } from "vitest";

// Browser consumers must never evaluate the server entry point (auth and database).
vi.mock("@crm/core", () => {
  throw new Error("Transfer wire code loaded the server core entry point.");
});

import { TRANSFER_MODULES, transferOperations } from "./transfer";

describe("transfer browser boundary", () => {
  it("loads the wire operations and shared registry without server dependencies", () => {
    expect(TRANSFER_MODULES).toEqual([
      "Leads",
      "Contacts",
      "Accounts",
      "Deals",
      "Tasks",
      "Events",
      "Calls",
      "Solutions",
      "Cases",
    ]);
    expect(transferOperations.runImport.path).toBe("/crm/v2.2/{module}/actions/import");
  });
});
