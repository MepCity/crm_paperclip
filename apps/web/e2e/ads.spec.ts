import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test.describe("Ads settings and webform attribution", () => {
  test("create campaign + group + keyword; hosted webform submit with utm_campaign links Lead to campaign", async ({
    page,
  }) => {
    const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/ads-mep1508-evidence";
    mkdirSync(evidenceDir, { recursive: true });

    await page.setViewportSize({ width: 1180, height: 703 });
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

    // 1. Navigate to Settings -> Extensions -> Google
    await page.goto(`/crm/${org.slug}/settings/extensions/google`);
    await page.waitForLoadState("networkidle");

    // Verify Ads tab is default/selected, empty state visible
    await expect(page.getByText("Google Ads")).toBeVisible();
    await expect(page.getByTestId("create-campaign-button")).toBeVisible();
    await page.screenshot({
      path: join(evidenceDir, "ads-settings-empty-1180x703.png"),
    });

    // 2. Open New Campaign Dialog
    await page.getByTestId("create-campaign-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: join(evidenceDir, "ads-dialog-campaign-1180x703.png"),
    });

    // Fill campaign name & save
    await page.getByRole("dialog").getByRole("textbox").fill("Fall Promo 2026");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // Verify campaign row appeared
    await expect(page.getByText("Fall Promo 2026")).toBeVisible();

    // 3. Open New Ad Group Dialog
    const addGroupBtn = page.locator("button[data-testid^='add-group-button-']").first();
    await expect(addGroupBtn).toBeVisible();
    await addGroupBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: join(evidenceDir, "ads-dialog-group-1180x703.png"),
    });

    await page.getByRole("dialog").getByRole("textbox").fill("Search High Intent");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Search High Intent")).toBeVisible();

    // 4. Open New Keyword Dialog
    const addKwBtn = page.locator("button[data-testid^='add-keyword-']").first();
    await expect(addKwBtn).toBeVisible();
    await addKwBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: join(evidenceDir, "ads-dialog-keyword-1180x703.png"),
    });

    await page.getByRole("dialog").getByRole("textbox").fill("enterprise crm software");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("enterprise crm software")).toBeVisible();

    // 5. Open New Text Ad Dialog
    const addAdBtn = page.locator("button[data-testid^='add-item-']").first();
    await expect(addAdBtn).toBeVisible();
    await addAdBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: join(evidenceDir, "ads-dialog-ad-1180x703.png"),
    });

    await page.getByRole("dialog").getByRole("textbox").fill("Best Cloud CRM - Start Free");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Best Cloud CRM - Start Free")).toBeVisible();

    // Screenshot populated tree
    await page.screenshot({
      path: join(evidenceDir, "ads-settings-populated-1180x703.png"),
    });

    // 6. Test Contacts tab (disabled external connection)
    await page.getByRole("tab", { name: "Contacts" }).click();
    await expect(page.getByRole("button", { name: "Authenticate" })).toBeDisabled();
    await page.screenshot({
      path: join(evidenceDir, "ads-contacts-disabled-1180x703.png"),
    });

    // 7. Get the campaign ID from Ads tree API
    const treeRes = await page.request.get("/crm/v2.1/settings/ads/tree", {
      headers: jsonHeaders,
    });
    expect(treeRes.ok()).toBe(true);
    const treeData = await treeRes.json();
    const createdCampaign = treeData.campaigns.find(
      (c: { name: string }) => c.name === "Fall Promo 2026",
    );
    expect(createdCampaign).toBeDefined();

    // 8. Create a Lead webform with captureAttribution: true
    const createFormRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Inbound Lead Form", module: "Leads" },
    });
    expect(createFormRes.ok()).toBe(true);
    const { webform } = await createFormRes.json();
    const formId = webform.id;

    const updateFormRes = await page.request.put(`/crm/v2.1/settings/webforms/${formId}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
          { fieldApiName: "Email", label: "Email", required: false, hidden: false },
        ],
        settings: {
          buttonLabel: "Send Request",
          captureAttribution: true,
          acknowledgement: {
            kind: "message",
            text: "Thank you for reaching out to us!",
          },
        },
      },
    });
    expect(updateFormRes.ok()).toBe(true);

    const publishRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/publish`,
      { headers: actionHeaders },
    );
    expect(publishRes.ok()).toBe(true);

    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/regenerate_key`,
      { headers: actionHeaders },
    );
    expect(keyRes.ok()).toBe(true);
    const { publicKey } = await keyRes.json();

    // 9. Visit hosted form with UTM parameters matching our campaign and keyword
    await page.goto(
      `/f/${publicKey}?utm_campaign=fall%20promo%202026&utm_term=enterprise%20crm%20software&utm_source=google&gclid=click-12345`,
    );
    await expect(page.getByRole("heading", { name: "Inbound Lead Form" })).toBeVisible();

    await page.locator("#field-Last_Name").fill("Miller");
    await page.locator("#field-Company").fill("Miller Industries");
    await page.locator("#field-Email").fill("miller@example.com");

    // Wait 2.1s for anti-bot token minimum age window
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send Request" }).click();

    // Verify thank-you message
    await expect(page.locator("#thank-you-message")).toContainText(
      "Thank you for reaching out to us!",
    );

    // 10. Check CRM Leads list
    await page.goto(`/crm/${org.slug}/tab/Leads/list`);
    await expect(page.getByText("Miller").first()).toBeVisible();

    // Click on Miller record link to navigate to record detail
    const leadLink = page.locator("table tbody tr").first().getByRole("link").first();
    const href = await leadLink.getAttribute("href");
    expect(href).toBeDefined();
    await leadLink.click();
    await page.waitForURL(new RegExp(`/crm/${org.slug}/tab/Leads/[^/]+`));
    const urlParts = (href ?? page.url()).split("/");
    const leadId = urlParts[urlParts.length - 1];
    expect(leadId).toBeDefined();

    // 11. Assert that the Lead has an attribution row linked to the campaign
    const attrRes = await page.request.get(`/crm/v2.1/Leads/${leadId}/attributions`, {
      headers: jsonHeaders,
    });
    expect(attrRes.ok()).toBe(true);
    const { attributions } = await attrRes.json();
    expect(attributions).toHaveLength(1);

    const attr = attributions[0];
    expect(attr.campaignId).toBe(createdCampaign.id);
    expect(attr.gclid).toBe("click-12345");
    expect(attr.utmSource).toBe("google");
    expect(attr.utmCampaign).toBe("fall promo 2026");
    expect(attr.utmTerm).toBe("enterprise crm software");
    expect(attr.source).toBe("webform");
  });
  test("webform-attributed lead shows the ad attribution section; conversion copies it; the summary report counts it", async ({
    page,
  }) => {
    const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/ads-mep1509-evidence";
    mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1180, height: 703 });
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const origin = new URL(page.url()).origin;
    const jsonHeaders = {
      "X-CRM-ORG": org.slug,
      Origin: origin,
      "Content-Type": "application/json",
    };
    const actionHeaders = { "X-CRM-ORG": org.slug, Origin: origin };

    // Local ads model: campaign → group → keyword.
    const campaignRes = await page.request.post("/crm/v2.1/settings/ads/campaigns", {
      headers: jsonHeaders,
      data: { name: "Winter Search" },
    });
    expect(campaignRes.ok()).toBe(true);
    const { campaign } = await campaignRes.json();
    const groupRes = await page.request.post("/crm/v2.1/settings/ads/groups", {
      headers: jsonHeaders,
      data: { campaignId: campaign.id, name: "Brand Terms" },
    });
    expect(groupRes.ok()).toBe(true);
    const { group } = await groupRes.json();
    const keywordRes = await page.request.post("/crm/v2.1/settings/ads/keywords", {
      headers: jsonHeaders,
      data: { campaignId: campaign.id, adGroupId: group.id, name: "cloud crm" },
    });
    expect(keywordRes.ok()).toBe(true);

    // Lead webform that captures attribution.
    const formRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Attribution Form", module: "Leads" },
    });
    expect(formRes.ok()).toBe(true);
    const formId = (await formRes.json()).webform.id;
    expect(
      (
        await page.request.put(`/crm/v2.1/settings/webforms/${formId}`, {
          headers: jsonHeaders,
          data: {
            fields: [
              { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
              { fieldApiName: "Company", label: "Company", required: true, hidden: false },
            ],
            settings: {
              buttonLabel: "Send",
              captureAttribution: true,
              acknowledgement: { kind: "message", text: "Thanks!" },
            },
          },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await page.request.post(`/crm/v2.1/settings/webforms/${formId}/actions/publish`, {
          headers: actionHeaders,
        })
      ).ok(),
    ).toBe(true);
    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/regenerate_key`,
      { headers: actionHeaders },
    );
    const { publicKey } = await keyRes.json();

    await page.goto(
      `/f/${publicKey}?utm_campaign=winter%20search&utm_term=cloud%20crm&utm_source=google&utm_medium=cpc&gclid=e2e-click-1`,
    );
    await page.locator("#field-Last_Name").fill("Attributed");
    await page.locator("#field-Company").fill("Attributed Co");
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.locator("#thank-you-message")).toContainText("Thanks!");

    await page.goto(`/crm/${org.slug}/tab/Leads/list`);
    const leadLink = page.locator("table tbody tr").first().getByRole("link").first();
    await expect(leadLink).toBeVisible();
    const leadId = ((await leadLink.getAttribute("href")) ?? "").split("/").pop() as string;
    expect(leadId).toBeTruthy();

    const expectSection = async (module: string, id: string, source: string, shot: string) => {
      await page.goto(moduleRecordPath(org.slug, module, id));
      await expect(page.locator("[data-record-frame]")).toBeVisible();
      const section = page.getByTestId("ad-attribution-section");
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("ad-attribution-campaign")).toHaveText("Winter Search");
      await expect(page.getByTestId("ad-attribution-adGroup")).toHaveText("Brand Terms");
      await expect(page.getByTestId("ad-attribution-keyword")).toHaveText("cloud crm");
      await expect(page.getByTestId("ad-attribution-gclid")).toHaveText("e2e-click-1");
      await expect(page.getByTestId("ad-attribution-utmMedium")).toHaveText("cpc");
      await expect(page.getByTestId("ad-attribution-source")).toHaveText(source);
      await page.screenshot({ path: join(evidenceDir, shot) });
    };

    await expectSection(LEADS_MODULE, leadId, "Webform", "attribution-lead-1180x703.png");

    // Convert into a contact and a deal; the attribution travels with them.
    const convertRes = await page.request.post(`/crm/v2.2/Leads/${leadId}/actions/convert`, {
      headers: jsonHeaders,
      data: {
        account: { create: {} },
        contact: { create: {} },
        deal: {
          create: {
            Deal_Name: "Attributed deal",
            Stage: "Qualification",
            Closing_Date: "2026-12-31",
            Amount: 2500,
          },
        },
      },
    });
    expect(convertRes.ok()).toBe(true);
    const converted = await convertRes.json();
    const contactId = (converted.contactId ?? converted.data?.contactId) as string;
    const dealId = (converted.dealId ?? converted.data?.dealId) as string;
    expect(contactId && dealId).toBeTruthy();

    await expectSection(
      "Contacts",
      contactId,
      "Lead conversion",
      "attribution-contact-1180x703.png",
    );
    await expectSection("Deals", dealId, "Lead conversion", "attribution-deal-1180x703.png");

    // A module without the section never asks for it (no 400 on the page).
    const notSupported = await page.request.get(
      `/crm/v2.1/Accounts/${converted.accountId ?? "x"}/ad_attribution`,
      {
        headers: actionHeaders,
      },
    );
    expect(notSupported.status()).toBe(404);

    // Summary report: one lead, one contact, one deal with its amount under the keyword.
    await page.goto(`/crm/${org.slug}/tab/Reports/ads-summary`);
    const row = page.getByRole("row", { name: /Winter Search › Brand Terms › cloud crm/ });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByRole("cell")).toHaveText([
      "Winter Search › Brand Terms › cloud crm",
      "1",
      "1",
      "1",
      "2,500.00",
    ]);
    await page.screenshot({ path: join(evidenceDir, "ads-summary-report-1180x703.png") });

    // A date range before today leaves the report empty.
    await page.getByLabel("From").fill("2020-01-01");
    await page.getByLabel("To").fill("2020-01-31");
    await page.getByTestId("ads-summary-apply").click();
    await expect(page.getByTestId("ads-summary-empty")).toBeVisible();

    await page.goto(`/crm/${org.slug}/settings/extensions/google`);
    await expect(page.getByTestId("ads-summary-link")).toBeVisible();
    await page.screenshot({ path: join(evidenceDir, "google-integrations-1180x703.png") });
  });
});
