import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { FormGrid } from "./form-grid";

afterEach(cleanup);

test("renders both left and right columns with their content", () => {
  const { container } = render(
    <FormGrid left={<p>Left Column Content</p>} right={<p>Right Column Content</p>} />,
  );

  const grid = container.querySelector("[data-record-form-grid]");
  expect(grid).toBeTruthy();

  const leftColumn = container.querySelector('[data-record-form-column="left"]');
  const rightColumn = container.querySelector('[data-record-form-column="right"]');
  expect(leftColumn).toBeTruthy();
  expect(rightColumn).toBeTruthy();

  expect(screen.getByText("Left Column Content")).toBeTruthy();
  expect(screen.getByText("Right Column Content")).toBeTruthy();
  expect(leftColumn?.contains(screen.getByText("Left Column Content"))).toBe(true);
  expect(rightColumn?.contains(screen.getByText("Right Column Content"))).toBe(true);
});

test("renders correctly when only left column content is provided", () => {
  const { container } = render(<FormGrid left={<p>Only Left</p>} right={null} />);

  const leftColumn = container.querySelector('[data-record-form-column="left"]');
  const rightColumn = container.querySelector('[data-record-form-column="right"]');
  expect(leftColumn).toBeTruthy();
  expect(rightColumn).toBeTruthy();

  expect(screen.getByText("Only Left")).toBeTruthy();
  expect(leftColumn?.contains(screen.getByText("Only Left"))).toBe(true);
  expect(rightColumn?.childNodes.length).toBe(0);
});

test("renders correctly when only right column content is provided", () => {
  const { container } = render(<FormGrid left={null} right={<p>Only Right</p>} />);

  const leftColumn = container.querySelector('[data-record-form-column="left"]');
  const rightColumn = container.querySelector('[data-record-form-column="right"]');
  expect(leftColumn).toBeTruthy();
  expect(rightColumn).toBeTruthy();

  expect(screen.getByText("Only Right")).toBeTruthy();
  expect(rightColumn?.contains(screen.getByText("Only Right"))).toBe(true);
  expect(leftColumn?.childNodes.length).toBe(0);
});
