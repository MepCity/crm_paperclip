import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import { MAX_INBOUND_ATTACHMENT_BYTES as CAP } from "../types";
import { inboundStorageDecision, validateOutboundAttachments } from "./policy";
import { createFakeScanner, createOffScanner, downloadGate } from "./scanner";

const f = (sizeBytes: number, name = "a.pdf") => ({
  name,
  sizeBytes,
  contentType: "application/pdf",
});

describe("validateOutboundAttachments", () => {
  it("passes exactly at the cap", () => {
    expect(() => validateOutboundAttachments([f(CAP)])).not.toThrow();
  });
  it("fails at cap + 1 with field attachments", () => {
    try {
      validateOutboundAttachments([f(CAP + 1)]);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(Object.keys((e as ValidationError).fieldErrors)).toEqual(["attachments"]);
    }
  });
  it("sums several files", () => {
    expect(() => validateOutboundAttachments([f(CAP / 2), f(CAP / 2, "b")])).not.toThrow();
    expect(() => validateOutboundAttachments([f(CAP / 2), f(CAP / 2 + 1, "b")])).toThrow(
      ValidationError,
    );
  });
  it("honours a custom cap", () => {
    expect(() => validateOutboundAttachments([f(11)], 10)).toThrow(ValidationError);
  });
  it("rejects invalid sizes and empty names", () => {
    expect(() => validateOutboundAttachments([f(-1)])).toThrow(ValidationError);
    expect(() => validateOutboundAttachments([f(1.5)])).toThrow(ValidationError);
    expect(() => validateOutboundAttachments([f(1, "  ")])).toThrow(ValidationError);
  });
});

describe("inboundStorageDecision", () => {
  it("stores up to the cap and drops above", () => {
    expect(inboundStorageDecision(CAP)).toBe("store");
    expect(inboundStorageDecision(CAP + 1)).toBe("not_stored");
  });
});

describe("scanners and gate", () => {
  const input = { bytes: new Uint8Array(1), contentType: "text/plain" };
  it("off scanner skips and never throws", async () => {
    expect(await createOffScanner().scan({ ...input, name: "x" })).toEqual({
      status: "skipped",
      reason: "scanner_off",
    });
  });
  it("fake scanner flags listed names", async () => {
    const s = createFakeScanner(["bad.exe"]);
    expect((await s.scan({ ...input, name: "bad.exe" })).status).toBe("infected");
    expect((await s.scan({ ...input, name: "ok.txt" })).status).toBe("clean");
  });
  it("maps every verdict to a gate result", () => {
    expect(downloadGate({ status: "clean" }, true)).toBe("allow");
    expect(downloadGate({ status: "skipped", reason: "scanner_off" }, true)).toBe("allow");
    expect(downloadGate({ status: "infected" }, true)).toBe("quarantine");
    expect(downloadGate({ status: "error" }, true)).toBe("quarantine");
    expect(downloadGate({ status: "clean" }, false)).toBe("quarantine");
  });
});
