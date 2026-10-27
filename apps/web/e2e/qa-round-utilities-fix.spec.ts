import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("captures corrected Turkish utility, support and customization screens", async ({
  page,
  pageErrors,
}, testInfo) => {
  test.setTimeout(360_000);
  page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const result = await page.request.put("/api/personal-settings/language", {
    headers: { Origin: new URL(page.url()).origin },
    data: { language: "tr" },
  });
  expect(result.ok()).toBe(true);
  const root = `/crm/${org.slug}`;
  const output = process.env.MEP_QA_SCREENSHOT_DIR;
  if (output) await mkdir(output, { recursive: true });
  const shot = async (name: string) => {
    await page.screenshot({
      path: output ? join(output, `${name}.png`) : testInfo.outputPath(`${name}.png`),
    });
  };
  for (const [tab, title] of [
    ["Campaigns", "Kampanyalar"],
    ["Cases", "Servis Dosyaları"],
    ["Solutions", "Çözümler"],
  ] as const) {
    await page.goto(`${root}/tab/${tab}/list`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Özel görünümler", exact: true }).click();
    await expect(
      page.getByRole("menuitem", { name: "Ortak Görünümler", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: `Görüntülenmemiş ${title}`, exact: true }),
    ).toBeVisible();
    await shot(`${tab}-views`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Eylemler", exact: true }).click();
    await expect(
      page.getByRole("menuitem", { name: "Toplu Güncelleştir", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: `Dışa Aktar ${title}`, exact: true }),
    ).toBeVisible();
    await shot(`${tab}-actions`);
    await page.keyboard.press("Escape");
    await page.goto(`${root}/tab/${tab}/create`);
    await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toBeVisible();
    if (tab === "Campaigns") {
      await expect(page.getByText("Gerçekleşen Masraf", { exact: true }).first()).toBeVisible();
      await expect(page.locator("[data-record-form-inventory-footer]")).toHaveAttribute(
        "data-pin-bottom",
        "true",
      );
    }
    if (tab === "Cases") {
      const number = page.getByText("Servis Dosyası Numarası", { exact: true }).first();
      const owner = page.getByText("Servis Dosyası Kayıt Sahibi", { exact: true }).first();
      await expect(number).toBeVisible();
      await expect(owner).toBeVisible();
      const a = await number.boundingBox(),
        b = await owner.boundingBox();
      expect(a?.x).toBeLessThan(b?.x ?? 0);
      await expect(page.getByText("İç Yorumlar", { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText("İstemci Komut Dosyası", { exact: true })).toBeVisible();
    if (tab === "Campaigns")
      await expect(page.getByText("Kampanya Kayıt Sahibi", { exact: true }).first()).toBeVisible();
    if (tab === "Cases") await expect(page.getByText("Solution", { exact: true })).toHaveCount(0);
    await shot(`${tab}-form`);
  }
  for (const [path, heading, name] of [
    ["modules", "Modüller", "modules"],
    ["modules/Leads/fields", "Alanlar", "fields"],
    ["modules/Leads/layouts", "Düzenler", "layouts"],
    ["company-details", "Şirket Detayları", "company"],
    ["currencies", "Para Birimleri", "currencies"],
    ["personal-settings", "Kişisel Ayarlar", "personal"],
    ["import-history", "İçe Aktarma Geçmişi", "import-history"],
  ] as const) {
    await page.goto(`${root}/settings/${path}`);
    await expect(
      page
        .getByRole("tab", { name: heading, exact: true })
        .or(page.getByRole("link", { name: heading, exact: true }))
        .first(),
    ).toBeVisible();
    if (name === "fields") {
      const table = page.getByRole("table");
      await expect(table.getByRole("cell", { name: "Adres", exact: true })).toHaveCount(2);
      await expect(table.getByRole("cell", { name: "Address - City", exact: true })).toHaveCount(0);
    }
    if (name === "modules")
      await expect(
        page.getByRole("columnheader", { name: "Modül Adı", exact: true }),
      ).toBeVisible();
    if (name === "currencies")
      await expect(page.getByTestId("home-currency-panel")).toContainText("Yerel para biriminizi");
    if (name === "personal")
      await expect(
        page.getByRole("heading", { name: "Kullanıcı Bilgisi", exact: true }),
      ).toBeVisible();
    if (name === "import-history")
      await expect(page.getByText("Yeni İçe aktarım yok", { exact: true })).toBeVisible();
    await shot(name);
  }
  await page.goto(`${root}/settings/recycle-bin`);
  await expect(
    page.getByRole("heading", { name: "Geri Dönüşüm Kutusu", exact: true }).last(),
  ).toBeVisible();
  await expect(page.locator("header").first()).not.toContainText("Loading");
  await expect(
    page.getByRole("columnheader", { name: "Silinme Tarihi", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Geridönüşüm Kutusunu Boşalt", exact: true }),
  ).toBeVisible();
  await shot("recycle-list");
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(page.getByText("ÖÖ", { exact: true })).toBeVisible();
  await shot("recycle-search");
  await page.goto(`${root}/tab/Leads/tags`);
  await expect(page.getByRole("heading", { name: "Etiketleri Yönet", exact: true })).toBeVisible();
  await shot("tags");
  await page.goto(`${root}/tab/Leads/drafts`);
  await expect(page.getByRole("heading", { name: "Taslaklar", exact: true })).toBeVisible();
  await expect(page.getByText("Hiç kayıt yok", { exact: true })).toBeVisible();
  await shot("drafts");
  await page.goto(`${root}/tab/Leads/list`);
  await page.getByRole("button", { name: "Eylemler", exact: true }).click();
  await page.getByRole("menuitem", { name: "Yazıcı Görünümü", exact: true }).hover();
  await expect(
    page.getByRole("menuitem", { name: "Yazdırma Varsayılan görünümü", exact: true }),
  ).toBeVisible();
  await shot("leads-print");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  const tagRow = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: "Etiket", exact: true }) });
  await tagRow.scrollIntoViewIfNeeded();
  await tagRow.getByText("Etiket", { exact: true }).click();
  await expect(tagRow.getByText("Buraya yazın", { exact: true })).toBeVisible();
  await expect(
    page
      .locator(".filter-panel-actions")
      .getByRole("button", { name: "Filtre Uygula", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(tagRow).toBeInViewport();
  await expect(page.locator(".filter-panel-actions")).toBeInViewport();
  await shot("lead-tag-filter");
  for (const tab of ["Accounts", "Leads"] as const) {
    await page.goto(`${root}/tab/${tab}/list`);
    const link = page
      .locator("table tbody tr")
      .first()
      .locator('td[data-part="column"] a[href]')
      .first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const details = page.url();
    await page.getByRole("tab", { name: "Zaman Çizelgesi", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Zaman Çizelgesi Geçmişi", exact: true }),
    ).toBeVisible();
    await expect(page.locator("[data-timeline-history]").getByRole("status")).toHaveCount(0);
    await expect(page.locator("[data-timeline-history]").getByRole("alert")).toHaveCount(0);
    if (tab === "Accounts")
      await expect(
        page.getByText("Göster Yaklaşan Otomatik Eylemler", { exact: true }),
      ).toBeVisible();
    await shot(`${tab}-timeline`);
    await page.goto(details);
    await page
      .locator('[data-related-card="notes"]')
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    const notes = page.locator('[data-related-card="notes"]');
    await expect(notes.getByTestId("note-composer-collapsed")).toHaveText("Bir not ekleyin");
    await shot(`${tab}-notes`);
    await notes.getByTestId("note-composer-collapsed").click();
    await expect(notes.getByPlaceholder("Ünvan", { exact: true })).toBeVisible();
    await shot(`${tab}-note-composer`);
    await notes.getByRole("button", { name: "İptal", exact: true }).click();
    const attachments = page.locator('[data-related-card="attachments"]');
    await attachments.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(
      attachments.getByRole("heading", { name: "Eklentiler", exact: true }),
    ).toBeVisible();
    await shot(`${tab}-attachments`);
    if (tab === "Leads") {
      await page.getByRole("button", { name: "Etiketleri Ekle", exact: true }).click();
      await expect(page.getByPlaceholder("Etiketleri Girin", { exact: true })).toBeVisible();
      await shot("lead-tags");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Diğer Seçenekler", exact: true }).click();
      await expect(
        page.getByRole("menuitem", { name: "Kartviziti Özelleştir", exact: true }),
      ).toBeVisible();
      await shot("lead-more");
      await page.keyboard.press("Escape");
      const campaigns = page.locator('[data-related-card="campaigns"]');
      await campaigns.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await expect(
        campaigns.getByRole("button", { name: "Kampanyalar Ekle", exact: true }),
      ).toBeVisible();
      await shot("lead-campaigns");
    }
  }
  await page.goto(`${root}/tab/Documents`);
  await expect(page.getByRole("button", { name: /Klasörlerim/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Team Folder/ }).click();
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.getByText("Kullanılabilir öğe yok.", { exact: true })).toBeVisible();
  await shot("documents-folder");
  assertNoPageErrors(pageErrors);
});
