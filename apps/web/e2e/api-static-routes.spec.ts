import { operationPath, operations } from "../src/lib/api/wire/operations";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Next serves static metadata and user routes with the browser session", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  for (const [op, envelope] of [
    [operations.fields, "fields"],
    [operations.layouts, "layouts"],
    [operations.views, "custom_views"],
    [operations.users, "users"],
  ] as const) {
    const query = op === operations.users ? "" : "?module=Leads";
    const response = await page.request.get(`${operationPath(op)}${query}`, {
      headers: { "X-CRM-ORG": org.slug },
    });
    expect(response.status(), op.path).toBe(200);
    expect(response.headers()["cache-control"]).toBe("no-store");
    const body = await response.json();
    expect(body[envelope].length, envelope).toBeGreaterThan(0);
  }
});
