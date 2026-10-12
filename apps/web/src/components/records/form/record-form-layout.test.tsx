import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { FieldGroup } from "./field-group";
import { FormRow } from "./form-row";
import { RecordFormShell } from "./record-form-shell";

afterEach(cleanup);

test("record form shell exposes page title, form landmark and action handlers", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  const onSaveAndNew = vi.fn();
  const onSave = vi.fn();
  render(
    <RecordFormShell
      title="Create Lead"
      formAriaLabel="Create lead"
      actionLabels={{ cancel: "Cancel", saveAndNew: "Save and New", save: "Save" }}
      onCancel={onCancel}
      onSaveAndNew={onSaveAndNew}
      onSave={onSave}
    >
      <p>Body</p>
    </RecordFormShell>,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Create Lead" })).toBeTruthy();
  expect(screen.getByRole("form", { name: "Create lead" })).toBeTruthy();
  const cancel = screen.getByRole("button", { name: "Cancel" });
  const saveAndNew = screen.getByRole("button", { name: "Save and New" });
  const save = screen.getByRole("button", { name: "Save" });
  await user.click(cancel);
  await user.click(saveAndNew);
  await user.click(save);
  expect(onCancel).toHaveBeenCalledOnce();
  expect(onSaveAndNew).toHaveBeenCalledOnce();
  expect(onSave).toHaveBeenCalledOnce();
});

test("form row links its label to the control", () => {
  render(
    <FormRow label="Company" controlId="company-field" column="left">
      <input id="company-field" type="text" />
    </FormRow>,
  );
  const control = screen.getByRole("textbox", { name: "Company" });
  expect(control.getAttribute("id")).toBe("company-field");
});

test("field group exposes group role and accessible name", () => {
  render(
    <FieldGroup name="Address">
      <FormRow label="City" controlId="city" column="left">
        <input id="city" type="text" />
      </FormRow>
    </FieldGroup>,
  );
  expect(screen.getByRole("group", { name: "Address" })).toBeTruthy();
});

test("action buttons follow Cancel, Save and New, Save tab order", async () => {
  const user = userEvent.setup();
  render(
    <RecordFormShell
      title="Create Lead"
      formAriaLabel="Create lead"
      actionLabels={{ cancel: "Cancel", saveAndNew: "Save and New", save: "Save" }}
    >
      <p>Body</p>
    </RecordFormShell>,
  );
  const cancel = screen.getByRole("button", { name: "Cancel" });
  const saveAndNew = screen.getByRole("button", { name: "Save and New" });
  const save = screen.getByRole("button", { name: "Save" });
  await user.tab();
  expect(document.activeElement).toBe(cancel);
  await user.tab();
  expect(document.activeElement).toBe(saveAndNew);
  await user.tab();
  expect(document.activeElement).toBe(save);
});
