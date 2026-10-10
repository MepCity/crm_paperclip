import { ValidationError } from "@crm/core/errors";
import type { FieldDataType, FieldDefinition, FieldValue } from "@crm/core/records";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { isLeadInlineEditable } from "@/lib/records/leads-inline-edit";
import { render } from "@/test/render";
import { DetailFieldRow } from "./detail-field-row";
import { InlineEditProvider } from "./inline-edit-context";
import { InlineFieldEditor } from "./inline-field-editor";

function field(type: FieldDataType = "text"): FieldDefinition {
  return {
    apiName: "Company",
    label: "Company",
    dataType: type,
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, edit: true, create: true, quickCreate: false },
    picklist: [{ storedValue: "Warm", displayValue: "Warm" }],
  };
}
function setup(
  type: FieldDataType = "text",
  value: FieldValue = "Old",
  save = vi.fn().mockResolvedValue(undefined),
) {
  const cancel = vi.fn();
  const complete = vi.fn();
  render(
    <InlineFieldEditor
      field={field(type)}
      value={value}
      onSave={save}
      onCancel={cancel}
      onComplete={complete}
    />,
  );
  return { cancel, complete, save, user: userEvent.setup() };
}
afterEach(cleanup);

test.each([
  "text",
  "email",
  "phone",
  "website",
  "textarea",
  "integer",
  "double",
  "currency",
  "boolean",
  "ownerlookup",
  "picklist",
] as const)("%s uses its form input", (type) => {
  setup(
    type,
    type === "boolean" ? true : ["integer", "double", "currency"].includes(type) ? 12 : null,
  );
  expect(
    screen.getByRole(
      type === "boolean"
        ? "checkbox"
        : ["ownerlookup", "picklist"].includes(type)
          ? "button"
          : "textbox",
      { name: "Company" },
    ),
  ).toBeTruthy();
  if (type === "picklist")
    expect(screen.getByRole("listbox", { name: "Company choices" })).toBeTruthy();
});

test("Save and Enter send only the changed field; unchanged Save closes without a write", async () => {
  const { user, save, complete } = setup();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(save).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledOnce();
  const input = screen.getByRole("textbox", { name: "Company" });
  await user.clear(input);
  await user.type(input, "New{Enter}");
  await waitFor(() => expect(save).toHaveBeenCalledWith({ Company: "New" }));
});

test.each(["Cancel", "Escape"])("%s discards without writing", async (action) => {
  const { user, save, cancel } = setup();
  await user.type(screen.getByRole("textbox"), "draft");
  if (action === "Cancel") await user.click(screen.getByRole("button", { name: "Cancel" }));
  else await user.keyboard("{Escape}");
  expect(cancel).toHaveBeenCalledOnce();
  expect(save).not.toHaveBeenCalled();
});

test("required and email validation use form messages and leave the editor open", async () => {
  const { user, save } = setup();
  await user.clear(screen.getByRole("textbox"));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Company cannot be empty.")).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
  cleanup();
  const email = setup("email", "valid@example.test");
  await email.user.clear(screen.getByRole("textbox"));
  await email.user.type(screen.getByRole("textbox"), "bad");
  await email.user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Please enter a valid Company.")).toBeTruthy();
  expect(email.save).not.toHaveBeenCalled();
});

test.each([new ValidationError({ Company: ["Rejected field."] }), new Error("Update failed.")])(
  "server errors stay beneath the control",
  async (error) => {
    const { user, complete } = setup("text", "Old", vi.fn().mockRejectedValue(error));
    await user.type(screen.getByRole("textbox"), "new");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText(
        error instanceof ValidationError ? "Rejected field." : "Update failed.",
      ),
    ).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe("true");
  },
);

test("pending save prevents duplicate requests and cancellation", async () => {
  let resolve!: () => void;
  const save = vi.fn(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const { user, cancel } = setup("text", "Old", save);
  await user.type(screen.getByRole("textbox"), "new");
  await user.dblClick(screen.getByRole("button", { name: "Save" }));
  expect(save).toHaveBeenCalledOnce();
  expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
  await user.keyboard("{Escape}");
  expect(cancel).not.toHaveBeenCalled();
  resolve();
  await waitFor(() =>
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
});

test("another pencil cancels the previous draft; composite and system rows have no pencil", async () => {
  const user = userEvent.setup();
  const save = vi.fn();
  const other = { ...field(), apiName: "Other", label: "Other" };
  render(
    <InlineEditProvider eligible={isLeadInlineEditable} save={save}>
      {[
        field(),
        other,
        { ...field(), apiName: "Address", label: "Address" },
        { ...field(), apiName: "Modified_By", label: "Modified By" },
      ].map((f) => (
        <DetailFieldRow
          key={f.apiName}
          field={f}
          value="Old"
          layout="details"
          format={DEFAULT_FORMAT}
        />
      ))}
    </InlineEditProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Edit Company" }));
  await user.type(screen.getByRole("textbox"), "draft");
  await user.click(screen.getByRole("button", { name: "Edit Other" }));
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByRole("textbox", { name: "Other" })).toHaveProperty("value", "Old");
  expect(screen.queryByRole("button", { name: "Edit Address" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit Modified By" })).toBeNull();
  expect(save).not.toHaveBeenCalled();
});

test("numeric Enter commits the current typed value before saving", async () => {
  const { user, save } = setup("integer", 12);
  const input = screen.getByRole("textbox", { name: "Company" });
  await user.clear(input);
  await user.type(input, "23{Enter}");
  await waitFor(() => expect(save).toHaveBeenCalledWith({ Company: 23 }));
});

test("textarea Enter inserts a newline without saving", async () => {
  const { user, save } = setup("textarea", "Old");
  await user.type(screen.getByRole("textbox"), "{Enter}new");
  expect(save).not.toHaveBeenCalled();
});

test("Escape from the open picklist cancels the editor", async () => {
  const { user, cancel, save } = setup("picklist", "Warm");
  await user.keyboard("{Escape}");
  expect(cancel).toHaveBeenCalledOnce();
  expect(save).not.toHaveBeenCalled();
});

test.each(["email", "website"] as const)(
  "%s retains its link and a separate edit pencil",
  (type) => {
    render(
      <InlineEditProvider eligible={isLeadInlineEditable} save={vi.fn()}>
        <DetailFieldRow
          field={field(type)}
          value={type === "email" ? "person@example.test" : "https://example.test"}
          layout="details"
          format={DEFAULT_FORMAT}
        />
      </InlineEditProvider>,
    );
    expect(screen.getByRole("link").closest("button")).toBeNull();
    expect(screen.getByRole("button", { name: "Edit Company" })).toBeTruthy();
  },
);
