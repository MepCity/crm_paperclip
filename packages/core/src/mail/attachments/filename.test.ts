import { describe, expect, it } from "vitest";
import { sanitizeAttachmentFilename as s } from "./filename";

describe("sanitizeAttachmentFilename", () => {
  it("keeps only the last path component", () => {
    expect(s("a/b/c.txt")).toBe("c.txt");
    expect(s("..\\..\\x.exe")).toBe("x.exe");
    expect(s("../../etc/passwd")).toBe("passwd");
    expect(s("dir\\sub/file.pdf")).toBe("file.pdf");
  });

  it("drops control and bidi characters", () => {
    expect(s("a\u0000b\u001fc\u007fd.txt")).toBe("abcd.txt");
    expect(s("report‮gnp.exe")).toBe("reportgnp.exe");
    expect(s("x⁦y⁩.txt")).toBe("xy.txt");
  });

  it("replaces reserved punctuation with underscore", () => {
    expect(s('a<b>c:d"e|f?g*h.txt')).toBe("a_b_c_d_e_f_g_h.txt");
  });

  it("trims edge whitespace and dots", () => {
    expect(s("  .. name.txt. . ")).toBe("name.txt");
    expect(s("..")).toBe("attachment");
  });

  it("prefixes Windows reserved names", () => {
    expect(s("con.txt")).toBe("_con.txt");
    expect(s("NUL")).toBe("_NUL");
    expect(s("com1.tar.gz")).toBe("_com1.tar.gz");
    expect(s("LPT9.log")).toBe("_LPT9.log");
    expect(s("console.txt")).toBe("console.txt");
  });

  it("normalizes to NFC", () => {
    expect(s("é.txt")).toBe("é.txt");
  });

  it("limits to 255 UTF-8 bytes, keeping extension and characters whole", () => {
    const out = s(`${"ğ".repeat(150)}.pdf`);
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(255);
    expect(out.endsWith(".pdf")).toBe(true);
    expect(out).not.toContain("�");
    expect(new TextDecoder("utf-8", { fatal: true }).decode(new TextEncoder().encode(out))).toBe(
      out,
    );
    const long = s(`${"ş".repeat(300)}`);
    expect(new TextEncoder().encode(long).length).toBeLessThanOrEqual(255);
  });

  it("falls back for empty names", () => {
    expect(s(undefined)).toBe("attachment");
    expect(s("", { contentType: "application/pdf" })).toBe("attachment.pdf");
    expect(s("   ", { contentType: "Image/PNG; x=1" })).toBe("attachment.png");
    expect(s("", { contentType: "image/jpeg" })).toBe("attachment.jpg");
    expect(s("", { contentType: "text/plain" })).toBe("attachment.txt");
    expect(s("", { contentType: "text/calendar" })).toBe("attachment.ics");
    expect(s("", { contentType: "application/zip" })).toBe("attachment");
    expect(s("", { fallback: "mail.eml", contentType: "application/pdf" })).toBe("mail.eml");
  });

  it("is idempotent and leaves clean names alone", () => {
    expect(s("Rapor Ekim 2026.pdf")).toBe("Rapor Ekim 2026.pdf");
    for (const input of [
      "..\\..\\x.exe",
      "con.txt",
      `${"ğ".repeat(200)}.pdf`,
      "report‮gnp.exe",
      "a:b.txt",
      undefined,
    ]) {
      const once = s(input);
      expect(s(once)).toBe(once);
    }
  });
});
