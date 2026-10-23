export type ScanVerdict =
  | { status: "clean" }
  | { status: "infected"; signature?: string }
  | { status: "skipped"; reason: "scanner_off" }
  | { status: "error" };

export interface AttachmentScanner {
  scan(input: { bytes: Uint8Array; name: string; contentType: string }): Promise<ScanVerdict>;
}

/** Scanner switched off by an explicit setting: never throws. */
export function createOffScanner(): AttachmentScanner {
  return { scan: async () => ({ status: "skipped", reason: "scanner_off" }) };
}

/** Test adapter: files whose name is listed are reported infected. */
export function createFakeScanner(infectedNames: string[]): AttachmentScanner {
  const infected = new Set(infectedNames);
  return {
    scan: async ({ name }) =>
      infected.has(name)
        ? { status: "infected", signature: "Fake.Test.Signature" }
        : { status: "clean" },
  };
}

/** Infected, error or a failed file policy quarantine; clean and skipped are allowed. */
export function downloadGate(verdict: ScanVerdict, filePolicyOk: boolean): "allow" | "quarantine" {
  if (!filePolicyOk) return "quarantine";
  return verdict.status === "clean" || verdict.status === "skipped" ? "allow" : "quarantine";
}
