import { describe, expect, it } from "vitest";
import { parseMailto } from "./mailto";

describe("parseMailto", () => {
  it("parses a lone address", () => {
    expect(parseMailto("mailto:a@example.com")).toEqual({
      to: [{ address: "a@example.com" }],
      cc: [],
      bcc: [],
      subject: "",
      body: "",
      invalid: [],
    });
  });

  it("merges several addresses from the path and to= params", () => {
    const r = parseMailto("mailto:a@example.com,b@example.com?to=c@example.com");
    expect(r?.to.map((x) => x.address)).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
  });

  it("parses to, cc, bcc, subject and body", () => {
    const r = parseMailto(
      "mailto:a@example.com?cc=b@example.com&bcc=c@example.com&subject=Hi&body=Line1%0D%0ALine2",
    );
    expect(r?.cc).toEqual([{ address: "b@example.com" }]);
    expect(r?.bcc).toEqual([{ address: "c@example.com" }]);
    expect(r?.subject).toBe("Hi");
    expect(r?.body).toBe("Line1\r\nLine2");
  });

  it("decodes UTF-8 subjects", () => {
    expect(
      parseMailto("mailto:a@example.com?subject=%C5%9Eirket%20toplant%C4%B1s%C4%B1")?.subject,
    ).toBe("Şirket toplantısı");
  });

  it("keeps + as a plus", () => {
    expect(parseMailto("mailto:a@example.com?subject=a+b")?.subject).toBe("a+b");
  });

  it("is case-insensitive for scheme and parameter names", () => {
    const r = parseMailto("MAILTO:a@example.com?CC=b@example.com&Subject=S&BODY=B");
    expect(r?.cc).toEqual([{ address: "b@example.com" }]);
    expect(r?.subject).toBe("S");
    expect(r?.body).toBe("B");
  });

  it("uses the first of repeated subject and body values", () => {
    const r = parseMailto("mailto:a@example.com?subject=one&subject=two&body=x&body=y");
    expect(r?.subject).toBe("one");
    expect(r?.body).toBe("x");
  });

  it("leaves malformed percent-encoding raw without throwing", () => {
    expect(parseMailto("mailto:a@example.com?subject=100%25%ZZ")?.subject).toBe("100%25%ZZ");
  });

  it("ignores unknown parameters", () => {
    const r = parseMailto("mailto:a@example.com?in-reply-to=%3Cx%40y%3E&subject=S");
    expect(r?.subject).toBe("S");
    expect(r?.invalid).toEqual([]);
  });

  it("reports invalid addresses", () => {
    const r = parseMailto("mailto:a@example.com,not-an-address?cc=bad");
    expect(r?.to).toEqual([{ address: "a@example.com" }]);
    expect(r?.invalid).toEqual(["not-an-address", "bad"]);
  });

  it("returns null for non-mailto hrefs", () => {
    expect(parseMailto("https://example.com")).toBeNull();
    expect(parseMailto("a@example.com")).toBeNull();
  });
});
