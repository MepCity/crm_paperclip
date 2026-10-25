import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test.describe("CRM modules Turkish localization", () => {
  test("renders Leads list, create form, detail, and module empty states in Turkish", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);

    // Switch user interface language to Turkish in personal settings
    await page.goto(`/crm/${org.slug}/settings/personal-settings`);
    await page.getByRole("button", { name: "Edit locale information" }).click();
    await page.getByLabel("Language", { exact: true }).selectOption("tr");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    // 1. Leads list view
    await page.goto(`/crm/${org.slug}/tab/Leads/list`);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(
      page.getByRole("link", { name: "Müşteri Adayı Oluştur", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Sistem Tanımlı Filtreler")).toBeVisible();
    await expect(page.getByText("Alanlara Göre Filtrele")).toBeVisible();
    await expect(page.getByText(/Toplam Kayıtlar/)).toBeVisible();

    // 2. Leads create form view
    await page.goto(`/crm/${org.slug}/tab/Leads/create`);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(
      page.getByRole("heading", { name: "Müşteri Adayı Oluştur", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "İptal", exact: true })).toBeVisible();
    const saveButton = page.getByRole("button", { name: "Kaydet", exact: true });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page.getByText(/boş bırakılamaz|zorunludur/i).first()).toBeVisible();

    // 3. Leads detail view
    await page.goto(`/crm/${org.slug}/tab/Leads/list`);
    await expect(page.getByRole("table", { name: /Records|Kayıtlar/i })).toBeVisible();
    const firstRowLink = page.locator("table tbody tr").first().getByRole("link").first();
    await firstRowLink.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Genel Bakış" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Zaman Çizelgesi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Geri", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Notlar", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Eklentiler", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Açık Aktiviteler", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Kapalı Aktiviteler", exact: true })).toBeVisible();

    // 4. Empty states and localized module controls for later modules
    await page.goto(`/crm/${org.slug}/tab/Campaigns/list`);
    await expect(page.getByRole("link", { name: "Kampanya Oluştur", exact: true })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Kampanya Adı", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "İlk harfe göre filtrele" }).click();
    await page.getByRole("option", { name: "Z", exact: true }).click();
    await expect(page.getByText("Hiçbir Kampanyalar bulunamadı.")).toBeVisible();

    await page.goto(`/crm/${org.slug}/tab/Cases/list`);
    await expect(
      page.getByRole("link", { name: "Servis Dosyası Oluştur", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "İlk harfe göre filtrele" }).click();
    await page.getByRole("option", { name: "Z", exact: true }).click();
    await expect(page.getByText("Hiçbir Servis Dosyaları bulunamadı.")).toBeVisible();

    await page.goto(`/crm/${org.slug}/tab/Solutions/list`);
    await expect(page.getByRole("link", { name: "Çözüm Oluştur", exact: true })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Çözüm Başlığı", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "İlk harfe göre filtrele" }).click();
    await page.getByRole("option", { name: "Z", exact: true }).click();
    await expect(page.getByText("Hiçbir Çözümler bulunamadı.")).toBeVisible();
  });

  test("renders remaining Phase 1 screens in Turkish", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);

    // Switch user interface language to Turkish in personal settings
    await page.goto(`/crm/${org.slug}/settings/personal-settings`);
    await page.getByRole("button", { name: "Edit locale information" }).click();
    await page.getByLabel("Language", { exact: true }).selectOption("tr");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    // 1. Documents
    await page.goto(`/crm/${org.slug}/tab/Documents`);
    await expect(page.getByText("Ekip Klasörleri")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ayrıntılar" })).toBeVisible();

    // 2. Email & Calendar
    await page.goto(`/crm/${org.slug}/tab/Emails`);
    await expect(page.getByRole("button", { name: "Oluştur" })).toBeVisible();

    await page.goto(`/crm/${org.slug}/calendar`);
    await expect(page.getByRole("button", { name: "Bugün" })).toBeVisible();

    // 3. Setup (Customization)
    await page.goto(`/crm/${org.slug}/settings`);
    await expect(page.getByRole("heading", { name: "Kurulum" })).toBeVisible();

    // 4. Automation (Workflow Rules)
    await page.goto(`/crm/${org.slug}/settings/workflow-rules`);
    await expect(page.getByRole("heading", { name: "İş Akışı Kuralları" })).toBeVisible();

    // 5. Reports & Analytics
    await page.goto(`/crm/${org.slug}/tab/Reports`);
    await expect(page.getByRole("button", { name: "Tüm Raporlar" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Rapor Adı" })).toBeVisible();

    await page.goto(`/crm/${org.slug}/tab/Dashboards`);
    await expect(page.getByRole("button", { name: "Tümü" })).toBeVisible();
    await expect(page.getByText("BU AY KAZANILAN MÜŞTERİ ADAYLARI")).toBeVisible();

    // 6. Workqueue
    await page.goto(`/crm/${org.slug}/workqueue`);
    await expect(page.getByRole("heading", { name: "Benim İş Kuyruğu" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Görevler" })).toBeVisible();

    // 7. Visits & Social
    await page.goto(`/crm/${org.slug}/tab/Visits`);
    await expect(page.getByRole("heading", { name: "Ziyaretçi Takibi" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Başlayın" })).toBeVisible();

    await page.goto(`/crm/${org.slug}/tab/Social`);
    await expect(page.getByRole("button", { name: "Haydi Başlayalım" })).toBeVisible();
  });
});
