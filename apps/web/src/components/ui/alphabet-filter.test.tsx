import { cleanup, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ALPHABET_OPTIONS, AlphabetFilter } from "./alphabet-filter";

const LABEL = "Filter by first letter";

afterEach(cleanup);

function Controlled({
  initial = null,
  onChange = vi.fn(),
}: {
  initial?: string | null;
  onChange?: (letter: string | null) => void;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <AlphabetFilter
      label={LABEL}
      value={value}
      onChange={(letter) => {
        setValue(letter);
        onChange(letter);
      }}
    />
  );
}

function trigger() {
  return screen.getByRole("button", { name: LABEL });
}

async function openList(user: UserEvent) {
  await user.click(trigger());
  const list = await screen.findByRole("listbox", { name: `${LABEL} choices` });
  return { list, rows: within(list).getAllByRole("option") };
}

function selectedRows(rows: HTMLElement[]) {
  return rows.filter((row) => row.getAttribute("aria-selected") === "true");
}

test("the control shows the current choice and starts on All", () => {
  render(<Controlled />);
  expect(trigger().textContent).toBe("All");
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("a chosen letter becomes the control text", () => {
  render(<AlphabetFilter label={LABEL} value="K" onChange={vi.fn()} />);
  expect(trigger().textContent).toBe("K");
});

test("the list holds All and A to Z, in this order", async () => {
  const user = userEvent.setup();
  render(<Controlled />);
  const { rows } = await openList(user);
  expect(rows).toHaveLength(27);
  expect(rows.map((row) => row.textContent?.trim())).toEqual([...ALPHABET_OPTIONS]);
  expect(ALPHABET_OPTIONS[0]).toBe("All");
  expect([...ALPHABET_OPTIONS.slice(1)]).toEqual([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]);
});

test("the chosen letter is the selected row", async () => {
  const user = userEvent.setup();
  render(<Controlled initial="M" />);
  const { rows } = await openList(user);
  expect(selectedRows(rows).map((row) => row.textContent?.trim())).toEqual(["M"]);
});

test("All is the selected row while no letter is chosen", async () => {
  const user = userEvent.setup();
  render(<Controlled />);
  const { rows } = await openList(user);
  expect(selectedRows(rows).map((row) => row.textContent?.trim())).toEqual(["All"]);
});

test("a letter is reported and closes the list", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  const { list } = await openList(user);
  await user.click(within(list).getByRole("option", { name: "Q" }));
  expect(onChange).toHaveBeenCalledWith("Q");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(trigger().textContent).toBe("Q");
});

test("All is reported as null and closes the list", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Controlled initial="Q" onChange={onChange} />);
  const { list } = await openList(user);
  await user.click(within(list).getByRole("option", { name: "All" }));
  expect(onChange).toHaveBeenCalledWith(null);
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(trigger().textContent).toBe("All");
});

test("the list opens from the keyboard and walks with the arrow keys", async () => {
  const user = userEvent.setup();
  render(<Controlled />);
  trigger().focus();
  await user.keyboard("{ArrowDown}");
  const list = await screen.findByRole("listbox", { name: `${LABEL} choices` });
  const rows = within(list).getAllByRole("option");
  expect(rows[0]?.hasAttribute("data-focused")).toBe(true);
  await user.keyboard("{ArrowDown}{ArrowDown}");
  expect(rows[2]?.hasAttribute("data-focused")).toBe(true);
  await user.keyboard("{ArrowUp}");
  expect(rows[1]?.hasAttribute("data-focused")).toBe(true);
});

test("Enter on the focused row chooses it and closes the list", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  trigger().focus();
  await user.keyboard("{Enter}");
  await screen.findByRole("listbox", { name: `${LABEL} choices` });
  await user.keyboard("{ArrowDown}{Enter}");
  expect(onChange).toHaveBeenCalledWith("A");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(trigger().textContent).toBe("A");
});

test("Escape closes the list without choosing", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  const { rows } = await openList(user);
  await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
  expect(trigger().textContent).toBe("All");
  expect(rows[0]?.isConnected).toBe(false);
});

test("a click outside closes the list without choosing", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <div>
      <span data-testid="elsewhere">outside</span>
      <Controlled onChange={onChange} />
    </div>,
  );
  await openList(user);
  await user.click(screen.getByTestId("elsewhere"));
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
  expect(trigger().textContent).toBe("All");
});
