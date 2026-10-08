import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const PASSWORD = "long-password-1";

async function inviteMember(page: Page, email: string): Promise<string> {
  await page.getByRole("button", { name: "Invite member" }).click();
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
  const membersUrl = `/crm/${organization.slug}/settings/members`;

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("link", { name: "Members" }).click();
  await expect(page).toHaveURL(membersUrl);
  await expect(page.getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("You")).toBeVisible();
  // pending-announcement workaround
  await page.reload();
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Invite member" }).click();
  await expect(page.getByRole("dialog", { name: "Invite member" })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");

  const beaEmail = `bea-${crypto.randomUUID()}@example.test`;
  const inviteUrl = await inviteMember(page, beaEmail);
  await page.reload();
  await expect(page.getByText(inviteUrl)).toHaveCount(0);
  await expect(page.getByText(beaEmail)).toBeVisible();

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
    await expect(bea).toHaveURL(inviteUrl);
    await bea.getByRole("button", { name: `Join ${organization.name}` }).click();
    await expect(bea).toHaveURL(`/crm/${organization.slug}`);
    await expect(bea.getByRole("button", { name: "Organization switcher" })).toContainText(
      organization.name,
    );

    await page.reload();
    const beaRow = page.getByRole("row").filter({ hasText: beaEmail });
    await expect(beaRow).toBeVisible();
    await expect(page.getByText("No pending invitations.")).toBeVisible();

    await bea.goto(membersUrl);
    await expect(bea.getByRole("row").filter({ hasText: ada.email })).toBeVisible();
    await expect(bea.getByText("You")).toBeVisible();
    await expect(bea.getByRole("button", { name: /Role for/ })).toHaveCount(0);
    await expect(bea.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    await expect(bea.getByRole("button", { name: "Invite member" })).toHaveCount(0);
    await expect(bea.getByRole("heading", { name: "Pending invitations" })).toHaveCount(0);
    await expectNoA11yViolations(bea);

    await page.getByRole("button", { name: "Role for Bea Member" }).click();
    await page.getByRole("option", { name: "Admin", exact: true }).click();
    await expect(page.getByRole("button", { name: "Role for Bea Member" })).toContainText("Admin");
    await bea.reload();
    await expect(bea.getByRole("button", { name: "Invite member" })).toBeVisible();
    await expect(bea.getByRole("button", { name: "Role for Ada Admin" })).toBeVisible();
    await expect(bea.getByRole("button", { name: "Remove Ada Admin" })).toBeVisible();

    await page.getByRole("button", { name: "Role for Ada Admin" }).click();
    await page.getByRole("option", { name: "Member", exact: true }).click();
    await expect(page.getByRole("button", { name: "Invite member" })).toHaveCount(0);

    await bea.reload();
    const warnings = bea.getByRole("main").getByRole("alert");
    await bea.getByRole("button", { name: "Role for Bea Member" }).click();
    await bea.getByRole("option", { name: "Member", exact: true }).click();
    await expect(warnings).toHaveCount(1);
    await expect(warnings).toContainText("An organization must have an admin.");
    await expect(bea.getByRole("button", { name: "Role for Bea Member" })).toContainText("Admin");

    await bea.getByRole("button", { name: "Remove Bea Member" }).click();
    await bea.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    await expect(warnings).toHaveCount(1);
    await expect(warnings).toContainText("An organization must have an admin.");
    await expect(bea.getByRole("row").filter({ hasText: beaEmail })).toBeVisible();

    await bea.getByRole("button", { name: "Remove Ada Admin" }).click();
    await bea.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    await expect(bea.getByRole("row").filter({ hasText: ada.email })).toHaveCount(0);
    const removed = await page.context().newPage();
    try {
      await removed.goto(`/crm/${organization.slug}`);
      await expect(removed.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
    } finally {
      await removed.close();
    }

    const revokedEmail = `revoked-${crypto.randomUUID()}@example.test`;
    const revokedUrl = await inviteMember(bea, revokedEmail);
    await bea.getByRole("button", { name: `Revoke ${revokedEmail}` }).click();
    await expect(bea.getByText(revokedEmail)).toHaveCount(0);
    await guest.goto(revokedUrl);
    await expect(guest.getByText("This invitation has been revoked.")).toBeVisible();

    const otherEmail = `other-${crypto.randomUUID()}@example.test`;
    const otherUrl = await inviteMember(bea, otherEmail);
    await page.goto(otherUrl);
    await expect(page.getByText(`This invitation was sent to ${otherEmail}.`)).toBeVisible();
    await expect(page.getByRole("button", { name: /Join / })).toHaveCount(0);
  } finally {
    await beaContext.close();
    await guestContext.close();
  }
});
