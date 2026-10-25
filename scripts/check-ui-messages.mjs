import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const userProps = new Set([
  "label",
  "title",
  "description",
  "message",
  "placeholder",
  "aria-label",
  "aria-description",
  "alt",
  "emptyMessage",
  "confirmLabel",
  "cancelLabel",
  "textValue",
  "errorMessage",
]);

export function scanSource(source, file = "fixture.tsx") {
  let ast;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
  } catch {
    return [];
  }

  const hits = [];
  const add = (node, value) => {
    const text = value.replace(/\s+/g, " ").trim();
    if (!/[a-zA-Z\u00c0-\u024f]/u.test(text)) return;
    const loc = node.loc?.start;
    hits.push({
      file,
      line: loc ? loc.line : 1,
      column: loc ? loc.column + 1 : 1,
      hash: createHash("sha256").update(text).digest("hex").slice(0, 16),
    });
  };

  const getLiteralText = (node) => {
    if (!node) return null;
    if (node.type === "StringLiteral") return node.value;
    if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
      return node.quasis[0].value.raw;
    }
    return null;
  };

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.type === "JSXText") {
      add(node, node.value);
    } else if (node.type === "JSXAttribute") {
      const propName = node.name?.name;
      if (userProps.has(propName) && node.value) {
        if (node.value.type === "StringLiteral") {
          add(node.value, node.value.value);
        } else if (node.value.type === "JSXExpressionContainer") {
          const lit = getLiteralText(node.value.expression);
          if (lit !== null) add(node.value.expression, lit);
        }
      }
    } else if (node.type === "ObjectProperty") {
      const propName =
        node.key?.type === "Identifier"
          ? node.key.name
          : node.key?.type === "StringLiteral"
            ? node.key.value
            : null;
      if (propName && userProps.has(propName)) {
        const lit = getLiteralText(node.value);
        if (lit !== null) add(node.value, lit);
      }
    } else if (node.type === "CallExpression") {
      const calleeName =
        node.callee?.type === "Identifier"
          ? node.callee.name
          : node.callee?.type === "MemberExpression" && node.callee.property?.type === "Identifier"
            ? node.callee.property.name
            : null;
      if (calleeName && /^(toast|setError|setMessage|alert)$/.test(calleeName)) {
        for (const arg of node.arguments) {
          const lit = getLiteralText(arg);
          if (lit !== null) add(arg, lit);
        }
      }
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "comments") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item.type === "string") walk(item);
        }
      } else if (child && typeof child.type === "string") {
        walk(child);
      }
    }
  }

  walk(ast);
  return hits;
}

export function scanWorkspace(root) {
  const results = [];
  const sourceRoot = join(root, "apps/web/src");
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const file = relative(root, path).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        if (!/(?:\/i18n|\/server|\/test|\/app\/api)$/.test(file)) walk(path);
      } else if (/\.tsx?$/.test(file) && !/\.(?:test|int\.test|demo)\.|fixture|\.d\.ts$/.test(file))
        results.push(...scanSource(readFileSync(path, "utf8"), file));
    }
  }
  walk(sourceRoot);
  return results.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  );
}

export function compareBaseline(actual, baseline) {
  const id = (hit) => JSON.stringify(hit);
  const existing = new Set(baseline.map(id));
  const current = new Set(actual.map(id));
  return {
    added: actual.filter((hit) => !existing.has(id(hit))),
    stale: baseline.filter((hit) => !current.has(id(hit))),
  };
}

export const COMPLETED_MODULE_PREFIXES = [
  "apps/web/src/components/shell/",
  "apps/web/src/modules/settings-personal/",
];

export function filterUnauthorizedExemptions(
  added,
  main,
  completedPrefixes = COMPLETED_MODULE_PREFIXES,
) {
  const mainByFileHash = new Set(main.map((m) => `${m.file}:${m.hash}`));
  return added.filter((hit) => {
    // If the same file and hash already existed in main, it is a shifted line, not a new exemption.
    if (mainByFileHash.has(`${hit.file}:${hit.hash}`)) return false;
    // Completed modules allow no new baseline additions.
    return completedPrefixes.some((p) => hit.file.startsWith(p));
  });
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) ===
    fileURLToPath(new URL(process.argv[1], `file://${process.cwd()}/`))
) {
  const root = process.cwd();
  const path = "scripts/ui-messages-baseline.json";
  const baselineFile = join(root, path);

  if (process.argv.includes("--write") || !existsSync(baselineFile)) {
    const hits = scanWorkspace(root);
    writeFileSync(baselineFile, `${JSON.stringify(hits, null, 2)}\n`, "utf8");
    console.log(`UI message guard: baseline written to ${path} with ${hits.length} items.`);
    process.exit(0);
  }

  const baseline = JSON.parse(readFileSync(baselineFile, "utf8"));
  // On subsequent branches the committed main baseline is authoritative; a PR
  // cannot silently grant itself extra exemptions by regenerating this file.
  let main;
  try {
    main = JSON.parse(
      execFileSync("git", ["show", `origin/main:${path}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    /* Initial adoption has no main baseline yet. */
  }
  const result = compareBaseline(scanWorkspace(root), baseline);
  const rawExpanded = main ? compareBaseline(baseline, main).added : [];
  const expanded = filterUnauthorizedExemptions(rawExpanded, main || []);
  if (result.added.length || result.stale.length || expanded.length) {
    console.error(JSON.stringify({ ...result, unauthorizedExemptions: expanded }, null, 2));
    process.exitCode = 1;
  } else
    console.log(
      `UI message guard: ${baseline.length} existing literals; no additions or stale exemptions.`,
    );
}
