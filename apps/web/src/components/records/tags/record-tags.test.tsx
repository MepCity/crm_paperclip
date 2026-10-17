import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  readRecordTagsAction,
  removeRecordTagAction,
  saveRecordTagsAction,
} from "@/app/crm/[orgSlug]/tags/actions";
import { RecordTags } from "./record-tags";

vi.mock("@/app/crm/[orgSlug]/tags/actions", () => ({
  readRecordTagsAction: vi.fn(),
  removeRecordTagAction: vi.fn(),
  saveRecordTagsAction: vi.fn(),
}));
const tag = {
  id: "tag-a",
  module: "Leads",
  name: "Alpha",
  color: null,
  createdBy: "actor",
  createdAt: "",
  modifiedBy: "actor",
  modifiedAt: "",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readRecordTagsAction).mockResolvedValue({
    status: "success",
    tags: [],
    catalogue: [tag],
  });
});
afterEach(cleanup);
function setup() {
  render(<RecordTags orgSlug="synthetic" module="Leads" recordId="record-a" label="Add Tags" />);
  return userEvent.setup();
}

it("opens with focused empty input and disabled Save; Escape and Cancel discard input", async () => {
  const user = setup();
  const trigger = screen.getByRole("button", { name: "Add Tags" });
  await user.click(trigger);
  const input = screen.getByRole("combobox", { name: "Enter Tags" });
  await waitFor(() => expect(document.activeElement).toBe(input));
  expect(input.getAttribute("placeholder")).toBe("Enter Tags");
  expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  await user.type(input, "Draft");
  expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(trigger);
  expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("");
  await user.type(screen.getByRole("combobox"), "Draft,");
  expect(screen.getByRole("button", { name: "Remove pending tag Draft" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(saveRecordTagsAction).not.toHaveBeenCalled();
});

it("creates pending chips with Enter/comma, saves and removes a record chip", async () => {
  vi.mocked(saveRecordTagsAction).mockResolvedValue({
    status: "success",
    tags: [tag],
    catalogue: [tag],
  });
  vi.mocked(removeRecordTagAction).mockResolvedValue({
    status: "success",
    tags: [],
    catalogue: [tag],
  });
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Add Tags" }));
  await user.type(screen.getByRole("combobox"), "Alpha{Enter}Beta,");
  expect(screen.getByRole("button", { name: "Remove pending tag Alpha" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remove pending tag Beta" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(saveRecordTagsAction).toHaveBeenCalledWith("synthetic", "Leads", "record-a", [
    "Alpha",
    "Beta",
  ]);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await user.click(screen.getByRole("button", { name: "Remove tag Alpha" }));
  expect(removeRecordTagAction).toHaveBeenCalledWith("synthetic", "Leads", "record-a", "tag-a");
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Remove tag Alpha" })).toBeNull(),
  );
});

it("filters suggestions and displays the service field error without closing", async () => {
  vi.mocked(saveRecordTagsAction).mockResolvedValue({
    status: "error",
    message: "Invalid",
    fieldErrors: { name: ["Tag name is too long."] },
  });
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Add Tags" }));
  await user.type(screen.getByRole("combobox"), "Al");
  expect(await screen.findByRole("option", { name: "Alpha" })).toBeTruthy();
  await user.click(screen.getByRole("option", { name: "Alpha" }));
  expect(screen.getByRole("button", { name: "Remove pending tag Alpha" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Tag name is too long.");
  expect(screen.getByRole("dialog", { name: "Add Tags" })).toBeTruthy();
});

it("keeps the chip and shows the service error when removal fails", async () => {
  vi.mocked(readRecordTagsAction).mockResolvedValue({
    status: "success",
    tags: [tag],
    catalogue: [tag],
  });
  vi.mocked(removeRecordTagAction).mockResolvedValue({
    status: "error",
    message: "Record is locked.",
  });
  const user = setup();
  await user.click(await screen.findByRole("button", { name: "Remove tag Alpha" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Record is locked.");
  expect(screen.getByRole("button", { name: "Remove tag Alpha" })).toBeTruthy();
});

it("ignores an old catalogue read that finishes after Save", async () => {
  let finishRead: ((result: Awaited<ReturnType<typeof readRecordTagsAction>>) => void) | undefined;
  vi.mocked(readRecordTagsAction).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRead = resolve;
      }),
  );
  vi.mocked(saveRecordTagsAction).mockResolvedValue({
    status: "success",
    tags: [tag],
    catalogue: [tag],
  });
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Add Tags" }));
  await user.type(screen.getByRole("combobox"), "Alpha{Enter}");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("button", { name: "Remove tag Alpha" });
  finishRead?.({ status: "success", tags: [], catalogue: [] });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Remove tag Alpha" })).toBeTruthy(),
  );
});
