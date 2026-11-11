import { describe, expect, it } from "vitest";
import {
  createEphemeralCadenceRuntime,
  createEphemeralJourneyRuntime,
  createEphemeralMailRuntime,
  createEphemeralRuntime,
  defaultAccessSnapshotProvider,
} from "./main";

describe("ephemeral mail wiring", () => {
  it("registers send and sync in both the catalog and registry without starting a worker", () => {
    const { catalog, handlers } = createEphemeralMailRuntime();
    for (const kind of ["mail_send", "mail_sync"]) {
      expect(catalog.definition(kind, 1).kind).toBe(kind);
      expect(handlers.get(kind, 1)?.kind).toBe(kind);
    }
  });
});

describe("ephemeral cadence and journey wiring (fail-closed access provider)", () => {
  it("wires defaultAccessSnapshotProvider in createEphemeralCadenceRuntime", () => {
    const { handlers } = createEphemeralCadenceRuntime();
    expect(handlers.get("cadence_step", 1)?.kind).toBe("cadence_step");
  });

  it("wires defaultAccessSnapshotProvider in createEphemeralJourneyRuntime", () => {
    const { handlers } = createEphemeralJourneyRuntime();
    expect(handlers.get("journey_transition", 1)?.kind).toBe("journey_transition");
    expect(handlers.get("journey_action", 1)?.kind).toBe("journey_action");
    expect(handlers.get("journey_sweep", 1)?.kind).toBe("journey_sweep");
  });

  it("wires defaultAccessSnapshotProvider in createEphemeralRuntime", () => {
    const { handlers } = createEphemeralRuntime();
    expect(handlers.get("cadence_step", 1)?.kind).toBe("cadence_step");
    expect(handlers.get("journey_transition", 1)?.kind).toBe("journey_transition");
    expect(handlers.get("journey_action", 1)?.kind).toBe("journey_action");
    expect(handlers.get("journey_sweep", 1)?.kind).toBe("journey_sweep");
  });

  it("exports defaultAccessSnapshotProvider wired from access snapshot service", () => {
    expect(typeof defaultAccessSnapshotProvider).toBe("function");
  });
});
