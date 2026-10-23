import { describe, expect, it } from "vitest";
import { MimeParseError, parseMimeMessage } from "./mime-parse";

const crlf = (s: string) => s.replace(/\n/g, "\r\n");

describe("parseMimeMessage", () => {
  it("parses single-part plain text and folded headers", () => {
    const m = parseMimeMessage(
      crlf("From: a@example.com\nSubject: Hello\n world\nContent-Type: text/plain\n\nHi there\n"),
    );
    expect(m.headers.get("subject")).toEqual(["Hello world"]);
    expect(m.text).toBe("Hi there\r\n");
    expect(m.attachments).toEqual([]);
  });

  it("parses multipart/alternative", () => {
    const m = parseMimeMessage(
      crlf(
        'Content-Type: multipart/alternative; boundary="b1"\n\npreamble\n--b1\nContent-Type: text/plain\n\nplain\n--b1\nContent-Type: text/html\n\n<p>html</p>\n--b1--\nepilogue\n',
      ),
    );
    expect(m.text).toBe("plain");
    expect(m.html).toBe("<p>html</p>");
    expect(m.attachments).toHaveLength(0);
  });

  it("parses mixed with a base64 attachment (unquoted boundary)", () => {
    const m = parseMimeMessage(
      crlf(
        'Content-Type: multipart/mixed; boundary=xx\n\n--xx\nContent-Type: text/plain\n\nbody\n--xx\nContent-Type: application/pdf; name=a.pdf\nContent-Disposition: attachment; filename="a.pdf"\nContent-Transfer-Encoding: base64\n\naGVs\nbG8=\n--xx--\n',
      ),
    );
    expect(m.text).toBe("body");
    expect(m.attachments).toHaveLength(1);
    const a = m.attachments[0];
    expect(a?.filename).toBe("a.pdf");
    expect(a?.disposition).toBe("attachment");
    expect(new TextDecoder().decode(a?.content)).toBe("hello");
    expect(a?.size).toBe(5);
  });

  it("parses related with inline cid image", () => {
    const m = parseMimeMessage(
      crlf(
        'Content-Type: multipart/related; boundary="r"\n\n--r\nContent-Type: text/html\n\n<img src="cid:x1">\n--r\nContent-Type: image/png\nContent-ID: <x1>\nContent-Disposition: inline\nContent-Transfer-Encoding: base64\n\nAAEC\n--r--\n',
      ),
    );
    expect(m.html).toContain("cid:x1");
    expect(m.attachments[0]).toMatchObject({
      contentId: "x1",
      disposition: "inline",
      contentType: "image/png",
      size: 3,
    });
  });

  it("decodes quoted-printable with soft breaks and utf-8", () => {
    const m = parseMimeMessage(
      crlf(
        "Content-Type: text/plain; charset=utf-8\nContent-Transfer-Encoding: quoted-printable\n\nlong li=\nne fran=C3=A7ais\n",
      ),
    );
    expect(m.text).toBe("long line français\r\n");
  });

  it("decodes latin1 body", () => {
    const head = new TextEncoder().encode(
      "Content-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: 8bit\r\n\r\n",
    );
    const raw = Uint8Array.from([...head, 0x63, 0x61, 0x66, 0xe9]);
    expect(parseMimeMessage(raw).text).toBe("café");
  });

  it("falls back to utf-8 for unknown charset", () => {
    const m = parseMimeMessage("Content-Type: text/plain; charset=x-nope\r\n\r\nabc");
    expect(m.text).toBe("abc");
  });

  it("decodes RFC 2231 continued filenames", () => {
    const m = parseMimeMessage(
      crlf(
        "Content-Type: multipart/mixed; boundary=z\n\n--z\nContent-Type: application/octet-stream\nContent-Disposition: attachment;\n filename*0*=utf-8''r%C3%A9sum%C3%A9;\n filename*1*=%20final.txt\n\ndata\n--z--\n",
      ),
    );
    expect(m.attachments[0]?.filename).toBe("résumé final.txt");
  });

  it("joins a multi-byte character split across RFC 2231 segments", () => {
    const m = parseMimeMessage(
      crlf(
        "Content-Type: multipart/mixed; boundary=z\n\n--z\nContent-Type: application/octet-stream\nContent-Disposition: attachment;\n filename*0*=utf-8''r%C3;\n filename*1*=%A9sum.txt\n\ndata\n--z--\n",
      ),
    );
    expect(m.attachments[0]?.filename).toBe("résum.txt");
  });

  it("handles LF-only input", () => {
    const m = parseMimeMessage(
      'Content-Type: multipart/alternative; boundary="q"\n\n--q\nContent-Type: text/plain\n\nA\n--q--\n',
    );
    expect(m.text).toBe("A");
  });

  it("returns what it has for an unclosed boundary", () => {
    const m = parseMimeMessage(
      crlf(
        'Content-Type: multipart/mixed; boundary="u"\n\n--u\nContent-Type: text/plain\n\npartial\n',
      ),
    );
    expect(m.text).toBe("partial\n");
  });

  it("rejects excessive nesting", () => {
    let raw = "Content-Type: text/plain\r\n\r\nx";
    for (let i = 0; i < 25; i++) {
      raw = `Content-Type: multipart/mixed; boundary="b${i}"\r\n\r\n--b${i}\r\n${raw}\r\n--b${i}--\r\n`;
    }
    expect(() => parseMimeMessage(raw)).toThrow(MimeParseError);
  });

  it("rejects more than 500 parts", () => {
    const parts = Array.from(
      { length: 501 },
      () => "--b\r\nContent-Type: text/plain\r\n\r\nx\r\n",
    ).join("");
    const raw = `Content-Type: multipart/mixed; boundary="b"\r\n\r\n${parts}--b--\r\n`;
    expect(() => parseMimeMessage(raw)).toThrow(MimeParseError);
  });
});
