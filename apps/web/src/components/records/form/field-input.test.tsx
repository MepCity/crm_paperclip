import { DOTTED_DAY_FIRST_FORMAT, formatOptionsFromOrganization } from "@crm/core/format";
import type { FieldDataType, FieldDefinition, FieldValue, RecordService } from "@crm/core/records";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { RecordChoice } from "@/components/ui/record-choice";
import { FormatProvider } from "@/lib/format-context";
import { dealsFormRules } from "@/modules/deals/deals-form-rules";
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
test("integer keeps a typed decimal so Save can report it", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="integer" initial={null} onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" });
  await user.type(input, "12.5");
  await user.tab();
  expect((input as HTMLInputElement).value).toBe("12.5");
  expect(change).toHaveBeenLastCalledWith(12.5);
});
test("number limits stop the entry at the business bounds", async () => {
  const user = userEvent.setup();
  render(<Controlled type="integer" initial={99} numberLimits={{ min: 0, max: 100 }} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  input.focus();
  await user.keyboard("{ArrowUp}");
  expect(input.value).toBe("100");
  await user.keyboard("{ArrowUp}");
  expect(input.value).toBe("100");
  await user.clear(input);
  await user.type(input, "1");
  input.focus();
  await user.keyboard("{ArrowDown}");
  expect(input.value).toBe("0");
  await user.keyboard("{ArrowDown}");
  expect(input.value).toBe("0");
});
test("an entry without limits keeps stepping past the Deals bounds", async () => {
  const user = userEvent.setup();
  render(<Controlled type="integer" initial={99} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  input.focus();
  await user.keyboard("{ArrowUp}{ArrowUp}");
  expect(input.value).toBe("101");
});
test("date entry keeps the DD.MM.YYYY mask and hands YYYY-MM-DD to the form model", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="date" initial="2026-02-15" onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  expect(input.value).toBe("15.02.2026");
  expect(input.getAttribute("placeholder")).toBe("DD.MM.YYYY");
  // contacts-form.md › Date of Birth: no calendar or information icon beside the input.
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
  await user.clear(input);
  expect(change).toHaveBeenLastCalledWith(null);
  await user.type(input, "0");
  expect(input.value).toBe("0");
  expect(change).toHaveBeenLastCalledWith("0");
  await user.type(input, "4.07.1998");
  expect(input.value).toBe("04.07.1998");
  expect(change).toHaveBeenLastCalledWith("1998-07-04");
});
test("date keeps an impossible day in its typed shape so Save can report it", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="date" initial={null} onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  await user.type(input, "30.02.2026");
  expect(input.value).toBe("30.02.2026");
  expect(change).toHaveBeenLastCalledWith("2026-02-30");
});
test("date keeps a partial day when deleting from a filled value", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="date" initial="2026-02-15" onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  expect(input.value).toBe("15.02.2026");
  input.setSelectionRange(input.value.length, input.value.length);
  await user.type(input, "{Backspace}");
  expect(input.value).toBe("15.02.202");
  expect(change).toHaveBeenLastCalledWith("15.02.202");
  await user.type(input, "6");
  expect(input.value).toBe("15.02.2026");
  expect(change).toHaveBeenLastCalledWith("2026-02-15");
});
test("date keeps an impossible day while it is being corrected", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="date" initial="2026-02-30" onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  expect(input.value).toBe("30.02.2026");
  input.setSelectionRange(input.value.length, input.value.length);
  await user.type(input, "{Backspace}");
  expect(input.value).toBe("30.02.202");
  expect(change).toHaveBeenLastCalledWith("30.02.202");
  await user.type(input, "6");
  expect(input.value).toBe("30.02.2026");
  expect(change).toHaveBeenLastCalledWith("2026-02-30");
});
test("a half-typed date stays a model value while a cleared one is empty", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="date" initial="2026-02-15" onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  input.setSelectionRange(input.value.length, input.value.length);
  await user.type(input, "{Backspace}{Backspace}");
  expect(input.value).toBe("15.02.20");
  expect(change).toHaveBeenLastCalledWith("15.02.20");
  await user.clear(input);
  expect(change).toHaveBeenLastCalledWith(null);
});
test("date shows a half-typed entry that is held in the model", () => {
  const noop = () => {};
  const { rerender } = render(
    <FieldInput field={field("date")} value="15.02.202" onChange={noop} />,
  );
  expect((screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement).value).toBe(
    "15.02.202",
  );
  rerender(<FieldInput field={field("date")} value={null} onChange={noop} />);
  expect((screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement).value).toBe("");
});
test("date follows a model written from outside the input", () => {
  const noop = () => {};
  const { rerender } = render(
    <FieldInput field={field("date")} value="2026-02-15" onChange={noop} />,
  );
  expect((screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement).value).toBe(
    "15.02.2026",
  );
  rerender(<FieldInput field={field("date")} value={null} onChange={noop} />);
  expect((screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement).value).toBe("");
  rerender(<FieldInput field={field("date")} value="1998-07-04" onChange={noop} />);
  expect((screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement).value).toBe(
    "04.07.1998",
  );
});
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
test.each([
  "text",
  "textarea",
  "date",
  "integer",
  "bigint",
  "picklist",
  "ownerlookup",
  "boolean",
] as const)("%s disabled rejects interaction and errors are associated", async (type) => {
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
});
test("profile placeholder is noninteractive and unsupported types render nothing", () => {
  render(<Controlled type="profileimage" />);
  expect(screen.getByRole("img", { name: "Example" })).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  cleanup();
  for (const type of ["multi_module_lookup"] as const) {
    const result = render(<Controlled type={type} />);
    expect(result.container.innerHTML).toBe("");
    cleanup();
  }
});

