import { expect, it } from "vitest";
import { hrefWithNext, readNextParam, safeNextPath } from "./safe-next-path";

it("accepts a relative path", () => {
  expect(safeNextPath("/")).toBe("/");
  expect(safeNextPath("/dev/ui")).toBe("/dev/ui");
});

it("rejects an empty value", () => {
  expect(safeNextPath("")).toBe("/");
  expect(safeNextPath(null)).toBe("/");
  expect(safeNextPath(undefined)).toBe("/");
});

it("rejects a full URL", () => {
  expect(safeNextPath("https://example.org")).toBe("/");
  expect(safeNextPath("https://example.org/dev/ui")).toBe("/");
});

it("rejects a protocol-relative host", () => {
  expect(safeNextPath("//example.org")).toBe("/");
  expect(safeNextPath("//example.org/dev/ui")).toBe("/");
});

it("rejects a backslash protocol-relative host", () => {
  expect(safeNextPath("/\\example.org")).toBe("/");
  expect(safeNextPath("/\\example.org/dev/ui")).toBe("/");
});

it("rejects a value that contains a scheme", () => {
  expect(safeNextPath("javascript:alert(1)")).toBe("/");
  expect(safeNextPath("mailto:person@example.test")).toBe("/");
});

it("keeps a query and hash on a relative path", () => {
  expect(safeNextPath("/dev/ui?tab=form#menu")).toBe("/dev/ui?tab=form#menu");
  expect(safeNextPath("/dev/ui?next=https://example.org#section")).toBe(
    "/dev/ui?next=https://example.org#section",
  );
});

it("rejects hosts hidden behind whitespace controls", () => {
  expect(safeNextPath("/\t/example.org")).toBe("/");
  expect(safeNextPath("/\n/example.org")).toBe("/");
  expect(safeNextPath("/\r/example.org")).toBe("/");
  expect(safeNextPath("/\t\\example.org")).toBe("/");
});

it("rejects a leading or embedded tab, newline, or carriage return", () => {
  expect(safeNextPath("\t/dev/ui")).toBe("/");
  expect(safeNextPath("/dev/\tui")).toBe("/");
  expect(safeNextPath("\n/dev/ui")).toBe("/");
  expect(safeNextPath("/dev/\nui")).toBe("/");
  expect(safeNextPath("\r/dev/ui")).toBe("/");
  expect(safeNextPath("/dev/\rui")).toBe("/");
});

it("rejects a backslash in the middle of a path", () => {
  expect(safeNextPath("/dev/ui\\secret")).toBe("/");
});

it("rejects a delete character", () => {
  expect(safeNextPath("/dev/\u007Fui")).toBe("/");
});

it("returns the resolved path rather than the raw input", () => {
  expect(safeNextPath("/dev/../ui")).toBe("/ui");
  expect(safeNextPath("/dev/./ui?tab=form#menu")).toBe("/dev/ui?tab=form#menu");
});

it("reads the first next query value and drops an unsafe one", () => {
  expect(readNextParam("/dev/ui")).toBe("/dev/ui");
  expect(readNextParam(["/dev/ui", "/sign-up"])).toBe("/dev/ui");
  expect(readNextParam("//example.org")).toBe("/");
  expect(readNextParam(undefined)).toBe("/");
});

it("preserves a safe next path on auth links", () => {
  expect(hrefWithNext("/sign-up", "/")).toBe("/sign-up");
  expect(hrefWithNext("/sign-up", "/dev/ui")).toBe("/sign-up?next=%2Fdev%2Fui");
  expect(hrefWithNext("/sign-in", "/dev/ui?tab=form#menu")).toBe(
    "/sign-in?next=%2Fdev%2Fui%3Ftab%3Dform%23menu",
  );
});
