import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { CoordinatesInput, PrefixInput, TextPrefixInput } from "./composite-inputs";
import { FormRow } from "./form-row";

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
