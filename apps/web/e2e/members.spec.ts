import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { AUTH_NAVIGATION_TIMEOUT_MS, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const PASSWORD = "long-password-1";

/** The selected user's detail panel, opened in edit mode. */
async function editUser(page: Page, name: string) {
  await page
    .getByRole("list", { name: "Users" })
    .getByRole("button", { name: new RegExp(name) })
    .click();
  await page
    .getByRole("article", { name: `User details: ${name}` })
    .getByRole("button", { name: "Edit user" })
    .click();
}

function userRow(page: Page, text: string) {
  return page.getByRole("list", { name: "Users" }).getByRole("listitem").filter({ hasText: text });
}

async function inviteMember(page: Page, email: string): Promise<string> {
  await page.getByRole("button", { name: "New User" }).click();
  const dialog = page.getByRole("dialog", { name: "Invite member" });
  await dialog.getByRole("textbox", { name: "Email" }).fill(email);
  await dialog.getByRole("button", { name: "Create invitation" }).click();
  const inviteUrl = (await dialog.getByText(/\/invite\//).innerText()).trim();
  expect(inviteUrl).not.toContain("?");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return inviteUrl;
}

test("two people join through an invitation and manage membership", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const ada = await signUpNewUser(page, { name: "Ada Admin" });
  const organization = await createOrganization(page, "Northwind");
  const membersUrl = `/crm/${organization.slug}/settings/users`;
  const activateUrl = `/crm/${organization.slug}/settings/activate-users`;

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("link", { name: "Users", exact: true }).click();
  await expect(page).toHaveURL(membersUrl);
  await expect(page.getByRole("link", { name: "Users", exact: true }).first()).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("link", { name: "Activate Users" })).toBeVisible();
  await expect(page.getByText("You")).toBeVisible();
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "New User" }).click();
  await expect(page.getByRole("dialog", { name: "Invite member" })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");

  const beaEmail = `bea-${crypto.randomUUID()}@example.test`;
  const inviteUrl = await inviteMember(page, beaEmail);
  await page.goto(activateUrl);
  await expect(page.getByText(inviteUrl)).toHaveCount(0);
  await expect(page.getByText(beaEmail)).toBeVisible();
  await expectNoA11yViolations(page);

  const beaContext = await browser.newContext();
  const bea = await beaContext.newPage();
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  try {
    await bea.goto(inviteUrl);
    await expect(bea.getByText(organization.name)).toBeVisible();
    await expect(bea.getByText(beaEmail)).toBeVisible();
    await bea.getByRole("link", { name: "Sign up" }).click();
    await bea.getByRole("textbox", { name: "Name" }).fill("Bea Member");
    await bea.getByRole("textbox", { name: "Email" }).fill(beaEmail);
    await bea.getByLabel("Password").fill(PASSWORD);
    await bea.getByRole("button", { name: "Sign up" }).click();
    await expect(bea).toHaveURL(inviteUrl, { timeout: AUTH_NAVIGATION_TIMEOUT_MS });
    await bea.getByRole("button", { name: `Join ${organization.name}` }).click();
    await expect(bea).toHaveURL(`/crm/${organization.slug}`);
    await expect(bea.getByRole("button", { name: /Organization switcher:/ })).toContainText(
      organization.name,
    );

    await page.reload();
    await expect(page.getByText("No pending invitations.")).toBeVisible();
    await page.goto(membersUrl);
    await expect(userRow(page, beaEmail)).toBeVisible();

    await bea.goto(membersUrl);
    await expect(userRow(bea, ada.email)).toBeVisible();
    await expect(bea.getByText("You")).toBeVisible();
    await expect(bea.getByRole("button", { name: "Edit user" })).toHaveCount(0);
    await expect(bea.getByRole("button", { name: /Role for/ })).toHaveCount(0);
    await expect(bea.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    await expect(bea.getByRole("button", { name: "New User" })).toHaveCount(0);
    await expect(bea.getByRole("link", { name: "Activate Users" })).toHaveCount(0);
    await expectNoA11yViolations(bea);

    await editUser(page, "Bea Member");
    await page.getByRole("button", { name: "Role for Bea Member" }).click();
    await page.getByRole("option", { name: "Admin", exact: true }).click();
    await expect(page.getByRole("button", { name: "Role for Bea Member" })).toContainText("Admin");
    await bea.reload();
    await expect(bea.getByRole("button", { name: "New User" })).toBeVisible();
    await editUser(bea, "Ada Admin");
    await expect(bea.getByRole("button", { name: "Role for Ada Admin" })).toBeVisible();
    await expect(bea.getByRole("button", { name: "Remove Ada Admin" })).toBeVisible();

    // The organization owner (Ada) keeps the Administrator profile and cannot be removed.
    await editUser(page, "Ada Admin");
    await page.getByRole("button", { name: "Role for Ada Admin" }).click();
    await page.getByRole("option", { name: "Member", exact: true }).click();
    const warnings = page.getByRole("main").getByRole("alert");
    await expect(warnings).toHaveCount(1);
    await expect(warnings).toContainText("The organization owner cannot be changed.");
    await expect(page.getByRole("button", { name: "Role for Ada Admin" })).toContainText("Admin");

    await bea.reload();
    await editUser(bea, "Ada Admin");
    await bea.getByRole("button", { name: "Remove Ada Admin" }).click();
    await bea.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    const beaWarnings = bea.getByRole("main").getByRole("alert");
    await expect(beaWarnings).toHaveCount(1);
    await expect(beaWarnings).toContainText("The organization owner cannot be changed.");
    await expect(userRow(bea, ada.email)).toBeVisible();

    const revokedEmail = `revoked-${crypto.randomUUID()}@example.test`;
    const revokedUrl = await inviteMember(bea, revokedEmail);
    await bea.goto(activateUrl);
    await bea.getByRole("button", { name: `Revoke ${revokedEmail}` }).click();
    await expect(bea.getByText(revokedEmail)).toHaveCount(0);
    await guest.goto(revokedUrl);
    await expect(guest.getByText("This invitation has been revoked.")).toBeVisible();

    const otherEmail = `other-${crypto.randomUUID()}@example.test`;
    await bea.goto(membersUrl);
    const otherUrl = await inviteMember(bea, otherEmail);
    await page.goto(otherUrl);
    await expect(page.getByText(`This invitation was sent to ${otherEmail}.`)).toBeVisible();
    await expect(page.getByRole("button", { name: /Join / })).toHaveCount(0);
  } finally {
    await beaContext.close();
    await guestContext.close();
  }
});

test("the invite dialog keeps focus after the link is created and closes on Escape", async ({
  page,
}) => {
  await signUpNewUser(page, { name: "Ada Admin" });
  const organization = await createOrganization(page, "Focus North");
  // A full page load drops the announcement React Aria leaves pending behind the
  // client-side navigation out of the organization shell (see the shell spec).
  await page.goto(`/crm/${organization.slug}/settings/users`);

  const trigger = page.getByRole("button", { name: "New User" });
  const dialog = page.getByRole("dialog", { name: "Invite member" });

  // Creating an invitation replaces the form with the link, so the pressed button is
  // removed from the document with the focus on it. The dialog has to take that focus
  // back, or Escape would no longer reach the modal and the flow could not be closed.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "Email" })
    .fill(`focus-${crypto.randomUUID()}@example.test`);
  await dialog.getByRole("button", { name: "Create invitation" }).click();
  await expect(dialog.getByText(/\/invite\//)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute("role")))
    .toBe("dialog");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent?.trim()))
    .toBe("New User");

  // Same flow again after a second dialog type was opened and dismissed.
  await page.getByRole("button", { name: "Edit user" }).click();
  await page
    .getByRole("button", { name: /^Remove / })
    .first()
    .click();
  const confirm = page.getByRole("alertdialog");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toBeHidden();

  await trigger.click();
  await dialog
    .getByRole("textbox", { name: "Email" })
    .fill(`focus2-${crypto.randomUUID()}@example.test`);
  await dialog.getByRole("button", { name: "Create invitation" }).click();
  await expect(dialog.getByText(/\/invite\//)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute("role")))
    .toBe("dialog");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent?.trim()))
    .toBe("New User");
});
