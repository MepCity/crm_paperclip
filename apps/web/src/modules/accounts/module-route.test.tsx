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
}));
vi.mock("@/lib/session", () => ({
  requireOrgContext: vi.fn(async () => ({ userId: "route-author" })),
}));
vi.mock("@/components/shell/page-title", () => ({
  PageTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("../registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("../registry")>();
  const { accountsScreenDefinition } = await import("./definition");
  const definitions = [...original.moduleScreens, accountsScreenDefinition];
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
      {definition.apiName}:detail:{recordId}:
      {definition.detail.statusRibbon ? "ribbon" : "no ribbon"}
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
  Promise.resolve({ orgSlug: "sample-org", moduleTab: "Accounts", ...extra });

test.each([
  [moduleListPage, {}, "Accounts:list:default"],
  [moduleListPage, { viewId: "custom-sample" }, "Accounts:list:custom-sample"],
  [moduleDetailPage, { recordId: "sample-record" }, "Accounts:detail:sample-record:no ribbon"],
  [moduleCreatePage, {}, "Accounts:form:new"],
  [moduleEditPage, { recordId: "sample-record" }, "Accounts:form:sample-record"],
  [moduleClonePage, { recordId: "sample-record" }, "Accounts:form:sample-record"],
])("resolves a test-only Accounts module for route %#", async (page, extra, expected) => {
  render(await page({ params: params(extra) }));
  expect(screen.getByRole("heading", { name: "Accounts" })).toBeTruthy();
  expect(screen.getByText(expected)).toBeTruthy();
});

test("uses the Accounts page title for test-only registration", async () => {
  expect(await modulePageMetadata({ params: params() })).toEqual({ title: "Accounts" });
  expect(resolveModuleScreen("Unknown")).toBeUndefined();
});

test.each([
  moduleListPage,
  moduleDetailPage,
  moduleCreatePage,
  moduleEditPage,
  moduleClonePage,
  modulePageMetadata,
])("unknown tabs use the existing not-found boundary %#", async (page) => {
  await expect(
    page({
      params: Promise.resolve({
        orgSlug: "sample-org",
        moduleTab: "Unknown",
        recordId: "sample-record",
      }),
    }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
});
