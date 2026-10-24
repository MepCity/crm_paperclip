import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Visits enabled fixture: list to detail with unavailable controls", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(`${r.method()} ${r.url()}`);
  });
  await page.goto(`/crm/${slug}/tab/Visits?state=enabled-empty`);
  await expect(page.getByText("No visits yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send to Webmaster" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await page.goto(`/crm/${slug}/tab/Visits?state=populated`);
  await expect(page.getByRole("button", { name: "Manage Columns" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await page.getByLabel("View").selectOption("top");
  await expect(page.getByText("Ranking criteria not available")).toBeVisible();
  await page.getByLabel("View").selectOption("all");
  await page.getByRole("link", { name: "192.0.2.1", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/tab/Visits/visit-1`);
  await expect(page.getByRole("heading", { name: "Actions Performed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Note" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(writes).toEqual([]);
  assertNoPageErrors(pageErrors);
});
