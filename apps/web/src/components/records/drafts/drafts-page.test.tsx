import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { DraftsPage, type DraftsPageProps } from "./drafts-page";

afterEach(cleanup);

function setup(overrides: Partial<DraftsPageProps> = {}) {
  const props = {
    onBack: vi.fn(),
    onInfo: vi.fn(),
    onHelp: vi.fn(),
    onAddCriterion: vi.fn(),
    ...overrides,
  };
  const view = render(<DraftsPage {...props} />);
  return { ...view, props, user: userEvent.setup() };
}

test("PS-07–PS-16: renders header, criteria card, controls, and empty results card", async () => {
  const { user, props } = setup();

  // Header Title
  expect(screen.getByRole("heading", { name: "Drafts" })).toBeTruthy();

  // PS-07: Back navigation
  const backButton = screen.getByRole("button", { name: "Back" });
  expect(backButton).toBeTruthy();
  expect((backButton as HTMLButtonElement).disabled).toBe(false);
  await user.click(backButton);
  expect(props.onBack).toHaveBeenCalledOnce();

  // PS-08: Information icon
  const infoButton = screen.getByRole("button", { name: "Information" });
  expect(infoButton).toBeTruthy();
  expect((infoButton as HTMLButtonElement).disabled).toBe(false);
  await user.click(infoButton);
  expect(props.onInfo).toHaveBeenCalledOnce();

  // PS-09: Help
  const helpButton = screen.getByRole("button", { name: "Help" });
  expect(helpButton).toBeTruthy();
  expect((helpButton as HTMLButtonElement).disabled).toBe(false);
  await user.click(helpButton);
  expect(props.onHelp).toHaveBeenCalledOnce();

  // Criteria Card heading
  expect(screen.getByRole("heading", { name: "Criteria" })).toBeTruthy();

  // PS-11: Number/index box showing "1"
  const indexInput = screen.getByRole("textbox", { name: "Criterion index" }) as HTMLInputElement;
  expect(indexInput).toBeTruthy();
  expect(indexInput.value).toBe("1");

  // PS-12: Field selector showing None
  const fieldSelector = screen.getByRole("button", { name: "Field selector" }) as HTMLButtonElement;
  expect(fieldSelector).toBeTruthy();
  expect(fieldSelector.disabled).toBe(false);
  expect(fieldSelector.textContent).toContain("None");

  // PS-13: Operator selector disabled showing None
  const operatorSelector = screen.getByRole("button", {
    name: "Operator selector",
  }) as HTMLButtonElement;
  expect(operatorSelector).toBeTruthy();
  expect(operatorSelector.disabled).toBe(true);
  expect(operatorSelector.textContent).toContain("None");

  // PS-14: Value textbox disabled
  const valueInput = screen.getByRole("textbox", { name: "Criterion value" }) as HTMLInputElement;
  expect(valueInput).toBeTruthy();
  expect(valueInput.disabled).toBe(true);

  // PS-15: Plus icon
  const addBtn = screen.getByRole("button", { name: "Add criterion" }) as HTMLButtonElement;
  expect(addBtn).toBeTruthy();
  expect(addBtn.disabled).toBe(false);
  await user.click(addBtn);
  expect(props.onAddCriterion).toHaveBeenCalledOnce();

  // PS-16: Search button disabled
  const searchButton = screen.getByRole("button", { name: "Search" }) as HTMLButtonElement;
  expect(searchButton).toBeTruthy();
  expect(searchButton.disabled).toBe(true);

  // Results Card: empty status
  expect(screen.getByText("No records available")).toBeTruthy();

  // PS-10: Hide / chevron toggles local expanded state
  const hideButton = screen.getByRole("button", { name: "Hide criteria" });
  expect(hideButton).toBeTruthy();
  await user.click(hideButton);

  // When collapsed, criteria row controls and search button should be hidden
  expect(screen.queryByRole("textbox", { name: "Criterion index" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Field selector" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Search" })).toBeNull();

  // Toggle back to Show
  const showButton = screen.getByRole("button", { name: "Show criteria" });
  expect(showButton).toBeTruthy();
  await user.click(showButton);

  // When re-expanded, controls are visible again
  expect(screen.getByRole("textbox", { name: "Criterion index" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Field selector" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
});
