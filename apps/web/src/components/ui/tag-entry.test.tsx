import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { TagEntry } from "./tag-entry";

afterEach(cleanup);

it("keeps composing Enter/comma in the input and commits ordinary delimiters", async () => {
  const add = vi.fn();
  render(
    <TagEntry value="Example" onChange={vi.fn()} onAdd={add} suggestions={[]} disabled={false} />,
  );
  const input = screen.getByRole("combobox", { name: "Enter Tags" });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent.keyDown(input, { key: ",", isComposing: true });
  expect(add).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "," });
  expect(add).toHaveBeenCalledWith("Example");
});

it("supports catalogue selection by keyboard and disables editing while saving", async () => {
  const add = vi.fn();
  function Field() {
    const [value, setValue] = useState("");
    return (
      <TagEntry
        value={value}
        onChange={setValue}
        onAdd={add}
        suggestions={[
          { id: "a", name: "Alpha" },
          { id: "b", name: "Beta" },
        ]}
        disabled={false}
      />
    );
  }
  const { rerender } = render(<Field />);
  const user = userEvent.setup();
  await user.type(screen.getByRole("combobox"), "Al");
  expect(await screen.findByRole("option", { name: "Alpha" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: "Beta" })).toBeNull();
  await user.keyboard("{ArrowDown}{Enter}");
  expect(add).toHaveBeenCalledWith("Alpha");
  rerender(<TagEntry value="" onChange={vi.fn()} onAdd={add} suggestions={[]} disabled />);
  expect((screen.getByRole("combobox") as HTMLInputElement).disabled).toBe(true);
});
