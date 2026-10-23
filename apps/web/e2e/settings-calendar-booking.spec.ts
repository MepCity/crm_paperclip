import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Calendar Booking settings page opens prerequisite dialog and Cancel closes it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to calendar-booking settings page
  await page.goto(`/crm/${org.slug}/settings/calendar-booking`);

  // 2. Check dialog elements: heading, message, buttons
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("heading", { name: "Business Hours Not Configured" })).toBeVisible();
  await expect(
    page.getByText("Calendar booking needs your organization's business hours."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Configure Business Hours" })).toBeVisible();

  const cancelButton = page.getByRole("button", { name: "Cancel" });
  await expect(cancelButton).toBeVisible();

  // 3. Click Cancel -> closes dialog and leaves empty content area
  await cancelButton.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Business Hours Not Configured" })).toHaveCount(0);
});
