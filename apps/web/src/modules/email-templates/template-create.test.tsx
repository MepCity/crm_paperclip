import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { TemplateCreate } from "./template-create";

afterEach(cleanup);

it("selects a module, opens the gallery and editor, preserves text across modes and exposes both save choices", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<TemplateCreate modules={["Leads", "Contacts"]} onClose={close} />);
  expect(screen.getByRole("dialog", { name: "Create Email Template" })).toBeDefined();
  await user.click(screen.getByRole("button", { name: /Select Module/ }));
  await user.click(screen.getByRole("option", { name: "Contacts" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Template Gallery" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "Basic 6" })).toBeDefined();
  expect(screen.getByText("Blank")).toBeDefined();
  for (const category of [
    "All",
    "Basic",
    "Celebration",
    "Invitation",
    "Follow-up",
    "Product Promotion",
    "Notification",
  ])
    expect(screen.getByRole("button", { name: category })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Add HTML / Plain Text" }));
  await user.type(screen.getByRole("textbox", { name: "Template name" }), "Welcome");
  await user.type(screen.getByRole("textbox", { name: "Template body" }), "Hello there");
  await user.click(screen.getByRole("button", { name: "Plain text" }));
  expect(screen.getByRole("textbox", { name: "Template body" }).textContent).toBe("Hello there");
  const toolbar = screen.getByRole("toolbar", { name: "Template formatting" });
  expect(within(toolbar).getByRole("button", { name: "HTML" })).toBeDefined();
  expect(within(toolbar).getByRole("button", { name: "Show Tips" })).toBeDefined();
  expect(within(toolbar).getByRole("button", { name: "Bold" })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "HTML" }));
  expect(screen.getByRole("textbox", { name: "Template body" }).textContent).toBe("Hello there");
  await user.click(screen.getByRole("button", { name: "Save" }));
  const menu = screen.getByRole("menu", { name: "Save" });
  for (const name of ["Save now", "Save as draft"])
    expect(within(menu).getByRole("menuitem", { name }).getAttribute("aria-disabled")).toBe("true");
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledOnce();
});

it("cancels the module dialog without entering the gallery", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<TemplateCreate modules={["Leads"]} onClose={close} />);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledOnce();
});
