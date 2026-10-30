import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dir = __dirname;
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".eml"))
  .sort();
const allowedDomains = new Set(["example.com", "example.org", "example.net"]);

describe("synthetic mail fixtures", () => {
  it("contains the expected number of fixtures", () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of files) {
    const text = readFileSync(path.join(dir, file), "utf8");

    describe(file, () => {
      it("uses CRLF line endings only", () => {
        expect(text.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
        expect(text.endsWith("\r\n")).toBe(true);
      });

      it("has From, Date and Message-ID headers", () => {
        const head = text.split("\r\n\r\n")[0] ?? "";
        for (const name of ["From", "Date", "Message-ID"]) {
          expect(head, name).toMatch(new RegExp(`^${name}:`, "mi"));
        }
      });

      it("only uses reserved example domains", () => {
        const domains = [...text.matchAll(/@([A-Za-z0-9.-]+)/g)].map((m) =>
          (m[1] ?? "").toLowerCase().replace(/\.$/, ""),
        );
        expect(domains.length).toBeGreaterThan(0);
        for (const domain of domains) {
          expect(allowedDomains.has(domain), `${file}: ${domain}`).toBe(true);
        }
      });
    });
  }
});
