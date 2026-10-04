import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { Disclosure } from "./disclosure";

afterEach(cleanup);

test("Disclosure toggles by keyboard with its full label and aria-expanded", async () => {
  const user = userEvent.setup();
  render(
    <Disclosure label="A heading wider than the available space" defaultExpanded>
      <p>Panel contents</p>
    </Disclosure>,
  );
  const trigger = screen.getByRole("button", { name: "A heading wider than the available space" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  trigger.focus();
  await user.keyboard(" ");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  await user.keyboard("{Enter}");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});

test("Disclosure leads the heading with the expand icon", async () => {
  const user = userEvent.setup();
  render(
    <Disclosure label="System Defined Filters" defaultExpanded>
      <p>Panel contents</p>
    </Disclosure>,
  );
  const trigger = screen.getByRole("button", { name: "System Defined Filters" });
  const iconPrecedesLabel = () => {
    const icon = trigger.querySelector("svg");
    const label = trigger.querySelector("span");
    expect(icon).not.toBeNull();
    expect(label?.textContent).toBe("System Defined Filters");
    if (!icon || !label) return false;
    const position = icon.compareDocumentPosition(label);
    return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  };
  expect(iconPrecedesLabel()).toBe(true);
  expect(trigger.querySelector("svg title")).toBeNull();
  await user.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(iconPrecedesLabel()).toBe(true);
  expect(trigger.querySelector("svg title")).toBeNull();
});

test("Disclosure supports controlled expansion and a disabled trigger", async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn();
  const view = render(
    <Disclosure label="Samples" isExpanded={false} onExpandedChange={onExpandedChange}>
      <p>Panel contents</p>
    </Disclosure>,
  );
  const trigger = screen.getByRole("button", { name: "Samples" });
  await user.click(trigger);
  expect(onExpandedChange).toHaveBeenCalledWith(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  view.rerender(
    <Disclosure label="Samples" isExpanded isDisabled onExpandedChange={onExpandedChange}>
      <p>Panel contents</p>
    </Disclosure>,
  );
  onExpandedChange.mockClear();
  await user.click(trigger);
  expect(onExpandedChange).not.toHaveBeenCalled();
});
