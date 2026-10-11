import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { TextField } from "@/components/ui/text-field";
import { render } from "@/test/render";
import {
  AddressFieldGroups,
  CoordinatesInput,
  CopyAddressMenu,
  PrefixInput,
  TextPrefixInput,
} from "./composite-inputs";
import { FormRow } from "./form-row";
import { FormSection } from "./form-section";

afterEach(cleanup);
test("prefix selector remains independent of text, including null and disabled", async () => {
  const user = userEvent.setup();
  const prefix = vi.fn();
  const text = vi.fn();
  const result = render(
    <PrefixInput
      label="First Name"
      value=""
      onChange={text}
      prefixLabel="Salutation"
      prefixValue={null}
      onPrefixChange={prefix}
      options={[{ displayValue: "Mx.", storedValue: "Mx." }]}
    />,
  );
  await user.type(screen.getByRole("textbox", { name: "First Name" }), "Example");
  expect(text).toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Salutation" }));
  await user.click(screen.getByRole("option", { name: "Mx." }));
  expect(prefix).toHaveBeenLastCalledWith("Mx.");
  await user.click(screen.getByRole("button", { name: "Salutation" }));
  await user.click(screen.getByRole("option", { name: "-None-" }));
  expect(prefix).toHaveBeenLastCalledWith(null);
  result.rerender(
    <PrefixInput
      label="First Name"
      isDisabled
      prefixLabel="Salutation"
      prefixValue={null}
      onPrefixChange={prefix}
      options={[]}
    />,
  );
  expect((screen.getByRole("button", { name: "Salutation" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});
test("text prefix is visual and does not become part of the value", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<TextPrefixInput label="Handle" prefix="@" onChange={change} />);
  expect(screen.getByText("@")).toBeTruthy();
  await user.type(screen.getByRole("textbox"), "demo");
  expect(change).toHaveBeenLastCalledWith("demo");
});
test("coordinates edit independently, clear both, and respect disabled", async () => {
  const change = vi.fn();
  const user = userEvent.setup();
  const result = render(
    <CoordinatesInput label="Coordinates" latitude={12.5} longitude={24.5} onChange={change} />,
  );
  const latitude = screen.getByRole("textbox", { name: "Latitude" });
  await user.clear(latitude);
  await user.type(latitude, "-2.5");
  await user.tab();
  expect(change).toHaveBeenLastCalledWith({ latitude: -2.5, longitude: 24.5 });
  const longitude = screen.getByRole("textbox", { name: "Longitude" });
  await user.clear(longitude);
  await user.tab();
  expect(change).toHaveBeenLastCalledWith({ latitude: 12.5, longitude: null });
  await user.click(screen.getByRole("button", { name: "Clear All" }));
  expect(change).toHaveBeenLastCalledWith({ latitude: null, longitude: null });
  result.rerender(
    <CoordinatesInput
      label="Coordinates"
      latitude={null}
      longitude={null}
      onChange={change}
      disabled
    />,
  );
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("textbox", { name: "Latitude" }) as HTMLInputElement).disabled).toBe(
    true,
  );
});

test("coordinates associate the form row label with the first input", async () => {
  const user = userEvent.setup();
  render(
    <FormRow label="Location coordinates" controlId="location-coordinates" column="left">
      <CoordinatesInput
        id="location-coordinates"
        label="Coordinates"
        latitude={null}
        longitude={null}
        onChange={() => {}}
      />
    </FormRow>,
  );
  const first = screen.getByRole("textbox", { name: /Latitude/ });
  expect(screen.getByLabelText("Latitude")).toBe(first);
  const rowLabel = screen.getByText("Location coordinates") as HTMLLabelElement;
  expect(rowLabel.control).toBe(first);
  await user.click(rowLabel);
  expect(document.activeElement).toBe(first);
  expect(first.id).toBe("location-coordinates");
  expect(screen.getByRole("textbox", { name: "Longitude" })).not.toBe(first);
});

function addressParent(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "textarea",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };
}

