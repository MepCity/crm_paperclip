import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { render } from "@/test/render";
import { RemoveMemberButton } from "./remove-member-button";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});

test("opens a dialog titled Remove <name> with loss of access warning", async () => {
  const user = userEvent.setup();
  render(<RemoveMemberButton name="Ada Lovelace" onRemove={vi.fn()} report={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));

  expect(screen.getByRole("alertdialog")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Remove Ada Lovelace" })).toBeTruthy();
  expect(screen.getByText("Ada Lovelace will lose access to this organization.")).toBeTruthy();
});

test("Cancel closes the dialog without calling onRemove or report", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  const report = vi.fn();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={report} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(onRemove).not.toHaveBeenCalled();
  expect(report).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
});

test("Remove calls report(null) then onRemove once and refreshes on success", async () => {
  const calls: string[] = [];
  const report = vi.fn((message: string | null) => {
    calls.push(`report:${message}`);
  });
  const onRemove = vi.fn(async (): Promise<ActionState> => {
    calls.push("onRemove");
    return { status: "success" };
  });
  const user = userEvent.setup();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={report} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));

  await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  expect(calls).toEqual(["report:null", "onRemove"]);
  expect(router.refresh).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledTimes(1);
});

test("Remove reports error message and does not refresh when onRemove fails", async () => {
  const calls: string[] = [];
  const report = vi.fn((message: string | null) => {
    calls.push(`report:${message}`);
  });
  const onRemove = vi.fn(async (): Promise<ActionState> => {
    calls.push("onRemove");
    return { status: "error", message: "Cannot remove member." };
  });
  const user = userEvent.setup();

  render(<RemoveMemberButton name="Ada Lovelace" onRemove={onRemove} report={report} />);

  await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));

  await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  expect(calls).toEqual(["report:null", "onRemove", "report:Cannot remove member."]);
  expect(router.refresh).not.toHaveBeenCalled();
});
