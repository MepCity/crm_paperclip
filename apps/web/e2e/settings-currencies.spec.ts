import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Currencies settings screen opens and displays home currency initial state", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });

  await signUpNewUser(page);
  const org = await createOrganization(page);

  await page.goto(`/crm/${org.slug}/settings/currencies`);

  await expect(page.getByRole("heading", { name: "Currencies" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Currencies" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("home-currency-panel")).toBeVisible();
  await expect(
    page.getByText(
      "Do you want to set Turkish Lira - TRY as your home currency? Once you confirm your home currency, you cannot change it later.",
    ),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Change Home Currency" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Yes, Confirm Home Currency" })).toBeDisabled();

  expect(failed).toEqual([]);
});
