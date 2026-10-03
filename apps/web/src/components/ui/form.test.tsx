import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Form } from "./form";
import { TextField } from "./text-field";

afterEach(cleanup);

test("Form shows action state errors", () => {
  const actionState = {
    status: "error" as const,
    message: "Global error",
    fieldErrors: {
      email: ["Invalid email"],
    },
  };

  render(
    <Form actionState={actionState}>
      <TextField name="email" label="Email" />
    </Form>,
  );

  // Alert shows global message
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("Global error");

  // Field shows field error
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input.getAttribute("aria-invalid")).toBe("true");

  const descId = input.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  const errorMsg = document.getElementById(descId as string);
  expect(errorMsg?.textContent).toBe("Invalid email");
});
