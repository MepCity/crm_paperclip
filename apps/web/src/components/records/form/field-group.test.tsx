import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { FieldGroup } from "./field-group";

afterEach(cleanup);

test("renders fieldset with group role, legend text and accessible name", () => {
  const { container } = render(
    <FieldGroup name="Mailing Address">
      <input aria-label="Street" type="text" />
    </FieldGroup>,
  );

  const group = screen.getByRole("group", { name: "Mailing Address" });
  expect(group).toBeTruthy();

  const legend = container.querySelector("legend.record-form-field-group__legend");
  expect(legend).toBeTruthy();
  expect(legend?.textContent).toBe("Mailing Address");

  const legendId = legend?.getAttribute("id");
  expect(legendId).toBeTruthy();
  expect(group.getAttribute("aria-labelledby")).toBe(legendId);
});

test("renders children inside the field group body", () => {
  const { container } = render(
    <FieldGroup name="Contact Information">
      <p>Group child paragraph</p>
      <button type="button">Action</button>
    </FieldGroup>,
  );

  const body = container.querySelector(".record-form-field-group__body");
  expect(body).toBeTruthy();

  expect(screen.getByText("Group child paragraph")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Action" })).toBeTruthy();
  expect(body?.contains(screen.getByText("Group child paragraph"))).toBe(true);
});
