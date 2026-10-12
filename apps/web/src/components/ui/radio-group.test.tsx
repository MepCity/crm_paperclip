import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { Form } from "./form";
import { RadioGroup, type RadioOption } from "./radio-group";

const ratings: RadioOption[] = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

afterEach(cleanup);

const group = () => screen.getByRole("radiogroup", { name: "Rating" });
const option = (label: string) => screen.getByRole("radio", { name: label }) as HTMLInputElement;

test("RadioGroup labels the group and every option", () => {
  render(<RadioGroup name="rating" label="Rating" options={ratings} />);

  expect(screen.getAllByRole("radio")).toHaveLength(3);
  expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
    "hot",
    "warm",
    "cold",
  ]);
});

test("RadioGroup selects with a click and submits the chosen value", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <RadioGroup name="rating" label="Rating" options={ratings} />
    </form>,
  );

  expect(submittedValues()).toEqual([]);

  await user.click(option("Warm"));
  expect(submittedValues()).toEqual(["rating=warm"]);
});

test("RadioGroup moves the selection with the arrow keys", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <RadioGroup name="rating" label="Rating" options={ratings} defaultValue="hot" />
    </form>,
  );

  option("Hot").focus();
  expect(submittedValues()).toEqual(["rating=hot"]);

  await user.keyboard("{ArrowDown}");
  expect(submittedValues()).toEqual(["rating=warm"]);

  await user.keyboard("{ArrowDown}");
  expect(submittedValues()).toEqual(["rating=cold"]);

  await user.keyboard("{ArrowUp}");
  expect(submittedValues()).toEqual(["rating=warm"]);
});

test("RadioGroup lays its options out in the requested orientation", () => {
  render(<RadioGroup name="rating" label="Rating" options={ratings} orientation="horizontal" />);

  expect(group().getAttribute("data-orientation")).toBe("horizontal");
});

test("RadioGroup shows its description to assistive technology", () => {
  render(<RadioGroup name="rating" label="Rating" options={ratings} description="Pick one" />);

  expect(describedBy(group())).toBe("Pick one");
});

test("RadioGroup ties its error message to the group", () => {
  render(
    <RadioGroup name="rating" label="Rating" options={ratings} isInvalid errorMessage="Required" />,
  );

  expect(group().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(group())).toBe("Required");
});

test("RadioGroup shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { rating: ["Pick a rating"] },
      }}
    >
      <RadioGroup name="rating" label="Rating" options={ratings} />
    </Form>,
  );

  expect(group().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(group())).toBe("Pick a rating");
});

test("RadioGroup disables a single option", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <RadioGroup
        name="rating"
        label="Rating"
        options={[ratings[0] as RadioOption, { value: "cold", label: "Cold", isDisabled: true }]}
      />
    </form>,
  );

  expect(option("Cold").disabled).toBe(true);
  await user.click(option("Cold"));
  expect(submittedValues()).toEqual([]);
});

test("RadioGroup in the disabled state cannot be changed", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <RadioGroup name="rating" label="Rating" options={ratings} isDisabled />
    </form>,
  );

  expect(option("Hot").disabled).toBe(true);
  await user.click(option("Hot"));
  expect(submittedValues()).toEqual([]);
});

test("RadioGroup marks itself required", () => {
  render(<RadioGroup name="rating" label="Rating" options={ratings} isRequired />);

  expect(group().getAttribute("aria-required")).toBe("true");
});
