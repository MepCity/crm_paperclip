import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ManageTagsPage, type ManageTagsPageProps } from "./manage-tags-page";

afterEach(cleanup);

function setup(overrides: Partial<ManageTagsPageProps> = {}) {
  const props = {
    onBack: vi.fn(),
    onHelp: vi.fn(),
    onNewTag: vi.fn(),
    ...overrides,
  };
  const view = render(<ManageTagsPage {...props} />);
  return { ...view, props, user: userEvent.setup() };
}

test("TAG-09–TAG-11: renders header, back navigation, module badge, help, and empty table with New Tag", async () => {
  const { user, props } = setup();

  // Header and title
  expect(screen.getByRole("heading", { name: "Manage Tags" })).toBeTruthy();
  expect(screen.getByText("Leads")).toBeTruthy();

  // Explanatory paragraph
  expect(screen.getByText(/Tags are keywords that help you categorize your records/)).toBeTruthy();

  // Usage counter default
  expect(screen.getByText("Tags used : 0 / 100")).toBeTruthy();

  // Table columns
  expect(screen.getByRole("columnheader", { name: "Tag Color" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Tag Name" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Last Modified" })).toBeTruthy();

  // Empty state line
  expect(screen.getByText(/There are currently no available Tags/)).toBeTruthy();

  // TAG-09: Back button
  const backButton = screen.getByRole("button", { name: "Back" });
  expect(backButton).toBeTruthy();
  await user.click(backButton);
  expect(props.onBack).toHaveBeenCalledOnce();

  // TAG-10: Help action
  const helpButton = screen.getByRole("button", { name: "Help" });
  expect(helpButton).toBeTruthy();
  await user.click(helpButton);
  expect(props.onHelp).toHaveBeenCalledOnce();

  // TAG-11: New Tag button
  const newTagButton = screen.getByRole("button", { name: "New Tag" });
  expect(newTagButton).toBeTruthy();
  await user.click(newTagButton);
  expect(props.onNewTag).toHaveBeenCalledOnce();
});

test("renders custom module name and usage counter props", () => {
  setup({
    moduleName: "Contacts",
    tagsUsed: 12,
    tagsCapacity: 200,
  });

  expect(screen.getByText("Contacts")).toBeTruthy();
  expect(screen.getByText("Tags used : 12 / 200")).toBeTruthy();
});

test("lists tags and supports interim create, rename and confirmed deletion", async () => {
  const tag = {
    id: "one",
    module: "Leads",
    name: "Example",
    color: null,
    createdBy: "actor",
    modifiedBy: "actor",
    createdAt: "2026-10-17T10:00:00Z",
    modifiedAt: "2026-10-17T10:00:00Z",
  };
  const onSave = vi.fn(async () => true);
  const onDelete = vi.fn(async () => true);
  const { user } = setup({ tags: [tag], onSave, onDelete });
  expect(screen.getByText("Tags used : 1 / 100")).toBeTruthy();
  expect(screen.getByText("Example")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "New Tag" }));
  await user.type(screen.getByRole("textbox", { name: "Tag Name" }), "Second");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave).toHaveBeenCalledWith("Second", undefined);
  await user.click(screen.getByRole("button", { name: "Rename tag Example" }));
  const input = screen.getByRole("textbox", { name: "Tag Name" });
  await user.clear(input);
  await user.type(input, "Renamed");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave).toHaveBeenCalledWith("Renamed", "one");
  await user.click(screen.getByRole("button", { name: "Delete tag Example" }));
  expect(onDelete).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(onDelete).toHaveBeenCalledWith("one");
});

test("hides mutations without management permission and reports load errors", () => {
  setup({ canManage: false, error: "Permission denied" });
  expect(screen.queryByRole("button", { name: "New Tag" })).toBeNull();
  expect(screen.getByRole("alert").textContent).toBe("Permission denied");
});

test("rejects blank and overlength names; cancellation does not save", async () => {
  const onSave = vi.fn();
  const { user } = setup({ onSave });
  await user.click(screen.getByRole("button", { name: "New Tag" }));
  expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
  await user.type(screen.getByRole("textbox", { name: "Tag Name" }), "x".repeat(51));
  expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onSave).not.toHaveBeenCalled();
});
