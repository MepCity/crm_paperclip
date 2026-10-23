import { describe, expect, it } from "vitest";
import { parseListUnsubscribe } from "./list-unsubscribe";

describe("parseListUnsubscribe", () => {
  it("parses a single mailto", () => {
    expect(parseListUnsubscribe({ "List-Unsubscribe": "<mailto:unsub@example.com>" })).toEqual({
      mailto: [{ address: "unsub@example.com" }],
      https: [],
      oneClick: false,
    });
  });

  it("parses mailto and https, header name case-insensitive", () => {
    const r = parseListUnsubscribe({
      "LIST-UNSUBSCRIBE": "<mailto:u@example.com>, <https://example.com/u?id=1>",
    });
    expect(r.mailto).toEqual([{ address: "u@example.com" }]);
    expect(r.https).toEqual(["https://example.com/u?id=1"]);
  });

  it("percent-decodes subject and body", () => {
    const r = parseListUnsubscribe({
      "list-unsubscribe": "<mailto:u@example.com?subject=Please%20unsubscribe&body=Remove%20me>",
    });
    expect(r.mailto).toEqual([
      { address: "u@example.com", subject: "Please unsubscribe", body: "Remove me" },
    ]);
  });

  it("drops http and javascript URIs", () => {
    const r = parseListUnsubscribe({
      "list-unsubscribe": "<http://example.com/u>, <javascript:alert(1)>, <https://example.com/ok>",
    });
    expect(r.https).toEqual(["https://example.com/ok"]);
    expect(r.mailto).toEqual([]);
  });

  it("detects one-click only with exact value and an https URI", () => {
    const h = "<https://example.com/u>";
    expect(
      parseListUnsubscribe({
        "list-unsubscribe": h,
        "list-unsubscribe-post": "  List-Unsubscribe=One-Click ",
      }).oneClick,
    ).toBe(true);
    expect(
      parseListUnsubscribe({ "list-unsubscribe": h, "list-unsubscribe-post": "other" }).oneClick,
    ).toBe(false);
    expect(
      parseListUnsubscribe({
        "list-unsubscribe": "<mailto:u@example.com>",
        "list-unsubscribe-post": "List-Unsubscribe=One-Click",
      }).oneClick,
    ).toBe(false);
  });

  it("accepts array header values", () => {
    const r = parseListUnsubscribe({
      "list-unsubscribe": ["<mailto:a@example.com>", "<https://example.com/u>"],
    });
    expect(r.mailto).toHaveLength(1);
    expect(r.https).toHaveLength(1);
  });

  it("joins folded lines and ignores comments outside brackets", () => {
    const r = parseListUnsubscribe({
      "list-unsubscribe": "(comment) <https://example.com/\r\n  u>,\r\n <mailto:a@example.com>",
    });
    expect(r.https).toEqual(["https://example.com/u"]);
    expect(r.mailto).toEqual([{ address: "a@example.com" }]);
  });

  it("skips malformed values and handles empty headers", () => {
    expect(
      parseListUnsubscribe({ "list-unsubscribe": "mailto:a@example.com, https://example.com" }),
    ).toEqual({ mailto: [], https: [], oneClick: false });
    expect(parseListUnsubscribe({})).toEqual({ mailto: [], https: [], oneClick: false });
    expect(parseListUnsubscribe({ "list-unsubscribe": undefined }).https).toEqual([]);
  });
});
