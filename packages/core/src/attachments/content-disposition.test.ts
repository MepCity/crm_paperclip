import { describe, expect, it } from "vitest";
import { ATTACHMENT_DOWNLOAD_HEADERS, contentDispositionAttachment } from "./content-disposition";

describe("contentDispositionAttachment", () => {
  it.each([
    [
      "Teklif Şubat.pdf",
      "attachment; filename=\"Teklif _ubat.pdf\"; filename*=UTF-8''Teklif%20%C5%9Eubat.pdf",
    ],
    ['a"b.txt', "attachment; filename=\"a_b.txt\"; filename*=UTF-8''a%22b.txt"],
    ["x/y\\z.pdf", "attachment; filename=\"z.pdf\"; filename*=UTF-8''z.pdf"],
    [
      "rapor (1).pdf",
      "attachment; filename=\"rapor (1).pdf\"; filename*=UTF-8''rapor%20%281%29.pdf",
    ],
    ["it's*.txt", "attachment; filename=\"it's*.txt\"; filename*=UTF-8''it%27s%2A.txt"],
    [
      "report\r\nInjected.txt",
      "attachment; filename=\"reportInjected.txt\"; filename*=UTF-8''reportInjected.txt",
    ],
    ["", "attachment; filename=\"download\"; filename*=UTF-8''download"],
    ["\u0000\u0001\u001f\u007f", "attachment; filename=\"download\"; filename*=UTF-8''download"],
    ["dir/", "attachment; filename=\"download\"; filename*=UTF-8''download"],
    ["a%;,.txt", "attachment; filename=\"a%;,.txt\"; filename*=UTF-8''a%25%3B%2C.txt"],
    [
      "AZaz09!#$&+-.^_`|~",
      "attachment; filename=\"AZaz09!#$&+-.^_`|~\"; filename*=UTF-8''AZaz09!#$&+-.^_`|~",
    ],
    ["😀.txt", "attachment; filename=\"_.txt\"; filename*=UTF-8''%F0%9F%98%80.txt"],
  ])("encodes %j as a complete safe attachment header", (name, expected) => {
    const header = contentDispositionAttachment(name);
    expect(header).toBe(expected);
    expect(header).not.toMatch(/[\r\n]/);
    expect(header).toMatch(/^attachment; filename="[^"]+"; filename\*=UTF-8''[^\r\n]*$/);
  });

  it("removes every control character", () => {
    const controls = Array.from({ length: 32 }, (_, i) => String.fromCharCode(i)).join("");
    expect(contentDispositionAttachment(`a${controls}\u007fb.txt`)).toBe(
      "attachment; filename=\"ab.txt\"; filename*=UTF-8''ab.txt",
    );
  });

  it("exposes frozen download security headers", () => {
    expect(ATTACHMENT_DOWNLOAD_HEADERS).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    });
    expect(Object.isFrozen(ATTACHMENT_DOWNLOAD_HEADERS)).toBe(true);
  });
});