test("bigint keeps a long integer as digit text instead of a number", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="bigint" initial={null} onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  await user.type(input, "9007199254740993");
  expect(change).toHaveBeenLastCalledWith("9007199254740993");
  expect(input.getAttribute("inputmode")).toBe("numeric");
  await user.clear(input);
  expect(change).toHaveBeenLastCalledWith(null);
});

test("bigint shows the digit text stored by the service", () => {
  render(<FieldInput field={field("bigint")} value="123456789012345678" onChange={() => {}} />);
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  expect(input.value).toBe("123456789012345678");
});

test("bigint caps the entry at the field's own length limit", () => {
  render(
    <FieldInput
      field={{ ...field("bigint"), maxLength: 18 }}
      value="123456789012345678"
      onChange={() => {}}
    />,
  );
  const input = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  expect(input.maxLength).toBe(18);
});

test("bigint is drawn in the same frame as the numeric entries", () => {
  const { container: bigintContainer } = render(
    <FieldInput field={field("bigint")} value="42" onChange={() => {}} />,
  );
  const bigintInput = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  const bigintFrame = bigintContainer.querySelector(".record-input-frame")?.className;
  const bigintAria = bigintInput.getAttribute("aria-invalid");
  cleanup();
  const { container: numberContainer } = render(
    <FieldInput field={field("integer")} value={42} onChange={() => {}} />,
  );
  const numberInput = screen.getByRole("textbox", { name: "Example" }) as HTMLInputElement;
  expect(numberContainer.querySelector(".record-input-frame")?.className).toBe(bigintFrame);
  expect(numberInput.className).toBe(bigintInput.className);
  expect(numberInput.getAttribute("aria-invalid")).toBe(bigintAria);
});

test("lookup input with registered target displays value and opens selector dialog", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const mockService = {
    getModule: vi.fn().mockResolvedValue({
      apiName: "Leads",
      singularLabel: "Lead",
      pluralLabel: "Leads",
      businessCardFields: [],
      fields: [
        {
          apiName: "Full_Name",
          label: "Lead Name",
          dataType: "text",
          required: true,
          readOnly: false,
          unique: false,
          massUpdate: false,
          views: { view: true, create: true, edit: true, quickCreate: false },
        },
      ],
      layout: [],
    }),
    listViews: vi
      .fn()
      .mockResolvedValue([
        { id: "all", name: "All Leads", isDefault: true, columns: ["Full_Name"] },
      ]),
    list: vi.fn().mockResolvedValue({
      records: [
        { id: "lead-1", fields: { Full_Name: "First Lead" } },
        { id: "lead-2", fields: { Full_Name: "Second Lead" } },
      ],
      moreRecords: false,
    }),
    count: vi.fn().mockResolvedValue(2),
  };

  const lookupField: FieldDefinition = {
    apiName: "Parent_Lead",
    label: "Parent Lead",
    dataType: "lookup",
    lookup: { module: "Leads" },
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };

  render(
    <Controlled
      type="lookup"
      field={lookupField}
      initial={{ module: "Leads", id: "lead-1", name: "First Lead" }}
      onChange={change}
      recordService={mockService as unknown as RecordService}
    />,
  );

  const input = screen.getByRole("textbox", { name: "Parent Lead" }) as HTMLInputElement;
  expect(input.value).toBe("First Lead");

  // Non-empty typing does not mutate reference name (prevents desynchronizing id and name)
  await user.type(input, " typing");
  expect(change).not.toHaveBeenCalled();

  // Clearing the input sets value to null
  await user.clear(input);
  expect(change).toHaveBeenCalledWith(null);

  // Click lookup button opens SelectRecordDialog
  const lookupBtn = screen.getByRole("button", { name: "Open Parent Lead lookup" });
  await user.click(lookupBtn);

  // Dialog appears with records
  expect(await screen.findByRole("radio", { name: "Second Lead" })).toBeTruthy();

  // Select second lead and click Done
  await user.click(screen.getByRole("radio", { name: "Second Lead" }));
  await user.click(screen.getByRole("button", { name: "Done" }));

  expect(change).toHaveBeenCalledWith({
    module: "Leads",
    id: "lead-2",
    name: "Second Lead",
  });
});

