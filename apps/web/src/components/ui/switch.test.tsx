import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { Form } from "./form";
import { Switch } from "./switch";

afterEach(cleanup);

const notify = () => screen.getByRole("switch", { name: "Notify me" }) as HTMLInputElement;

test("Switch is reachable by its label", () => {
  render(<Switch name="notify" label="Notify me" />);

  expect(notify().checked).toBe(false);
});

test("Switch turns on with the space key and submits only while on", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <Switch name="notify" label="Notify me" />
    </form>,
  );

  expect(submittedValues()).toEqual([]);

  notify().focus();
  await user.keyboard(" ");
  expect(notify().checked).toBe(true);
  expect(submittedValues()).toEqual(["notify=true"]);

  await user.keyboard(" ");
  expect(submittedValues()).toEqual([]);
});

test("Switch keeps its submitted value when it starts on", () => {
  render(
    <form>
      <Switch name="notify" label="Notify me" defaultSelected />
    </form>,
  );

  expect(notify().checked).toBe(true);
  expect(submittedValues()).toEqual(["notify=true"]);
});

test("Switch shows its description to assistive technology", () => {
  render(<Switch name="notify" label="Notify me" description="Applies to the whole team" />);

  expect(describedBy(notify())).toBe("Applies to the whole team");
});

test("Switch ties its error message to the field", () => {
  render(<Switch name="notify" label="Notify me" isInvalid errorMessage="Turn notifications on" />);

  expect(notify().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(notify())).toBe("Turn notifications on");
});

test("Switch shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { notify: ["Turn notifications on"] },
      }}
    >
      <Switch name="notify" label="Notify me" />
    </Form>,
  );

  expect(notify().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(notify())).toBe("Turn notifications on");
});

test("Switch in the disabled state cannot be turned on", async () => {
  const user = userEvent.setup();
  render(<Switch name="notify" label="Notify me" isDisabled />);

  expect(notify().disabled).toBe(true);
  await user.click(notify());
  expect(notify().checked).toBe(false);
});

test("Switch marks itself required", () => {
  render(<Switch name="notify" label="Notify me" isRequired />);

  expect(notify().required).toBe(true);
});
