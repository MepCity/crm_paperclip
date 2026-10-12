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
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
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

test("pencil control is omitted without onEdit", () => {
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
  expect(screen.queryByRole("button", { name: "Edit Title" })).toBeNull();
});

test("pencil button calls onEdit with the field api name", async () => {
  const user = userEvent.setup();
  const edits: string[] = [];
  render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      onEdit={(apiName) => edits.push(apiName)}
      sections={[
        {
          title: "Lead Information",
          fields: [{ column: "left", field: textField("Title", "Title"), value: "Director" }],
        },
      ]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Edit Title" }));
  expect(edits).toEqual(["Title"]);
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

test("full-width Description row uses the description label layout modifier", () => {
  const { container } = render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      sections={[
        {
          title: "Address Information",
          fields: [
            {
              column: "full",
              field: textField("Description", "Description"),
              value: "",
            },
          ],
        },
      ]}
    />,
  );
  expect(container.querySelector(".detail-details-row-description")).toBeTruthy();
});

test("full-width Address row does not use the description label modifier", () => {
  const { container } = render(
    <DetailsCard
      format={DEFAULT_FORMAT}
      sections={[
        {
          title: "Address Information",
          fields: [
            {
              column: "full",
              field: textField("Address", "Address"),
              value: "Line one",
            },
          ],
        },
      ]}
    />,
  );
  expect(container.querySelector(".detail-details-row-description")).toBeNull();
});