test("lookup input non-empty typing does not mutate reference name, only clearing sets null", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const lookupField: FieldDefinition = {
    apiName: "Parent_Lead",
    label: "Parent Lead",
    dataType: "lookup",
    lookup: { module: "Leads" },
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };

  render(
    <Controlled
      type="lookup"
      field={lookupField}
      initial={{ module: "Leads", id: "lead-1", name: "First Lead" }}
      onChange={change}
    />,
  );

  const input = screen.getByRole("textbox", { name: "Parent Lead" }) as HTMLInputElement;
  await user.type(input, " Modified");
  expect(change).not.toHaveBeenCalled();

  await user.clear(input);
  expect(change).toHaveBeenCalledWith(null);
});

test("lookup input with unregistered target renders with laterModule and blocks clicks", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const lookupField: FieldDefinition = {
    apiName: "Doc_Ref",
    label: "Doc Ref",
    dataType: "lookup",
    lookup: { module: "Documents" },
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };

  render(
    <Controlled
      type="lookup"
      field={lookupField}
      initial={{ module: "Documents", id: "doc-1", name: "Big Doc" }}
      onChange={change}
    />,
  );

  const input = screen.getByRole("textbox", { name: "Doc Ref" }) as HTMLInputElement;
  expect(input.value).toBe("Big Doc");
  expect(input.readOnly).toBe(true);
  expect(input.getAttribute("data-later-module")).toBe("M9");
  expect(input.getAttribute("aria-disabled")).toBe("true");

  const btn = screen.getByRole("button", { name: "Open Doc Ref lookup" });
  expect(btn.getAttribute("data-later-module")).toBe("M9");
  expect(btn.getAttribute("aria-disabled")).toBe("true");

  // Clicking button does not open dialog
  await user.click(btn);
  expect(screen.queryByRole("dialog")).toBeNull();
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

test("polymorphic lookup draws a type select and clears the value when the type changes", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const who: FieldDefinition = {
    ...field("lookup"),
    apiName: "Who_Id",
    label: "Contact Name",
    lookup: { module: "Contacts", modules: ["Contacts", "Leads"] },
  };
  render(
    <Controlled
      type="lookup"
      field={who}
      initial={{ module: "Contacts", id: "1", name: "Ada" }}
      onChange={change}
    />,
  );
  const select = screen.getByRole("button", { name: /Contact Name module/ });
  expect(select.textContent).toContain("Contact");
  await user.click(select);
  await user.click(screen.getByRole("option", { name: "Lead" }));
  expect(change).toHaveBeenLastCalledWith(null);
});

test.each(["ALARM", "RRULE"] as const)(
  "%s renders an off switch that stores an object",
  async (type) => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<Controlled type={type} onChange={change} />);
    const toggle = screen.getByRole("switch", { name: "Example" });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    await user.click(toggle);
    expect(change.mock.calls.at(-1)?.[0]).toEqual(expect.any(Object));
    await user.click(toggle);
    expect(change).toHaveBeenLastCalledWith(null);
  },
);

test.each(["ALARM", "RRULE", "boolean"] as const)(
  "activity %s keeps an accessible name without duplicate visible text",
  (type) => {
    render(<Controlled type={type} variant="activity" hideLabel />);
    const control = screen.getByRole(type === "boolean" ? "checkbox" : "switch", {
      name: "Example",
    });
    expect(control).toBeTruthy();
    expect(screen.getByText("Example").classList.contains("sr-only")).toBe(true);
  },
);

