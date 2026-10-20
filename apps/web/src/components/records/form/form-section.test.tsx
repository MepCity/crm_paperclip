import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { FormSection } from "./form-section";

afterEach(cleanup);

test("renders section with title as heading and defaults layout to single", () => {
  const { container } = render(
    <FormSection title="Lead Information">
      <p>Section Content</p>
    </FormSection>,
  );

  const heading = screen.getByRole("heading", {
    level: 2,
    name: "Lead Information",
  });
  expect(heading).toBeTruthy();

  const section = container.querySelector("[data-record-form-section]");
  expect(section).toBeTruthy();
  expect(section?.getAttribute("data-record-form-section-layout")).toBe("single");

  expect(screen.getByText("Section Content")).toBeTruthy();
});

test("supports layout='two-column'", () => {
  const { container } = render(
    <FormSection title="Address Details" layout="two-column">
      <p>Two Column Body</p>
    </FormSection>,
  );

  const section = container.querySelector("[data-record-form-section]");
  expect(section?.getAttribute("data-record-form-section-layout")).toBe("two-column");
  expect(screen.getByText("Two Column Body")).toBeTruthy();
});

test("renders headerEnd content alongside title in section header", () => {
  render(
    <FormSection
      title="Address Information"
      headerEnd={<button type="button">Copy Address</button>}
    >
      <p>Fields</p>
    </FormSection>,
  );

  expect(screen.getByRole("heading", { level: 2, name: "Address Information" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Copy Address" })).toBeTruthy();
  expect(screen.getByText("Fields")).toBeTruthy();
});

test("renders without header when title is omitted", () => {
  const { container } = render(
    <FormSection>
      <p>Body Without Header</p>
    </FormSection>,
  );

  expect(screen.queryByRole("heading")).toBeNull();
  expect(container.querySelector("[data-record-form-section-header]")).toBeNull();
  expect(screen.getByText("Body Without Header")).toBeTruthy();
});
