import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test.describe("webforms embed codes, analytics, and record usage", () => {
  test("end-to-end embed dialog, submission analytics, and record webform usage related list", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const origin = new URL(page.url()).origin;
    const jsonHeaders = {
      "X-CRM-ORG": org.slug,
      Origin: origin,
      "Content-Type": "application/json",
    };
    const actionHeaders = {
      "X-CRM-ORG": org.slug,
      Origin: origin,
    };

    // 1. Create a Lead webform via API
    const createRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Analytics Test Form", module: "Leads" },
    });
    expect(createRes.ok(), await createRes.text()).toBe(true);
    const { webform } = await createRes.json();
    const formId = webform.id;

    // 2. Configure fields and published state
    const updateRes = await page.request.put(`/crm/v2.1/settings/webforms/${formId}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
          { fieldApiName: "Email", label: "Email", required: false, hidden: false },
        ],
        settings: {
          buttonLabel: "Send Analytics Lead",
          acknowledgement: {
            kind: "message",
            text: "Analytics inquiry received successfully!",
          },
        },
      },
    });
    expect(updateRes.ok(), await updateRes.text()).toBe(true);

    const publishRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/publish`,
      {
        headers: actionHeaders,
      },
    );
    expect(publishRes.ok(), await publishRes.text()).toBe(true);

    // 3. Open Builder UI and test Embed Dialog
    await page.goto(`/crm/${org.slug}/settings/webforms/${formId}`);

    // Click "Embed Code" button in builder top bar
    const embedBtn = page.getByTestId("form-embed-button");
    await expect(embedBtn).toBeVisible();
    await embedBtn.click();

    // Verify embed dialog opened
    await expect(page.getByTestId("embed-snippet-script")).toBeVisible();
    const scriptCode = await page.getByTestId("embed-snippet-script").textContent();
    expect(scriptCode).toContain("<script");
    expect(scriptCode).toContain("/f/");

    // Check iFrame tab
    await page.getByTestId("embed-tab-iframe").click();
    await expect(page.getByTestId("embed-snippet-iframe")).toBeVisible();
    const iframeCode = await page.getByTestId("embed-snippet-iframe").textContent();
    expect(iframeCode).toContain("<iframe src=");

    // Check Hosted URL tab
    await page.getByTestId("embed-tab-url").click();
    await expect(page.getByTestId("embed-snippet-url")).toBeVisible();
    const hostedUrl = (await page.getByTestId("embed-snippet-url").textContent())?.trim();
    expect(hostedUrl).toContain("/f/");

    // Check disabled Source HTML tab
    await page.getByTestId("embed-tab-source").click();
    await expect(page.getByText("Static source-HTML embed is not offered")).toBeVisible();

    // Close embed dialog
    await page.keyboard.press("Escape");

    // 4. Visit hosted URL and submit form
    if (!hostedUrl) throw new Error("Missing hosted URL");
    await page.goto(hostedUrl);

    await expect(page.getByRole("heading", { name: "Analytics Test Form" })).toBeVisible();
    await page.locator("#field-Last_Name").fill("Curie");
    await page.locator("#field-Company").fill("Radium Laboratories");
    await page.locator("#field-Email").fill("marie.curie@example.com");

    // Wait 2.1s for anti-bot minimum token age
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send Analytics Lead" }).click();

    await expect(page.locator("#thank-you-message")).toContainText(
      "Analytics inquiry received successfully!",
    );

    // 5. Navigate to Analytics Screen
    await page.goto(`/crm/${org.slug}/settings/webforms/${formId}/analytics`);
    await expect(
      page.getByRole("heading", { name: /Analytics: Analytics Test Form/i }),
    ).toBeVisible();

    // Verify KPI counters updated
    await expect(page.getByTestId("kpi-visits")).toHaveText("1");
    await expect(page.getByTestId("kpi-submissions")).toHaveText("1");
    await expect(page.getByTestId("kpi-accepted")).toHaveText("1");
    await expect(page.getByTestId("kpi-conversion")).toHaveText("100%");

    // Verify outcome counters
    await expect(page.getByTestId("outcome-accepted")).toHaveText("1");
    await expect(page.getByTestId("outcome-invalid")).toHaveText("0");

    // Verify location table has 'hosted' row
    await expect(page.getByRole("cell", { name: "hosted" })).toBeVisible();

    // 6. Navigate to Leads List and open the newly created Lead
    await page.goto(`/crm/${org.slug}/tab/Leads/list`);
    const leadLink = page.getByRole("link", { name: "Curie" }).first();
    await expect(leadLink).toBeVisible();
    await leadLink.click();

    // Verify Webform Usage related list card on Lead detail
    const webformUsageCard = page.locator("#related-list-webform-usage");
    await expect(webformUsageCard).toBeVisible();
    await expect(webformUsageCard.getByText("Analytics Test Form")).toBeVisible();
    await expect(webformUsageCard.getByRole("cell", { name: "hosted" })).toBeVisible();
    await expect(webformUsageCard.getByText("accepted")).toBeVisible();

    // 7. Verify Accounts module does NOT show Webform Usage related list
    const unsupportedUsageRes = await page.request.get(
      "/crm/v2.1/Accounts/00000000-0000-0000-0000-000000000000/webform_usage",
      {
        headers: actionHeaders,
      },
    );
    expect(unsupportedUsageRes.status()).toBe(404);
  });
});
