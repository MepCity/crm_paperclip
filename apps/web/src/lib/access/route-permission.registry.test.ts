import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OPERATION_PERMISSIONS, TAGS_BIN_PERMISSIONS } from "@/lib/api/route-permissions";
import { operations } from "@/lib/api/wire/operations";
import { transferOperations } from "@/lib/api/wire/transfer";

const appDir = join(__dirname, "../../app");
const srcDir = join(__dirname, "../..");

function walk(dir: string, accept: (file: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, accept, out);
    else if (accept(full)) out.push(full);
  }
  return out;
}

const WRAPPERS =
  /\b(apiRoute|operationRoute|transferRoute|tagsBinRoute|attachmentRoute|accessRoute|exemptRoute)\b/;

/** Splits a route file into its `export const|function METHOD` statements. */
function bindings(source: string): { method: string; text: string }[] {
  const parts = source.split(
    /^(?=export (?:const|async function|function) (?:GET|POST|PUT|PATCH|DELETE)\b)/m,
  );
  return parts
    .map((text) => ({
      text,
      method: /^export (?:const|async function|function) (\w+)/.exec(text)?.[1] ?? "",
    }))
    .filter((b) => b.method !== "");
}

describe("permission registry (ADR 0017 §11.2)", () => {
  const routes = walk(appDir, (f) => f.endsWith("/route.ts"));

  it("finds the route files", () => {
    expect(routes.length).toBeGreaterThan(60);
  });

  it("every route binding goes through a declaring wrapper", () => {
    const offenders: string[] = [];
    for (const file of routes) {
      const source = readFileSync(file, "utf8");
      for (const b of bindings(source)) {
        const viaHandler = /=\s*handler\s*;/.test(b.text) && /exemptRoute\(/.test(source);
        if (!WRAPPERS.test(b.text) && !viaHandler) offenders.push(`${file} ${b.method}`);
        // A direct apiRoute call must carry its own declaration.
        if (/\bapiRoute\b/.test(b.text) && !/permission:/.test(b.text))
          offenders.push(`${file} ${b.method} (no permission)`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every server action checks or explicitly exempts its permission", () => {
    const files = walk(srcDir, (f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)).filter((f) =>
      /^\s*["']use server["']/.test(readFileSync(f, "utf8")),
    );
    expect(files.length).toBeGreaterThanOrEqual(6);
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const parts = source.split(/^(?=export async function )/m).slice(1);
      for (const part of parts) {
        if (!/requireActionPermission\(|declareActionExempt\(/.test(part)) {
          offenders.push(`${file} ${/function (\w+)/.exec(part)?.[1]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every wire operation has a declared permission", () => {
    const missing: string[] = [];
    for (const op of [...Object.values(operations), ...Object.values(transferOperations)]) {
      if (!OPERATION_PERMISSIONS[`${op.method} ${op.path}`])
        missing.push(`${op.method} ${op.path}`);
    }
    expect(missing).toEqual([]);
  });

  it("every tags/recycle-bin operation has a declared permission", () => {
    for (const key of [
      "tags",
      "create",
      "update",
      "delete",
      "add",
      "remove",
      "bin",
      "restore",
      "purge",
      "empty",
    ]) {
      expect(TAGS_BIN_PERMISSIONS[key]).toBeDefined();
    }
  });
});
