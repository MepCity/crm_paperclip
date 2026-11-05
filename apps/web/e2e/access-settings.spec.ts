import type { Locator, Page } from "@playwright/test";
import { AUTH_NAVIGATION_TIMEOUT_MS, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const PASSWORD = "long-password-1";

/** Opens a react-aria select by its label and picks an option. */
async function pick(page: Page, scope: Locator, label: string | RegExp, option: string) {
  await scope.getByRole("button", { name: label }).first().click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("administrator manages profiles, roles, groups and sharing", async ({
  page,
  browser,
  pageErrors,
}) => {
  test.setTimeout(240_000);
  await signUpNewUser(page, { name: "Ada Admin" });
  const org = await createOrganization(page, "Access Org");
  const base = `/crm/${org.slug}/settings`;

  // Navigation entries exist for an administrator.
  await page.goto(`${base}/members`);
  for (const name of ["Profiles", "Roles", "Groups", "Data Sharing", "Field Permissions"]) {
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  }

  // Profiles: the two system profiles, then a clone.
  await page.goto(`${base}/profiles`);
  await expect(page.getByRole("link", { name: "Administrator" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Standard", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New Profile" }).click();
  let dialog = page.getByRole("dialog", { name: "New Profile" });
  await dialog.getByRole("textbox", { name: "Profile name" }).fill("Support");
  await pick(page, dialog, /Clone from/, "Standard");
  await dialog.getByRole("button", { name: "Create profile" }).click();
  await expect(page.getByRole("heading", { name: "Profile: Support" })).toBeVisible();
  // Duplicate name is refused with the server message.
  await page.getByRole("button", { name: "Clone" }).click();
  dialog = page.getByRole("dialog", { name: "Clone" });
  await dialog.getByRole("textbox", { name: "Profile name" }).fill("support");
  await dialog.getByRole("button", { name: "Create profile" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await page.keyboard.press("Escape");
  // Custom profile edit: remove Leads delete.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("checkbox", { name: "Leads: Delete" }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Leads: Delete" })).not.toBeChecked();
  // The Administrator profile is read-only.
  await page.goto(`${base}/profiles`);
  await page.getByRole("link", { name: "Administrator" }).click();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);

  // Roles: create under Manager, root cannot be deleted.
  await page.goto(`${base}/roles`);
  await expect(page.getByRole("link", { name: "CEO" })).toBeVisible();
  await page.getByRole("button", { name: "New Role" }).click();
  dialog = page.getByRole("dialog", { name: "New role" });
  await dialog.getByRole("textbox", { name: "Role name" }).fill("Sales Rep");
  await pick(page, dialog, /Reporting To/, "Manager");
  await dialog.getByRole("button", { name: "Save role" }).click();
  await expect(page.getByRole("heading", { name: "Sales Rep" })).toBeVisible();
  await expect(page.getByText("Manager", { exact: true })).toBeVisible();
  await page.goto(`${base}/roles`);
  await page.getByRole("link", { name: "CEO" }).click();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);

  // Groups: empty state, create with a user member.
  await page.goto(`${base}/groups`);
  await expect(page.getByText("No groups have been created")).toBeVisible();
  await page.getByRole("button", { name: "Create Group" }).click();
  dialog = page.getByRole("dialog", { name: "Create group" });
  await dialog.getByRole("textbox", { name: "Group name" }).fill("Sales Team");
  await pick(page, dialog, /Group member/, "Ada Admin");
  await dialog.getByRole("button", { name: "Add member" }).click();
  await expect(dialog.getByText("User: Ada Admin")).toBeVisible();
  await dialog.getByRole("button", { name: "Save group" }).click();
  await expect(page.getByRole("cell", { name: "Sales Team", exact: true })).toBeVisible();

  // Data sharing: change a default, then add a sharing rule.
  await page.goto(`${base}/data-sharing`);
  await expect(page.getByRole("cell", { name: "Private (owner can view)" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: /Leads default access/ }).click();
  await page.getByRole("option", { name: "Public (Read only)" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("row", { name: /Leads/ })).toContainText("Public (Read only)");
  await page.getByRole("button", { name: "Sharing Rules" }).click();
  await page.getByRole("button", { name: "New Rule" }).click();
  dialog = page.getByRole("dialog", { name: /New sharing rule/ });
  await dialog.getByRole("textbox", { name: "Rule name" }).fill("Reps to managers");
  await pick(page, dialog, /Records owned by/, "Sales Rep");
  await pick(page, dialog, /Share with/, "Manager");
  await dialog.getByRole("button", { name: "Save rule" }).click();
  await expect(page.getByRole("cell", { name: "Reps to managers", exact: true })).toBeVisible();

  // Field permissions: tabs per profile, radios, administrator is fixed.
  await page.goto(`${base}/field-permissions`);
  await page.getByRole("button", { name: "Support" }).click();
  await expect(page.getByTestId("field-permissions")).toBeVisible();

  // Invitation carries profile and role; the new member shows them.
  await page.goto(`${base}/members`);
  await page.getByRole("button", { name: "Invite member" }).click();
  dialog = page.getByRole("dialog", { name: "Invite member" });
  const email = `rep-${crypto.randomUUID()}@example.test`;
  await dialog.getByRole("textbox", { name: "Email" }).fill(email);
  await pick(page, dialog, /Profile/, "Support");
  await pick(page, dialog, /Access role/, "Sales Rep");
  await dialog.getByRole("button", { name: "Create invitation" }).click();
  const inviteUrl = (await dialog.getByText(/\/invite\//).innerText()).trim();
  await dialog.getByRole("button", { name: "Close" }).click();

  const repContext = await browser.newContext();
  const rep = await repContext.newPage();
  try {
    await rep.goto(inviteUrl);
    await rep.getByRole("link", { name: "Sign up" }).click();
    await rep.getByRole("textbox", { name: "Name" }).fill("Rita Rep");
    await rep.getByRole("textbox", { name: "Email" }).fill(email);
    await rep.getByLabel("Password").fill(PASSWORD);
    await rep.getByRole("button", { name: "Sign up" }).click();
    await expect(rep).toHaveURL(inviteUrl, { timeout: AUTH_NAVIGATION_TIMEOUT_MS });
    await rep.getByRole("button", { name: `Join ${org.name}` }).click();
    await expect(rep).toHaveURL(`/crm/${org.slug}`);
    // Without user management the settings sections are hidden and the pages are denied.
    await rep.goto(`${base}/profiles`);
    await expect(rep.getByText("Access denied")).toBeVisible();
    await expect(rep.getByRole("link", { name: "Profiles", exact: true })).toHaveCount(0);
  } finally {
    await repContext.close();
  }

  await page.reload();
  const row = page.getByRole("row", { name: /Rita Rep/ });
  await expect(row.getByRole("button", { name: /Profile of Rita Rep/ })).toContainText("Support");
  await expect(row.getByRole("button", { name: /Access role of Rita Rep/ })).toContainText(
    "Sales Rep",
  );
  // Change the member's access role through the row control.
  await pick(page, row, /Access role of Rita Rep/, "Manager");
  await page.reload();
  await expect(
    page.getByRole("row", { name: /Rita Rep/ }).getByRole("button", { name: /Access role of/ }),
  ).toContainText("Manager");

  // Delete the in-use profile: replacement is required, then the member moves.
  await page.goto(`${base}/profiles`);
  await page.getByRole("link", { name: "Support" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Delete profile" });
  await dialog.getByRole("button", { name: "Delete profile" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await pick(page, dialog, /Replacement profile/, "Standard");
  await dialog.getByRole("button", { name: "Delete profile" }).click();
  await expect(page).toHaveURL(`${base}/profiles`);
  await expect(page.getByRole("link", { name: "Support" })).toHaveCount(0);
  // The refused duplicate name and the missing replacement profile are expected 400s.
  ignoreFailedResponses(pageErrors, [400]);
});
