import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { Checkbox } from "./checkbox";
import { Form } from "./form";

afterEach(cleanup);

const accept = () => screen.getByRole("checkbox", { name: "Accept the terms" }) as HTMLInputElement;

test("Checkbox is reachable by its label", () => {
  render(<Checkbox name="accept" label="Accept the terms" />);

  expect(accept().checked).toBe(false);
  expect(screen.getByText("Accept the terms").textContent).toBe("Accept the terms");
});

test("Checkbox toggles with the space key and submits only while checked", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <Checkbox name="accept" label="Accept the terms" />
    </form>,
  );

  expect(submittedValues()).toEqual([]);

  accept().focus();
  await user.keyboard(" ");
  expect(accept().checked).toBe(true);
  expect(submittedValues()).toEqual(["accept=true"]);

  await user.keyboard(" ");
  expect(accept().checked).toBe(false);
  expect(submittedValues()).toEqual([]);
});

test("Checkbox shows its description to assistive technology", () => {
  render(<Checkbox name="accept" label="Accept the terms" description="Read them first" />);

  expect(describedBy(accept())).toBe("Read them first");
});

test("Checkbox ties its error message to the field", () => {
  render(
    <Checkbox name="accept" label="Accept the terms" isInvalid errorMessage="You must accept" />,
  );

  expect(accept().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(accept())).toBe("You must accept");
});

test("Checkbox shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { accept: ["You must accept"] },
      }}
    >
      <Checkbox name="accept" label="Accept the terms" />
    </Form>,
  );

  expect(accept().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(accept())).toBe("You must accept");
});

test("Checkbox in the disabled state cannot be checked", async () => {
  const user = userEvent.setup();
  render(<Checkbox name="accept" label="Accept the terms" isDisabled />);

  expect(accept().disabled).toBe(true);
  await user.click(accept());
  expect(accept().checked).toBe(false);
});

test("Checkbox marks itself required", () => {
  render(<Checkbox name="accept" label="Accept the terms" isRequired />);

  expect(accept().required).toBe(true);
});
