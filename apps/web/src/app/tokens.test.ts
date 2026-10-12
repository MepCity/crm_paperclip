import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(directory, "tokens.css"), "utf8");
const readme = readFileSync(resolve(directory, "../components/ui/README.md"), "utf8");
const demo = readFileSync(resolve(directory, "../components/ui/tokens.demo.tsx"), "utf8");
const listSpec = readFileSync(
  resolve(directory, "../../../../research/specs/list-views.md"),
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
  "--color-primary-disabled": "#adb3ee",
  "--color-popover-sort-border": "#ced0e1",
  "--color-surface-selected": "#f0f4fc",
  "--color-surface-active": "#edf0f9",
  "--color-text-strong": "#202123",
  "--color-text-disabled": "#b5b8be",
  "--radius-xl": "1rem",
  "--size-popover-sort-field-top": "57px",
  "--size-popover-sort-inset-inline": "31px",
  "--size-popover-sort-inset-end": "39px",
  "--size-popover-sort-field-gap": "15px",
  "--size-popover-sort-label-gap": "18px",
  "--size-popover-sort-actions-offset": "20px",
  "--size-popover-sort-button-height": "27px",
  "--size-popover-sort-cancel-width": "66.5px",
  "--size-popover-sort-apply-width": "60px",
  "--size-popover-sort-button-gap": "8px",
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

// Binding CTO mapping from typography.md → List and detail text roles.
test("adopted typography tokens keep their exact values", () => {
  const byName = new Map(declared.map((token) => [token.name, token.value]));
  for (const [name, value] of Object.entries({
    "--font-weight-normal": "400",
    "--font-weight-semibold": "510",
    "--font-weight-bold": "650",
    "--text-sm": "0.84375rem",
    "--text-md": "0.90625rem",
    "--text-base": "1rem",
    "--text-lg": "0.96875rem",
    "--text-xl": "1.15625rem",
    "--text-2xl": "1.28125rem",
    "--text-3xl": "1.875rem",
  })) {
    expect(byName.get(name), name).toBe(value);
  }
  expect(byName.has("--font-weight-medium")).toBe(false);
  expect(byName.has("--text-13")).toBe(false);
});

test("retired typography tokens and utilities never fall back to framework defaults", () => {
  const forbidden = ["--font-weight-medium", "--text-13", "font-medium", "text-13"];
  const thisFile = fileURLToPath(import.meta.url);
  const violations: string[] = [];
  function scan(folder: string) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (entry.isFile() && path !== thisFile) {
        const source = readFileSync(path, "utf8");
        for (const token of forbidden) {
          if (source.includes(token)) violations.push(`${relative(directory, path)}: ${token}`);
        }
      }
    }
  }
  scan(resolve(directory, ".."));
  scan(resolve(directory, "../../e2e"));
  expect(violations).toEqual([]);
});
