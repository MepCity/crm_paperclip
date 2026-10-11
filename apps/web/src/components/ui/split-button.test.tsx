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

test("SplitButton supports laterModule on primary half while More half works", async () => {
  const user = userEvent.setup();
  const primary = vi.fn();
  const action = vi.fn();
  render(
    <SplitButton
      label="Create Record"
      onPress={primary}
      laterModule="M3"
      items={[{ id: "import", label: "Import", onAction: action }]}
    />,
  );

  const primaryBtn = screen.getByRole("button", { name: "Create Record" });
  expect(primaryBtn.getAttribute("aria-disabled")).toBe("true");
  expect(primaryBtn.getAttribute("data-later-module")).toBe("M3");
  expect(primaryBtn.hasAttribute("title")).toBe(false);
  expect(primaryBtn.hasAttribute("data-disabled")).toBe(false);

  await user.click(primaryBtn);
  expect(primary).not.toHaveBeenCalled();

  primaryBtn.focus();
  await user.keyboard("{Enter}");
  expect(primary).not.toHaveBeenCalled();
  await user.keyboard(" ");
  expect(primary).not.toHaveBeenCalled();

  const more = screen.getByRole("button", { name: "More" });
  await user.click(more);
  expect(screen.getByRole("menu")).toBeTruthy();

  await user.click(screen.getByRole("menuitem", { name: "Import" }));
  expect(action).toHaveBeenCalledTimes(1);
});

test("SplitButton supports laterModule on More half while primary half works", async () => {
  const user = userEvent.setup();
  const primary = vi.fn();
  render(
    <SplitButton
      label="Create Record"
      onPress={primary}
      moreLaterModule="M4"
      items={[{ id: "import", label: "Import", onAction: vi.fn() }]}
    />,
  );

  const primaryBtn = screen.getByRole("button", { name: "Create Record" });
  const moreBtn = screen.getByRole("button", { name: "More" });

  expect(moreBtn.getAttribute("aria-disabled")).toBe("true");
  expect(moreBtn.getAttribute("data-later-module")).toBe("M4");
  expect(moreBtn.hasAttribute("title")).toBe(false);
  expect(moreBtn.hasAttribute("data-disabled")).toBe(false);

  await user.click(primaryBtn);
  expect(primary).toHaveBeenCalledTimes(1);

  await user.click(moreBtn);
  expect(screen.queryByRole("menu")).toBeNull();

  moreBtn.focus();
  await user.keyboard("{Enter}");
  expect(screen.queryByRole("menu")).toBeNull();
  await user.keyboard(" ");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("SplitButton with link primary part supports laterModule", async () => {
  const user = userEvent.setup();
  render(<SplitButton label="Create Link" href="/target" laterModule="M3" />);

  const link = screen.getByRole("link", { name: "Create Link" });
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.getAttribute("data-later-module")).toBe("M3");
  expect(link.tagName).toBe("SPAN");

  await user.click(link);
  link.focus();
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
});
