import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { CloudDrivesDialog, type CloudDrivesDialogProps } from "./cloud-drives-dialog";

afterEach(cleanup);

function setup(props: Partial<CloudDrivesDialogProps> = {}) {
  const onClose = vi.fn();
  const view = render(<CloudDrivesDialog open onClose={onClose} {...props} />);
  return { onClose, view };
}

test("shows title and Close Modal button, and Google Drive selected by default", async () => {
  setup();
  expect(screen.getByRole("heading", { name: "Attach from Cloud Drives" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Close Modal" })).toBeTruthy();
  expect(screen.getByText("Your Google Drive account is not connected.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Authenticate Google Drive" })).toBeTruthy();
});

test("renders the six providers in exact required order", () => {
  setup();
  const providerNames = ["Google Drive", "Box", "Evernote", "Dropbox", "OneDrive", "SharePoint"];

  const buttons = screen.getAllByRole("button");
  const navButtons = buttons.filter((btn) => providerNames.includes(btn.textContent ?? ""));
  expect(navButtons.map((btn) => btn.textContent)).toEqual(providerNames);
});

test("switching provider updates body text and authenticate button", async () => {
  const user = userEvent.setup();
  setup();

  // Click Box
  await user.click(screen.getByRole("button", { name: "Box" }));
  expect(screen.getByText("Your Box account is not connected.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Authenticate Box" })).toBeTruthy();

  // Click OneDrive
  await user.click(screen.getByRole("button", { name: "OneDrive" }));
  expect(screen.getByText("Your OneDrive account is not connected.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Authenticate OneDrive" })).toBeTruthy();

  // Click SharePoint
  await user.click(screen.getByRole("button", { name: "SharePoint" }));
  expect(screen.getByText("Your SharePoint account is not connected.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Authenticate SharePoint" })).toBeTruthy();
});

test("renders consent links as inactive buttons with aria-disabled", () => {
  setup();
  const termsBtn = screen.getByRole("button", { name: "Terms of use" });
  const privacyBtn = screen.getByRole("button", { name: "Privacy policy" });

  expect(termsBtn.getAttribute("aria-disabled")).toBe("true");
  expect(privacyBtn.getAttribute("aria-disabled")).toBe("true");
});

test("shows unselectable 'No files selected' box in footer", () => {
  setup();
  expect(screen.getByText("No files selected")).toBeTruthy();
});

test("AT-19 authenticate button and AT-21 attach button are disabled", () => {
  setup();

  const authBtn = screen.getByRole("button", {
    name: "Authenticate Google Drive",
  }) as HTMLButtonElement;
  const attachBtn = screen.getByRole("button", {
    name: "Attach",
  }) as HTMLButtonElement;

  expect(authBtn.disabled).toBe(true);
  expect(attachBtn.disabled).toBe(true);
});

test("Close Modal button calls onClose", async () => {
  const user = userEvent.setup();
  const { onClose } = setup();

  await user.click(screen.getByRole("button", { name: "Close Modal" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("Escape key calls onClose", async () => {
  const user = userEvent.setup();
  const { onClose } = setup();

  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
});
