import { type MessageFormatElement, parse, TYPE } from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";
import { catalog, english, mergeCatalog, SAFE_ERROR, translator, turkish } from "./catalogs";
import { resolveLanguage } from "./resolve-language";

function leaves(tree: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string" ? [[path, value]] : Object.entries(leaves(value, path));
    }),
  );
}
function args(elements: MessageFormatElement[]): string[] {
  return [
    ...new Set(
      elements.flatMap((item) => {
        if (item.type === TYPE.literal || item.type === TYPE.pound) return [];
        if (item.type === TYPE.select || item.type === TYPE.plural)
          return [
            item.value,
            ...Object.values(item.options).flatMap((option) => args(option.value)),
          ];
        if (item.type === TYPE.tag) return [item.value, ...args(item.children)];
        return [item.value];
      }),
    ),
  ].sort();
}

describe("interface language and catalogs", () => {
  it("uses only supported saved preferences; browser/organization inputs are not accepted", () => {
    for (const [value, result] of [
      ["tr", "tr"],
      ["en", "en"],
      [null, "en"],
      [undefined, "en"],
      ["tr-TR", "en"],
      ["Turkish", "en"],
      [{ language: "tr" }, "en"],
    ])
      expect(resolveLanguage(value)).toBe(result);
  });
  it("validates all English and Turkish ICU leaves and identical argument/key sets", () => {
    const en = leaves(english);
    const tr = leaves(turkish);
    expect(Object.keys(tr).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe("");
      expect(tr[key]?.trim(), key).toBeTruthy();
      expect(args(parse(tr[key] ?? "")), key).toEqual(args(parse(value)));
    }
  });
  it("deep-merges missing/empty/invalid leaves and uses English plural rules", () => {
    const merged = mergeCatalog(english, { common: { actions: { save: "Kaydet" }, selected: "" } });
    expect(merged.fallbacks.has("common.selected")).toBe(true);
    const t = translator("tr", { common: { actions: { save: "Kaydet" } } });
    expect(t("common.actions.save")).toBe("Kaydet");
    expect(t("common.selected", { count: 0 })).toBe("0 records selected");
    expect(t("common.selected", { count: 1 })).toBe("1 record selected");
    expect(t("common.selected", { count: 2 })).toBe("2 records selected");
  });
  it("retries malformed selected ICU and handles absent English keys safely", () => {
    const t = translator("tr", { common: { selected: "{count, plural," } });
    expect(t("common.selected", { count: 2 })).toBe("2 records selected");
    expect(t("absent", { privateValue: "sensitive" })).toBe(SAFE_ERROR);
  });
  it("assembles the same complete namespaces for every language", () => {
    expect(Object.keys(catalog("tr").messages)).toEqual(Object.keys(catalog("en").messages));
  });
});