test("single address group renders one bordered fieldset without copy control", () => {
  const parent = addressParent("Address", "Address");
  render(
    <AddressFieldGroups
      groups={[{ parent, subfieldApiNames: ["Country", "Street"] }]}
      renderGroupFields={() => <TextField label="Country" hideLabel />}
      onClearGroup={() => {}}
    />,
  );
  expect(screen.getByRole("group", { name: "Address" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Copy Address" })).toBeNull();
  expect(screen.getByRole("button", { name: "Clear All" })).toBeTruthy();
});

test("dual address groups support copy in both directions and per-group clear", async () => {
  const user = userEvent.setup();
  const mailing = addressParent("Mailing_Address", "Mailing Address");
  const other = addressParent("Other_Address", "Other Address");
  const mailingFields = ["Mailing_City", "Mailing_Street"] as const;
  const otherFields = ["Other_City", "Other_Street"] as const;

  function Harness() {
    const [values, setValues] = useState<Record<string, string>>({
      Mailing_City: "Toronto",
      Mailing_Street: "1 King St",
      Other_City: "",
      Other_Street: "",
    });
    const copyGroups = [
      { id: mailing.apiName, label: mailing.label, subfieldApiNames: mailingFields },
      { id: other.apiName, label: other.label, subfieldApiNames: otherFields },
    ];
    return (
      <FormSection
        title="Address Information"
        headerEnd={
          <CopyAddressMenu
            groups={copyGroups}
            onCopy={(fromId, toId) => {
              const from = copyGroups.find((group) => group.id === fromId);
              const to = copyGroups.find((group) => group.id === toId);
              if (!from || !to) return;
              setValues((previous) => {
                const next = { ...previous };
                for (let index = 0; index < from.subfieldApiNames.length; index++) {
                  const source = from.subfieldApiNames[index];
                  const target = to.subfieldApiNames[index];
                  if (source && target) next[target] = previous[source] ?? "";
                }
                return next;
              });
            }}
          />
        }
      >
        <AddressFieldGroups
          groups={[
            { parent: mailing, subfieldApiNames: mailingFields },
            { parent: other, subfieldApiNames: otherFields },
          ]}
          renderGroupFields={(parent) =>
            (parent.apiName === mailing.apiName ? mailingFields : otherFields).map((apiName) => (
              <TextField
                key={apiName}
                label={apiName}
                hideLabel
                value={values[apiName] ?? ""}
                onChange={(next) => setValues((previous) => ({ ...previous, [apiName]: next }))}
              />
            ))
          }
          onClearGroup={(apiNames) => {
            setValues((previous) => {
              const next = { ...previous };
              for (const apiName of apiNames) next[apiName] = "";
              return next;
            });
          }}
        />
      </FormSection>
    );
  }

  render(<Harness />);
  expect(screen.getByRole("button", { name: "Copy Address" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Mailing Address → Other Address" }));
  expect((screen.getByRole("textbox", { name: "Other_City" }) as HTMLInputElement).value).toBe(
    "Toronto",
  );
  await user.click(screen.getByRole("button", { name: "Copy Address" }));
  await user.click(screen.getByRole("menuitem", { name: "Other Address → Mailing Address" }));
  expect((screen.getByRole("textbox", { name: "Mailing_Street" }) as HTMLInputElement).value).toBe(
    "1 King St",
  );
  const mailingGroup = screen.getByRole("group", { name: "Mailing Address" });
  const mailingClear = within(mailingGroup).getByRole("button", { name: "Clear All" });
  await user.click(mailingClear);
  expect((screen.getByRole("textbox", { name: "Mailing_City" }) as HTMLInputElement).value).toBe(
    "",
  );
  expect((screen.getByRole("textbox", { name: "Other_City" }) as HTMLInputElement).value).toBe(
    "Toronto",
  );
});

test("copy address menu renders only for exactly two groups", () => {
  const group = { id: "a", label: "A", subfieldApiNames: ["A_Street"] as const };
  const { rerender } = render(<CopyAddressMenu groups={[group]} onCopy={() => {}} />);
  expect(screen.queryByRole("button", { name: "Copy Address" })).toBeNull();
  rerender(
    <CopyAddressMenu
      groups={[group, { id: "b", label: "B", subfieldApiNames: ["B_Street"] }]}
      onCopy={() => {}}
    />,
  );
  expect(screen.getByRole("button", { name: "Copy Address" })).toBeTruthy();
  rerender(
    <CopyAddressMenu
      groups={[
        group,
        { id: "b", label: "B", subfieldApiNames: ["B_Street"] },
        { id: "c", label: "C", subfieldApiNames: ["C_Street"] },
      ]}
      onCopy={() => {}}
    />,
  );
  expect(screen.queryByRole("button", { name: "Copy Address" })).toBeNull();
});
