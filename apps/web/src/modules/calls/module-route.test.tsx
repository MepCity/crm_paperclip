import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { moduleListPage, modulePageMetadata } from "../module-route";
import { resolveModuleScreen } from "../registry";
import type { ModuleScreenDefinition } from "../types";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/session", () => ({
  requireOrgContext: vi.fn(async () => ({ userId: "route-author" })),
}));
vi.mock("@/components/shell/page-title", () => ({
  PageTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("../registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("../registry")>();
  const { callsScreenDefinition } = await import("./definition");
  const definitions = [...original.getModuleScreens(), callsScreenDefinition];
  return {
    ...original,
    resolveModuleScreen: (tab: string) => original.resolveModuleScreen(tab, definitions),
  };
});
vi.mock("../module-list-client", () => ({
  ModuleListClient: ({
    definition,
    viewId,
  }: {
    definition: ModuleScreenDefinition;
    viewId?: string;
  }) => (
    <p>
      {definition.apiName}:list:{viewId ?? "default"}
    </p>
  ),
}));

afterEach(cleanup);

const params = (extra = {}) =>
  Promise.resolve({ orgSlug: "sample-org", moduleTab: "Calls", ...extra });

test.each([
  [moduleListPage, {}, "Calls:list:default"],
  [moduleListPage, { viewId: "custom-sample" }, "Calls:list:custom-sample"],
])("resolves a test-only Calls module for route %#", async (page, extra, expected) => {
  render(await page({ params: params(extra) }));
  expect(screen.getByRole("heading", { name: "Calls" })).toBeTruthy();
  expect(screen.getByText(expected)).toBeTruthy();
});

test("uses the Calls page title for test-only registration", async () => {
  expect(await modulePageMetadata({ params: params() })).toEqual({ title: "Calls" });
  expect(resolveModuleScreen("Unknown")).toBeUndefined();
});

test.each([moduleListPage, modulePageMetadata])(
  "unknown tabs use the existing not-found boundary %#",
  async (page) => {
    await expect(
      page({
        params: Promise.resolve({
          orgSlug: "sample-org",
          moduleTab: "Unknown",
          recordId: "sample-record",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  },
);
