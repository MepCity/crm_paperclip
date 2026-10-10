import type { FieldDataType, FieldDefinition, FieldValue } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { FieldInput, type FieldInputProps } from "./field-input";
import { FormRow } from "./form-row";

const options = [
  { displayValue: "Alpha", storedValue: "a" },
  { displayValue: "Beta", storedValue: "b" },
];
function field(dataType: FieldDataType): FieldDefinition {
  return {
    apiName: "Example",
    label: "Example",
    dataType,
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    picklist: options,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };
}
function Controlled({
  type,
  initial = null,
  ...props
}: Partial<FieldInputProps> & { type: FieldDataType; initial?: FieldValue }) {
  const [value, setValue] = useState(initial);
  return (
    <FieldInput
      {...props}
      field={props.field ?? field(type)}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}
afterEach(cleanup);

test.each(["text", "email", "phone", "website", "textarea"] as const)(
  "%s preserves text and maps empty to null",
  async (type) => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<Controlled type={type} initial="Example value" onChange={change} />);
    const input = screen.getByRole("textbox", { name: "Example" });
    expect((input as HTMLInputElement).value).toBe("Example value");
    await user.clear(input);
    expect(change).toHaveBeenLastCalledWith(null);
    await user.type(input, "new");
    expect(change).toHaveBeenLastCalledWith("new");
  },
);
test.each(["integer", "double", "currency"] as const)(
  "%s parses numbers and empty",
  async (type) => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Controlled
        type={type}
        initial={12}
        onChange={change}
        currencyPrefix="$"
        currencyInformation="Currency information"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Example" });
    expect((input as HTMLInputElement).value).toBe("12");
    await user.clear(input);
    await user.type(input, type === "integer" ? "23" : "23.5");
    await user.tab();
    expect(change).toHaveBeenLastCalledWith(type === "integer" ? 23 : 23.5);
    await user.clear(input);
    await user.tab();
    expect(change).toHaveBeenLastCalledWith(null);
    if (type === "currency") {
      expect(screen.getByText("$")).toBeTruthy();
      expect(screen.getByRole("img", { name: "Currency information" })).toBeTruthy();
    }
  },
);
test("checkbox maps both boolean states", async () => {
  const change = vi.fn();
  const user = userEvent.setup();
  render(<Controlled type="boolean" onChange={change} />);
  await user.click(screen.getByRole("checkbox"));
  expect(change).toHaveBeenLastCalledWith(true);
  await user.keyboard(" ");
  expect(change).toHaveBeenLastCalledWith(false);
});
test("standard list opens, chooses and dismisses with keyboard and maps None to null", async () => {
  const change = vi.fn();
  const user = userEvent.setup();
  render(<Controlled type="picklist" onChange={change} />);
  const trigger = screen.getByRole("button", { name: "Example" });
  trigger.focus();
  await user.keyboard("{Enter}");
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
    "-None-",
    "Alpha",
    "Beta",
  ]);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(change).toHaveBeenLastCalledWith("a");
  expect(screen.queryByRole("listbox")).toBeNull();
  await user.keyboard("{Enter}{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: "-None-" }));
  expect(change).toHaveBeenLastCalledWith(null);
});
test("searchable list focuses search, filters case insensitively and retains unlisted saved value", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="picklist" initial="Stored short value" searchable onChange={change} />);
  await user.click(screen.getByRole("button", { name: "Example" }));
  const input = screen.getByRole("textbox", { name: "Search" });
  expect(document.activeElement).toBe(input);
  expect(screen.getByRole("option", { name: "Stored short value" })).toBeTruthy();
  await user.type(input, "ALP");
  expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
    "-None-",
    "Alpha",
  ]);
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
  expect(change).toHaveBeenLastCalledWith("a");
});
test("empty searchable inventory shows only None", async () => {
  const user = userEvent.setup();
  render(<Controlled type="picklist" searchable options={[]} />);
  await user.click(screen.getByRole("button"));
  expect(screen.getAllByRole("option")).toHaveLength(1);
});
test("owner searches name/email, selects opaque id and invokes the adjacent picker", async () => {
  const change = vi.fn();
  const picker = vi.fn();
  const user = userEvent.setup();
  render(
    <Controlled
      type="ownerlookup"
      initial="a"
      onChange={change}
      onOpenPicker={picker}
      users={[
        { id: "a", name: "Alex Example", email: "alex@example.test" },
        { id: "b", name: "Robin Example", email: "robin@example.test" },
      ]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Example" }));
  const search = screen.getByRole("textbox", { name: "Search Users" });
  expect(document.activeElement).toBe(search);
  expect(screen.getByRole("option", { name: /Alex Example/ }).getAttribute("aria-selected")).toBe(
    "true",
  );
  await user.type(search, "ROBIN@EXAMPLE");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await user.click(screen.getByRole("option", { name: /Robin Example/ }));
  expect(change).toHaveBeenLastCalledWith("b");
  await user.click(screen.getByRole("button", { name: "Open owner picker" }));
  expect(picker).toHaveBeenCalledOnce();
});
test.each(["text", "textarea", "integer", "picklist", "ownerlookup", "boolean"] as const)(
  "%s disabled rejects interaction and errors are associated",
  async (type) => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<Controlled type={type} disabled errorMessage="Invalid example" onChange={change} />);
    const input = screen.getByLabelText("Example");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const ids = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids.some((id) => document.getElementById(id)?.textContent === "Invalid example")).toBe(
      true,
    );
    await user.click(input);
    await user.keyboard("changed");
    expect(change).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  },
);
test("profile placeholder is noninteractive and unsupported types render nothing", () => {
  render(<Controlled type="profileimage" />);
  expect(screen.getByRole("img", { name: "Example" })).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  cleanup();
  for (const type of ["lookup", "multi_module_lookup", "datetime", "bigint"] as const) {
    const result = render(<Controlled type={type} />);
    expect(result.container.innerHTML).toBe("");
    cleanup();
  }
});
test("read-only metadata prevents editing", () => {
  render(<Controlled type="text" field={{ ...field("text"), readOnly: true }} />);
  expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(true);
});
test("FormRow pairs with text, picklist and owner inputs through hideLabel", async () => {
  const user = userEvent.setup();
  render(
    <>
      <FormRow label="Company" controlId="company-field" column="left">
        <FieldInput
          id="company-field"
          hideLabel
          field={{ ...field("text"), label: "Company", apiName: "Company" }}
          value={null}
          onChange={() => {}}
        />
      </FormRow>
      <FormRow label="Status" controlId="status-field" column="left">
        <FieldInput
          id="status-field"
          hideLabel
          field={{ ...field("picklist"), label: "Status", apiName: "Status" }}
          value={null}
          onChange={() => {}}
        />
      </FormRow>
      <FormRow label="Owner" controlId="owner-field" column="left">
        <FieldInput
          id="owner-field"
          hideLabel
          field={{ ...field("ownerlookup"), label: "Owner", apiName: "Owner" }}
          value={null}
          onChange={() => {}}
          users={[{ id: "a", name: "Alex Example", email: "alex@example.test" }]}
        />
      </FormRow>
    </>,
  );
  const visibleLabels = (name: string) =>
    screen.getAllByText(name).filter((node) => !node.classList.contains("sr-only"));
  expect(visibleLabels("Company")).toHaveLength(1);
  expect(screen.getByLabelText("Company")).toBeTruthy();
  expect(visibleLabels("Status")).toHaveLength(1);
  expect(screen.getByLabelText("Status")).toBeTruthy();
  expect(visibleLabels("Owner")).toHaveLength(1);
  await user.click(screen.getByLabelText("Owner"));
  expect(screen.getByRole("listbox")).toBeTruthy();
});

test("checkbox inside a form row has one accessible label", () => {
  render(
    <FormRow label="Example" controlId="example-checkbox" column="left">
      <FieldInput
        id="example-checkbox"
        hideLabel
        field={field("boolean")}
        value={false}
        onChange={() => {}}
      />
    </FormRow>,
  );
  expect(screen.getByRole("checkbox", { name: "Example" })).toBeTruthy();
});

// record-detail.md › Email Opt Out checkbox: the row's control slot is the measured inset hook.
test("checkbox renders inside the form row control slot", () => {
  render(
    <FormRow label="Example" controlId="example-checkbox" column="left">
      <FieldInput
        id="example-checkbox"
        hideLabel
        field={field("boolean")}
        value={false}
        onChange={() => {}}
      />
    </FormRow>,
  );
  const slot = document.querySelector("[data-record-form-control-slot]");
  expect(slot?.contains(screen.getByRole("checkbox"))).toBe(true);
});
