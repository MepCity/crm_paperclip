import type { Page } from "@playwright/test";
import { moduleListDefaultPath } from "./crm-paths";
import { expect } from "./test";

const payloads: Record<string, Record<string, unknown>> = {
  Leads: { Last_Name: "Synthetic touched", Company: "Synthetic Co" },
  Contacts: { Last_Name: "Synthetic touched" },
  Accounts: { Account_Name: "Synthetic touched" },
  Deals: {
    Deal_Name: "Synthetic touched",
    Stage: "Qualification",
    Closing_Date: "2030-01-01",
  },
  Tasks: { Subject: "Synthetic touched" },
  Events: {
    Event_Title: "Synthetic touched",
    Start_DateTime: "2030-01-01T10:00:00.000Z",
    End_DateTime: "2030-01-01T11:00:00.000Z",
    Meeting_Venue__s: "In-office",
  },
  Calls: {
    Subject: "Synthetic touched",
    Call_Type: "Outbound",
    Outgoing_Call_Status: "Scheduled",
    Call_Start_Time: "2030-01-01T10:00:00.000Z",
  },
  Campaigns: { Campaign_Name: "Synthetic touched" },
};

/** Create one synthetic record, then tick Touched Records, Apply and Clear on the list. */
export async function exerciseTouchedFilter(page: Page, orgSlug: string, module: string) {
  const path = `${moduleListDefaultPath(orgSlug, module === "Events" ? "Meetings" : module)}${module === "Deals" ? "?presentation=table" : ""}`;
  await page.goto(path);
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const summary = list.getByRole("group", { name: "Records summary" });
  const readTotal = async () =>
    Number(/Total Records\s*(\d+)/.exec(await summary.innerText())?.[1] ?? Number.NaN);
  const expectTotal = (value: number) => expect.poll(readTotal).toBe(value);
  const before = await readTotal();
  const headers = { "X-CRM-ORG": orgSlug, Origin: new URL(page.url()).origin };
  const payload = { ...payloads[module] };
  if (module === "Deals") {
    const account = await page.request.post("/crm/v2.2/Accounts", {
      headers,
      data: { data: [{ Account_Name: "Synthetic parent" }] },
    });
    expect(account.status(), await account.text()).toBe(200);
    const accountId = (await account.json()).data[0].details.id;
    payload.Account_Name = { id: accountId };
  }
  const created = await page.request.post(`/crm/v2.2/${module}`, {
    headers,
    data: { data: [payload] },
  });
  expect(created.status(), await created.text()).toBe(200);
  await page.reload();
  await expectTotal(before + 1);

  const touched = list.getByRole("checkbox", { name: "Touched Records", exact: true });
  await touched.scrollIntoViewIfNeeded();
  await touched.check({ force: true });
  const request = page.waitForRequest(
    (req) =>
      req.url().includes(`/${module}/bulk`) && Boolean(req.postDataJSON()?.system_filters?.touched),
  );
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await request;
  await expectTotal(1);
  await expect(list.locator("tbody tr")).toHaveCount(1);
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expectTotal(before + 1);
}
