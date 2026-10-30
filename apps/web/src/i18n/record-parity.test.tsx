import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { DetailsCard } from "@/components/records/detail/details-card";
import { TimelineSurface } from "@/components/records/detail/timeline/timeline-surface";
import { ViewSettingsMenu } from "@/components/records/list/view-settings-menu";
import { ViewTabStrip } from "@/components/records/list/view-tab-strip";
import { PageTitle, PageTitleContext } from "@/components/shell/page-title";
import { render } from "@/test/render";
import { LanguageProvider } from "./client-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);

test("uses Turkish titles, detail controls and timeline subtabs", () => {
  const setTitle = vi.fn();
  render(
    <LanguageProvider language="tr">
      <PageTitleContext.Provider value={setTitle}>
        <PageTitle title="Leads" />
        <DetailsCard sections={[]} format={{ locale: "en-US", timeZone: "UTC" }} />
        <TimelineSurface
          activeSubtabId="history"
          subtabs={[
            { id: "history", label: "History" },
            { id: "interactions", label: "Interactions" },
          ]}
        >
          <span />
        </TimelineSurface>
      </PageTitleContext.Provider>
    </LanguageProvider>,
  );
  expect(setTitle).toHaveBeenCalledWith("Müşteri Adayları");
  expect(screen.getByRole("button", { name: "Detayları sakla" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Geçmiş" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Etkileşimler" })).toBeTruthy();
});

test("translates view settings and keeps fixed column reset disabled", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider language="tr">
      <ViewSettingsMenu
        perPage={10}
        wrapText
        onPerPageChange={vi.fn()}
        onWrapTextChange={vi.fn()}
        onManageColumns={vi.fn()}
      />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Görüntüleme Ayarları" }));
  expect(screen.getAllByRole("menuitem").map((row) => row.textContent)).toEqual([
    "Sütunları Yönet",
    "Sütun Boyutunu Sıfırla",
    "Sayfa Başına Kayıt10",
    "Görüntüleme ModuMetni Kaydır",
  ]);
  expect(
    screen.getByRole("menuitem", { name: "Sütun Boyutunu Sıfırla" }).getAttribute("aria-disabled"),
  ).toBe("true");
});

test("searches and selects translated views using stable service IDs", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <LanguageProvider language="tr">
      <ViewTabStrip
        viewName="Tüm Müşteri Adayları"
        searchable
        views={[
          { id: "all", name: "Tüm Müşteri Adayları", systemDefined: true },
          { id: "custom", name: "Review queue", systemDefined: false, isDefault: false },
        ]}
        onViewChange={change}
      />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Özel görünümler" }));
  expect(screen.getByRole("menuitem", { name: "Tarafımdan Oluşturuldu" })).toBeTruthy();
  expect(screen.getByRole("menuitem", { name: "Ortak Görünümler" })).toBeTruthy();
  await user.type(screen.getByRole("textbox", { name: "Görünümleri ara" }), "Review");
  expect(screen.queryByRole("menuitem", { name: "Tüm Müşteri Adayları" })).toBeNull();
  await user.click(screen.getByRole("menuitem", { name: "Review queue" }));
  expect(change).toHaveBeenCalledWith("custom");
});
