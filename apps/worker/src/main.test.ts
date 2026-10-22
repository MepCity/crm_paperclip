import { describe, expect, it } from "vitest";
import { createEphemeralMailRuntime } from "./main";

describe("ephemeral mail wiring", () => {
  it("registers send and sync in both the catalog and registry without starting a worker", () => {
    const { catalog, handlers } = createEphemeralMailRuntime();
    for (const kind of ["mail_send", "mail_sync"]) {
      expect(catalog.definition(kind, 1).kind).toBe(kind);
      expect(handlers.get(kind, 1)?.kind).toBe(kind);
    }
  });
});
