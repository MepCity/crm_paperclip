import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { leadsScreenDefinition } from "./leads/definition";
import type { ModuleScreenDefinition } from "./types";

const resolveModuleScreen = vi.fn<(tab: string) => ModuleScreenDefinition | undefined>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("./registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("./registry")>();
  return {
    ...original,
    resolveModuleScreen: (tab: string) => resolveModuleScreen(tab),
  };
});
vi.mock("./module-list-client", () => ({
  ModuleListClient: () => <p>list</p>,
}));
vi.mock("./module-form-client", () => ({
  ModuleFormClient: () => <p>form</p>,
}));
vi.mock("@/components/records/deduplicate/dedup-conflict-route", () => ({
  DedupConflictRoute: () => <p>dedup</p>,
}));
vi.mock("@/components/records/merge/merge-duplicates-screen", () => ({
  MergeDuplicatesScreen: () => <p>merge</p>,
}));
vi.mock("@/components/records/detail/record-detail-screen", () => ({
  RecordDetailScreen: () => <p data-testid="shared-detail">shared-detail</p>,
}));

import { ModuleRouteClient } from "./module-route-client";

function CustomDetailScreen(_props: {
  orgSlug: string;
  recordId: string;
  paths: unknown;
  definition: ModuleScreenDefinition;
}) {
  return <p data-testid="custom-detail">custom-detail</p>;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("detail route renders module-specific Screen when the definition provides one", () => {
  resolveModuleScreen.mockReturnValue({
    ...leadsScreenDefinition,
    detail: { ...leadsScreenDefinition.detail, Screen: CustomDetailScreen },
  });
  render(
    <ModuleRouteClient
      moduleTab="Leads"
      kind="detail"
      orgSlug="org"
      recordId="rec-1"
      currentUserId="user"
    />,
  );
  expect(screen.getByTestId("custom-detail")).toBeTruthy();
  expect(screen.queryByTestId("shared-detail")).toBeNull();
});

test("detail route uses shared RecordDetailScreen when Screen is omitted", () => {
  resolveModuleScreen.mockReturnValue({
    ...leadsScreenDefinition,
    detail: { ...leadsScreenDefinition.detail, Screen: undefined },
  });
  render(
    <ModuleRouteClient
      moduleTab="Leads"
      kind="detail"
      orgSlug="org"
      recordId="rec-1"
      currentUserId="user"
    />,
  );
  expect(screen.getByTestId("shared-detail")).toBeTruthy();
  expect(screen.queryByTestId("custom-detail")).toBeNull();
});
