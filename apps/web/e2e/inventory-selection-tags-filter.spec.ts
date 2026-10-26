import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const modules = [
  { name: "Solutions", numberField: "Solution_Number", numberLabel: "Solution Number" },
  { name: "Cases", numberField: "Case_Number", numberLabel: "Case Number" },
] as const;

for (const module of modules) {
  test(`${module.name} selection Tags and ${module.numberLabel} filter work end to end`, async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, module.name));
    const headers = { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin };
    const title = `Synthetic ${module.name} selection record`;
    const created = await page.request.post(`/crm/v2.2/${module.name}`, {
      headers,
      data: {
        data: [
          module.name === "Solutions"
            ? { Solution_Title: title, Question: "Synthetic question", Answer: "Synthetic answer" }
            : { Subject: title, Status: "New", Case_Origin: "Web" },
        ],
      },
    });
    expect(created.status()).toBe(200);
    const id = (await created.json()).data[0].details.id;
    const read = await page.request.get(`/crm/v2.2/${module.name}/${id}`, { headers });
    expect(read.status()).toBe(200);
    const number = String((await read.json()).data[0][module.numberField]);
    expect(number).not.toBe("undefined");

    await page.reload();
    const list = page.locator(".module-list-page");
    await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

    // Filter panel: autonumber matches as text and narrows the list.
    const numberRow = list
      .getByRole("listitem")
      .filter({ has: page.getByRole("checkbox", { name: module.numberLabel, exact: true }) });
    await numberRow.scrollIntoViewIfNeeded();
    await numberRow.getByText(module.numberLabel, { exact: true }).click();
    await list.getByRole("textbox", { name: `${module.numberLabel} value` }).fill(number);
    await list.getByRole("button", { name: "Apply Filter" }).click();
    await expect(list.locator("tbody tr")).toHaveCount(1);
    await expect(list.locator("tbody")).toContainText(title);
    await list.getByRole("button", { name: "Clear", exact: true }).click();
    await numberRow.scrollIntoViewIfNeeded();
    await numberRow.getByText(module.numberLabel, { exact: true }).click();
    await list
      .getByRole("textbox", { name: `${module.numberLabel} value` })
      .fill("no-such-number-0");
    await list.getByRole("button", { name: "Apply Filter" }).click();
    await expect(list.getByText(`No ${module.name} found.`)).toBeVisible();
    await list.getByRole("button", { name: "Clear", exact: true }).click();

    // Selection bar Tags: select the seeded record, add a tag, the record carries it.
    const row = list.locator("tbody tr").filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.getByRole("checkbox").check({ force: true });
    await list.getByRole("button", { name: "Tags", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add Tags" });
    await dialog.getByRole("combobox").fill("Selection tag");
    await dialog.getByRole("combobox").press("Enter");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(async () => {
        const res = await page.request.get(`/crm/v2.2/${module.name}/${id}`, { headers });
        return JSON.stringify((await res.json()).data[0].Tag ?? []);
      })
      .toContain("Selection tag");
  });
}
