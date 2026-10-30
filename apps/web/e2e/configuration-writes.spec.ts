import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("tabular report create, run, reopen and revision update persist", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Reports`);
  await page.getByRole("button", { name: "Create Report", exact: true }).click();
  await page.getByRole("button", { name: /Select Primary Module/ }).click();
  await page.getByRole("option", { name: "Leads", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("report-module-selected.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const builder = page.getByRole("region", { name: "Report Builder", exact: true });
  await expect(builder).toBeVisible();
  await builder.getByRole("textbox", { name: "Report Name", exact: true }).fill("Pipeline review");
  await builder
    .locator("label")
    .filter({ has: page.getByRole("checkbox", { name: "Last Name", exact: true }) })
    .click();
  await builder
    .locator("label")
    .filter({ has: page.getByRole("checkbox", { name: "Company", exact: true }) })
    .click();
  await builder.getByRole("button", { name: "Move Company up" }).click();
  await builder.getByRole("button", { name: "Add filter", exact: true }).click();
  await builder.getByRole("combobox", { name: "Filter 1 field" }).selectOption("Last_Name");
  await builder.getByRole("combobox", { name: "Filter 1 operator" }).selectOption("contains");
  await builder.getByRole("textbox", { name: "Filter 1 value" }).fill("Unique no-match");
  await builder.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("region", { name: "Report results" })).toContainText(
    "Total records: 0",
  );
  await expect(builder.getByRole("combobox", { name: "Grouping" })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("report-builder.png"), fullPage: true });
  await builder.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Reports/[0-9a-f-]+$`));
  const savedUrl = page.url();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pipeline review", exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByRole("columnheader").first()).toContainText("Company");
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Report Name", exact: true })
    .fill("Pipeline review updated");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(savedUrl);
  await page.goto(`/crm/${org.slug}/tab/Reports`);
  await expect(
    page.getByRole("link", { name: "Pipeline review updated", exact: true }),
  ).toBeVisible();
  const other = await createOrganization(page);
  await page.goto(`/crm/${other.slug}/tab/Reports`);
  await expect(
    page.getByRole("link", { name: "Pipeline review updated", exact: true }),
  ).toHaveCount(0);
});

test("inactive assignment shell and unverified organization address survive reload", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/assignment-rules`);
  await page.getByRole("button", { name: "Create Assignment Rule", exact: true }).click();
  await page.getByRole("combobox", { name: "Module", exact: true }).selectOption("Leads");
  await page.getByRole("textbox", { name: "Rule Name", exact: true }).fill("Review routing");
  await page.screenshot({ path: testInfo.outputPath("assignment-create.png"), fullPage: true });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("inactive");
  await page.screenshot({ path: testInfo.outputPath("assignment-saved.png"), fullPage: true });
  await page.getByRole("link", { name: "Open rule", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/assignment-rules\/[0-9a-f-]+$/);
  await page.reload();
  await expect(page.getByTestId("assignment-detail-status")).toHaveText("Inactive");
  await expect(page.getByTestId("assignment-detail-no-entries")).toContainText("no entries");
  await page.getByRole("link", { name: "Back to Assignment Rules" }).click();
  await expect(page.getByRole("link", { name: "Review routing" })).toBeVisible();
  await page.goto(`/crm/${org.slug}/settings/email-configuration/organization-emails`);
  await page.getByRole("button", { name: "Add Email Address", exact: true }).click();
  await page.getByRole("textbox", { name: "Display Name", exact: true }).fill("Support");
  await page
    .getByRole("textbox", { name: "Email Address", exact: true })
    .fill("support@example.test");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "support@example.test", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Unverified", { exact: true })).toBeVisible();
  await expect(page.getByText(/No verification email has been sent/)).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("organization-address-pending.png"),
    fullPage: true,
  });
  // Duplicate addresses remain visible as a recoverable conflict, with the draft intact.
  await page.getByRole("button", { name: "Add Email Address", exact: true }).click();
  await page.getByRole("textbox", { name: "Display Name", exact: true }).fill("Duplicate");
  await page
    .getByRole("textbox", { name: "Email Address", exact: true })
    .fill("support@example.test");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("already exists");
  await expect(page.getByRole("textbox", { name: "Display Name", exact: true })).toHaveValue(
    "Duplicate",
  );
});

test("Turkish definition write screens preserve translated labels and pending states", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const language = await page.request.put("/api/personal-settings/language", {
    headers: { Origin: new URL(page.url()).origin },
    data: { language: "tr" },
  });
  expect(language.ok()).toBe(true);
  await page.goto(`/crm/${org.slug}/tab/Reports`);
  await page.getByRole("button", { name: "Rapor Oluştur", exact: true }).click();
  await page.getByRole("button", { name: /Birincil Modülü Seç/ }).click();
  await page.getByRole("option", { name: "Müşteri Adayları", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("report-entry-tr.png"), fullPage: true });
  await page.getByRole("button", { name: "Devam", exact: true }).click();
  const builder = page.getByRole("region", { name: "Rapor Oluşturucu", exact: true });
  await expect(builder).toBeVisible();
  await builder
    .locator("label")
    .filter({ has: page.getByRole("checkbox") })
    .first()
    .click();
  await builder.getByRole("button", { name: "Filtre ekle", exact: true }).click();
  await builder.getByRole("combobox", { name: "Filtre 1 alanı" }).selectOption("Last_Name");
  await builder.getByRole("combobox", { name: "Filtre 1 işleci" }).selectOption("starts_with");
  await builder.getByRole("textbox", { name: "Filtre 1 değeri" }).fill("No-match");
  await builder.getByRole("button", { name: "Çalıştır", exact: true }).click();
  await expect(page.getByRole("region", { name: "Rapor sonuçları" })).toContainText(
    "Toplam kayıt: 0",
  );
  await page.screenshot({ path: testInfo.outputPath("report-builder-tr.png"), fullPage: true });
  await page.goto(`/crm/${org.slug}/settings/assignment-rules`);
  await page.getByRole("button", { name: "Atama Kuralı Oluştur", exact: true }).click();
  await page.getByRole("combobox", { name: "Modül", exact: true }).selectOption("Leads");
  await page.getByRole("textbox", { name: "Kural Adı", exact: true }).fill("Review routing TR");
  await page.screenshot({ path: testInfo.outputPath("assignment-create-tr.png"), fullPage: true });
  await page.getByRole("button", { name: "Sonraki", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("pasif");
  await page.goto(`/crm/${org.slug}/settings/email-configuration/organization-emails`);
  await page.getByRole("button", { name: "E-posta Adresi Ekle", exact: true }).click();
  await page.getByRole("textbox", { name: "Görünen Ad", exact: true }).fill("Support");
  await page
    .getByRole("textbox", { name: "E-posta Adresi", exact: true })
    .fill("support@example.test");
  await page.screenshot({
    path: testInfo.outputPath("organization-address-form-tr.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Doğrulanmamış", { exact: true })).toBeVisible();
  await expect(page.getByText(/Doğrulama e-postası gönderilmedi/)).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("organization-address-pending-tr.png"),
    fullPage: true,
  });
});
