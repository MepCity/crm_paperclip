import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { TextField } from "./text-field";

afterEach(cleanup);

test("TextField links error message via aria-describedby", () => {
  render(<TextField name="email" label="Email" isInvalid errorMessage="Invalid email" />);
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input.getAttribute("aria-invalid")).toBe("true");
  const descId = input.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  const errorMsg = document.getElementById(descId as string);
  expect(errorMsg?.textContent).toBe("Invalid email");
});
