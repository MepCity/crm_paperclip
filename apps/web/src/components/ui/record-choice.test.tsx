import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { RecordChoice } from "./record-choice";

afterEach(cleanup);
const options = [
  { value: null, label: "-None-" },
  { value: "a", label: "Alpha" },
];
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
