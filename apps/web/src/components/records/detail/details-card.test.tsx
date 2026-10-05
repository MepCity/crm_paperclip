import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { DetailsCard } from "./details-card";

afterEach(cleanup);

function textField(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
  };
}

test("Hide Details toggles sections and aria-expanded", async () => {
  const user = userEvent.setup();
  render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      sections={[
        {
          title: "Lead Information",
          fields: [{ column: "left", field: textField("Title", "Title"), value: "Director" }],
        },
      ]}
    />,
  );

  const toggle = screen.getByRole("button", { name: "Hide Details" });
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Director")).toBeTruthy();

  await user.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByText("Director")).toBeNull();
  expect(screen.getByRole("button", { name: "Show Details" })).toBeTruthy();
});

test("pencil icon is omitted without onEdit", () => {
  render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      sections={[
        {
          title: "Lead Information",
          fields: [{ column: "left", field: textField("Title", "Title"), value: "Director" }],
        },
      ]}
    />,
  );
  expect(screen.queryByRole("img", { name: /Edit Title/ })).toBeNull();
});

test("pencil icon appears when onEdit is provided", () => {
  render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      onEdit={() => {}}
      sections={[
        {
          title: "Lead Information",
          fields: [{ column: "left", field: textField("Title", "Title"), value: "Director" }],
        },
      ]}
    />,
  );
  expect(screen.getByRole("img", { name: "Edit Title" })).toBeTruthy();
});

test("two-column sections keep left and right fields in separate columns", () => {
  const { container } = render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      sections={[
        {
          title: "Lead Information",
          fields: [
            {
              column: "left",
              field: textField("Left", "Left"),
              value: "Short",
            },
            {
              column: "right",
              field: textField("Right", "Right"),
              value:
                "A very long value that should wrap and increase only the right column row height",
            },
          ],
        },
      ]}
    />,
  );
  const leftColumn = container.querySelector('[data-detail-column="left"]');
  const rightColumn = container.querySelector('[data-detail-column="right"]');
  expect(leftColumn?.querySelector('[data-detail-field="Left"]')).toBeTruthy();
  expect(rightColumn?.querySelector('[data-detail-field="Right"]')).toBeTruthy();
  expect(leftColumn?.querySelector('[data-detail-field="Right"]')).toBeNull();
});
