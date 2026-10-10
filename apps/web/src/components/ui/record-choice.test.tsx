import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { RecordChoice } from "./record-choice";

afterEach(cleanup);
const options = [
  { value: null, label: "-None-" },
  { value: "a", label: "Alpha" },
];

test("muted empty value uses placeholder ink on the value span only", () => {
  render(
    <RecordChoice
      label="Salutation"
      value={null}
      onChange={() => {}}
      options={options}
      mutedEmpty
    />,
  );
  const trigger = screen.getByRole("button", { name: "Salutation" });
  const value = trigger.querySelector("[data-part=empty-value]");
  expect(value).toBeTruthy();
  expect((value as Element).classList.contains("record-prefix-empty")).toBe(true);
  expect(trigger.classList.contains("record-prefix-empty")).toBe(false);
});

test("selected muted choice drops empty marker and uses value ink", async () => {
  const user = userEvent.setup();
  function Controlled() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <RecordChoice
        label="Salutation"
        value={value}
        onChange={setValue}
        options={options}
        mutedEmpty
      />
    );
  }
  render(<Controlled />);
  await user.click(screen.getByRole("button", { name: "Salutation" }));
  await user.click(screen.getByRole("option", { name: "Alpha" }));
  const trigger = screen.getByRole("button", { name: "Salutation" });
  const span = document.getElementById(trigger.getAttribute("aria-describedby") ?? "");
  expect(span?.getAttribute("data-part")).toBeNull();
  expect(span?.classList.contains("record-prefix-empty")).toBe(false);
});

test("arrow opens a choice panel and Escape restores the trigger", async () => {
  const user = userEvent.setup();
  render(<RecordChoice label="Choice" value={null} onChange={() => {}} options={options} />);
  const trigger = screen.getByRole("button", { name: "Choice" });
  expect(document.getElementById(trigger.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
    "-None-",
  );
  trigger.focus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("listbox")).toBeTruthy();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
test("isolated open example and disabled state respect controlled selection", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const result = render(
    <RecordChoice label="Choice" value="a" onChange={change} options={options} defaultOpen />,
  );
  expect(screen.getByRole("option", { name: "Alpha" }).getAttribute("aria-selected")).toBe("true");
  await user.click(screen.getByRole("option", { name: "Alpha" }));
  expect(change).toHaveBeenLastCalledWith("a");
  result.rerender(
    <RecordChoice
      label="Choice"
      value="a"
      onChange={change}
      options={options}
      disabled
      defaultOpen
    />,
  );
  expect(screen.queryByRole("listbox")).toBeNull();
  expect((screen.getByRole("button", { name: "Choice" }) as HTMLButtonElement).disabled).toBe(true);
});

test.each([false, true])("choice keeps one selected marker with inline=%s", (inline) => {
  render(
    <RecordChoice
      label="Choice"
      value="a"
      onChange={() => {}}
      options={options}
      defaultOpen
      inline={inline}
    />,
  );
  const selected = screen.getByRole("option", { name: "Alpha" });
  const empty = screen.getByRole("option", { name: "-None-" });
  expect(selected.getAttribute("aria-selected")).toBe("true");
  expect(selected.querySelectorAll("svg")).toHaveLength(1);
  expect(empty.querySelectorAll("svg")).toHaveLength(0);
  expect(selected.querySelector(".record-inline-choice-check") !== null).toBe(inline);
  expect(selected.querySelector(".record-choice-check") !== null).toBe(!inline);
  expect(empty.querySelector(".record-inline-choice-check") !== null).toBe(inline);
});
