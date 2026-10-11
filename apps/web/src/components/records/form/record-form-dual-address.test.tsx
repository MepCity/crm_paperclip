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

function group(name: string) {
  return within(screen.getByRole("group", { name }));
}

async function fillMailingAddress(user: ReturnType<typeof userEvent.setup>) {
  const mailing = group("Mailing Address");
  await user.type(
    mailing.getByRole("textbox", { name: "Flat / House No./ Building / Apartment Name" }),
    "Unit 9",
  );
  await user.type(mailing.getByRole("textbox", { name: "Street Address" }), "1 King St");
  await user.type(mailing.getByRole("textbox", { name: "City" }), "Toronto");
  await user.click(mailing.getByRole("button", { name: "State / Province" }));
  await user.click(screen.getByRole("option", { name: "-None-" }));
  await user.type(mailing.getByRole("textbox", { name: "Zip / Postal Code" }), "M5H");
  await user.type(mailing.getByRole("textbox", { name: "Latitude" }), "43.65");
  await user.type(mailing.getByRole("textbox", { name: "Longitude" }), "-79.38");
  await user.click(mailing.getByRole("button", { name: "Country / Region" }));
  await user.click(screen.getByRole("option", { name: "Afghanistan" }));
}

function expectMailingValues(scope: ReturnType<typeof within>, filled: boolean) {
  const flat = scope.getByRole("textbox", {
    name: "Flat / House No./ Building / Apartment Name",
  }) as HTMLInputElement;
  const street = scope.getByRole("textbox", { name: "Street Address" }) as HTMLInputElement;
  const city = scope.getByRole("textbox", { name: "City" }) as HTMLInputElement;
  const zip = scope.getByRole("textbox", { name: "Zip / Postal Code" }) as HTMLInputElement;
  const lat = scope.getByRole("textbox", { name: "Latitude" }) as HTMLInputElement;
  const lng = scope.getByRole("textbox", { name: "Longitude" }) as HTMLInputElement;
  const country = scope.getByRole("button", { name: "Country / Region" });

  if (filled) {
    expect(flat.value).toBe("Unit 9");
    expect(street.value).toBe("1 King St");
    expect(city.value).toBe("Toronto");
    expect(zip.value).toBe("M5H");
    expect(lat.value).toBe("43.65");
    expect(lng.value).toBe("-79.38");
    expect(country.textContent).toContain("Afghanistan");
  } else {
    expect(flat.value).toBe("");
    expect(street.value).toBe("");
    expect(city.value).toBe("");
    expect(zip.value).toBe("");
    expect(lat.value).toBe("");
    expect(lng.value).toBe("");
    expect(country.textContent).toContain("-None-");
  }
}

async function clickGroupClearAll(
  scope: ReturnType<typeof within>,
  user: ReturnType<typeof userEvent.setup>,
) {
  const clearButtons = scope.getAllByRole("button", { name: "Clear All" });
  const clear = clearButtons[clearButtons.length - 1];
  if (!clear) throw new Error("Missing group Clear All");
  await user.click(clear);
}

test("derived contact zip api names include Mailing_Zip and Other_Zip", () => {
  expect(addressSubfieldApiNames("Mailing_Address")).toContain("Mailing_Zip");
  expect(addressSubfieldApiNames("Other_Address")).toContain("Other_Zip");
});

test("dual address copy and clear run through RecordFormScreen state", async () => {
  harness();
  await screen.findByRole("heading", { name: "Create Contact" });
  const user = userEvent.setup();

  const mailingGroup = group("Mailing Address");
  const otherGroup = group("Other Address");

  await fillMailingAddress(user);

  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Mailing Address → Other Address" }));

  expectMailingValues(otherGroup, true);
  expectMailingValues(mailingGroup, true);

  await user.type(otherGroup.getByRole("textbox", { name: "Street Address" }), " override");
  await user.type(otherGroup.getByRole("textbox", { name: "City" }), "X");
  await user.type(
    otherGroup.getByRole("textbox", { name: "Flat / House No./ Building / Apartment Name" }),
    "B",
  );

  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Other Address → Mailing Address" }));

  expect(
    (mailingGroup.getByRole("textbox", { name: "Street Address" }) as HTMLInputElement).value,
  ).toBe("1 King St override");
  expect((mailingGroup.getByRole("textbox", { name: "City" }) as HTMLInputElement).value).toBe(
    "TorontoX",
  );
  expect(
    (
      mailingGroup.getByRole("textbox", {
        name: "Flat / House No./ Building / Apartment Name",
      }) as HTMLInputElement
    ).value,
  ).toBe("Unit 9B");

  await clickGroupClearAll(mailingGroup, user);
  expectMailingValues(mailingGroup, false);
  expect(
    (otherGroup.getByRole("textbox", { name: "Street Address" }) as HTMLInputElement).value,
  ).toBe("1 King St override");
  expect(
    (
      otherGroup.getByRole("textbox", {
        name: "Flat / House No./ Building / Apartment Name",
      }) as HTMLInputElement
    ).value,
  ).toBe("Unit 9B");

  await clickGroupClearAll(otherGroup, user);
  expectMailingValues(otherGroup, false);
}, 60_000);
