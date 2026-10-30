import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ExportLauncher } from "./export-launcher";

const state = vi.hoisted(() => ({ language: "tr" as "tr" | "en" }));
vi.mock("@/i18n/client-provider", async () => {
  const { translator } = await import("@/i18n/catalogs");
  return {
    useUiLanguage: () => state.language,
    useUiTranslations: () => translator(state.language),
  };
});
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/lib/api/client/provider", () => ({ useOrgSlug: () => "synthetic" }));
vi.mock("@/lib/api/client/hooks", () => ({
  useTransferClient: () => ({}),
  useModule: () => ({ data: { pluralLabel: "Accounts", fields: [] } }),
  useViews: () => ({
    data: [{ id: "all", name: "All Accounts", systemDefined: true, isDefault: true }],
  }),
}));
vi.mock("./export/export-dialog", () => ({
  ExportDialog: ({ moduleLabel, views }: { moduleLabel: string; views: { name: string }[] }) => (
    <div>
      <span>{moduleLabel}</span>
      <span>{views[0]?.name}</span>
    </div>
  ),
}));
afterEach(cleanup);
test.each([
  ["tr", "Firmalar"],
  ["en", "Accounts"],
] as const)("export dialog module label follows %s", (language, label) => {
  state.language = language;
  render(<ExportLauncher module="Accounts" moduleLabel="Accounts" open onOpenChange={() => {}} />);
  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByText(language === "tr" ? "Tüm Firmalar" : "All Accounts")).toBeTruthy();
});
