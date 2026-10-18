import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { FormRow, type FormRowColumn } from "./form-row";

afterEach(cleanup);

test("links label to control with htmlFor and renders children in control slot", () => {
  const { container } = render(
    <FormRow label="Email Address" controlId="email-input" column="left">
      <input id="email-input" type="email" />
    </FormRow>,
  );

  const input = screen.getByRole("textbox", { name: "Email Address" });
  expect(input).toBeTruthy();
  expect(input.getAttribute("id")).toBe("email-input");

  const controlSlot = container.querySelector("[data-record-form-control-slot]");
  expect(controlSlot).toBeTruthy();
  expect(controlSlot?.contains(input)).toBe(true);
});

test.each(["left", "right", "full"] as const)(
  "renders data-record-form-row-column for column variant '%s'",
  (column: FormRowColumn) => {
    const { container } = render(
      <FormRow label="Field" controlId="field-id" column={column}>
        <input id="field-id" type="text" />
      </FormRow>,
    );

    const row = container.querySelector("[data-record-form-row]");
    expect(row).toBeTruthy();
    expect(row?.getAttribute("data-record-form-row-column")).toBe(column);
  },
);

test("applies data-required attribute when required is true", () => {
  const { container } = render(
    <FormRow label="Company" controlId="company-id" column="left" required={true}>
      <input id="company-id" type="text" />
    </FormRow>,
  );

  const row = container.querySelector("[data-record-form-row]");
  expect(row?.getAttribute("data-required")).toBe("true");
});

test("omits data-required attribute when required is false or undefined", () => {
  const { container: falseContainer } = render(
    <FormRow label="Phone" controlId="phone-id" column="right" required={false}>
      <input id="phone-id" type="tel" />
    </FormRow>,
  );

  const falseRow = falseContainer.querySelector("[data-record-form-row]");
  expect(falseRow?.hasAttribute("data-required")).toBe(false);

  const { container: undefContainer } = render(
    <FormRow label="Phone" controlId="phone-id-2" column="right">
      <input id="phone-id-2" type="tel" />
    </FormRow>,
  );

  const undefRow = undefContainer.querySelector("[data-record-form-row]");
  expect(undefRow?.hasAttribute("data-required")).toBe(false);
});

test("renders labelControl instead of standard label when provided", () => {
  render(
    <FormRow
      label="Ignored Label"
      labelControl={
        <select aria-label="Activity Type">
          <option value="call">Call</option>
          <option value="task">Task</option>
        </select>
      }
      controlId="activity-subject"
      column="left"
    >
      <input id="activity-subject" type="text" />
    </FormRow>,
  );

  expect(screen.getByRole("combobox", { name: "Activity Type" })).toBeTruthy();
  expect(screen.queryByText("Ignored Label")).toBeNull();
});
