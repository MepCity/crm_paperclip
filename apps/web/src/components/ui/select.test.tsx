import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
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

  // The invalid state is the styling hook for the field and its error.
  expect(trigger.parentElement?.getAttribute("data-invalid")).toBe("true");
});

test("Select in the disabled state cannot be opened", async () => {
  const user = userEvent.setup();
  render(<FruitSelect isDisabled />);

  const trigger = screen.getByRole("button", { name: /Fruit/ }) as HTMLButtonElement;
  expect(trigger.disabled).toBe(true);

  await user.click(trigger);
  expect(screen.queryByRole("listbox")).toBeNull();
});
