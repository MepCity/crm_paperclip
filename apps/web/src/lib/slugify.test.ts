import { expect, test } from "vitest";
import { slugify } from "./slugify";

test("maps Turkish letters to ASCII", () => {
  expect(slugify("Çağrı Şirketi Örnek")).toBe("cagri-sirketi-ornek");
  expect(slugify("İstanbul")).toBe("istanbul");
  expect(slugify("IĞDIR")).toBe("igdir");
  expect(slugify("ışık")).toBe("isik");
});

test("strips accents that are not Turkish letters", () => {
  expect(slugify("Café naïve")).toBe("cafe-naive");
  expect(slugify("señor")).toBe("senor");
});

test("collapses spaces and punctuation into one hyphen", () => {
  expect(slugify("Hello, world!")).toBe("hello-world");
  expect(slugify("a___b")).toBe("a-b");
  expect(slugify("a   b")).toBe("a-b");
});

test("strips leading and trailing hyphens", () => {
  expect(slugify("---hello---")).toBe("hello");
  expect(slugify("  hello  ")).toBe("hello");
});

test("limits the result to 40 characters", () => {
  expect(slugify("a".repeat(50))).toBe("a".repeat(40));
  expect(slugify(`${"a".repeat(39)} b extra`)).toBe("a".repeat(39));
});

test("returns an empty string for empty input", () => {
  expect(slugify("")).toBe("");
  expect(slugify("   ")).toBe("");
  expect(slugify("---")).toBe("");
});
