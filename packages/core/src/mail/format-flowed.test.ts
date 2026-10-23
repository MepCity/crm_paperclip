import { describe, expect, it } from "vitest";
import { decodeFormatFlowed } from "./format-flowed";

describe("decodeFormatFlowed", () => {
  it("returns empty text unchanged", () => {
    expect(decodeFormatFlowed("")).toBe("");
  });

  it("keeps fixed lines unchanged", () => {
    expect(decodeFormatFlowed("one\ntwo\nthree")).toBe("one\ntwo\nthree");
  });

  it("joins two flowed lines", () => {
    expect(decodeFormatFlowed("hello \nworld")).toBe("hello world");
  });

  it("joins three flowed lines", () => {
    expect(decodeFormatFlowed("a \nb \nc\nd")).toBe("a b c\nd");
  });

  it("removes the soft-break space when delSp is true", () => {
    expect(decodeFormatFlowed("hel \nlo", { delSp: true })).toBe("hello");
    expect(decodeFormatFlowed("hel \nlo", { delSp: false })).toBe("hel lo");
  });

  it("removes space-stuffing", () => {
    expect(decodeFormatFlowed(" From here\n >not quote")).toBe("From here\n>not quote");
  });

  it("breaks the flow when quote depth changes", () => {
    expect(decodeFormatFlowed("> one \n>> two \n>> three\nfour")).toBe(
      "> one \n>> two three\nfour",
    );
  });

  it("joins flowed quoted lines at the same depth", () => {
    expect(decodeFormatFlowed("> a \n> b")).toBe("> a b");
  });

  it("never joins the signature separator", () => {
    expect(decodeFormatFlowed("text\n-- \nname \nmore")).toBe("text\n-- \nname more");
  });

  it("accepts CRLF input and outputs LF", () => {
    expect(decodeFormatFlowed("a \r\nb\r\nc\r\n")).toBe("a b\nc\n");
  });
});
