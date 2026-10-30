import { describe, expect, it } from "vitest";
import { CsvError, neutralizeCell, parseCsv, serializeCsv } from "./csv";

const enc = (s: string) => new TextEncoder().encode(s);
const opts = { charset: "UTF-8" as const, maxColumns: 5, maxRows: 5 };
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof CsvError ? { code: e.code, line: e.line } : e;
  }
  return null;
};

describe("parseCsv", () => {
  it("parses with and without BOM", () => {
    const want = { headers: ["a", "b"], rows: [["1", "2"]] };
    expect(parseCsv(enc("a,b\n1,2"), opts)).toEqual(want);
    expect(parseCsv(enc("﻿a,b\r\n1,2\r\n"), opts)).toEqual(want);
  });
  it("supports CR line endings and leading blank lines", () => {
    const want = { headers: ["a", "b"], rows: [["1", "2"]] };
    expect(parseCsv(enc("a,b\r1,2\r"), opts)).toEqual(want);
    expect(parseCsv(enc("\n  \r\na,b\r1,2"), opts)).toEqual(want);
  });
  it("decodes ISO-8859-1", () => {
    const r = parseCsv(new Uint8Array([0x61, 0x0a, 0xe9]), { ...opts, charset: "ISO-8859-1" });
    expect(r.rows).toEqual([["é"]]);
  });
  it("rejects invalid UTF-8", () => {
    expect(code(() => parseCsv(new Uint8Array([0x61, 0x0a, 0xe9]), opts))?.valueOf()).toMatchObject(
      { code: "bad_encoding" },
    );
  });
  it("handles quoted commas, newlines and escapes", () => {
    const r = parseCsv(enc('a,b\n"x,1","l1\r\nl2 ""q"""\n'), opts);
    expect(r.rows).toEqual([["x,1", 'l1\nl2 "q"']]);
  });
  it("reports unterminated quote line", () => {
    expect(code(() => parseCsv(enc('a\n1\n"oops\n'), opts))).toEqual({
      code: "malformed_csv",
      line: 3,
    });
  });
  it("rejects junk after closing quote", () => {
    expect(code(() => parseCsv(enc('a\n"x"y'), opts))).toEqual({ code: "malformed_csv", line: 2 });
  });
  it("pads short rows and rejects long rows", () => {
    expect(parseCsv(enc("a,b,c\n1"), opts).rows).toEqual([["1", "", ""]]);
    expect(code(() => parseCsv(enc("a\n1,2"), opts))).toEqual({ code: "malformed_csv", line: 2 });
  });
  it("validates headers", () => {
    expect(code(() => parseCsv(enc("a,,b\n1"), opts))).toMatchObject({ code: "no_header" });
    expect(parseCsv(enc("a, A ,A,b\n1"), opts).headers).toEqual(["a", "A (2)", "A (3)", "b"]);
    expect(parseCsv(enc("x,x (2),x\n1"), opts).headers).toEqual(["x", "x (2)", "x (3)"]);
    expect(code(() => parseCsv(enc(""), opts))).toMatchObject({ code: "empty_file" });
    expect(code(() => parseCsv(enc(" \n\n"), opts))).toMatchObject({ code: "empty_file" });
  });
  it("skips blanks and stops after more than 10 consecutive", () => {
    const blanks = (n: number) => "\n".repeat(n);
    const o = { ...opts, maxRows: 50 };
    expect(parseCsv(enc(`a\n1${blanks(11)}2`), o).rows).toEqual([["1"], ["2"]]);
    expect(parseCsv(enc(`a\n1${blanks(12)}2`), o).rows).toEqual([["1"]]);
  });
  it("enforces limits exactly", () => {
    expect(parseCsv(enc("a,b,c,d,e\n1"), opts).headers).toHaveLength(5);
    expect(code(() => parseCsv(enc("a,b,c,d,e,f\n1"), opts))).toMatchObject({
      code: "too_many_columns",
    });
    expect(parseCsv(enc("a\n1\n2\n3\n4\n5"), opts).rows).toHaveLength(5);
    expect(code(() => parseCsv(enc("a\n1\n2\n3\n4\n5\n6"), opts))).toMatchObject({
      code: "too_many_rows",
    });
  });
  it("keeps cell whitespace", () => {
    expect(parseCsv(enc("a\n x "), opts).rows).toEqual([[" x "]]);
  });
});

describe("serializeCsv", () => {
  it("round-trips tricky cells", () => {
    const rows = [["x,1", 'q"q', "l1\nl2", " pad ", "plain"]];
    const out = serializeCsv(["a", "b", "c", "d", "e"], rows);
    expect(out.startsWith("﻿")).toBe(false);
    expect(out).toContain("\r\n");
    const back = parseCsv(enc(out), opts);
    expect(back.rows).toEqual(rows);
  });
  it("neutralizes cells", () => {
    expect(serializeCsv(["h"], [["=1+1"]])).toBe("h\r\n'=1+1\r\n");
  });
});

describe("neutralizeCell", () => {
  it("prefixes dangerous non-numeric values", () => {
    for (const v of ["=1+1", "+90 555", "@x", "-", "\tx", "\rx"])
      expect(neutralizeCell(v)).toBe(`'${v}`);
  });
  it("leaves numbers and safe text", () => {
    for (const v of ["-5", "+3.5", "abc", "", "a=b"]) expect(neutralizeCell(v)).toBe(v);
  });
});
