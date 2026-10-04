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

it("rejects a resolved pathname that starts with a double slash", () => {
  expect(safeNextPath("/.//example.org")).toBe("/");
  expect(safeNextPath("/..//example.org")).toBe("/");
  expect(safeNextPath("/%2e//example.org")).toBe("/");
  expect(safeNextPath("/%2E%2e//example.org")).toBe("/");
  expect(safeNextPath("/dev/..//example.org")).toBe("/");
  expect(safeNextPath("/././/example.org/path?x=1")).toBe("/");
});

it("keeps a double slash that is not at the start of the resolved path", () => {
  expect(safeNextPath("/dev//ui")).toBe("/dev//ui");
  expect(safeNextPath("/dev/ui?from=https://example.org//a")).toBe(
    "/dev/ui?from=https://example.org//a",
  );
});

const nextPathInputs = [
  "/",
  "/dev/ui",
  "",
  null,
  undefined,
  "https://example.org",
  "https://example.org/dev/ui",
  "//example.org",
  "//example.org/dev/ui",
  "/\\example.org",
  "/\\example.org/dev/ui",
  "javascript:alert(1)",
  "mailto:person@example.test",
  "/dev/ui?tab=form#menu",
  "/dev/ui?next=https://example.org#section",
  "/\t/example.org",
  "/\n/example.org",
  "/\r/example.org",
  "/\t\\example.org",
  "\t/dev/ui",
  "/dev/\tui",
  "\n/dev/ui",
  "/dev/\nui",
  "\r/dev/ui",
  "/dev/\rui",
  "/dev/ui\\secret",
  "/dev/\u007Fui",
  "/dev/../ui",
  "/dev/./ui?tab=form#menu",
  "/.//example.org",
  "/..//example.org",
  "/%2e//example.org",
  "/%2E%2e//example.org",
  "/dev/..//example.org",
  "/././/example.org/path?x=1",
  "/dev//ui",
  "/dev/ui?from=https://example.org//a",
] as const;

it("stays on this origin for every input used in this file", () => {
  for (const input of nextPathInputs) {
    const result = safeNextPath(input);
    expect(result.startsWith("/")).toBe(true);
    expect(result.startsWith("//")).toBe(false);
    expect(new URL(result, "https://app.test").origin).toBe("https://app.test");
    expect(safeNextPath(result)).toBe(result);
  }
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
