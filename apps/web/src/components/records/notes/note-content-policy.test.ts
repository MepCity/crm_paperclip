import { afterEach, describe, expect, test, vi } from "vitest";
import {
  isNoteContentEmpty,
  NOTE_CONTENT_MAX,
  NOTE_TITLE_MAX,
  noteContentText,
  safeHref,
  sanitizeStyle,
} from "./note-content-policy";

afterEach(() => vi.unstubAllGlobals());

test("limits", () => {
  expect(NOTE_TITLE_MAX).toBe(120);
  expect(NOTE_CONTENT_MAX).toBe(65_535);
});

describe("noteContentText", () => {
  test("collapses whitespace and separates blocks", () => {
    expect(noteContentText("<p>Hello</p><p>  big \n world </p>")).toBe("Hello big world");
    expect(noteContentText("a<br>b")).toBe("a b");
  });
  test("drops script/style contents", () => {
    expect(noteContentText("<p>x</p><script>alert(1)</script><style>p{}</style>")).toBe("x");
  });
  test("server path without DOMParser", () => {
    vi.stubGlobal("DOMParser", undefined);
    expect(noteContentText("<p>Tom &amp; Jerry</p><script>evil()</script><b>ok</b>")).toBe(
      "Tom & Jerry ok",
    );
  });
});

describe("isNoteContentEmpty", () => {
  test.each(["", "   ", "<p><br></p>", "<div>&nbsp;</div>", "<!-- c -->"])("empty: %j", (html) => {
    expect(isNoteContentEmpty(html)).toBe(true);
  });
  test("non-empty", () => {
    expect(isNoteContentEmpty("<p>x</p>")).toBe(false);
  });
  test("server path", () => {
    vi.stubGlobal("DOMParser", undefined);
    expect(isNoteContentEmpty("<p><br></p>")).toBe(true);
    expect(isNoteContentEmpty("<p>a</p>")).toBe(false);
  });
});

describe("safeHref", () => {
  test("allows http, https, mailto", () => {
    expect(safeHref("https://a.com")).toBe("https://a.com");
    expect(safeHref("HTTP://a.com")).toBe("HTTP://a.com");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  test.each([
    "javascript:alert(1)",
    " JaVaScRiPt:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,x",
    "vbscript:x",
    "//evil.com",
    "/relative",
    "",
  ])("rejects %j", (href) => {
    expect(safeHref(href)).toBeNull();
  });
});

describe("sanitizeStyle", () => {
  test("keeps allowed", () => {
    expect(sanitizeStyle("color:#f00; background-color: rgb(1,2,3)", "span")).toEqual({
      color: "#f00",
      backgroundColor: "rgb(1,2,3)",
    });
    expect(sanitizeStyle("list-style-type: lower-roman", "ol")).toEqual({
      listStyleType: "lower-roman",
    });
    expect(sanitizeStyle("margin-left: 40px; padding-left:400px", "p")).toEqual({
      marginLeft: "40px",
      paddingLeft: "400px",
    });
  });
  test("drops the rest", () => {
    expect(sanitizeStyle("background:url(javascript:x)", "p")).toBeUndefined();
    expect(sanitizeStyle("color:expression(alert(1))", "p")).toBeUndefined();
    expect(sanitizeStyle("background-color:url(x)", "p")).toBeUndefined();
    expect(sanitizeStyle("margin-left:401px", "p")).toBeUndefined();
    expect(sanitizeStyle("margin-left:-10px", "p")).toBeUndefined();
    expect(sanitizeStyle("list-style-type:square", "p")).toBeUndefined();
    expect(sanitizeStyle("position:fixed", "p")).toBeUndefined();
  });
});
