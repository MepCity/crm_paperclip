import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(directory, "../../app/tokens.css"), "utf8");
const readme = readFileSync(resolve(directory, "README.md"), "utf8");
const demo = readFileSync(resolve(directory, "tokens.demo.tsx"), "utf8");
const listSpec = readFileSync(
  resolve(directory, "../../../../../research/specs/list-views.md"),
  "utf8",
);

/** Names and values that this pass adds. They are binding, not derived in the test. */
const LIST_PASS = {
  "--color-panel-border": "#dcdbee",
  "--color-row-separator": "#edf0f4",
  "--color-control-border": "#c5c4d3",
  "--color-button-border": "#d5d8e9",
  "--color-button-gradient-start": "#fefefe",
  "--color-button-gradient-end": "#f2f1f8",
  "--color-primary-gradient-start": "#5767f6",
  "--color-primary-gradient-end": "#154ec5",
  "--color-primary-divider": "#c3c8f4",
  "--color-surface-selected": "#f0f4fc",
  "--color-surface-active": "#edf0f9",
  "--color-text-strong": "#202123",
  "--color-text-disabled": "#b5b8be",
  "--font-weight-medium": "500",
  "--text-13": "0.8125rem",
  "--radius-xl": "1rem",
} as const;

function cssTokens(source: string): { name: string; value: string }[] {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((match) => ({
    name: match[1] ?? "",
    value: (match[2] ?? "").trim().replace(/\s+/g, " "),
  }));
}

function readmeValue(cell: string): string {
  const code = cell.match(/`([^`]+)`/);
  if (code?.[1]) return code[1].trim().replace(/\s+/g, " ");
  return cell.trim();
}

function readmeTokens(source: string): { name: string; value: string; source: string }[] {
  const table = source.slice(source.indexOf("| Token |"), source.indexOf("### Measured values"));
  return table
    .split("\n")
    .filter((line) => line.startsWith("| `--"))
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      return {
        name: cells[1]?.replaceAll("`", "") ?? "",
        value: readmeValue(cells[2] ?? ""),
        source: cells[3] ?? "",
      };
    });
}

const declared = cssTokens(css);
const documented = readmeTokens(readme);

test("every token in tokens.css is documented with the same value, in file order", () => {
  expect(documented.map((token) => token.name)).toEqual(declared.map((token) => token.name));
  for (const [index, token] of declared.entries()) {
    const row = documented[index];
    expect(row?.name).toBe(token.name);
    if (row?.value === "system stack") {
      expect(token.value.length).toBeGreaterThan(0);
      continue;
    }
    expect(row?.value.toLowerCase()).toBe(token.value.toLowerCase());
  }
});

test("the tokens demo names every declared token and no extra one", () => {
  const demoNames = [...demo.matchAll(/"(--[a-z0-9-]+)"/g)].map((match) => match[1] ?? "");
  expect(new Set(demoNames)).toEqual(new Set(declared.map((token) => token.name)));
});

test("list-pass names and values match tokens.css and the source table", () => {
  const byName = new Map(declared.map((token) => [token.name, token.value]));
  const documentedByName = new Map(documented.map((token) => [token.name, token]));
  for (const [name, value] of Object.entries(LIST_PASS)) {
    expect(byName.get(name)?.toLowerCase()).toBe(value);
    expect(documentedByName.get(name)?.value.toLowerCase()).toBe(value);
    expect(documentedByName.get(name)?.source).toContain("list-views.md");
    expect(documentedByName.get(name)?.source).not.toContain("not yet measured");
  }
});

test("list-spec quotations in the source table occur in the visual layout section", () => {
  const visual = listSpec.slice(
    listSpec.indexOf("### Visual layout"),
    listSpec.indexOf("## Fields"),
  );
  const missing: string[] = [];
  for (const line of readme.split("\n")) {
    if (!line.includes("list-views.md")) continue;
    const tail = line.slice(line.indexOf("list-views.md"));
    for (const quote of tail.matchAll(/"([^"]+)"/g)) {
      const text = quote[1] ?? "";
      if (!visual.includes(text)) missing.push(text);
    }
  }
  expect(missing).toEqual([]);
});
