import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { Form } from "./form";
import { TextArea } from "./text-area";

afterEach(cleanup);

const notes = () => screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement;

test("TextArea is reachable by its label and shows the requested row count", () => {
  render(<TextArea name="notes" label="Notes" rows={6} />);

  expect(notes().tagName).toBe("TEXTAREA");
  expect(notes().rows).toBe(6);
});

test("TextArea shows its description to assistive technology", () => {
  render(<TextArea name="notes" label="Notes" description="Internal only" />);

  expect(describedBy(notes())).toBe("Internal only");
});

test("TextArea ties its error message to the field", () => {
  render(<TextArea name="notes" label="Notes" isInvalid errorMessage="Write something" />);

  expect(notes().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(notes())).toBe("Write something");
});

test("TextArea shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { notes: ["Write something"] },
      }}
    >
      <TextArea name="notes" label="Notes" />
    </Form>,
  );

  expect(notes().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(notes())).toBe("Write something");
});

test("TextArea in the disabled state rejects typing", async () => {
  const user = userEvent.setup();
  render(<TextArea name="notes" label="Notes" isDisabled />);

  expect(notes().disabled).toBe(true);
  await user.click(notes());
  await user.keyboard("hello");
  expect(notes().value).toBe("");
});

test("TextArea marks itself required", () => {
  render(<TextArea name="notes" label="Notes" isRequired />);

  expect(notes().required).toBe(true);
});

test("TextArea submits the text that was typed", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <TextArea name="notes" label="Notes" defaultValue="Call back" />
    </form>,
  );

  expect(submittedValues()).toEqual(["notes=Call back"]);

  await user.clear(notes());
  await user.type(notes(), "Call back on Friday");
  expect(submittedValues()).toEqual(["notes=Call back on Friday"]);
});
