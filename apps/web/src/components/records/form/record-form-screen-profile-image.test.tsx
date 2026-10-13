import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { accountsScreenDefinition } from "@/modules/accounts/definition";
import { contactsScreenDefinition } from "@/modules/contacts/definition";
import { leadsScreenDefinition } from "@/modules/leads/definition";
import { render } from "@/test/render";
import type { ModuleScreenDefinition } from "@/modules/types";
import { RecordFormScreen } from "./record-form-screen";

afterEach(() => cleanup());

/**
 * AF-05: the placeholder draws the module's own image and nothing else — no disc behind a
 * module-supplied glyph, and the shared portrait keeps the ring the reference draws.
 */
function renderCreate(definition: ModuleScreenDefinition) {
  const ctx = {
    orgId: `form-profile-image-${definition.apiName}`,
    orgSlug: "form-profile-image",
    orgName: "Form Profile Image",
    userId: "profile-image-user",
    role: "admin" as const,
  };
  const fixture = createFixtureRecordService(ctx, {
    listMemberIds: async () => [ctx.userId],
  });
  const service = createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: ctx.userId, name: "Image User", email: "image@example.test" },
    ],
  });
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
          profileImageIcon: definition.form.profileImageIcon,
          paths: { detail: (id) => `detail:${id}`, create: "create", cancel: "list" },
          navigate: () => {},
        }}
      />
    </ApiProvider>,
  );
}

test("Accounts draws the building placeholder without a ring or disc", async () => {
  renderCreate(accountsScreenDefinition);
  await screen.findByRole("heading", { name: "Create Account" });
  const image = screen.getByRole("button", { name: "Account Image" });

  expect(image.getAttribute("data-later-module")).toBe("M6");
  expect(image.className).toContain("record-form-profile-image");
  const glyph = image.querySelector(".record-form-profile-image__glyph");
  expect(glyph?.nodeName.toLowerCase()).toBe("svg");
  expect(glyph?.getAttribute("aria-hidden")).toBe("true");
  expect(image.querySelector(".record-profile")).toBeNull();
  expect(image.querySelector(".record-profile-silhouette")).toBeNull();
});

test("Contacts keeps the ringed portrait placeholder inside the control", async () => {
  renderCreate(contactsScreenDefinition);
  await screen.findByRole("heading", { name: "Create Contact" });
  const image = screen.getByRole("button", { name: "Contact Image" });

  expect(image.getAttribute("data-later-module")).toBe("M6");
  const ring = image.querySelector(".record-profile");
  expect(ring).toBeTruthy();
  expect(ring?.querySelector(".record-profile-silhouette")).toBeTruthy();
  expect(image.querySelector(".record-form-profile-image__glyph")).toBeNull();
});

test("Leads keeps the shared image field untouched", async () => {
  renderCreate(leadsScreenDefinition);
  await screen.findByRole("heading", { name: "Create Lead" });
  const image = screen.getByRole("img", { name: "Lead Image" });

  expect(image.className).toContain("record-profile");
  expect(image.querySelector(".record-profile-silhouette")).toBeTruthy();
  expect(image.closest(".record-form-profile-image")).toBeNull();
});
