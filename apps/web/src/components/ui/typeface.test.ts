import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync(new URL("../../app/tokens.css", import.meta.url), "utf8");

for (const [file, digest] of [
  ["figtree-variable.ttf", "c8d9e77bb970c18f7b55fd2d8c91f86c9e9cc42696da9c3e7bc4fffba1d3ef5a"],
  ["OFL.txt", "140d37233e7f3ce7313798befa9600893bcceaf41a55fa0fa5ad52f7f657a268"],
]) {
  test(`${file} preserves the official source bytes`, () => {
    const bytes = readFileSync(new URL(`../../app/fonts/figtree/${file}`, import.meta.url));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(digest);
  });
}

test("one local normal variable face serves every adopted weight", () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)];
  expect(faces).toHaveLength(1);
  const face = faces[0]?.[1];
  expect(face).toMatch(/font-family:\s*"Figtree";/);
  expect(face).toMatch(/font-weight:\s*300 900;/);
  expect(face).toMatch(/font-style:\s*normal;/);
  expect(face).toMatch(/font-display:\s*swap;/);
  expect(face).toContain('src: url("./fonts/figtree/figtree-variable.ttf") format("truetype");');
  expect(css).toMatch(/--font-sans:\s*"Figtree", ui-sans-serif/);
});

test("adopted type tokens retain their measured sizes and bold weight", () => {
  for (const [name, value] of Object.entries({
    "--text-2xs": "0.53125rem",
    "--text-xs": "0.71875rem",
    "--text-sm": "0.84375rem",
    "--text-md": "0.90625rem",
    "--text-xl": "1.15625rem",
    "--font-weight-semibold": "510",
  })) {
    expect(css).toContain(`${name}: ${value};`);
  }
});
