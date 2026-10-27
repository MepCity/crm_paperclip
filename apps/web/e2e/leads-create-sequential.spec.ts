import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("two sequential lead creates survive independent list, search and detail requests", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const headers = { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin };
  const ids: string[] = [];
  for (const name of ["Sequential Alpha", "Sequential Beta"]) {
    const response = await page.request.post("/crm/v2.2/Leads", {
      headers,
      data: { data: [{ Last_Name: name, Company: "Example Company" }] },
    });
    expect(response.ok()).toBe(true);
    const id = (await response.json()).data[0].details.id;
    expect(typeof id).toBe("string");
    ids.push(id);
  }
  expect(new Set(ids).size).toBe(2);
  for (const id of ids) {
    const detail = await page.request.get(`/crm/v2.2/Leads/${id}`, { headers });
    expect(detail.ok()).toBe(true);
    expect((await detail.json()).data[0].id).toBe(id);
  }
  const list = await page.request.post("/crm/v2.2/Leads/bulk?cvid=all-leads&page=1&per_page=50", {
    headers,
    data: { search: "Sequential" },
  });
  expect(list.ok(), await list.text()).toBe(true);
  expect((await list.json()).data.map((row: { id: string }) => row.id).sort()).toEqual(ids.sort());
  const search = await page.request.post("/crm/v2.2/actions/search", {
    headers,
    data: { text: "Sequential", modules: ["Leads"] },
  });
  expect(search.ok()).toBe(true);
  const groups = await search.json();
  expect(groups[0].records.map((row: { id: string }) => row.id).sort()).toEqual(ids.sort());
});
