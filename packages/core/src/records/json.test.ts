import { describe, expect, it } from "vitest";
import { isJsonArray, isJsonObject } from "./json";

describe("isJsonObject", () => {
  it("returns true for empty and plain objects", () => {
    expect(isJsonObject({})).toBe(true);
    expect(isJsonObject({ a: 1, b: "text", c: true, d: null })).toBe(true);
  });

  it("returns true for Object.create(null) objects", () => {
    const nullProtoObj = Object.create(null);
    expect(isJsonObject(nullProtoObj)).toBe(true);

    const populatedNullProto = Object.create(null);
    populatedNullProto.key = "val";
    populatedNullProto.count = 42;
    expect(isJsonObject(populatedNullProto)).toBe(true);
  });

  it("returns true for nested objects and arrays", () => {
    expect(
      isJsonObject({
        str: "hello",
        num: 0,
        nested: {
          flag: false,
          arr: [1, "two", null, { deep: true }],
        },
      }),
    ).toBe(true);
  });

  it("returns true for DAGs where the same sub-object is reused across sibling branches", () => {
    const sharedLeaf = { value: 42 };
    const root = {
      branchA: sharedLeaf,
      branchB: sharedLeaf,
    };
    expect(isJsonObject(root)).toBe(true);

    const sharedArray = ["item1", "item2"];
    const rootWithSharedArray = {
      first: sharedArray,
      second: sharedArray,
    };
    expect(isJsonObject(rootWithSharedArray)).toBe(true);

    const deepLeaf = { id: "leaf" };
    const middle1 = { leaf: deepLeaf, other: 1 };
    const middle2 = { leaf: deepLeaf, other: 2 };
    expect(isJsonObject({ left: middle1, right: middle2 })).toBe(true);
  });

  it("returns false for arrays, null, and primitive values", () => {
    expect(isJsonObject([])).toBe(false);
    expect(isJsonObject([1, 2, 3])).toBe(false);
    expect(isJsonObject(null)).toBe(false);
    expect(isJsonObject(undefined)).toBe(false);
    expect(isJsonObject("string")).toBe(false);
    expect(isJsonObject(123)).toBe(false);
    expect(isJsonObject(0)).toBe(false);
    expect(isJsonObject(true)).toBe(false);
    expect(isJsonObject(false)).toBe(false);
    expect(isJsonObject(Symbol("sym"))).toBe(false);
    expect(isJsonObject(BigInt(100))).toBe(false);
  });

  it("returns false when containing NaN or Infinity values", () => {
    expect(isJsonObject({ a: Number.NaN })).toBe(false);
    expect(isJsonObject({ a: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isJsonObject({ a: Number.NEGATIVE_INFINITY })).toBe(false);
    expect(isJsonObject({ nested: { num: Number.NaN } })).toBe(false);
    expect(isJsonObject({ arr: [1, Number.NaN] })).toBe(false);
  });

  it("returns false when containing undefined values", () => {
    expect(isJsonObject({ a: undefined })).toBe(false);
    expect(isJsonObject({ nested: { a: undefined } })).toBe(false);
    expect(isJsonObject({ arr: [undefined] })).toBe(false);
  });

  it("returns false when containing function values or methods", () => {
    expect(isJsonObject({ fn: () => {} })).toBe(false);
    expect(
      isJsonObject({
        // biome-ignore lint/complexity/useArrowFunction: verify function expressions
        fn: function () {},
      }),
    ).toBe(false);
    expect(
      isJsonObject({
        method() {
          return 1;
        },
      }),
    ).toBe(false);
  });

  it("returns false when containing Date, Map, Set, RegExp or class instances", () => {
    expect(isJsonObject(new Date())).toBe(false);
    expect(isJsonObject({ d: new Date() })).toBe(false);
    expect(isJsonObject({ m: new Map() })).toBe(false);
    expect(isJsonObject({ s: new Set() })).toBe(false);
    expect(isJsonObject({ r: /abc/ })).toBe(false);

    class CustomClass {
      val = 1;
    }
    expect(isJsonObject(new CustomClass())).toBe(false);
    expect(isJsonObject({ instance: new CustomClass() })).toBe(false);

    const customProto = Object.create({ protoProp: "inherited" });
    expect(isJsonObject(customProto)).toBe(false);
  });

  it("returns false when object has symbol keys", () => {
    const sym = Symbol("test");
    expect(isJsonObject({ [sym]: "value" })).toBe(false);
    expect(isJsonObject({ [Symbol.for("global")]: 123 })).toBe(false);

    const objWithSym = { normal: "ok" };
    Object.defineProperty(objWithSym, sym, {
      value: "hidden",
      enumerable: true,
    });
    expect(isJsonObject(objWithSym)).toBe(false);
  });

  it("returns false for cyclic (self-referencing) objects", () => {
    const directCycle: Record<string, unknown> = {};
    directCycle.self = directCycle;
    expect(isJsonObject(directCycle)).toBe(false);

    const branchA: Record<string, unknown> = {};
    const branchB: Record<string, unknown> = { branchA };
    branchA.branchB = branchB;
    expect(isJsonObject(branchA)).toBe(false);

    const cycleViaArray: Record<string, unknown> = {};
    cycleViaArray.arr = [cycleViaArray];
    expect(isJsonObject(cycleViaArray)).toBe(false);
  });

  it("returns false for properties with getters, setters, or non-enumerable flags", () => {
    const withGetter = {};
    Object.defineProperty(withGetter, "foo", {
      get() {
        return "bar";
      },
      enumerable: true,
    });
    expect(isJsonObject(withGetter)).toBe(false);

    const withSetter = {};
    Object.defineProperty(withSetter, "foo", {
      set() {},
      enumerable: true,
    });
    expect(isJsonObject(withSetter)).toBe(false);

    const withNonEnumerable = {};
    Object.defineProperty(withNonEnumerable, "foo", {
      value: "bar",
      enumerable: false,
    });
    expect(isJsonObject(withNonEnumerable)).toBe(false);
  });
});

describe("isJsonArray", () => {
  it("returns true for plain arrays containing valid JSON elements", () => {
    expect(isJsonArray([])).toBe(true);
    expect(isJsonArray([1, "text", true, false, null])).toBe(true);
    expect(isJsonArray([[1, 2], [{ a: "b" }], null])).toBe(true);
  });

  it("returns true for DAGs where the same sub-element is reused across array elements", () => {
    const sharedObj = { id: 1, name: "shared" };
    expect(isJsonArray([sharedObj, sharedObj])).toBe(true);

    const sharedSubArray = [1, 2, 3];
    expect(isJsonArray([sharedSubArray, sharedSubArray])).toBe(true);
  });

  it("returns false for sparse arrays", () => {
    // biome-ignore lint/suspicious/noSparseArray: verify sparse arrays
    const sparse = [1, , 3];
    expect(isJsonArray(sparse)).toBe(false);
    expect(isJsonArray(new Array(3))).toBe(false);

    const deletedElementArr = [1, 2, 3];
    delete (deletedElementArr as unknown[])[1];
    expect(isJsonArray(deletedElementArr)).toBe(false);
  });

  it("returns false for arrays with extra named or non-index properties", () => {
    const arrWithNamedProp: unknown[] = [1, 2];
    (arrWithNamedProp as unknown as Record<string, unknown>).extra = "bad";
    expect(isJsonArray(arrWithNamedProp)).toBe(false);

    const arrWithNegativeKey: unknown[] = [1, 2];
    (arrWithNegativeKey as unknown as Record<string, unknown>)["-1"] = "bad";
    expect(isJsonArray(arrWithNegativeKey)).toBe(false);

    const arrWithFloatKey: unknown[] = [1, 2];
    (arrWithFloatKey as unknown as Record<string, unknown>)["1.5"] = "bad";
    expect(isJsonArray(arrWithFloatKey)).toBe(false);

    const arrWithLeadingZeroKey: unknown[] = [1, 2];
    (arrWithLeadingZeroKey as unknown as Record<string, unknown>)["01"] = "bad";
    expect(isJsonArray(arrWithLeadingZeroKey)).toBe(false);

    const arrWithSymbolKey: unknown[] = [1, 2];
    (arrWithSymbolKey as unknown as Record<symbol, unknown>)[Symbol("extra")] = "bad";
    expect(isJsonArray(arrWithSymbolKey)).toBe(false);
  });

  it("returns false for objects, null, and primitive values", () => {
    expect(isJsonArray({})).toBe(false);
    expect(isJsonArray({ length: 0 })).toBe(false);
    expect(isJsonArray({ 0: "a", 1: "b", length: 2 })).toBe(false);
    expect(isJsonArray(null)).toBe(false);
    expect(isJsonArray(undefined)).toBe(false);
    expect(isJsonArray("[]")).toBe(false);
    expect(isJsonArray(123)).toBe(false);
    expect(isJsonArray(true)).toBe(false);
    expect(isJsonArray(Symbol("sym"))).toBe(false);
    expect(isJsonArray(BigInt(10))).toBe(false);
  });

  it("returns false when containing invalid elements", () => {
    expect(isJsonArray([Number.NaN])).toBe(false);
    expect(isJsonArray([Number.POSITIVE_INFINITY])).toBe(false);
    expect(isJsonArray([Number.NEGATIVE_INFINITY])).toBe(false);
    expect(isJsonArray([undefined])).toBe(false);
    expect(isJsonArray([() => {}])).toBe(false);
    expect(isJsonArray([new Date()])).toBe(false);
    expect(isJsonArray([new Map()])).toBe(false);
    expect(isJsonArray([new Set()])).toBe(false);
    expect(isJsonArray([{ fn: () => {} }])).toBe(false);
  });

  it("returns false for cyclic arrays", () => {
    const directCycle: unknown[] = [];
    directCycle.push(directCycle);
    expect(isJsonArray(directCycle)).toBe(false);

    const indirectCycleA: unknown[] = [];
    const indirectCycleB: unknown[] = [indirectCycleA];
    indirectCycleA.push(indirectCycleB);
    expect(isJsonArray(indirectCycleA)).toBe(false);

    const cycleViaObject: unknown[] = [];
    cycleViaObject.push({ arr: cycleViaObject });
    expect(isJsonArray(cycleViaObject)).toBe(false);
  });

  it("returns false when array elements or indices have getters or non-enumerable flags", () => {
    const arrayWithGetter = [1, 2];
    Object.defineProperty(arrayWithGetter, "0", {
      get() {
        return 1;
      },
      enumerable: true,
      configurable: true,
    });
    expect(isJsonArray(arrayWithGetter)).toBe(false);

    const arrayWithNonEnumerable = [1, 2];
    Object.defineProperty(arrayWithNonEnumerable, "0", {
      value: 1,
      enumerable: false,
      configurable: true,
    });
    expect(isJsonArray(arrayWithNonEnumerable)).toBe(false);
  });
});
