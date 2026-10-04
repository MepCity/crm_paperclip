import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SplitButton } from "./split-button";

afterEach(cleanup);

test("SplitButton exposes separate primary and More names and keyboard actions", async () => {
  const user = userEvent.setup();
  const primary = vi.fn();
  const action = vi.fn();
  render(
    <SplitButton
      label="Create Lead"
      onPress={primary}
      items={[{ id: "example", label: "Example action", onAction: action }]}
    />,
  );
  const create = screen.getByRole("button", { name: "Create Lead" });
  create.focus();
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
  expect(primary).toHaveBeenCalledTimes(2);
  await user.tab();
  const more = screen.getByRole("button", { name: "More" });
  expect(document.activeElement).toBe(more);
  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");
  expect(action).toHaveBeenCalledTimes(1);
  expect(primary).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("menu")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(more));
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menu")).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("SplitButton omits the More part and divider without items", () => {
  const { container } = render(<SplitButton label="Create Lead" />);
  expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  expect(container.querySelector("[data-split-divider]")).toBeNull();
});

test("SplitButton primary part can be a link", () => {
  render(<SplitButton label="Create Lead" href="/dev/ui" />);
  expect(screen.getByRole("link", { name: "Create Lead" }).getAttribute("href")).toBe("/dev/ui");
});
