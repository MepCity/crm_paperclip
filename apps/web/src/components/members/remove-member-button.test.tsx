import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { render } from "@/test/render";
import { RemoveMemberButton } from "./remove-member-button";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("renders remove button with accessible name", () => {
  render(<RemoveMemberButton name="Ada Lovelace" onRemove={vi.fn()} report={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Remove Ada Lovelace" })).toBeTruthy();
});

test("clicking button opens confirmation dialog with details and cancel dismisses without removing", async () => {
  const onRemove = vi.fn();
  const user = userEvent.setup();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Remove Ada Lovelace" })).toBeTruthy();
  expect(screen.getByText("Ada Lovelace will lose access to this organization.")).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onRemove).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("confirming calls onRemove, clears errors and refreshes router on success", async () => {
  const onRemove = vi.fn(async (): Promise<ActionState> => ({ status: "success" }));
  const report = vi.fn();
  const user = userEvent.setup();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={report} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));

  await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  expect(report).toHaveBeenCalledWith(null);
  expect(refreshMock).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
});

test("reports error message when onRemove returns an error status", async () => {
  const onRemove = vi.fn(
    async (): Promise<ActionState> => ({
      status: "error",
      message: "You do not have permission to remove this member.",
    }),
  );
  const report = vi.fn();
  const user = userEvent.setup();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={report} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));

  await waitFor(() =>
    expect(report).toHaveBeenCalledWith("You do not have permission to remove this member."),
  );
  expect(refreshMock).not.toHaveBeenCalled();
});

test("disables cancel and confirm buttons while removal is pending", async () => {
  let resolveRemove: (state: ActionState) => void = () => {};
  const onRemove = vi.fn(
    () =>
      new Promise<ActionState>((resolve) => {
        resolveRemove = resolve;
      }),
  );
  const user = userEvent.setup();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  const confirmButton = screen.getByRole("button", {
    name: "Remove",
  }) as HTMLButtonElement;
  const cancelButton = screen.getByRole("button", {
    name: "Cancel",
  }) as HTMLButtonElement;

  expect(confirmButton.disabled).toBe(false);
  expect(cancelButton.disabled).toBe(false);

  await user.click(confirmButton);

  await waitFor(() => expect(confirmButton.disabled).toBe(true));
  expect(cancelButton.disabled).toBe(true);

  resolveRemove({ status: "success" });
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
});
