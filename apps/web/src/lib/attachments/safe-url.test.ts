import { describe, expect, it } from "vitest";
import { safeAttachmentUrl } from "./safe-url";

describe("safeAttachmentUrl", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/plain,hello",
    "/relative/path",
    "ftp://example.test/file",
    "",
    "   ",
    null,
    undefined,
    42,
  ])("rejects an invalid attachment URL: %s", (value) => {
    expect(safeAttachmentUrl(value)).toBeNull();
  });

  it("trims and normalizes an HTTPS URL", () => {
    expect(safeAttachmentUrl("  https://EXAMPLE.test/file  ")).toBe("https://example.test/file");
  });

  it("accepts HTTP URLs", () => {
    expect(safeAttachmentUrl("http://example.test")).toBe("http://example.test/");
  });

  it("accepts exactly 2,048 characters and rejects 2,049", () => {
    const url = "https://example.test/".padEnd(2048, "a");
    expect(safeAttachmentUrl(url)).toBe(url);
    expect(safeAttachmentUrl(`${url}a`)).toBeNull();
  });

  it("rejects a short input whose percent-encoded href exceeds 2,048 characters", () => {
    const url = `https://example.test/${"é".repeat(400)}`;
    expect(url.length).toBeLessThan(2048);
    expect(new URL(url).href.length).toBeGreaterThan(2048);
    expect(safeAttachmentUrl(url)).toBeNull();
  });
});
