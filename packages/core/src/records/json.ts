import type { JsonObject, JsonValue } from "./contract";

/** Plain JSON only, with finite numbers and no cycles or non-JSON members. */
function isJsonContainer(value: unknown): boolean {
  const ancestors = new Set<object>();
  function valid(item: unknown): boolean {
    if (item === null || typeof item === "string" || typeof item === "boolean") return true;
    if (typeof item === "number") return Number.isFinite(item);
    if (typeof item !== "object" || ancestors.has(item)) return false;
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    )
      return false;
    ancestors.add(item);
    const keys = Reflect.ownKeys(item);
    const array = Array.isArray(item);
    const result =
      (!array || keys.length === item.length + 1) &&
      keys.every((key) => {
        if (typeof key !== "string") return false;
        if (array && key === "length") return true;
        if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= item.length)) return false;
        const descriptor = Object.getOwnPropertyDescriptor(item, key);
        return descriptor?.enumerable === true && "value" in descriptor && valid(descriptor.value);
      });
    ancestors.delete(item);
    return result;
  }
  return value !== null && typeof value === "object" && valid(value);
}

export function isJsonObject(value: unknown): value is JsonObject {
  return !Array.isArray(value) && isJsonContainer(value);
}
export function isJsonArray(value: unknown): value is readonly JsonValue[] {
  return Array.isArray(value) && isJsonContainer(value);
}
