import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Form, SubmitButton } from "./form";
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

test("Form shows the success message in an alert", () => {
  render(
    <Form actionState={{ status: "success", message: "Saved" }}>
      <TextField name="email" label="Email" />
    </Form>,
  );

  expect(screen.getByRole("alert").textContent).toContain("Saved");
});

test("SubmitButton is pending while the form action runs", async () => {
  const user = userEvent.setup();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let submitted = false;

  render(
    <Form
      action={async () => {
        submitted = true;
        await gate;
      }}
    >
      <TextField name="email" label="Email" />
      <SubmitButton>Save</SubmitButton>
    </Form>,
  );

  const submit = screen.getByRole("button", { name: "Save" });
  expect(submit.getAttribute("data-pending")).toBeNull();

  await user.click(submit);
  await waitFor(() => expect(submitted).toBe(true));
  expect(submit.getAttribute("data-pending")).toBe("true");
  expect(submit.getAttribute("aria-disabled")).toBe("true");

  await act(async () => {
    release();
  });
  await waitFor(() => expect(submit.getAttribute("data-pending")).toBeNull());
});
