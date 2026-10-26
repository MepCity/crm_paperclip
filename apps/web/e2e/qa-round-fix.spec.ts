import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, ignoreFailedResponses, test } from "./support/test";

test("check-round fixes keep Turkish screens and draft entry flows usable", async ({
  page,
  pageErrors,
}, testInfo) => {
  test.setTimeout(180_000);
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
  await page.goto(`${root}/tab/Emails`);
  await expect(page.getByRole("heading", { level: 1, name: "E-posta", exact: true })).toBeVisible();
  await expect(page.getByText(/Synthetic mail preview/)).toHaveCount(0);
  await shot("01-inbox");
  await page.route("**/crm/v2.2/mail/conversations?*", (route) =>
    route.fulfill({
      status: 403,
      json: { code: "NO_PERMISSION", details: {}, message: "Denied", status: "error" },
    }),
  );
  await page.reload();
  await expect(page.getByRole("dialog", { name: "İzin Reddedildi" })).toBeVisible();
  await shot("01b-inbox-denied");
  await page.getByRole("button", { name: "Tamam", exact: true }).click();
  await page.unroute("**/crm/v2.2/mail/conversations?*");
  ignoreFailedResponses(pageErrors, [403]);
  await page.goto(`${root}/settings/email-configuration/email-compose-settings`);
  await expect(page.getByRole("heading", { name: "Oluştur Ayarları" })).toBeVisible();
  await shot("02-compose-settings");
  await page.getByRole("button", { name: "Yeni İmza Ekle", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "İmza içeriği" })).toBeVisible();
  await page.getByRole("textbox", { name: "İmza içeriği" }).scrollIntoViewIfNeeded();
  await shot("03-signature");
  await page.goto(`${root}/settings/templates?type=email`);
  await expect(page.getByRole("heading", { name: "Şablonlar", exact: true })).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toBeVisible();
  await shot("04-templates");
  await page.getByRole("button", { name: "Yeni Şablon", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Müşteri Adayları");
  await shot("05-template-create");
  await page.goto(`${root}/calendar`);
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("columnheader").nth(1)).toHaveText(/^\d{1,2} /);
  await shot("19-calendar-day");
  await page.getByRole("button", { name: "Oluştur", exact: true }).click();
  await shot("06-calendar-create-menu");
  await page.getByRole("menuitem", { name: "Toplantı", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Meetings\/create$/);
  await expect(page.locator("form")).toBeVisible();
  await shot("06-calendar-create");
  await page.goto(`${root}/settings/workflow-rules`);
  await expect(page.getByRole("table")).toBeVisible();
  await shot("07-workflow-list");
  await page.getByRole("button", { name: "Yeni Kural Oluştur", exact: true }).click();
  await shot("08-workflow-create");
  await page.getByRole("button", { name: /Modül/ }).click();
  await page.getByRole("option", { name: "Müşteri Adayları", exact: true }).click();
  await page.getByRole("textbox", { name: "Kural Adı", exact: true }).fill("Routing draft");
  await page.getByRole("button", { name: "Sonraki", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Bu iş akışı kuralını şuna göre yürütün/ }),
  ).toBeVisible();
  await shot("09-workflow-when");
  await page.goto(`${root}/settings/assignment-rules`);
  await expect(page.getByRole("heading", { name: "Atama Kuralları", exact: true })).toBeVisible();
  await shot("10-assignment-list");
  await page.getByRole("button", { name: "Atama Kuralı Oluştur", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot("10b-assignment-create");
  await page.goto(`${root}/tab/Reports`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Raporlar", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/synthetic/i)).toHaveCount(0);
  await shot("11-reports");
  await page.getByRole("button", { name: "Rapor Oluştur", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Yeni Rapor Oluştur" })).toBeVisible();
  await shot("12-report-create");
  await page.getByRole("button", { name: /Birincil Modülü Seç/ }).click();
  await expect(page.getByRole("option", { name: "Müşteri Adayları", exact: true })).toBeVisible();
  await shot("13-report-module-entry");
  await page.goto(`${root}/tab/Dashboards`);
  await expect(page.getByRole("combobox", { name: /genel bakış/i })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "BU AY KAZANILAN MÜŞTERİ ADAYLARI", exact: true }),
  ).toBeVisible();
  await shot("14-analytics");
  await page.getByRole("button", { name: "Pano Oluştur", exact: true }).click();
  await expect(page.getByRole("button", { name: "Şelale", exact: true })).toBeVisible();
  await shot("15-dashboard-create");
  await page.getByRole("button", { name: "Grafik", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Grafik Ekle" })).toBeVisible();
  await expect(page.getByText("Anında çizelge oluştur")).toBeVisible();
  await shot("16-add-chart");
  await page.goto(root);
  await expect(page.getByTestId("home-canvas")).toBeVisible();
  await shot("17-home");
  await page.goto(`${root}/workqueue`);
  const welcome = page.getByRole("dialog");
  await expect(welcome).toBeVisible();
  await welcome.getByRole("button", { name: /Başlayın/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "İş Kuyruğu", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).not.toContainText("Waiting for input");
  await shot("18-workqueue");
  for (const [path, name, heading] of [
    ["email-configuration/email-sharing", "20-email-sharing", "E-posta Paylaşımı İzinleri"],
    [
      "email-configuration/organization-emails",
      "21-organization-emails",
      "Organizasyon E-posta Adresleri",
    ],
    [
      "email-configuration/custom-email-fields-preference",
      "22-custom-email-fields",
      "Özel E-posta Alanları Tercihleri",
    ],
    ["bcc-dropbox", "23-bcc", "BCC Dropbox"],
    ["calendar-booking", "24-booking", "Çalışma Saatleri henüz yapılandırılmamış"],
  ] as const) {
    await page.goto(`${root}/settings/${path}`);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await shot(name);
  }
  await page.goto(`${root}/tab/Leads/100000000000000000`);
  const card = page.locator("#related-list-emails");
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole("heading", { name: "E-postalar", exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "E-posta Oluştur", exact: true })).toBeVisible();
  await expect(card.getByRole("tab")).toHaveText(["Postalar", "Taslaklar", "Zamanlandı"]);
  await shot("25-record-emails");
  assertNoPageErrors(pageErrors);
});
