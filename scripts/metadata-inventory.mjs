// Prints a counts-only inventory of a local metadata export as Markdown.
// Usage: node scripts/metadata-inventory.mjs <metadata-folder>
// Only numbers, module API names and data-type names are printed.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CONTRACT = join(here, "../packages/core/src/records/contract.ts");

const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);
const nonEmpty = (v) => v != null && typeof v === "object" && Object.keys(v).length > 0;

/** Static list of data types the record engine supports, read from its contract source. */
export function engineFieldTypes(source = readFileSync(CONTRACT, "utf8")) {
  const m = source.match(/export type FieldDataType =([^;]+);/);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

export function inventory(dir) {
  const modulesDir = join(dir, "modules");
  const modules = existsSync(modulesDir) ? readdirSync(modulesDir).sort() : [];
  const rows = [];
  const total = { types: {}, flags: {} };
  const bump = (o, k, n = 1) => {
    o[k] = (o[k] ?? 0) + n;
  };
  for (const name of modules) {
    const base = join(modulesDir, name);
    const fields = readJson(join(base, "fields.json"))?.fields ?? [];
    const layouts = readJson(join(base, "layouts.json"))?.layouts ?? [];
    const views = readJson(join(base, "custom_views.json"))?.custom_views ?? [];
    const types = {};
    const flags = {
      custom: 0,
      system: 0,
      mass_update: 0,
      unique: 0,
      read_only: 0,
      formula: 0,
      lookup: 0,
      picklist: 0,
    };
    for (const f of fields) {
      const t = String(f.data_type ?? "unknown");
      bump(types, t);
      bump(total.types, t);
      if (f.custom_field === true) flags.custom++;
      else flags.system++;
      if (f.mass_update === true) flags.mass_update++;
      if (nonEmpty(f.unique)) flags.unique++;
      if (f.read_only === true) flags.read_only++;
      if (nonEmpty(f.formula)) flags.formula++;
      if (nonEmpty(f.lookup) || /lookup/.test(t)) flags.lookup++;
      if (t === "picklist") flags.picklist++;
    }
    for (const [k, v] of Object.entries(flags)) bump(total.flags, k, v);
    rows.push({
      name,
      fields: fields.length,
      layouts: layouts.length,
      sections: layouts.reduce((n, l) => n + (l.sections?.length ?? 0), 0),
      views: views.length,
      types,
      flags,
    });
  }
  return { rows, total };
}

export function render(dir) {
  const { rows, total } = inventory(dir);
  const out = ["# Metadata inventory (counts only)", ""];
  const fmt = (o) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b));
  out.push("## Per module", "");
  out.push(
    "| Module | Fields | Custom | System | mass_update | unique | read_only | formula | lookup | picklist | Layouts | Sections | Custom views |",
  );
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const f = r.flags;
    out.push(
      `| ${r.name} | ${r.fields} | ${f.custom} | ${f.system} | ${f.mass_update} | ${f.unique} | ${f.read_only} | ${f.formula} | ${f.lookup} | ${f.picklist} | ${r.layouts} | ${r.sections} | ${r.views} |`,
    );
  }
  out.push("", "## Fields by data type (all modules)", "", "| Data type | Fields |", "|---|---|");
  for (const [t, n] of fmt(total.types)) out.push(`| ${t} | ${n} |`);
  out.push(
    "",
    "## Fields by data type per module",
    "",
    "| Module | Data type | Fields |",
    "|---|---|---|",
  );
  for (const r of rows) for (const [t, n] of fmt(r.types)) out.push(`| ${r.name} | ${t} | ${n} |`);
  const engine = engineFieldTypes();
  const missing = fmt(total.types).filter(([t]) => !engine.includes(t));
  out.push(
    "",
    "## In metadata, not in our record engine",
    "",
    "| Data type | Fields |",
    "|---|---|",
  );
  if (missing.length === 0) out.push("| (none) | 0 |");
  for (const [t, n] of missing) out.push(`| ${t} | ${n} |`);
  const unused = engine.filter((t) => !(t in total.types));
  out.push(
    "",
    `Engine types not present in metadata: ${unused.length ? unused.join(", ") : "(none)"}`,
    "",
  );
  return out.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: node scripts/metadata-inventory.mjs <metadata-folder>");
    process.exit(2);
  }
  process.stdout.write(`${render(dir)}\n`);
}
