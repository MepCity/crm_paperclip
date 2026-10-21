import { ValidationError } from "@crm/core/errors";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { DetailFieldRow, type DetailFieldRowProps } from "./detail-field-row";
import { InlineEditProvider } from "./inline-edit-context";
import { RecordCallProvider } from "./record-call-context";

afterEach(cleanup);

function field(extra: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName: "Company",
    label: "Company",
    dataType: "text",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, edit: true, create: true, quickCreate: false },
    ...extra,
  };
}

function row(extra: Partial<DetailFieldRowProps> = {}) {
  return (
    <DetailFieldRow
      field={field()}
      value="Example company"
      layout="details"
      format={DEFAULT_FORMAT}
      {...extra}
    />
  );
}

test.each<{
  dataType: FieldDefinition["dataType"];
  value: FieldValue;
  text: string;
}>([
  { dataType: "text", value: "Example company", text: "Example company" },
  { dataType: "integer", value: 42, text: "42" },
  { dataType: "double", value: 12.5, text: "12.5" },
  { dataType: "currency", value: 99.5, text: "99.5" },
  { dataType: "phone", value: "555-0100", text: "555-0100" },
  { dataType: "boolean", value: true, text: "true" },
  { dataType: "ownerlookup", value: "owner-1", text: "Test Owner" },
  { dataType: "picklist", value: "web", text: "Web form" },
  { dataType: "textarea", value: "First line\nSecond line", text: "First line Second line" },
])("displays $dataType values beside the field label", ({ dataType, value, text }) => {
  render(
    row({
      field: field({ dataType, picklist: [{ storedValue: "web", displayValue: "Web form" }] }),
      value,
      ownerNames: { "owner-1": "Test Owner" },
    }),
  );
  expect(screen.getByText("Company")).toBeTruthy();
  expect(screen.getByText(text)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
});

test.each(["email", "website"] as const)(
  "%s keeps its link while the pencil opens inline editing",
  async (dataType) => {
    const user = userEvent.setup();
    const value = dataType === "email" ? "sample@example.test" : "example.test";
    render(
      <InlineEditProvider eligible={() => true} save={vi.fn()}>
        {row({ field: field({ dataType }), value })}
      </InlineEditProvider>,
    );
    expect(screen.getByRole("link", { name: value }).getAttribute("href")).toBe(
      dataType === "email" ? `mailto:${value}` : `https://${value}`,
    );
    expect(screen.queryByRole("button", { name: "Edit Company value" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Edit Company" }));
    expect(screen.getByRole("textbox", { name: "Company" })).toBe(document.activeElement);
  },
);

test.each([null, ""])("empty value %s hides suffix and call action", (value) => {
  render(row({ value, suffix: " - Contacts", callAction: true }));
  expect(screen.getByText("—")).toBeTruthy();
  expect(screen.queryByText(/Contacts/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Call" })).toBeNull();
});

test("nonempty values retain the suffix and delegated edit callback", async () => {
  const onEdit = vi.fn();
  render(row({ suffix: " - Contacts", onEdit }));
  expect(screen.getByText("- Contacts")).toBeTruthy();
  await userEvent.setup().click(screen.getByRole("button", { name: "Edit Company" }));
  expect(onEdit).toHaveBeenCalledExactlyOnceWith("Company");
});

function editable(save = vi.fn().mockResolvedValue(undefined)) {
  function Harness() {
    const [value, setValue] = useState<FieldValue>("Original");
    return (
      <InlineEditProvider
        eligible={(definition) => !definition.readOnly}
        save={async (input) => {
          await save(input);
          setValue(input.Company ?? null);
        }}
      >
        {row({ value })}
        {row({ field: field({ apiName: "Locked", label: "Locked", readOnly: true }) })}
        {row({ field: field({ apiName: "Phone", label: "Phone", dataType: "phone" }) })}
      </InlineEditProvider>
    );
  }
  render(<Harness />);
  return { user: userEvent.setup(), save };
}

test("keyboard activation saves the changed field, updates the value and restores focus", async () => {
  const { user, save } = editable();
  expect(screen.queryByRole("button", { name: /Edit Locked/ })).toBeNull();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit Company value" }));
  await user.keyboard("{Enter}");
  const input = screen.getByRole("textbox", { name: "Company" });
  expect(document.activeElement).toBe(input);
  await user.clear(input);
  await user.type(input, "Updated");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(save).toHaveBeenCalledExactlyOnceWith({ Company: "Updated" });
  expect(screen.getByText("Updated")).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit Company value" }));
});

test.each(["Escape", "Cancel"])("%s discards the draft and restores row focus", async (action) => {
  const { user, save } = editable();
  await user.click(screen.getByRole("button", { name: "Edit Company" }));
  await user.type(screen.getByRole("textbox", { name: "Company" }), " draft");
  if (action === "Escape") await user.keyboard("{Escape}");
  else await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByText("Original")).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit Company value" }));
});

test("switching pencils discards the previous row draft without saving", async () => {
  const { user, save } = editable();
  await user.click(screen.getByRole("button", { name: "Edit Company" }));
  await user.type(screen.getByRole("textbox", { name: "Company" }), " draft");
  await user.click(screen.getByRole("button", { name: "Edit Phone" }));
  expect(screen.queryByRole("textbox", { name: "Company" })).toBeNull();
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByRole("textbox", { name: "Phone" })).toBeTruthy();
  expect(screen.getByText("Original")).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
});

test("required validation keeps the row editor open until the draft is corrected", async () => {
  const { user, save } = editable();
  await user.click(screen.getByRole("button", { name: "Edit Company value" }));
  const input = screen.getByRole("textbox", { name: "Company" });
  await user.clear(input);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Company cannot be empty.")).toBeTruthy();
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(save).not.toHaveBeenCalled();
  await user.type(input, "Corrected");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Corrected")).toBeTruthy();
  expect(screen.queryByText("Company cannot be empty.")).toBeNull();
});

test("server field validation retains the draft and permits retry", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new ValidationError({ Company: ["Value rejected."] }))
    .mockResolvedValue(undefined);
  const { user } = editable(save);
  await user.click(screen.getByRole("button", { name: "Edit Company" }));
  await user.type(screen.getByRole("textbox", { name: "Company" }), " revised");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Value rejected.")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Company" }) as HTMLInputElement).value).toBe(
    "Original revised",
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(save).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Original revised")).toBeTruthy();
});

test("saving an unchanged row closes without a write and restores focus", async () => {
  const { user, save } = editable();
  await user.click(screen.getByRole("button", { name: "Edit Company" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit Company value" }));
});

test("phone Call keeps the M5 marker without a call provider and is active with one", () => {
  const phone = field({ apiName: "Phone", label: "Phone", dataType: "phone", required: false });
  const { container, unmount } = render(row({ field: phone, value: "555-0100", callAction: true }));
  const marked = container.querySelector('[data-later-module="M5"]');
  expect(marked?.getAttribute("aria-disabled")).toBe("true");
  unmount();
  const view = render(
    <RecordCallProvider value={vi.fn()}>
      {row({ field: phone, value: "555-0100", callAction: true })}
    </RecordCallProvider>,
  );
  expect(view.container.querySelector('[data-later-module="M5"]')).toBeNull();
});
