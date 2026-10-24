import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { saveRecordTagsAction } from "@/app/crm/[orgSlug]/tags/actions";
import { SelectionTagsDialog } from "./selection-tags-dialog";

vi.mock("@/app/crm/[orgSlug]/tags/actions", () => ({ saveRecordTagsAction: vi.fn() }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

function setup(module: string) {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  render(
    <SelectionTagsDialog
      orgSlug="synthetic"
      module={module}
      recordIds={["r1", "r2"]}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />,
  );
  return { user: userEvent.setup(), onOpenChange, onSuccess };
}

it.each(["Solutions", "Cases"])("saves typed tag on every selected %s record", async (module) => {
  vi.mocked(saveRecordTagsAction).mockResolvedValue({ status: "success", tags: [], catalogue: [] });
  const { user, onOpenChange, onSuccess } = setup(module);
  await user.type(screen.getByRole("combobox", { name: "Enter Tags" }), "Priority");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  expect(saveRecordTagsAction).toHaveBeenCalledTimes(2);
  expect(saveRecordTagsAction).toHaveBeenCalledWith("synthetic", module, "r1", ["Priority"]);
  expect(saveRecordTagsAction).toHaveBeenCalledWith("synthetic", module, "r2", ["Priority"]);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("shows the error and stays open when saving fails", async () => {
  vi.mocked(saveRecordTagsAction).mockResolvedValue({ status: "error", message: "Locked record." });
  const { user, onSuccess } = setup("Solutions");
  await user.type(screen.getByRole("combobox", { name: "Enter Tags" }), "Alpha");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Locked record.");
  expect(onSuccess).not.toHaveBeenCalled();
});
