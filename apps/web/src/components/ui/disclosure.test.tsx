import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Disclosure } from "./disclosure";
import { Icons } from "./icon";

afterEach(cleanup);

test("Disclosure exposes expanded state and opens and closes using Enter and Space", async () => {
  const user = userEvent.setup();
  render(
    <Disclosure label="Details">
      <p>Content</p>
    </Disclosure>,
  );
  const trigger = screen.getByRole("button", { name: "Details" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("group")).toBeNull();
  await user.tab();
  expect(document.activeElement).toBe(trigger);
  await user.keyboard("{Enter}");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Content")).toBeTruthy();
  expect(trigger.getAttribute("aria-controls")).toBeTruthy();
  await user.keyboard(" ");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("group")).toBeNull();
});

test("Rail Disclosure starts expanded and collapses using the mouse", async () => {
  const user = userEvent.setup();
  render(
    <Disclosure label="Sales" icon={Icons.folder} variant="rail" defaultExpanded>
      <p>Modules</p>
    </Disclosure>,
  );
  const trigger = screen.getByRole("button", { name: "Sales" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  await user.click(trigger);
  expect(screen.queryByRole("group")).toBeNull();
});
