import type { Page } from "@playwright/test";
import { moduleListDefaultPath } from "./crm-paths";
import { expect } from "./test";

/** Exercise real system-filter requests against synthetic local application records. */
export async function exerciseSystemFilters(
  page: Page,
  orgSlug: string,
  module: "Solutions" | "Cases",
  seededTotal: number,
) {
  await page.goto(moduleListDefaultPath(orgSlug, module));
  const headers = { "X-CRM-ORG": orgSlug, Origin: new URL(page.url()).origin };
  const title = "Synthetic system filter record";
  const created = await page.request.post(`/crm/v2.2/${module}`, {
    headers,
    data: {
      data: [
        module === "Solutions"
          ? { Solution_Title: title, Question: "Synthetic question", Answer: "Synthetic answer" }
          : { Subject: title, Status: "New", Case_Origin: "Web" },
      ],
    },
  });
  expect(created.status()).toBe(200);
  const id = (await created.json()).data[0].details.id;
  const note = await page.request.post("/crm/v2.2/Notes", {
    headers,
    data: {
      data: [
        {
          Parent_Id: { module, id },
          Note_Title: "Synthetic filter note",
          Note_Content: "Synthetic content",
        },
      ],
    },
  });
  expect(note.status()).toBe(200);
  await page.reload();
  const list = page.locator(".module-list-page");
  const summary = list.getByRole("group", { name: "Records summary" });
  const total = seededTotal + 1;
  const expectTotal = async (value: number) => {
    await expect(summary.locator('[data-part="total-value"]')).toHaveText(String(value));
  };
  await expectTotal(total);
  for (const [label, expected] of [
    ["Locked", 1],
    ["Record Action", 1],
    ["Related Records Action", 1],
    ["Touched Records", 1],
    ["Untouched Records", seededTotal],
  ] as const) {
    const row = list
      .getByRole("group", { name: "System Defined Filters", exact: true })
      .getByRole("listitem")
      .filter({ has: page.getByRole("checkbox", { name: label, exact: true }) });
    await row.scrollIntoViewIfNeeded();
    await row.getByText(label, { exact: true }).click();
    if (label === "Related Records Action") {
      await expect(list.getByRole("button", { name: "Apply Filter" })).toBeDisabled();
      await row.getByRole("button", { name: /Related Records Action module/ }).click();
      const options = page.getByRole("listbox").getByRole("option");
      await expect(options).toHaveText(
        module === "Solutions"
          ? ["Notes", "Attachments"]
          : ["Notes", "Attachments", "Tasks", "Meetings", "Calls"],
      );
      await page.getByRole("option", { name: "Notes", exact: true }).click();
    }
    const wireKey = {
      Locked: "locked",
      "Record Action": "record_action",
      "Related Records Action": "related_records_action",
      "Touched Records": "touched",
      "Untouched Records": "untouched",
    }[label];
    const bulkRequest = page.waitForRequest(
      (request) =>
        request.url().includes(`/${module}/bulk`) &&
        Boolean(request.postDataJSON()?.system_filters?.[wireKey]),
    );
    const countRequest = page.waitForRequest(
      (request) =>
        request.url().includes(`/${module}/actions/count`) &&
        Boolean(request.postDataJSON()?.system_filters?.[wireKey]),
    );
    await list.getByRole("button", { name: "Apply Filter" }).click();
    const [bulk, count] = await Promise.all([bulkRequest, countRequest]);
    expect(count.postDataJSON().system_filters).toEqual(bulk.postDataJSON().system_filters);
    await expectTotal(expected);
    if (label === "Locked") {
      await expect(list.locator("tbody tr")).toHaveCount(1);
      await expect(list.locator("tbody")).toContainText(
        module === "Solutions" ? "Solution 2" : "Case 2",
      );
    } else if (label === "Untouched Records") {
      await expect(list.locator("tbody")).not.toContainText(title);
    } else {
      await expect(list.locator("tbody tr")).toHaveCount(1);
      await expect(list.locator("tbody")).toContainText(title);
    }
    // The applied draft and its frozen period survive hiding/reopening the panel.
    await list.getByRole("button", { name: "Filter", exact: true }).click();
    await list.getByRole("button", { name: "Filter", exact: true }).click();
    await expect(
      list
        .getByRole("group", { name: "System Defined Filters", exact: true })
        .getByRole("checkbox", { name: label, exact: true }),
    ).toBeChecked();
    await expectTotal(expected);
    await list.getByRole("button", { name: "Clear", exact: true }).click();
    await expectTotal(total);
  }
}
