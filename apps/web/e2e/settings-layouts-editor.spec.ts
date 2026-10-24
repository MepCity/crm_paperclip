import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

test.skip(
  process.env.MEP_E2E_DEV_LOGIN !== "1" || process.env.MEP_EPHEMERAL_CUSTOMIZATION !== "1",
  "Needs the development server with ephemeral customization enabled",
);

test("admin customizes layout, reorders fields and sections, catches unreachable required field, and preserves draft on conflict", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  await page.goto(`/crm/${org.slug}/settings/modules/Leads/layouts`);
  await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();

  // 1. Open Layout Editor
  await page.getByRole("button", { name: "Customize Layout" }).click();
  await expect(page.getByRole("heading", { name: "Standard Layout" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Layout" })).toBeVisible();

  // 2. Section reordering and manipulation: Add a new section
  await page.getByRole("button", { name: "Add Section" }).click();
  await page.getByRole("textbox", { name: "New Section Name" }).fill("Custom Info");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByLabel("Section Name Custom Info")).toBeVisible();

  // 3. Move field within section and columns
  await page.getByRole("button", { name: "Move First Name down" }).click();
  await expect(page.getByRole("button", { name: "Move First Name up" })).toBeEnabled();

  // 4. Hide optional field
  await page.getByRole("button", { name: "Hide Email" }).click();
  await expect(page.getByRole("button", { name: "Add Email to layout" })).toBeVisible();

  // 5. Hide required field (Last Name) -> verify server rejects unreachable required field
  await page.getByRole("button", { name: "Hide Last Name" }).click();
  await expect(page.getByRole("button", { name: "Add Last Name to layout" })).toBeVisible();

  await page.getByRole("button", { name: "Save Layout" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Required field is unreachable without a server value.");

  // Verify draft is preserved (Last Name still in Available Fields, Custom Info still present)
  await expect(page.getByLabel("Section Name Custom Info")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Last Name to layout" })).toBeVisible();

  // Add Last Name back to layout
  await page.getByRole("button", { name: "Add Last Name to layout" }).click();

  // 6. Test conflict preservation
  const origin = new URL(page.url()).origin;
  const read = await page.request.get("/crm/v2.1/settings/layouts?module=Leads", {
    headers: { "X-CRM-ORG": org.slug },
  });
  const { revision } = await read.json();
  const bump = await page.request.patch("/crm/v2.2/settings/modules/Leads", {
    headers: { "X-CRM-ORG": org.slug, Origin: origin },
    data: {
      expectedRevision: revision,
      command: { type: "module.patch", properties: { pluralLabel: "Prospects" } },
    },
  });
  expect(bump.ok()).toBe(true);

  // Attempt save with stale revision
  await page.getByRole("button", { name: "Save Layout" }).click();
  await expect(page.getByRole("alert")).toContainText("The layout changed since this page loaded");

  // Draft is preserved
  await expect(page.getByLabel("Section Name Custom Info")).toBeVisible();

  ignoreFailedResponses(pageErrors, [400, 409]);
});
