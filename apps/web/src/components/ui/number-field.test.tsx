import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { Form } from "./form";
import { NumberField } from "./number-field";

afterEach(cleanup);

const amount = () => screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement;

test("NumberField is reachable by its label", () => {
  render(<NumberField name="amount" label="Amount" />);

  expect(amount().getAttribute("aria-roledescription")).toBe("Number field");
});

test("NumberField steps with the arrow keys and stops at the bounds", async () => {
  const user = userEvent.setup();
  render(
    <NumberField
      name="amount"
      label="Amount"
      defaultValue={9}
      minValue={0}
      maxValue={10}
      step={2}
    />,
  );

  amount().focus();
  await user.keyboard("{ArrowUp}");
  expect(amount().value).toBe("10");

  // maxValue caps the step.
  await user.keyboard("{ArrowUp}");
  expect(amount().value).toBe("10");

  await user.keyboard("{ArrowDown}");
  expect(amount().value).toBe("8");

  for (let press = 0; press < 5; press += 1) {
    await user.keyboard("{ArrowDown}");
  }
  expect(amount().value).toBe("0");
});

test("NumberField shows the value with the app locale and honours a per-field one", () => {
  const { unmount } = render(<NumberField name="amount" label="Amount" defaultValue={1234.5} />);
  expect(amount().value).toBe("1,234.5");

  unmount();
  render(<NumberField name="amount" label="Amount" defaultValue={1234.5} locale="de-DE" />);
  expect(amount().value).toBe("1.234,5");
});

test("NumberField shows the requested number of decimal places", () => {
  render(<NumberField name="amount" label="Amount" defaultValue={1234.5} decimalPlaces={2} />);

  expect(amount().value).toBe("1,234.50");
});

test("NumberField submits a locale independent decimal string", async () => {
  const user = userEvent.setup();
  const { unmount } = render(
    <form>
      <NumberField name="amount" label="Amount" locale="de-DE" />
    </form>,
  );

  await user.click(amount());
  await user.keyboard("1234,5");
  expect(amount().value).toBe("1234,5");
  expect(submittedValues()).toEqual(["amount=1234.5"]);

  unmount();
  render(
    <form>
      <NumberField name="amount" label="Amount" />
    </form>,
  );

  await user.click(amount());
  await user.keyboard("1234.5");
  expect(submittedValues()).toEqual(["amount=1234.5"]);
});

test("NumberField formats the typed value once the field loses focus", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <NumberField name="amount" label="Amount" />
    </form>,
  );

  await user.click(amount());
  await user.keyboard("1234.5");
  await user.tab();

  expect(amount().value).toBe("1,234.5");
});

test("NumberField shows its description to assistive technology", () => {
  render(<NumberField name="amount" label="Amount" description="In thousands" />);

  expect(describedBy(amount())).toBe("In thousands");
});

test("NumberField ties its error message to the field", () => {
  render(<NumberField name="amount" label="Amount" isInvalid errorMessage="Enter a number" />);

  expect(amount().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(amount())).toBe("Enter a number");
});

test("NumberField shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { amount: ["Enter a number"] },
      }}
    >
      <NumberField name="amount" label="Amount" />
    </Form>,
  );

  expect(amount().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(amount())).toBe("Enter a number");
});

test("NumberField in the disabled state rejects typing", async () => {
  const user = userEvent.setup();
  render(<NumberField name="amount" label="Amount" isDisabled />);

  expect(amount().disabled).toBe(true);
  await user.click(amount());
  await user.keyboard("5");
  expect(amount().value).toBe("");
});

test("NumberField marks itself required", () => {
  render(<NumberField name="amount" label="Amount" isRequired />);

  expect(amount().required).toBe(true);
});
