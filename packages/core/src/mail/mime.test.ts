import { describe, expect, it } from "vitest";
import { composeMime, envelopeRecipients } from "./mime";

const base = {
  from: { name: "Ayşe Yılmaz", address: "ayse@example.com" },
  to: [{ name: "Çağlar Öztürk", address: "caglar@example.com" }],
  subject: "Merhaba",
  text: "selam",
  messageId: "<fixed@example.com>",
  date: new Date("2026-10-22T10:00:00Z"),
};
let n = 0;
const gen = () => `B${++n}`;

interface Part {
  headers: Record<string, string>;
  body: string;
  parts: Part[];
}

function parse(raw: string): Part {
  const idx = raw.indexOf("\r\n\r\n");
  const headers: Record<string, string> = {};
  const unfolded = raw.slice(0, idx).replace(/\r\n[ \t]+/g, " ");
  for (const line of unfolded.split("\r\n")) {
    const c = line.indexOf(":");
    headers[line.slice(0, c).toLowerCase()] = line.slice(c + 1).trim();
  }
  const body = raw.slice(idx + 4);
  const m = /boundary="([^"]+)"/.exec(headers["content-type"] ?? "");
  const parts: Part[] = [];
  if (m) {
    const chunks = body.split(`--${m[1]}`).slice(1, -1);
    for (const ch of chunks) parts.push(parse(ch.replace(/^\r\n/, "").replace(/\r\n$/, "")));
  }
  return { headers, body, parts };
}

const decodeWords = (v: string) =>
  v
    .replace(/\?=\s+=\?UTF-8\?B\?/g, "?==?UTF-8?B?")
    .replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (_m, b) => Buffer.from(b, "base64").toString("utf8"));

describe("composeMime", () => {
  it("builds plain text with CRLF and base64 body", () => {
    n = 0;
    const raw = composeMime({ ...base, generateBoundary: gen });
    expect(raw.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(raw.split("\r\n").every((l) => l.length <= 998)).toBe(true);
    const p = parse(raw);
    expect(p.headers["content-type"]).toBe("text/plain; charset=utf-8");
    expect(Buffer.from(p.body.replace(/\r\n/g, ""), "base64").toString()).toBe("selam");
    expect(p.headers["message-id"]).toBe("<fixed@example.com>");
    expect(p.headers["mime-version"]).toBe("1.0");
  });

  it("builds multipart/alternative", () => {
    n = 0;
    const p = parse(composeMime({ ...base, html: "<b>selam</b>", generateBoundary: gen }));
    expect(p.headers["content-type"]).toContain("multipart/alternative");
    expect(p.parts.map((x) => x.headers["content-type"])).toEqual([
      "text/plain; charset=utf-8",
      "text/html; charset=utf-8",
    ]);
  });

  it("builds mixed with attachment, 76-char base64 lines", () => {
    n = 0;
    const content = new Uint8Array(500).map((_, i) => i % 256);
    const raw = composeMime({
      ...base,
      html: "<p>x</p>",
      attachments: [{ filename: "rapor.pdf", contentType: "application/pdf", content }],
      generateBoundary: gen,
    });
    const p = parse(raw);
    expect(p.headers["content-type"]).toContain("multipart/mixed");
    expect(p.parts).toHaveLength(2);
    expect(p.parts[0]?.headers["content-type"]).toContain("multipart/alternative");
    const att = p.parts[1];
    expect(att?.headers["content-disposition"]).toBe('attachment; filename="rapor.pdf"');
    const lines = att?.body.split("\r\n") ?? [];
    expect(lines.every((l) => l.length <= 76)).toBe(true);
    expect([...Buffer.from(lines.join(""), "base64")]).toEqual([...content]);
  });

  it("encodes Turkish subject, names and filenames", () => {
    const subject =
      "Çok önemli: Şirket toplantısı için gündem öğeleri ve ğüşiöç karakterleri hakkında";
    const raw = composeMime({
      ...base,
      subject,
      attachments: [
        { filename: "özet şablon.txt", contentType: "text/plain", content: new Uint8Array([65]) },
      ],
      generateBoundary: gen,
    });
    const head = raw.slice(0, raw.indexOf("\r\n\r\n"));
    expect(head.split("\r\n").every((l) => l.length <= 78)).toBe(true);
    for (const w of head.match(/=\?UTF-8\?B\?[^?]+\?=/g) ?? [])
      expect(w.length).toBeLessThanOrEqual(75);
    const p = parse(raw);
    expect(decodeWords(p.headers.subject ?? "")).toBe(subject);
    expect(decodeWords(p.headers.from ?? "")).toBe("Ayşe Yılmaz <ayse@example.com>");
    expect(decodeWords(p.headers.to ?? "")).toBe("Çağlar Öztürk <caglar@example.com>");
    expect(p.parts[1]?.headers["content-disposition"]).toContain(
      "filename*=UTF-8''%C3%B6zet%20%C5%9Fablon.txt",
    );
  });

  it("never splits a multibyte character across encoded words", () => {
    const subject = "ş".repeat(60);
    const p = parse(composeMime({ ...base, subject }));
    expect(decodeWords(p.headers.subject ?? "")).toBe(subject);
  });

  it("folds long address lists and references", () => {
    const to = Array.from({ length: 12 }, (_, i) => ({ address: `kisi${i}@example.com` }));
    const refs = Array.from({ length: 12 }, (_, i) => `<ref${i}@example.com>`);
    const raw = composeMime({ ...base, to, references: refs, inReplyTo: refs[11] });
    const head = raw.slice(0, raw.indexOf("\r\n\r\n"));
    expect(head.split("\r\n").every((l) => l.length <= 78)).toBe(true);
    const p = parse(raw);
    expect(p.headers.references).toBe(refs.join(" "));
    expect(p.headers.to?.split(", ")).toHaveLength(12);
  });

  it("keeps BCC out of headers but in the envelope", () => {
    const input = {
      ...base,
      cc: [{ address: "cc@example.com" }],
      bcc: [{ address: "gizli@example.com" }],
    };
    const raw = composeMime(input);
    expect(raw).not.toContain("gizli@example.com");
    expect(raw.toLowerCase()).not.toContain("bcc:");
    expect(envelopeRecipients(input)).toEqual([
      "caglar@example.com",
      "cc@example.com",
      "gizli@example.com",
    ]);
  });

  it("rejects header injection", () => {
    expect(() => composeMime({ ...base, subject: "x\r\nBcc: evil@example.com" })).toThrow();
    expect(() =>
      composeMime({ ...base, from: { name: "a\nb", address: "a@example.com" } }),
    ).toThrow();
    expect(() =>
      composeMime({ ...base, to: [{ address: "a@example.com\r\nBcc: e@example.com" }] }),
    ).toThrow();
    expect(() => composeMime({ ...base, inReplyTo: "<a@b>\r\nX: y" })).toThrow();
    expect(() =>
      composeMime({
        ...base,
        attachments: [{ filename: "a\r\nb", contentType: "text/plain", content: new Uint8Array() }],
      }),
    ).toThrow();
  });

  it("requires a recipient and quotes special display names", () => {
    expect(() => composeMime({ ...base, to: [] })).toThrow();
    const p = parse(composeMime({ ...base, to: [{ name: 'Doe, "J"', address: "j@example.com" }] }));
    expect(p.headers.to).toBe('"Doe, \\"J\\"" <j@example.com>');
  });
});
