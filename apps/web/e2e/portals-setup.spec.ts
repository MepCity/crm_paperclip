import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, ignoreFailedResponses, test } from "./support/test";

test.describe("Portals Setup Member Screens (ADR 0019a §6)", () => {
  test("unconfigured landing, portal setup, user types, and invite flow", async ({
    page,
    pageErrors,
  }) => {
    // Exact reference CRM viewport geometry for visual parity check
    await page.setViewportSize({ width: 1180, height: 703 });
    ignoreFailedResponses(pageErrors, [404]);

    await signUpNewUser(page);
    const org = await createOrganization(page);

    // 1. Navigate to Portals settings
    await page.goto(`/crm/${org.slug}/settings/portals`);
    assertNoPageErrors(pageErrors);

    // 2. Unconfigured landing state matching P1 reference capture
    const title = page.locator('[data-zcqa="CustomerPortalTitle"]');
    await expect(title).toBeVisible();

    const getStartedBtn = page.locator(
      '#client_portal_getStarted, [data-zcqa="CustomerPortalGettingStartedButton"]',
    );
    await expect(getStartedBtn).toBeVisible();

    const helpLink = page.locator('[data-testid="portal-help-link"]');
    await expect(helpLink).toBeVisible();
    await expect(helpLink).toHaveAttribute("href", "#help");

    // Save screenshot for side-by-side artifact comparison
    const screenshotDir = join(process.cwd(), "test-results");
    mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: join(screenshotDir, "portals-landing-actual.png"),
      fullPage: false,
    });

    // 3. Click Get Started to open Portal Configuration modal
    await getStartedBtn.click();
    const portalConfigModal = page.locator('[data-testid="portal-config-modal"]');
    await expect(portalConfigModal).toBeVisible();

    // Fill Portal configuration
    const nameInput = page.locator('[data-testid="portal-name-input"]');
    await nameInput.fill("MepCity Customer Portal");

    const slugInput = page.locator('[data-testid="portal-slug-input"]');
    await slugInput.fill("mepcity-portal");

    const savePortalBtn = page.locator(
      '[data-testid="save-portal-button"], [data-testid="portal-config-submit"]',
    );
    await savePortalBtn.click();

    // 4. Portal Dashboard is rendered
    const setupScreen = page.locator('[data-testid="portal-setup-screen"]');
    await expect(setupScreen).toBeVisible();
    await expect(page.getByText("MepCity Customer Portal")).toBeVisible();
    await expect(page.getByText("/portal/mepcity-portal")).toBeVisible();

    // Tabs exist
    await expect(page.locator('[data-testid="tab-user-types"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-auth-events"]')).toBeVisible();

    // 5. Create a User Type
    const newUserTypeBtn = page.locator('[data-testid="new-user-type-button"]');
    await expect(newUserTypeBtn).toBeVisible();
    await newUserTypeBtn.click();

    const userTypeModal = page.locator('[data-testid="user-type-modal"]');
    await expect(userTypeModal).toBeVisible();

    const userTypeNameInput = page.locator('[data-testid="user-type-name-input"]');
    await userTypeNameInput.fill("Client Support Tier");

    // Enable Contacts and Cases modules
    const contactsToggle = page.locator('[data-testid="module-toggle-Contacts"]');
    if (!(await contactsToggle.isChecked())) {
      await contactsToggle.click();
    }

    const casesToggle = page.locator('[data-testid="module-toggle-Cases"]');
    if (!(await casesToggle.isChecked())) {
      await casesToggle.click();
    }

    // Enable create permission on Cases
    const casesCreateAction = page.locator(
      '[data-testid="action-create-Cases"], [data-testid="action-Cases-create"]',
    );
    if ((await casesCreateAction.isVisible()) && !(await casesCreateAction.isChecked())) {
      await casesCreateAction.click();
    }

    const saveUserTypeBtn = page.locator(
      '[data-testid="save-user-type-button"], [data-testid="user-type-submit"]',
    );
    await saveUserTypeBtn.scrollIntoViewIfNeeded();
    await saveUserTypeBtn.click();

    // User type appears in the table
    await expect(page.locator('[data-testid="user-types-table"]')).toContainText(
      "Client Support Tier",
    );

    // 6. Configure organization sender email (ADR 0019a §5) & create Contact in CRM
    await page.request.post(`/api/definitions/${org.slug}/organization-addresses`, {
      headers: {
        "X-CRM-ORG": org.slug,
        "Content-Type": "application/json",
        Origin: new URL(page.url()).origin,
      },
      data: {
        displayName: "Portal Support",
        address: "support@mepcity.test",
      },
    });

    const contactRes = await page.request.post("/crm/v2.2/Contacts", {
      headers: {
        "X-CRM-ORG": org.slug,
        "Content-Type": "application/json",
        Origin: new URL(page.url()).origin,
      },
      data: {
        data: [
          {
            Last_Name: "PortalTester",
            First_Name: "Alice",
            Email: "alice.portal@example.test",
          },
        ],
      },
    });
    expect(contactRes.ok(), await contactRes.text()).toBe(true);

    // 7. Switch to Portal Users tab and invite the Contact
    await page.locator('[data-testid="tab-users"]').click();
    await expect(
      page.locator('[data-testid="portal-users-panel"], [data-testid="users-panel"]'),
    ).toBeVisible();

    const inviteUserBtn = page.locator('[data-testid="invite-user-button"]');
    await expect(inviteUserBtn).toBeVisible();
    await inviteUserBtn.click();

    const inviteModal = page.locator('[data-testid="invite-user-modal"]');
    await expect(inviteModal).toBeVisible();

    // Select contact
    const contactSelect = page.locator(
      '[data-testid="contact-select"], [data-testid="invite-contact-select"]',
    );
    await page.locator('[data-testid="contact-search-input"]').fill("Alice");
    await contactSelect.selectOption({ label: "Alice PortalTester (alice.portal@example.test)" });

    // Select user type
    const userTypeSelect = page.locator(
      '[data-testid="user-type-select"], [data-testid="invite-usertype-select"]',
    );
    await userTypeSelect.selectOption({ label: "Client Support Tier" });

    // Submit invitation
    const submitInviteBtn = page.locator(
      '[data-testid="send-invite-button"], [data-testid="invite-user-submit"]',
    );
    await submitInviteBtn.click();

    // User appears in portal users table
    await expect(page.locator('[data-testid="portal-users-table"]')).toContainText(
      "alice.portal@example.test",
    );
    await expect(page.locator('[data-testid="portal-users-table"]')).toContainText("Invited");

    // 8. Audit Events tab
    await page.locator('[data-testid="tab-auth-events"]').click();
    await expect(page.locator('[data-testid="auth-events-panel"]')).toBeVisible();

    assertNoPageErrors(pageErrors);
  });
});
