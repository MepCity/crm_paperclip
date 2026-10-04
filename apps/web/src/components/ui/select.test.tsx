import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { Form } from "./form";
import { Select, SelectItem } from "./select";

const fruits = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
];

interface FruitSelectProps {
  isDisabled?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
}

function FruitSelect(props: FruitSelectProps) {
  return (
    <Select label="Fruit" items={fruits} {...props}>
      {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
    </Select>
  );
}

afterEach(cleanup);

test("Select opens with the keyboard, chooses with Enter and shows the value", async () => {
  const user = userEvent.setup();
  render(<FruitSelect />);

  const trigger = screen.getByRole("button", { name: /Fruit/ });
  // The placeholder comes from the fixed en-US locale, not the browser locale.
  expect(trigger.textContent).toContain("Select an item");

  trigger.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("listbox")).toBeTruthy();

  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");

  expect(screen.queryByRole("listbox")).toBeNull();
  expect(trigger.textContent).toContain("Banana");
});

test("Select ties its error message to the trigger", () => {
  render(<FruitSelect isInvalid errorMessage="Pick a fruit" />);

  const trigger = screen.getByRole("button", { name: /Fruit/ });
  const describedBy = trigger.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy as string)?.textContent).toBe("Pick a fruit");
});

test("Select marks its trigger invalid so the border follows the danger token", () => {
  const { unmount } = render(<FruitSelect isInvalid errorMessage="Pick a fruit" />);

  // The trigger draws the border, so the styling hook has to live on the trigger.
  expect(screen.getByRole("button", { name: /Fruit/ }).getAttribute("data-invalid")).toBe("true");

  unmount();
  render(<FruitSelect />);

  expect(screen.getByRole("button", { name: /Fruit/ }).getAttribute("data-invalid")).toBeNull();
});

test("Select marks its trigger invalid from form field errors", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { fruit: ["Pick a fruit"] },
      }}
    >
      <Select name="fruit" label="Fruit" items={fruits}>
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
    </Form>,
  );

  expect(screen.getByRole("button", { name: /Fruit/ }).getAttribute("data-invalid")).toBe("true");
});

test("Select in the disabled state cannot be opened", async () => {
  const user = userEvent.setup();
  render(<FruitSelect isDisabled />);

  const trigger = screen.getByRole("button", { name: /Fruit/ }) as HTMLButtonElement;
  expect(trigger.disabled).toBe(true);

  await user.click(trigger);
  expect(screen.queryByRole("listbox")).toBeNull();
});
