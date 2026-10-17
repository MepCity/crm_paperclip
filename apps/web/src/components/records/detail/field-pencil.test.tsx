import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { FieldPencil } from "./field-pencil";

afterEach(cleanup);

test("renders button named by label with type button and aria-hidden icon", () => {
  const onClick = vi.fn();
  render(<FieldPencil label="Edit Lead Name" onClick={onClick} />);
  const button = screen.getByRole("button", { name: "Edit Lead Name" });
  expect(button).toBeTruthy();
  expect(button.getAttribute("type")).toBe("button");
  const icon = button.querySelector("svg");
  expect(icon).not.toBeNull();
  expect(icon?.getAttribute("aria-hidden")).toBe("true");
});

test("pressing button calls onClick once", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(<FieldPencil label="Edit Lead Name" onClick={onClick} />);
  const button = screen.getByRole("button", { name: "Edit Lead Name" });
  await user.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});