test("the label-side selector works independently of its named lookup input", async () => {
  const change = vi.fn();
  const user = userEvent.setup();
  render(
    <FormRow
      label="Contact"
      labelControl={
        <RecordChoice
          label="Contact type"
          hideLabel
          value="Contacts"
          onChange={change}
          options={[
            { value: "Contacts", label: "Contact" },
            { value: "Leads", label: "Lead" },
          ]}
        />
      }
      controlId="person"
      column="full"
    >
      <Controlled type="text" id="person" />
    </FormRow>,
  );
  const selector = screen.getByRole("button", { name: "Contact type" });
  expect(selector.closest("label")).toBeNull();
  await user.click(selector);
  await user.click(screen.getByRole("option", { name: "Lead" }));
  expect(change).toHaveBeenCalledWith("Leads");
  expect(screen.getByRole("textbox", { name: "Example" }).id).toBe("person");
});

test("the default toggle retains its visible label", () => {
  render(<Controlled type="ALARM" />);
  expect(screen.getByRole("switch", { name: "Example" })).toBeTruthy();
  expect(screen.getByText("Example").classList.contains("sr-only")).toBe(false);
});

test("currency help opens on click or keyboard, dismisses and never edits the amount", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <Controlled
      type="currency"
      field={{ ...field("currency"), apiName: "Amount", label: "Amount" }}
      initial={125}
      onChange={change}
      currencyPrefix="$"
      currencyHelp={dealsFormRules.currencyHelp?.Amount}
    />,
  );
  const amount = screen.getByRole("textbox", { name: "Amount" });
  const trigger = screen.getByRole("button", { name: "Amount information" });
  await user.hover(trigger);
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Amount information" })).toBeTruthy();
  expect(screen.getByText("20 + 20").tagName).toBe("STRONG");
  expect(screen.getByText("40").tagName).toBe("STRONG");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  await user.keyboard("{Enter}");
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.click(amount);
  expect(screen.queryByRole("dialog")).toBeNull();
  trigger.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.keyboard("{Escape}");
  expect((screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement).value).toBe("125");
  expect(change).not.toHaveBeenCalled();
});

test("text suggestions open, filter, select with keyboard, and preserve custom text", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <Controlled
      type="text"
      suggestions={["Email", "Call", "Meeting", "Send Letter", "Product Demo"]}
      onChange={change}
    />,
  );
  const input = screen.getByRole("combobox", { name: "Example" });
  await user.click(input);
  expect(screen.getAllByRole("option")).toHaveLength(5);
  await user.type(input, "mee");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await user.keyboard("{ArrowDown}{Enter}");
  expect((input as HTMLInputElement).value).toBe("Meeting");
  expect(change).toHaveBeenLastCalledWith("Meeting");
  await user.click(input);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
  await user.clear(input);
  await user.type(input, "Custom follow up");
  await user.tab();
  expect((input as HTMLInputElement).value).toBe("Custom follow up");
  expect(change).toHaveBeenLastCalledWith("Custom follow up");
});

test("calendar chooses a model day, dismisses, and keeps invalid and partial text", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled type="date" initial="2026-11-10" onChange={change} />);
  const input = screen.getByRole("textbox", { name: "Example" });
  await user.click(input);
  const day = screen.getByRole("button", { name: /November 15, 2026/ });
  await user.click(day);
  expect((input as HTMLInputElement).value).toBe("15.11.2026");
  expect(change).toHaveBeenLastCalledWith("2026-11-15");
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(input);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.clear(input);
  await user.type(input, "31.02.2026");
  expect((input as HTMLInputElement).value).toBe("31.02.2026");
  expect(change).toHaveBeenLastCalledWith("2026-02-31");
  await user.clear(input);
  await user.type(input, "12.0");
  expect((input as HTMLInputElement).value).toBe("12.0");
  expect(change).toHaveBeenLastCalledWith("12.0");
});

test("every date field opens a calendar without a module opt-in", async () => {
  const user = userEvent.setup();
  render(<Controlled type="date" />);
  await user.click(screen.getByRole("textbox", { name: "Example" }));
  const dialog = screen.getByRole("dialog", { name: "Example calendar" });
  const input = screen.getByRole("textbox", { name: "Example" });
  expect(input.getAttribute("aria-haspopup")).toBe("dialog");
  expect(input.getAttribute("aria-details")).toBe(dialog.id);
  expect(input.hasAttribute("aria-expanded")).toBe(false);
  expect(input.hasAttribute("aria-controls")).toBe(false);
  await user.keyboard("{Escape}");
  expect(input.hasAttribute("aria-details")).toBe(false);
});

