import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("My Jobs screen, review logs and approval/review process settings screens", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    // 404/500 unexpected errors
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });

  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to My Jobs page (/crm/[slug]/tab/Approvals)
  await page.goto(`/crm/${org.slug}/tab/Approvals`);
  await expect(page.getByRole("heading", { name: "İşlerim" })).toBeVisible();

  // 2. Verify 4 tabs and count badges
  const blueprintTab = page.getByRole("tab", { name: /Şema Geçişleri/ });
  const approvalTab = page.getByRole("tab", { name: /Onaylar/ });
  const reviewTab = page.getByRole("tab", { name: /İncelemeler/ });
  const visionTab = page.getByRole("tab", { name: /Görüntü Doğrulamaları/ });

  await expect(blueprintTab).toBeVisible();
  await expect(approvalTab).toBeVisible();
  await expect(reviewTab).toBeVisible();
  await expect(visionTab).toBeVisible();

  // Default selected tab is İncelemeler
  await expect(reviewTab).toHaveAttribute("aria-selected", "true");

  // 3. Switch to Blueprint tab
  await blueprintTab.click();
  await expect(blueprintTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("columnheader", { name: "Şema" })).toBeVisible();
  await expect(page.getByText("Bekleyen onay yok")).toBeVisible();

  // 4. Switch to Image validation tab
  await visionTab.click();
  await expect(visionTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("columnheader", { name: "Bekleyen Resim Sayısı" })).toBeVisible();
  await expect(page.getByText("Bekleyen onay yok")).toBeVisible();

  // 5. Navigate to Review Logs page
  const historyLink = page.getByRole("link", { name: "Gözden Geçirme Günlükleri" });
  await historyLink.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Approvals/history`);
  await expect(page.getByRole("heading", { name: "Gözden Geçirme Geçmişi" })).toBeVisible();

  // Return to My Jobs
  await page.getByRole("link", { name: "Gözden geçirilecek kayıtlara dön" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Approvals`);

  // 6. Navigate to Settings > Onay İşlemleri
  await page.goto(`/crm/${org.slug}/settings/approval-processes`);
  await expect(page.getByRole("heading", { name: "Onay İşlemi" })).toBeVisible();
  await expect(page.getByText("Onay işlemi yapılandırmanız yok")).toBeVisible();
  await expect(page.getByRole("link", { name: "+ Onay İşlemi Ekle" }).first()).toBeVisible();

  // 7. Navigate to Settings > Gözden Geçirme Süreçleri
  await page.goto(`/crm/${org.slug}/settings/review-processes`);
  await expect(page.getByRole("heading", { name: "Gözden Geçirme Süreci" })).toBeVisible();

  // Check §4.2 empty state
  await expect(
    page.getByRole("heading", { name: "Bilgilerin El ile Gözden Geçirilmesi" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bilgi Toplamayı İyileştir" })).toBeVisible();

  // Create new review process
  await page.getByRole("link", { name: "Yeni Süreç Oluştur" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/review-processes/new`);
  await expect(page.getByRole("heading", { name: "Yeni Gözden Geçirme Süreci" })).toBeVisible();

  await page.locator("#rev-proc-name").fill("Fırsat Doğrulama Süreci");
  await page.getByRole("button", { name: "Kaydet" }).first().click();

  // Should navigate back to list and show newly created process
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/review-processes`);
  await expect(page.getByText("Fırsat Doğrulama Süreci")).toBeVisible();

  expect(failed).toEqual([]);
});
