import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { addressSubfieldApiNames } from "@/lib/records/composite-address";
import { render } from "@/test/render";
import { dualAddressFormRules, dualAddressModuleMetadata } from "./dual-address-form-fixture";
import { RecordFormScreen } from "./record-form-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function harness() {
  const ctx = {
    orgId: "dual-address-form-test",
    orgSlug: "dual-address-form-test",
    orgName: "Dual Address Test",
    userId: "form-author",
    role: "admin" as const,
  };
  const fixture = createFixtureRecordService(ctx, {
    listMemberIds: async () => [ctx.userId],
  });
  const service = createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: ctx.userId, name: "Form Author", email: "author@example.test" },
    ],
  });
  const originalGetModule = service.getModule.bind(service);
  service.getModule = async (moduleName) => {
    if (moduleName === dualAddressModuleMetadata.apiName) return dualAddressModuleMetadata;
    return originalGetModule(moduleName);
  };
  render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <RecordFormScreen
        config={{
          module: dualAddressModuleMetadata.apiName,
          rules: dualAddressFormRules,
          paths: { detail: () => "detail", create: "create", cancel: "cancel" },
          navigate: vi.fn(),
        }}
        currentUserId={ctx.userId}
      />
    </ApiProvider>,
  );
}

test("derived contact zip api names include Mailing_Zip and Other_Zip", () => {
  expect(addressSubfieldApiNames("Mailing_Address")).toContain("Mailing_Zip");
  expect(addressSubfieldApiNames("Other_Address")).toContain("Other_Zip");
});

test("dual address copy and clear run through RecordFormScreen state", async () => {
  harness();
  await screen.findByRole("heading", { name: "Create Contact" });
  const user = userEvent.setup();

  const mailingGroup = screen.getByRole("group", { name: "Mailing Address" });
  const otherGroup = screen.getByRole("group", { name: "Other Address" });

  await user.type(
    within(mailingGroup).getByRole("textbox", { name: "Street Address" }),
    "1 King St",
  );
  await user.type(within(mailingGroup).getByRole("textbox", { name: "City" }), "Toronto");
  await user.type(within(mailingGroup).getByRole("textbox", { name: "Zip / Postal Code" }), "M5H");
  await user.click(within(mailingGroup).getByRole("button", { name: "Country / Region" }));
  await user.click(screen.getByRole("option", { name: "Afghanistan" }));

  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Mailing Address → Other Address" }));

  expect(
    (within(otherGroup).getByRole("textbox", { name: "Street Address" }) as HTMLInputElement).value,
  ).toBe("1 King St");
  expect(
    (within(otherGroup).getByRole("textbox", { name: "City" }) as HTMLInputElement).value,
  ).toBe("Toronto");
  expect(
    (within(otherGroup).getByRole("textbox", { name: "Zip / Postal Code" }) as HTMLInputElement)
      .value,
  ).toBe("M5H");
  expect(
    within(otherGroup).getByRole("button", { name: "Country / Region" }).textContent,
  ).toContain("Afghanistan");

  await user.type(within(otherGroup).getByRole("textbox", { name: "Street Address" }), " override");
  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Other Address → Mailing Address" }));
  expect(
    (within(mailingGroup).getByRole("textbox", { name: "Street Address" }) as HTMLInputElement)
      .value,
  ).toBe("1 King St override");

  const clearButtons = within(mailingGroup).getAllByRole("button", { name: "Clear All" });
  const mailingClear = clearButtons[clearButtons.length - 1];
  if (!mailingClear) throw new Error("Missing mailing Clear All");
  await user.click(mailingClear);
  expect(
    (within(mailingGroup).getByRole("textbox", { name: "Street Address" }) as HTMLInputElement)
      .value,
  ).toBe("");
  expect(
    (within(otherGroup).getByRole("textbox", { name: "Street Address" }) as HTMLInputElement).value,
  ).toBe("1 King St override");
}, 30_000);
