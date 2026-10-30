import { describe, expect, it } from "vitest";
import { parseRecipientList } from "./recipient-list";

describe("parseRecipientList", () => {
  it("splits on comma, semicolon and newline", () => {
    const r = parseRecipientList("a@x.com, b@x.com; c@x.com\nd@x.com\r\ne@x.com");
    expect(r.recipients.map((x) => x.address)).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
      "d@x.com",
      "e@x.com",
    ]);
    expect(r.invalid).toEqual([]);
  });

  it("keeps display names and normalizes addresses", () => {
    expect(parseRecipientList("Ann Lee <ANN@X.com>").recipients).toEqual([
      { address: "ann@x.com", name: "Ann Lee" },
    ]);
  });

  it("does not split on a comma inside quotes", () => {
    expect(parseRecipientList('"Last, First" <a@x.com>, b@x.com').recipients).toEqual([
      { address: "a@x.com", name: "Last, First" },
      { address: "b@x.com" },
    ]);
  });

  it("drops duplicates, first wins and keeps its name", () => {
    expect(parseRecipientList("Ann <a@x.com>, A@X.com, b@x.com, a@x.com").recipients).toEqual([
      { address: "a@x.com", name: "Ann" },
      { address: "b@x.com" },
    ]);
  });

  it("reports invalid tokens as typed and ignores empty ones", () => {
    const r = parseRecipientList(" nope ,, a@x.com ;; bad@ ");
    expect(r.recipients).toEqual([{ address: "a@x.com" }]);
    expect(r.invalid).toEqual(["nope", "bad@"]);
  });

  it("returns empty arrays for empty or whitespace input", () => {
    expect(parseRecipientList("")).toEqual({ recipients: [], invalid: [] });
    expect(parseRecipientList(" \n ;, ")).toEqual({ recipients: [], invalid: [] });
  });
});
