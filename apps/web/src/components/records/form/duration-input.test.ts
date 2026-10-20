import { expect, test } from "vitest";
import { formatDuration, parseDuration } from "./duration-input";

test("duration text splits into minutes and seconds and joins back", () => {
  expect(parseDuration("12:05")).toEqual({ minutes: 12, seconds: 5 });
  expect(parseDuration("125:30")).toEqual({ minutes: 125, seconds: 30 });
  expect(parseDuration(null)).toEqual({ minutes: null, seconds: null });
  expect(parseDuration("bad")).toEqual({ minutes: null, seconds: null });
  expect(formatDuration(null, null)).toBeNull();
  expect(formatDuration(3, null)).toBe("03:00");
  expect(formatDuration(null, 7)).toBe("00:07");
  expect(formatDuration(125, 30)).toBe("125:30");
});
