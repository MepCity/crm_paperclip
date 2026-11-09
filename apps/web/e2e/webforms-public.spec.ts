import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

test.describe("webforms public routes and ingestion", () => {
  test("hosted form submit creates Lead and displays thank-you message", async ({ page }) => {
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
      data: { name: "Public Lead Capture", module: "Leads" },
    });
    expect(createRes.ok(), await createRes.text()).toBe(true);
    const { webform } = await createRes.json();
    const formId = webform.id;

    // 2. Update draft with fields and custom thank-you message
    const updateRes = await page.request.put(`/crm/v2.1/settings/webforms/${formId}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
          { fieldApiName: "Email", label: "Email", required: false, hidden: false },
        ],
        settings: {
          buttonLabel: "Send Inquiry",
          acknowledgement: {
            kind: "message",
            text: "Thank you for contacting us! We will get back to you shortly.",
          },
        },
      },
    });
    expect(updateRes.ok(), await updateRes.text()).toBe(true);

    // 3. Publish form
    const publishRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/publish`,
      {
        headers: actionHeaders,
      },
    );
    expect(publishRes.ok(), await publishRes.text()).toBe(true);

    // 4. Regenerate key to obtain active public key
    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/regenerate_key`,
      {
        headers: actionHeaders,
      },
    );
    expect(keyRes.ok(), await keyRes.text()).toBe(true);
    const { publicKey } = await keyRes.json();
    expect(publicKey).toBeDefined();

    // 5. Open hosted form page
    await page.goto(`/f/${publicKey}`);
    await expect(page.getByRole("heading", { name: "Public Lead Capture" })).toBeVisible();
    await expect(page.locator("#field-Last_Name")).toBeVisible();
    await expect(page.locator("#field-Company")).toBeVisible();
    await expect(page.locator("#field-Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Inquiry" })).toBeVisible();

    // 6. Fill form and wait for the 2-second anti-bot minimum token age window (§3.2, §3.5)
    await page.locator("#field-Last_Name").fill("Smithsonian");
    await page.locator("#field-Company").fill("Smithsonian Inc");
    await page.locator("#field-Email").fill("smithsonian@example.com");
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send Inquiry" }).click();

    // 7. Verify thank-you message page
    await expect(page.locator("#thank-you-message")).toContainText(
      "Thank you for contacting us! We will get back to you shortly.",
    );

    // 8. Go to CRM Leads list and assert the record was created
    await page.goto(`/crm/${org.slug}/tab/Leads/list`);
    await expect(page.getByText("Smithsonian").first()).toBeVisible();
  });

  test("hosted form with redirect acknowledgement redirects to target URL", async ({
    page,
    pageErrors,
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

    // 1. Create form
    const createRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Redirect Flow Form", module: "Leads" },
    });
    expect(createRes.ok(), await createRes.text()).toBe(true);
    const { webform } = await createRes.json();
    const formId = webform.id;

    // 2. Add location for redirect target
    const locRes = await page.request.post(`/crm/v2.1/settings/webforms/${formId}/locations`, {
      headers: jsonHeaders,
      data: { origin: "https://example.com" },
    });
    expect(locRes.ok(), await locRes.text()).toBe(true);

    // 3. Update draft with redirect setting
    const updateRes = await page.request.put(`/crm/v2.1/settings/webforms/${formId}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
        ],
        settings: {
          buttonLabel: "Submit & Redirect",
          acknowledgement: {
            kind: "redirect",
            url: "https://example.com/thank-you",
          },
        },
      },
    });
    expect(updateRes.ok(), await updateRes.text()).toBe(true);

    // 4. Publish & obtain public key
    const publishRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/publish`,
      {
        headers: actionHeaders,
      },
    );
    expect(publishRes.ok(), await publishRes.text()).toBe(true);

    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${formId}/actions/regenerate_key`,
      {
        headers: actionHeaders,
      },
    );
    expect(keyRes.ok(), await keyRes.text()).toBe(true);
    const { publicKey } = await keyRes.json();

    // 5. Open hosted page, fill, wait 2.1s token age, and submit
    await page.goto(`/f/${publicKey}`);
    await page.locator("#field-Last_Name").fill("RedirectUser");
    await page.locator("#field-Company").fill("RedirectCorp");
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Submit & Redirect" }).click();

    // 6. Verify redirected to target URL
    await page.waitForURL(/example\.com\/thank-you/);
    expect(page.url()).toContain("example.com/thank-you");

    // Clear external domain navigation errors from example.com
    pageErrors.length = 0;
  });

  test("displays 429 page when render rate limit is exceeded", async ({ page, pageErrors }) => {
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

    // Create and publish form
    const createRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Rate Limited Form", module: "Leads" },
    });
    expect(createRes.ok(), await createRes.text()).toBe(true);
    const { webform } = await createRes.json();

    const updateRes = await page.request.put(`/crm/v2.1/settings/webforms/${webform.id}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
        ],
      },
    });
    expect(updateRes.ok(), await updateRes.text()).toBe(true);

    const pubRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${webform.id}/actions/publish`,
      {
        headers: actionHeaders,
      },
    );
    expect(pubRes.ok(), await pubRes.text()).toBe(true);

    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${webform.id}/actions/regenerate_key`,
      {
        headers: actionHeaders,
      },
    );
    expect(keyRes.ok(), await keyRes.text()).toBe(true);
    const { publicKey } = await keyRes.json();

    // Make 121 GET requests to exceed render limit (limit = 120/min)
    for (let i = 0; i < 121; i++) {
      await page.request.get(`/f/${publicKey}`);
    }

    // Now visiting the page returns 429 Too Many Requests HTML
    const response = await page.goto(`/f/${publicKey}`);
    ignoreFailedResponses(pageErrors, [429]);
    expect(response?.status()).toBe(429);
    await expect(page.getByRole("heading", { name: "Too Many Requests" })).toBeVisible();
    await expect(page.getByText("Rate limit exceeded. Please try again later.")).toBeVisible();
  });

  test("displays 404 page for unknown public key", async ({ page, pageErrors }) => {
    const response = await page.goto("/f/wfk_live_nonExistentKey9999");
    ignoreFailedResponses(pageErrors, [404]);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Form Unavailable" })).toBeVisible();
    await expect(
      page.getByText("The form you are looking for is unavailable, inactive, or does not exist."),
    ).toBeVisible();
  });

  test("rejects foreign origin and fake hosted referer when locations are restricted", async ({
    page,
    pageErrors,
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

    // 1. Create form with restrictLocations: true
    const createRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Restricted Form", module: "Leads" },
    });
    expect(createRes.ok()).toBe(true);
    const { webform } = await createRes.json();

    const updateRes = await page.request.put(`/crm/v2.1/settings/webforms/${webform.id}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
          { fieldApiName: "Company", label: "Company", required: true, hidden: false },
        ],
        settings: {
          restrictLocations: true,
        },
      },
    });
    expect(updateRes.ok()).toBe(true);

    const pubRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${webform.id}/actions/publish`,
      {
        headers: actionHeaders,
      },
    );
    expect(pubRes.ok()).toBe(true);

    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${webform.id}/actions/regenerate_key`,
      {
        headers: actionHeaders,
      },
    );
    expect(keyRes.ok()).toBe(true);
    const { publicKey } = await keyRes.json();

    // Try submitting with foreign origin and fake hosted referer
    const fakeRes = await page.request.post(`/api/public/webforms/${publicKey}/submissions`, {
      headers: {
        Origin: "https://evil.example.com",
        Referer: `${origin}/f/${publicKey}`,
        "Content-Type": "application/json",
      },
      data: {
        Last_Name: "Hacker",
        Company: "EvilCorp",
      },
    });
    ignoreFailedResponses(pageErrors, [404]);
    expect(fakeRes.status()).toBe(404);
  });

  test("hosted Cases form renders picklists as select, and invalid submission returns 422 instead of 500", async ({
    page,
    pageErrors,
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

    // 1. Create a Cases webform
    const createRes = await page.request.post("/crm/v2.1/settings/webforms", {
      headers: jsonHeaders,
      data: { name: "Support Ticket Form", module: "Cases" },
    });
    expect(createRes.ok()).toBe(true);
    const { webform } = await createRes.json();

    // 2. Configure fields: Subject, Case_Origin (hidden with default), Status (picklist)
    const updateRes = await page.request.put(`/crm/v2.1/settings/webforms/${webform.id}`, {
      headers: jsonHeaders,
      data: {
        fields: [
          { fieldApiName: "Subject", label: "Subject", required: true, hidden: false },
          {
            fieldApiName: "Case_Origin",
            label: "Origin",
            required: true,
            hidden: true,
            defaultValue: "Web",
          },
          { fieldApiName: "Status", label: "Status", required: true, hidden: false },
        ],
        settings: {
          buttonLabel: "Submit Ticket",
          acknowledgement: {
            kind: "message",
            text: "Your ticket has been logged.",
          },
        },
      },
    });
    expect(updateRes.ok()).toBe(true);

    // 3. Publish & regenerate key
    const pubRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${webform.id}/actions/publish`,
      { headers: actionHeaders },
    );
    expect(pubRes.ok()).toBe(true);

    const keyRes = await page.request.post(
      `/crm/v2.1/settings/webforms/${webform.id}/actions/regenerate_key`,
      { headers: actionHeaders },
    );
    expect(keyRes.ok()).toBe(true);
    const { publicKey } = await keyRes.json();

    // 4. Visit hosted form: Status must render as a <select>
    await page.goto(`/f/${publicKey}`);
    const statusSelect = page.locator("select#field-Status");
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect.locator("option")).not.toHaveCount(0);

    // 5. Test invalid JSON submission: invalid picklist value must return 422, NOT 500
    // First get a valid token from the hosted page
    const tokenVal = await page.locator('input[name="_token"]').inputValue();
    await page.waitForTimeout(2100);

    ignoreFailedResponses(pageErrors, [422]);
    const badSubmitRes = await page.request.post(`/api/public/webforms/${publicKey}/submissions`, {
      headers: {
        Origin: origin,
        Referer: `${origin}/f/${publicKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: {
        _token: tokenVal,
        _hp: "",
        Subject: "Testing invalid status",
        Status: "NonExistentStatusValue999",
      },
    });

    expect(badSubmitRes.status()).toBe(422);
    const errJson = await badSubmitRes.json();
    expect(errJson.error).toBe("Validation failed");
    expect(errJson.errors?.Status).toBeDefined();
  });
});
