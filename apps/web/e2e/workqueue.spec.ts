import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Workqueue navigation, session welcome, queue switching and refresh remain GET-only", async ({
  page,
}) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET")
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Workqueue", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue`);
  await expect(nav.getByRole("link", { name: "Workqueue", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^My Deals \d+$/, exact: true }).click();
  await expect(page.getByRole("region", { name: "My Deals queue" })).toBeVisible();
  await page.getByRole("button", { name: "Refresh queue" }).click();
  await expect(page.getByRole("region", { name: "My Deals queue" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.getByRole("button", { name: /^Tasks \d+$/, exact: true }).click();
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue?page=2`);
  await expect(page.getByRole("region", { name: "Tasks queue" })).toBeVisible();
  await page.getByRole("link", { name: "Previous", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue?page=1`);
  await page.reload();
  await expect(page.getByRole("table", { name: "Queue records" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const task = page.getByRole("table", { name: "Queue records" }).getByRole("link").first();
  await expect(task).toBeVisible();
  expect(writes).toEqual([]);
  const href = await task.getAttribute("href");
  // Destination record pages have their own read POST contract; the queue itself is GET-only.
  await task.click();
  await expect(page).toHaveURL(href ?? "");
});
