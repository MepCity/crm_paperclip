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

const mailingAddressValues = {
  country: "Afghanistan",
  flat: "Unit 9",
  street: "1 King St",
  city: "Toronto",
  state: "Ontario",
  zip: "M5H",
  latitude: "43.65",
  longitude: "-79.38",
} as const;

const otherAddressValues = {
  country: "Albania",
  flat: "Suite 2",
  street: "9 Queen St",
  city: "Ottawa",
  state: "Alberta",
  zip: "K1A",
  latitude: "45.42",
  longitude: "-75.69",
} as const;

async function selectPicklistOption(
  scope: ReturnType<typeof within>,
  buttonName: string,
  optionName: string,
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(scope.getByRole("button", { name: buttonName }));
  await user.click(screen.getByRole("option", { name: optionName }));
}

async function fillAddressGroup(
  scope: ReturnType<typeof within>,
  values: typeof mailingAddressValues | typeof otherAddressValues,
  user: ReturnType<typeof userEvent.setup>,
) {
  const flat = scope.getByRole("textbox", {
    name: "Flat / House No./ Building / Apartment Name",
  });
  const street = scope.getByRole("textbox", { name: "Street Address" });
  const city = scope.getByRole("textbox", { name: "City" });
  const zip = scope.getByRole("textbox", { name: "Zip / Postal Code" });
  const lat = scope.getByRole("textbox", { name: "Latitude" });
  const lng = scope.getByRole("textbox", { name: "Longitude" });

  await selectPicklistOption(scope, "Country / Region", values.country, user);
  await user.clear(flat);
  await user.type(flat, values.flat);
  await user.clear(street);
  await user.type(street, values.street);
  await user.clear(city);
  await user.type(city, values.city);
  await selectPicklistOption(scope, "State / Province", values.state, user);
  await user.clear(zip);
  await user.type(zip, values.zip);
  await user.clear(lat);
  await user.type(lat, values.latitude);
  await user.clear(lng);
  await user.type(lng, values.longitude);
}

function expectAddressGroupValues(
  scope: ReturnType<typeof within>,
  values: typeof mailingAddressValues | typeof otherAddressValues | null,
) {
  const flat = scope.getByRole("textbox", {
    name: "Flat / House No./ Building / Apartment Name",
  }) as HTMLInputElement;
  const street = scope.getByRole("textbox", { name: "Street Address" }) as HTMLInputElement;
  const city = scope.getByRole("textbox", { name: "City" }) as HTMLInputElement;
  const zip = scope.getByRole("textbox", { name: "Zip / Postal Code" }) as HTMLInputElement;
  const lat = scope.getByRole("textbox", { name: "Latitude" }) as HTMLInputElement;
  const lng = scope.getByRole("textbox", { name: "Longitude" }) as HTMLInputElement;
  const country = scope.getByRole("button", { name: "Country / Region" });
  const state = scope.getByRole("button", { name: "State / Province" });

  if (values) {
    expect(flat.value).toBe(values.flat);
    expect(street.value).toBe(values.street);
    expect(city.value).toBe(values.city);
    expect(zip.value).toBe(values.zip);
    expect(lat.value).toBe(values.latitude);
    expect(lng.value).toBe(values.longitude);
    expect(country.textContent).toContain(values.country);
    expect(state.textContent).toContain(values.state);
  } else {
    expect(flat.value).toBe("");
    expect(street.value).toBe("");
    expect(city.value).toBe("");
    expect(zip.value).toBe("");
    expect(lat.value).toBe("");
    expect(lng.value).toBe("");
    expect(country.textContent).toContain("-None-");
    expect(state.textContent).toContain("-None-");
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

  await fillAddressGroup(mailingGroup, mailingAddressValues, user);

  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Mailing Address → Other Address" }));

  expectAddressGroupValues(otherGroup, mailingAddressValues);
  expectAddressGroupValues(mailingGroup, mailingAddressValues);

  await fillAddressGroup(otherGroup, otherAddressValues, user);

  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Other Address → Mailing Address" }));

  expectAddressGroupValues(mailingGroup, otherAddressValues);
  expectAddressGroupValues(otherGroup, otherAddressValues);

  await clickGroupClearAll(mailingGroup, user);
  expectAddressGroupValues(mailingGroup, null);
  expectAddressGroupValues(otherGroup, otherAddressValues);

  await fillAddressGroup(mailingGroup, mailingAddressValues, user);
  expectAddressGroupValues(mailingGroup, mailingAddressValues);
  expectAddressGroupValues(otherGroup, otherAddressValues);

  await clickGroupClearAll(otherGroup, user);
  expectAddressGroupValues(otherGroup, null);
  expectAddressGroupValues(mailingGroup, mailingAddressValues);
}, 60_000);
