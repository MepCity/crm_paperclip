import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  moduleClonePage,
  moduleCreatePage,
  moduleDetailPage,
  moduleEditPage,
  moduleListPage,
  modulePageMetadata,
} from "../module-route";
import { resolveModuleScreen } from "../registry";
import type { ModuleScreenDefinition } from "../types";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/session", () => ({
  requireOrgContext: vi.fn(async () => ({ userId: "route-author" })),
}));
vi.mock("@/components/shell/page-title", () => ({
  PageTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("../registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("../registry")>();
  const { productsScreenDefinition } = await import("./definition");
  const definitions = [...original.getModuleScreens(), productsScreenDefinition];
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
vi.mock("@/components/records/detail/record-detail-screen", () => ({
  RecordDetailScreen: ({
    definition,
    recordId,
  }: {
    definition: ModuleScreenDefinition;
    recordId: string;
  }) => (
    <p>
      {definition.apiName}:detail:{recordId}:no ribbon
    </p>
  ),
}));
vi.mock("../module-form-client", () => ({
  ModuleFormClient: ({
    definition,
    recordId,
    cloneSourceId,
  }: {
    definition: ModuleScreenDefinition;
    recordId?: string;
    cloneSourceId?: string;
  }) => (
    <p>
      {definition.apiName}:form:{recordId ?? cloneSourceId ?? "new"}
    </p>
  ),
}));

afterEach(cleanup);

const params = (extra = {}) =>
  Promise.resolve({ orgSlug: "sample-org", moduleTab: "Products", ...extra });

test.each([
  [moduleListPage, {}, "Products:list:default"],
  [moduleListPage, { viewId: "custom-sample" }, "Products:list:custom-sample"],
  [moduleDetailPage, { recordId: "sample-record" }, "Products:detail:sample-record:no ribbon"],
  [moduleCreatePage, {}, "Products:form:new"],
  [moduleEditPage, { recordId: "sample-record" }, "Products:form:sample-record"],
  [moduleClonePage, { recordId: "sample-record" }, "Products:form:sample-record"],
])("resolves a test-only Products module for route %#", async (page, extra, expected) => {
  render(await page({ params: params(extra) }));
  expect(screen.getByRole("heading", { name: "Products" })).toBeTruthy();
  expect(screen.getByText(expected)).toBeTruthy();
});

test("uses the Products page title for test-only registration", async () => {
  expect(await modulePageMetadata({ params: params() })).toEqual({ title: "Products" });
  expect(resolveModuleScreen("Unknown")).toBeUndefined();
});

test.each([
  [moduleListPage, {}],
  [moduleListPage, { viewId: "custom-sample" }],
  [moduleDetailPage, { recordId: "sample-record" }],
  [moduleCreatePage, {}],
  [moduleEditPage, { recordId: "sample-record" }],
  [moduleClonePage, { recordId: "sample-record" }],
])("rejects unknown module tab for route %#", async (page, extra) => {
  await expect(
    page({ params: Promise.resolve({ orgSlug: "sample-org", moduleTab: "Nope", ...extra }) }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
});
