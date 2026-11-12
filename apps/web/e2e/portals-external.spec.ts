import { randomBytes } from "node:crypto";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, ignoreFailedResponses, test } from "./support/test";

test.describe("External Portal Client Screens (ADR 0019a §6)", () => {
  test("invitation acceptance, login, modules list, case creation, self-edit, and 404 security", async ({
    page,
    pageErrors,
  }) => {
    // 1. Setup CRM admin and org
    await signUpNewUser(page);
    const org = await createOrganization(page);
    ignoreFailedResponses(pageErrors, [401, 404]);
    const origin = new URL(page.url()).origin;
    const jsonHeaders = {
      "X-CRM-ORG": org.slug,
      Origin: origin,
      "Content-Type": "application/json",
    };

    const rand = randomBytes(4).toString("hex");
    const portalSlug = `e2e-portal-${rand}`;

    // Configure organization sender address (ADR 0019a §5)
    const orgAddressRes = await page.request.post(
      `/api/definitions/${org.slug}/organization-addresses`,
      {
        headers: jsonHeaders,
        data: {
          displayName: "Enterprise Support",
          address: "support@enterprise.test",
        },
      },
    );
    expect(orgAddressRes.ok(), await orgAddressRes.text()).toBe(true);

    // 2. Create Portal via settings API
    const portalRes = await page.request.post("/crm/v2.1/settings/portals", {
      headers: jsonHeaders,
      data: {
        name: "Enterprise Client Portal",
        slug: portalSlug,
        defaultLanguage: "en",
      },
    });
    expect(portalRes.ok(), await portalRes.text()).toBe(true);

    // 3. Create User Type with Contacts (read/edit) and Cases (read/create)
    const userTypeRes = await page.request.post("/crm/v2.1/settings/portals/user-types", {
      headers: jsonHeaders,
      data: {
        name: "Standard Client",
        modules: {
          Contacts: {
            enabled: true,
            scope: "contact",
            actions: { view: true, edit: true, create: false },
            fields: [
              { apiName: "First_Name", mode: "read" },
              { apiName: "Last_Name", mode: "read" },
              { apiName: "Email", mode: "read" },
              { apiName: "Phone", mode: "edit" },
            ],
          },
          Cases: {
            enabled: true,
            scope: "contact",
            actions: { view: true, create: true, edit: false },
            fields: [
              { apiName: "Subject", mode: "edit" },
              { apiName: "Description", mode: "edit" },
              { apiName: "Priority", mode: "edit" },
              { apiName: "Status", mode: "read" },
            ],
          },
        },
        settings: { caseOwner: null },
      },
    });
    expect(userTypeRes.ok(), await userTypeRes.text()).toBe(true);
    const { userType } = await userTypeRes.json();

    // 4. Create Contact in CRM
    const contactEmail = `charlie-${rand}@example.test`;
    const contactRes = await page.request.post("/crm/v2.2/Contacts", {
      headers: jsonHeaders,
      data: {
        data: [
          {
            First_Name: "Charlie",
            Last_Name: "PortalUser",
            Email: contactEmail,
            Phone: "111-222-3333",
          },
        ],
      },
    });
    expect(contactRes.ok(), await contactRes.text()).toBe(true);
    const contactData = await contactRes.json();
    const contactId = String(contactData.data[0].details.id);

    // 5. Invite the Contact to the Portal
    const inviteRes = await page.request.post("/crm/v2.1/settings/portals/users", {
      headers: jsonHeaders,
      data: {
        contactId,
        userTypeId: userType.id,
      },
    });
    expect(inviteRes.ok(), await inviteRes.text()).toBe(true);
    const inviteJson = await inviteRes.json();
    const token = inviteJson.inviteToken;
    expect(token).toBeDefined();

    // 6. Navigate to Accept Invitation page with token in URL fragment
    await page.goto(`/portal/${portalSlug}/accept#t=${token}`);
    assertNoPageErrors(pageErrors);

    // Verify invitation acceptance form
    const acceptForm = page.locator('[data-testid="portal-accept-form"]');
    await expect(acceptForm).toBeVisible();

    const newPassword = "SecurePassword123!";
    await page.locator('[data-testid="portal-accept-password"]').fill(newPassword);
    await page.locator('[data-testid="portal-accept-confirm"]').fill(newPassword);
    await page.locator('[data-testid="portal-accept-submit"]').click();

    // 7. Successful activation redirects to Portal Home
    await expect(page).toHaveURL(`/portal/${portalSlug}`);
    await expect(page.locator('[data-testid="portal-home"]')).toBeVisible();
    await expect(page.getByText("Welcome back, Charlie PortalUser")).toBeVisible();

    // Verify enabled modules are visible in navigation
    await expect(page.locator('[data-testid="portal-nav-Contacts"]')).toBeVisible();
    await expect(page.locator('[data-testid="portal-nav-Cases"]')).toBeVisible();
    // Deals was not enabled, so it must not appear in nav
    await expect(page.locator('[data-testid="portal-nav-Deals"]')).toBeHidden();

    // 8. Cases List & Case Creation
    await page.locator('[data-testid="portal-nav-Cases"]').click();
    await expect(page).toHaveURL(`/portal/${portalSlug}/Cases`);
    await expect(page.locator('[data-testid="portal-module-list-Cases"]')).toBeVisible();

    // Click "+ New Case"
    await page.locator('[data-testid="portal-create-case-button"]').click();
    await expect(page).toHaveURL(`/portal/${portalSlug}/Cases/new`);
    await expect(page.locator('[data-testid="portal-new-case-form"]')).toBeVisible();

    // Fill Case details
    await page.locator('[data-testid="portal-case-subject"]').fill("Payment Inquiry #42");
    await page.locator('[data-testid="portal-case-priority"]').selectOption("High");
    await page
      .locator('[data-testid="portal-case-description"]')
      .fill("Questions regarding recent quote.");
    await page.locator('[data-testid="portal-case-submit"]').click();

    // Successfully created -> Detail page opens
    await expect(page.locator('[data-testid="portal-record-detail-Cases"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Payment Inquiry #42" })).toBeVisible();
    await expect(page.getByText("High").first()).toBeVisible();

    // 9. Unauthorized / Foreign Record Access Security (ADR 0019a §4.4)
    // Non-existent or foreign ID must strictly return the neutral 404 page
    await page.goto(`/portal/${portalSlug}/Cases/0193b3b0-0000-7000-8000-000000000000`);
    await expect(page.locator('[data-testid="portal-not-found"]')).toBeVisible();
    await expect(page.getByText("404")).toBeVisible();

    // 10. Self-Edit on Own Contact Profile
    await page.goto(`/portal/${portalSlug}/Contacts/${contactId}`);
    await expect(page.locator('[data-testid="portal-record-detail-Contacts"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Charlie PortalUser" })).toBeVisible();

    // Click "Edit Profile"
    const editBtn = page.locator('[data-testid="portal-contact-edit-button"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit Phone number (editable field)
    const phoneInput = page.locator('[data-testid="portal-input-Phone"]');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill("555-999-8888");

    // Click "Save Changes"
    await page.locator('[data-testid="portal-contact-save-button"]').click();

    // Verify updated phone value is saved
    await expect(page.getByText("555-999-8888")).toBeVisible();

    // 11. Sign Out
    const logoutBtn = page.locator('[data-testid="portal-logout-button"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await expect(page).toHaveURL(`/portal/${portalSlug}/login`);
    await expect(page.locator('[data-testid="portal-login-form"]')).toBeVisible();

    // 12. Authentication Verification: Login Failure with Invalid Credentials
    await page.locator('[data-testid="portal-login-email"]').fill(contactEmail);
    await page.locator('[data-testid="portal-login-password"]').fill("WrongPassword!");
    await page.locator('[data-testid="portal-login-submit"]').click();

    await expect(page.locator('[data-testid="portal-login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="portal-login-error"]')).toContainText(
      "Invalid email or password.",
    );

    // 13. Authentication Verification: Login Success
    await page.locator('[data-testid="portal-login-password"]').fill(newPassword);
    await page.locator('[data-testid="portal-login-submit"]').click();

    await expect(page).toHaveURL(`/portal/${portalSlug}`);
    await expect(page.locator('[data-testid="portal-home"]')).toBeVisible();

    // 401 from invalid login test & 404 from foreign record test are expected
    ignoreFailedResponses(pageErrors, [401, 404]);
    assertNoPageErrors(pageErrors);
  });
});
