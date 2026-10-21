import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("email folders and messages persist in URL and browser history", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Emails`);
  await expect(page.getByRole("heading", { name: "Select a message" })).toBeVisible();
  // Selection is local; it must not send a request, including route requests.
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: /Project overview/ }).click();
  await expect(page).toHaveURL(/folder=inbox&message=conversation-1$/);
  const reader = page.getByRole("region", { name: "Reading pane" });
  await expect(reader.getByRole("heading", { name: "Project overview" })).toBeVisible();
  await expect(reader.getByText("project-overview.pdf")).toBeVisible();
  const firstMessage = reader.getByRole("button").first();
  await expect(firstMessage).toHaveAttribute("aria-expanded", "false");
  await firstMessage.click();
  await expect(reader.getByText("Could you share an overview of the proposed work?")).toBeVisible();
  await page.getByRole("button", { name: "Sent 2" }).click();
  await expect(page).toHaveURL(/\?folder=sent$/);
  await page.getByRole("button", { name: /Planning summary/ }).click();
  await expect(reader.getByRole("heading", { name: "Planning summary" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Select a message" })).toBeVisible();
  await page.goBack();
  await expect(reader.getByRole("heading", { name: "Project overview" })).toBeVisible();
  expect(requests).toEqual([]);
  await page.reload();
  await expect(reader.getByRole("heading", { name: "Project overview" })).toBeVisible();
  await page.getByRole("button", { name: "Scheduled 0" }).click();
  await expect(page.getByRole("heading", { name: "No messages in Scheduled" })).toBeVisible();
});
