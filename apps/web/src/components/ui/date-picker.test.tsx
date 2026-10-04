import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { DatePicker } from "./date-picker";
import { Form } from "./form";

afterEach(cleanup);

const field = () => screen.getByRole("group", { name: "Due date" });
const segments = () => screen.getAllByRole("spinbutton");
const segmentTypes = () => segments().map((segment) => segment.getAttribute("data-type"));
const trigger = () => screen.getByRole("button", { name: /Calendar/ });

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  trigger().focus();
  await user.keyboard("{Enter}");
}

test("DatePicker labels the field and splits the day into segments", () => {
  render(<DatePicker name="due" label="Due date" />);

  expect(segmentTypes()).toEqual(["month", "day", "year"]);
});

test("DatePicker orders the segments by its locale", () => {
  render(<DatePicker name="due" label="Due date" locale="de-DE" />);

  expect(segmentTypes()).toEqual(["day", "month", "year"]);
});

test("DatePicker accepts a typed day and submits it as YYYY-MM-DD", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <DatePicker name="due" label="Due date" />
    </form>,
  );

  await user.click(segments()[0] as HTMLElement);
  await user.keyboard("03102026");

  expect(submittedValues()).toEqual(["due=2026-03-10"]);
});

test("DatePicker picks a day from the calendar with the keyboard", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <DatePicker name="due" label="Due date" defaultValue="2026-03-10" />
    </form>,
  );

  await openCalendar(user);
  expect(screen.getByRole("grid")).toBeTruthy();
  expect(screen.getByRole("heading").textContent).toBe("March 2026");

  // The calendar opens on the selected day, so one step right is the next day.
  await user.keyboard("{ArrowRight}");
  await user.keyboard("{Enter}");

  expect(submittedValues()).toEqual(["due=2026-03-11"]);
  expect(screen.queryByRole("grid")).toBeNull();
});

test("DatePicker submits the day that was picked, whatever the time zone is", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <DatePicker name="due" label="Due date" defaultValue="2026-03-01" />
    </form>,
  );

  await openCalendar(user);
  // Stepping back over a month boundary is where a time zone shift would show up.
  await user.keyboard("{ArrowLeft}");
  await user.keyboard("{Enter}");

  expect(submittedValues()).toEqual(["due=2026-02-28"]);
});

test("DatePicker closes the calendar with Escape", async () => {
  const user = userEvent.setup();
  render(<DatePicker name="due" label="Due date" defaultValue="2026-03-10" />);

  await openCalendar(user);
  expect(screen.queryByRole("grid")).toBeTruthy();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("grid")).toBeNull();
});

test("DatePicker shows its description to assistive technology", () => {
  render(<DatePicker name="due" label="Due date" description="Closing date of the deal" />);

  expect(describedBy(field())).toBe("Closing date of the deal");
});

test("DatePicker ties its error message to the field", () => {
  render(<DatePicker name="due" label="Due date" isInvalid errorMessage="Pick a date" />);

  // The segments carry the state for assistive technology, the group draws the border.
  expect(segments()[0]?.getAttribute("aria-invalid")).toBe("true");
  expect(field().getAttribute("data-invalid")).toBe("true");
  expect(describedBy(field())).toBe("Pick a date");
});

test("DatePicker shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { due: ["Pick a date"] },
      }}
    >
      <DatePicker name="due" label="Due date" />
    </Form>,
  );

  expect(field().getAttribute("data-invalid")).toBe("true");
  expect(describedBy(field())).toBe("Pick a date");
});

test("DatePicker in the disabled state cannot be opened", async () => {
  const user = userEvent.setup();
  render(<DatePicker name="due" label="Due date" isDisabled />);

  expect((trigger() as HTMLButtonElement).disabled).toBe(true);
  await user.click(trigger());
  expect(screen.queryByRole("grid")).toBeNull();
});

test("DatePicker marks itself required", () => {
  render(<DatePicker name="due" label="Due date" isRequired />);

  expect(segments()[0]?.getAttribute("aria-required")).toBe("true");
});
