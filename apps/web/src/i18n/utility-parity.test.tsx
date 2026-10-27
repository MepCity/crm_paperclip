// @vitest-environment jsdom
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { AttachmentsCard } from "@/components/records/attachments/attachments-card";
import { NoteComposer } from "@/components/records/notes/note-composer";
import { RecycleBin } from "@/components/records/recycle-bin/recycle-bin";
import { ImportHistory } from "@/components/records/transfer/history/import-history";
import { SettingsCurrenciesScreen } from "@/modules/settings-currencies/settings-currencies-screen";
import { groupAddressRows } from "@/modules/settings-modules/fields-model";
import { FieldsScreen } from "@/modules/settings-modules/fields-screen";
import { SettingsModulesScreen } from "@/modules/settings-modules/settings-modules-screen";
import { SettingsPersonalScreen } from "@/modules/settings-personal/settings-personal-screen";
import { render } from "@/test/render";
import { LanguageProvider } from "./client-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
const tr = (children: React.ReactNode) =>
  render(<LanguageProvider language="tr">{children}</LanguageProvider>);

test("settings use Turkish vocabulary while custom module labels remain verbatim", async () => {
  tr(
    <SettingsModulesScreen
      orgSlug="test-org"
      port={{
        listModules: async () => [
          {
            apiName: "Leads",
            displayLabel: "Leads",
            moduleName: "Leads",
            kind: "system",
            teamspaceCount: 1,
            sharedTo: "All Profiles",
            lastModifiedAt: null,
            enabled: true,
          },
          {
            apiName: "Custom",
            displayLabel: "My module",
            moduleName: "My module",
            kind: "custom",
            teamspaceCount: 1,
            sharedTo: "All Profiles",
            lastModifiedAt: null,
            enabled: true,
          },
        ],
      }}
    />,
  );
  expect(await screen.findAllByRole("cell", { name: "Tüm Profiller" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Genel Ayarlar" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Yeni Modül Oluştur" })).toBeTruthy();
  expect(screen.getAllByText("My module")).toHaveLength(2);
  expect(screen.queryByText(/assistant/i)).toBeNull();
});

test("fields aggregate the built-in address, preserve custom rows, and sort/search translated labels", async () => {
  const rows = [
    { apiName: "Email", label: "Email", dataType: "Email", custom: false },
    { apiName: "Street", label: "Street", dataType: "Single Line", custom: false },
    { apiName: "City", label: "City", dataType: "Single Line", custom: false },
    { apiName: "Custom", label: "My field", dataType: "Single Line", custom: true },
  ];
  expect(groupAddressRows(rows, "Leads").map((r) => r.apiName)).toEqual([
    "Email",
    "Custom",
    "Address",
  ]);
  tr(<FieldsScreen orgSlug="test-org" module="Leads" rows={rows} />);
  const table = screen.getByRole("table");
  expect(within(table).getAllByRole("row")[1]?.textContent).toContain("Adres");
  expect(within(table).queryByText("Street")).toBeNull();
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Alanlar veya Veri Türleri Ara" }),
    "E-posta",
  );
  expect(within(table).getAllByRole("row")).toHaveLength(2);
});

test("personal and currency panels translate headings and complete confirmation prose", async () => {
  const result = tr(
    <SettingsPersonalScreen user={{ name: "Test User", email: "test@example.invalid" }} />,
  );
  expect(await screen.findByRole("region", { name: "Kullanıcı Bilgisi" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Erişilebilirlik" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Detayları sakla" })).toBeTruthy();
  result.unmount();
  tr(<SettingsCurrenciesScreen />);
  expect(await screen.findByTestId("home-currency-panel")).toHaveProperty(
    "textContent",
    expect.stringContaining("Yerel para biriminizi"),
  );
  expect(screen.getByRole("button", { name: "Evet, Yerel Para Birimini Onayla" })).toBeTruthy();
});

test("note composer preserves a Turkish draft and submits the existing note payload", async () => {
  const save = vi.fn();
  tr(<NoteComposer mode="create" expanded onExpand={() => {}} onCancel={() => {}} onSave={save} />);
  await userEvent.type(screen.getByPlaceholderText("Ünvan"), "A note");
  await userEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  expect(save).toHaveBeenCalledWith({ title: "A note", content: "" });
});

test("attachments and recycle search localize display operators without changing search codes", async () => {
  const result = tr(
    <AttachmentsCard
      rows={[]}
      onAttach={() => {}}
      onFilesSelected={() => {}}
      onDownload={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(screen.getByRole("heading", { name: "Eklentiler" })).toBeTruthy();
  expect(screen.getByText("Eklentisi Yok")).toBeTruthy();
  result.unmount();
  const search = vi.fn();
  tr(
    <RecycleBin
      rows={[]}
      onRestore={() => {}}
      onDelete={() => {}}
      onEmpty={() => {}}
      onSearch={search}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Ara" }));
  expect(screen.getByText("ÖÖ")).toBeTruthy();
  expect(screen.getAllByText("İçerir").length).toBeGreaterThan(0);
  await userEvent.click(
    within(screen.getByRole("table")).getAllByRole("button", { name: "Ara" })[1] as HTMLElement,
  );
  expect(search).toHaveBeenCalledWith(
    expect.objectContaining({ nameOperator: "contains", time: "01:00" }),
  );
});

test("import history has tabs and an empty panel instead of an empty history table", async () => {
  tr(
    <ImportHistory
      jobs={[]}
      onUndo={async () => {}}
      canUndo={() => false}
      moduleLabel={(m) => m}
      importHref={(m) => `/imports/${m}`}
    />,
  );
  expect(
    screen.getByRole("tab", { name: "İçe Aktarma Geçmişi" }).getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByText("Yeni İçe aktarım yok")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
  await userEvent.click(screen.getByRole("tab", { name: "İçeri aktar" }));
  expect(screen.getByRole("link", { name: "Leads" }).getAttribute("href")).toBe("/imports/Leads");
});
