import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { contactsScreenDefinition } from "@/modules/contacts/definition";
import { render } from "@/test/render";
import { RecordFormScreen } from "./record-form-screen";

afterEach(() => cleanup());

function renderContactsCreate() {
  const ctx = {
    orgId: "contacts-layout-form",
    orgSlug: "contacts-layout",
    orgName: "Contacts Layout",
    userId: "layout-user",
    role: "admin" as const,
  };
  const fixture = createFixtureRecordService(ctx, {
    listMemberIds: async () => [ctx.userId],
  });
  const service = createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: ctx.userId, name: "Layout User", email: "layout@example.test" },
    ],
  });
  const definition = contactsScreenDefinition;
  render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <RecordFormScreen
        currentUserId={ctx.userId}
        config={{
          module: definition.apiName,
          rules: definition.form.rules,
          sectionColumnOverrides: definition.form.fallbackColumns,
          inventoryChrome: definition.form.inventoryChrome,
          profileImageLaterModule: definition.form.profileImageLaterModule,
          paths: { detail: (id) => `detail:${id}`, create: "create", cancel: "list" },
          navigate: () => {},
        }}
      />
    </ApiProvider>,
  );
}

function fieldOrderInColumn(column: HTMLElement): string[] {
  return Array.from(column.querySelectorAll<HTMLElement>("[data-form-field]")).map(
    (node) => node.dataset.formField ?? "",
  );
}

test("Contact Information uses spec column placement from fallback columns", async () => {
  renderContactsCreate();
  await screen.findByRole("heading", { name: "Create Contact" });
  const title = screen.getByRole("heading", { name: "Contact Information" });
  const section = title.closest("[data-record-form-section]");
  expect(section).toBeTruthy();
  const grid = section?.querySelector("[data-record-form-grid]");
  expect(grid).toBeTruthy();
  const left = grid?.querySelector('[data-record-form-column="left"]');
  const right = grid?.querySelector('[data-record-form-column="right"]');
  expect(left && right).toBeTruthy();
  expect(fieldOrderInColumn(left as HTMLElement)[0]).toBe("Owner");
  expect(fieldOrderInColumn(left as HTMLElement)).toContain("First_Name");
  expect(fieldOrderInColumn(right as HTMLElement)[0]).toBe("Lead_Source");
  expect(fieldOrderInColumn(right as HTMLElement)).toContain("Last_Name");
});

test("address groups order children and omit readonly coordinates textarea", async () => {
  renderContactsCreate();
  await screen.findByRole("heading", { name: "Create Contact" });
  const groups = document.querySelectorAll("[data-record-form-field-group]");
  expect(groups.length).toBeGreaterThanOrEqual(2);
  const mailing = groups[0] as HTMLElement;
  const order = fieldOrderInColumn(mailing);
  expect(order).toEqual([
    "Mailing_Country",
    "Mailing_Flat_House_No_Building_Apartment_Name",
    "Mailing_Street",
    "Mailing_City",
    "Mailing_State",
    "Mailing_Zip",
    "Mailing_Latitude",
  ]);
  expect(mailing.querySelector("[data-form-field=Mailing_Coordinates]")).toBeNull();
  expect(within(mailing).getByRole("group", { name: "Coordinates" })).toBeTruthy();
});

test("contact image is a focusable later-module control", async () => {
  renderContactsCreate();
  await screen.findByRole("heading", { name: "Create Contact" });
  const image = screen.getByRole("button", { name: "Contact Image" });
  expect(image.getAttribute("data-later-module")).toBe("M6");
  expect(image.getAttribute("aria-disabled")).toBe("true");
});
