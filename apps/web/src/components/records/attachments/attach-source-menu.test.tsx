import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { AttachSourceMenu } from "./attach-source-menu";

afterEach(cleanup);

test("AttachSourceMenu renders trigger with chevron down", () => {
  render(<AttachSourceMenu onAttach={vi.fn()} />);
  const btn = screen.getByRole("button", { name: "Attach" });
  expect(btn.querySelector("span[data-related-action-label]")?.textContent).toBe("Attach");
  expect(btn.matches("[data-related-action-label]")).toBe(false);
  expect(btn.querySelector("[data-chevron=down]")).toBeTruthy();
});

test("AttachSourceMenu opens menu, flips chevron, displays sources in order", async () => {
  const user = userEvent.setup();
  const onAttach = vi.fn();
  render(<AttachSourceMenu onAttach={onAttach} />);
  const btn = screen.getByRole("button", { name: "Attach" });

  await user.click(btn);
  expect(btn.querySelector("[data-chevron=up]")).toBeTruthy();

  const items = screen.getAllByRole("menuitem");
  expect(items.map((i) => i.textContent)).toEqual([
    "Upload File",
    "Documents",
    "Other Cloud Drives",
    "Link (URL)",
  ]);

  const docItem = screen.getByRole("menuitem", { name: "Documents" });
  expect(docItem.getAttribute("data-later-module")).toBe("M9");
  expect(docItem.getAttribute("aria-disabled")).toBe("true");

  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  expect(btn.querySelector("[data-chevron=down]")).toBeTruthy();
});

test("AttachSourceMenu triggers onAttach for active items", async () => {
  const user = userEvent.setup();
  const onAttach = vi.fn();
  render(<AttachSourceMenu onAttach={onAttach} />);

  // Upload File
  await user.click(screen.getByRole("button", { name: "Attach" }));
  await user.click(screen.getByRole("menuitem", { name: "Upload File" }));
  expect(onAttach).toHaveBeenCalledWith("upload");

  // Other Cloud Drives
  await user.click(screen.getByRole("button", { name: "Attach" }));
  await user.click(screen.getByRole("menuitem", { name: "Other Cloud Drives" }));
  expect(onAttach).toHaveBeenCalledWith("cloud");

  // Link (URL)
  await user.click(screen.getByRole("button", { name: "Attach" }));
  await user.click(screen.getByRole("menuitem", { name: "Link (URL)" }));
  expect(onAttach).toHaveBeenCalledWith("link");
});
