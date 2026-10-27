import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("captures Turkish core modules and their corrected entry controls", async ({
  page,
  pageErrors,
}, testInfo) => {
  test.setTimeout(240_000);
  page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const response = await page.request.put("/api/personal-settings/language", {
    headers: { Origin: new URL(page.url()).origin },
    data: { language: "tr" },
  });
  expect(response.ok()).toBe(true);
  const root = `/crm/${org.slug}`;
  const output = process.env.MEP_QA_SCREENSHOT_DIR;
  if (output) await mkdir(output, { recursive: true });
  const shot = async (name: string) => {
    await page.screenshot({
      path: output ? join(output, `${name}.png`) : testInfo.outputPath(`${name}.png`),
    });
  };
  await page.goto(root);
  await expect(page.getByRole("heading", { name: "Ana Sayfa", exact: true })).toBeVisible();
  await expect(page.locator("[data-shell-utilities]")).toBeVisible();
  await shot("home");
  await page.getByRole("button", { name: "kayıtlar ara", exact: true }).click();
  await expect(page.getByText("Tüm Modüller", { exact: true })).toBeVisible();
  await shot("search");
  await page.keyboard.press("Escape");
  for (const [tab, title] of [
    ["Leads", "Müşteri Adayları"],
    ["Contacts", "Kişiler"],
    ["Accounts", "Firmalar"],
    ["Deals", "Satış Fırsatları"],
    ["Tasks", "Görevler"],
    ["Meetings", "Toplantılar"],
    ["Calls", "Aramalar"],
  ] as const) {
    await page.goto(`${root}/tab/${tab}/list`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.locator("[data-view-pill]").first()).toContainText(`Tüm ${title}`);
    if (tab === "Meetings") {
      await expect(page.getByRole("columnheader", { name: "Başlık", exact: true })).toBeVisible();
      await expect(page.getByText("Giriş Adresi", { exact: true })).toBeVisible();
    }
    await shot(`${tab}-list`);
    if (tab === "Leads") {
      await page.getByRole("button", { name: "Özel görünümler", exact: true }).click();
      await expect(page.getByRole("textbox", { name: "Görünümleri ara" })).toBeVisible();
      await shot("Leads-views");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Eylemler", exact: true }).click();
      await expect(
        page.getByRole("menuitem", { name: "Toplu Güncelleştir", exact: true }),
      ).toBeVisible();
      await shot("Leads-actions");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Görüntüleme Ayarları", exact: true }).click();
      await expect(page.getByRole("menuitem", { name: "Sütun Boyutunu Sıfırla" })).toBeVisible();
      await shot("Leads-columns");
      await page.keyboard.press("Escape");
    }
    if (tab === "Deals") {
      await page.getByRole("button", { name: "Pano ayarları", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Kanban Görünümü - Ayarlar" })).toBeVisible();
      await shot("Deals-settings");
      await page.getByRole("button", { name: "İptal", exact: true }).click();
      await page
        .getByRole("combobox", { name: "Pano gruplandırması" })
        .selectOption("__manage_kanban_views__");
      const manage = page.getByRole("dialog", { name: "Kanban Görünümlerini Yönet" });
      await expect(manage).toBeVisible();
      await shot("Deals-manage");
      await manage.getByRole("button", { name: "Pencereyi Kapat", exact: true }).click();
    }
    if (tab === "Calls") {
      await page.getByRole("button", { name: "Arama Oluştur", exact: true }).click();
      await shot("Calls-create-menu");
      await page.getByRole("menuitem", { name: "Çağrı zamanla", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Çağrı zamanla" })).toBeVisible();
      await expect(
        page
          .getByRole("dialog", { name: "Çağrı zamanla" })
          .getByRole("textbox", { name: "Konu", exact: true }),
      ).toHaveValue("Arama Bilinmiyor ile zamanlandı");
      await shot("Calls-schedule");
      await page.getByRole("button", { name: "İptal", exact: true }).click();
    }
    if (tab === "Meetings") {
      await page.getByRole("button", { name: "Toplantı Oluştur", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Toplantı Bilgileri" })).toBeVisible();
      await shot("Meetings-quick");
      await page.getByRole("button", { name: "Daha fazla ayrıntı", exact: true }).click();
      await shot("Meetings-expanded");
      await page.getByRole("button", { name: "İptal", exact: true }).click();
    }
    const tableLink = page
      .locator("table tbody tr")
      .first()
      .locator('td[data-part="column"] a[href]')
      .first();
    const link = tab === "Deals" ? page.locator("[data-board-card] a").first() : tableLink;
    // Each seeded module supplies at least one record.
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    if (tab === "Leads")
      await expect(page.locator('[data-detail-section="Müşteri Adayı Resim"]')).toHaveCount(0);
    await shot(`${tab}-detail`);
    const detailUrl = page.url();
    if (tab === "Contacts") {
      await page
        .getByRole("navigation", { name: "İlgili Liste", exact: true })
        .getByRole("link", { name: "Satış Fırsatları", exact: true })
        .click();
      await shot("Contacts-related");
      await page.locator('[data-related-card="attachments"]').scrollIntoViewIfNeeded();
      await expect(
        page
          .locator('[data-related-card="attachments"]')
          .getByText("Ek bulunamadı", { exact: true }),
      ).toBeVisible();
      await shot("Contacts-attachments");
    }
    if (tab === "Accounts") {
      await page.getByRole("button", { name: "Hiyerarşi Görünümü", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Kişi Hiyerarşisi" })).toBeVisible();
      await shot("Accounts-hierarchy");
      await page.getByRole("button", { name: "Close Modal", exact: true }).click();
    }
    const timeline = page.getByRole("tab", { name: "Zaman Çizelgesi", exact: true });
    if (await timeline.count()) {
      await timeline.click();
      await expect(page.getByRole("tab", { name: "Geçmiş", exact: true })).toBeVisible();
      await shot(`${tab}-timeline`);
    }
    if (["Leads", "Contacts", "Accounts", "Deals"].includes(tab)) {
      await page.goto(`${detailUrl}/edit`);
      await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toBeVisible();
      await shot(`${tab}-edit`);
    }
    if (tab === "Leads") {
      await page.goto(`${detailUrl}/convert`);
      await expect(page.locator("[data-convert-chip]")).toHaveCount(2);
      await expect(page.getByRole("radio")).toHaveCount(0);
      await shot("Leads-convert");
    }
    if (["Leads", "Tasks"].includes(tab)) {
      await page.goto(`${root}/tab/${tab}/create`);
      await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toBeVisible();
      await shot(`${tab}-create`);
    }
  }
  assertNoPageErrors(pageErrors);
});