test("calendar supports keyboard opening and a disabled field cannot open it", async () => {
  const user = userEvent.setup();
  render(<Controlled type="date" initial="2026-11-10" />);
  const input = screen.getByRole("textbox", { name: "Example" });
  input.focus();
  await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
  expect(screen.getByRole("dialog", { name: "Example calendar" })).toBeTruthy();
  await user.keyboard("{ArrowRight}{Enter}");
  expect((input as HTMLInputElement).value).toBe("11.11.2026");
  cleanup();
  render(<Controlled type="date" disabled />);
  await user.click(screen.getByRole("textbox", { name: "Example" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("calendar dismisses on an outside click without changing the date", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <>
      <Controlled type="date" initial="2026-11-10" onChange={change} />
      <button type="button">Outside</button>
    </>,
  );
  await user.click(screen.getByRole("textbox", { name: "Example" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Outside" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(change).not.toHaveBeenCalled();
});

test("form accepts organization format: 1.234,56 amount maps to 1234.56 and 30.06.2026 date maps to 2026-06-30", async () => {
  const user = userEvent.setup();
  const changeAmount = vi.fn();
  const changeDate = vi.fn();
  const orgFormat = formatOptionsFromOrganization(DOTTED_DAY_FIRST_FORMAT);
  render(
    <FormatProvider format={orgFormat}>
      <Controlled type="currency" initial={null} onChange={changeAmount} />
      <Controlled type="date" initial={null} onChange={changeDate} />
    </FormatProvider>,
  );
  const [amountInput, dateInput] = screen.getAllByRole("textbox", { name: "Example" });
  expect(amountInput).toBeDefined();
  expect(dateInput).toBeDefined();
  if (!amountInput || !dateInput) return;

  await user.type(amountInput, "1.234,56");
  await user.tab();
  expect(changeAmount).toHaveBeenLastCalledWith(1234.56);

  await user.type(dateInput, "30.06.2026");
  expect(changeDate).toHaveBeenLastCalledWith("2026-06-30");
});

test("multireminder changes offset and delivery channel without losing legacy data", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <Controlled
      type="multireminder"
      field={{ ...field("multireminder"), apiName: "Remind_At" }}
      initial={[{ ALARM: "FREQ=NONE;ACTION=LEGACY;TRIGGER=-PT99M;REPEAT=2" }]}
      onChange={change}
    />,
  );
  expect(screen.getByRole("button", { name: "Delivery channel" }).textContent).toContain("LEGACY");
  await user.click(screen.getByRole("button", { name: "Example" }));
  await user.click(screen.getByRole("option", { name: "10 minutes before" }));
  expect(change).toHaveBeenLastCalledWith([
    { ALARM: "FREQ=NONE;ACTION=LEGACY;TRIGGER=-PT10M;REPEAT=2" },
  ]);
  await user.click(screen.getByRole("button", { name: "Delivery channel" }));
  await user.click(screen.getByRole("option", { name: "Email" }));
  expect(change).toHaveBeenLastCalledWith([
    { ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-PT10M;REPEAT=2" },
  ]);
  await user.click(screen.getByRole("button", { name: "Delivery channel" }));
  await user.click(screen.getByRole("option", { name: "None" }));
  expect(change).toHaveBeenLastCalledWith(null);
});

test("multireminder keeps EMAIL records and disables both controls when read-only", () => {
  render(
    <Controlled
      type="multireminder"
      field={{ ...field("multireminder"), apiName: "Remind_At" }}
      initial={[{ ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-PT15M" }]}
      disabled
    />,
  );
  expect(screen.getByRole("button", { name: "Example" }).hasAttribute("disabled")).toBe(true);
  const channel = screen.getByRole("button", { name: "Delivery channel" });
  expect(channel.textContent).toContain("Email");
  expect(channel.hasAttribute("disabled")).toBe(true);
});

test("participants reminder keeps the single offset control observed in the reference", () => {
  render(
    <Controlled
      type="multireminder"
      field={{ ...field("multireminder"), apiName: "Remind_Participants" }}
    />,
  );
  expect(screen.getByRole("button", { name: "Example" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Delivery channel" })).toBeNull();
});
