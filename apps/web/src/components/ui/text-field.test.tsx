import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { TextField } from "./text-field";

afterEach(cleanup);

test("filter search keeps an accessible label independent of its placeholder", async () => {
  const user = userEvent.setup();
  render(<TextField label="Search choices" placeholder="Search" variant="filter-search" />);
  const input = screen.getByRole("textbox", { name: "Search choices" }) as HTMLInputElement;
  expect(input.placeholder).toBe("Search");
  await user.type(input, "code");
  expect(input.value).toBe("code");
});

test("TextField links error message via aria-describedby", () => {
  render(<TextField name="email" label="Email" isInvalid errorMessage="Invalid email" />);
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input.getAttribute("aria-invalid")).toBe("true");
  const descId = input.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  const errorMsg = document.getElementById(descId as string);
  expect(errorMsg?.textContent).toBe("Invalid email");
});

test("TextField renders the requested input type", () => {
  render(
    <>
      <TextField name="mail" label="Email" type="email" />
      <TextField name="secret" label="Secret" type="password" />
    </>,
  );

  expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("type")).toBe("email");
  // A password input has no textbox role, so it is queried by its label.
  expect(screen.getByLabelText("Secret").getAttribute("type")).toBe("password");
});

test("TextField in the disabled state rejects typing", async () => {
  const user = userEvent.setup();
  render(<TextField name="email" label="Email" isDisabled />);

  const input = screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement;
  expect(input.disabled).toBe(true);

  await user.click(input);
  await user.keyboard("hello");
  expect(input.value).toBe("");
});

test("TextField shows its description to assistive technology", () => {
  render(<TextField name="email" label="Email" description="Work address only" />);

  const input = screen.getByRole("textbox", { name: "Email" });
  const descId = input.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  expect(document.getElementById(descId as string)?.textContent).toBe("Work address only");
});
