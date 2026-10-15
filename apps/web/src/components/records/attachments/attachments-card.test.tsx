import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { type AttachmentRow, AttachmentsCard, formatAttachmentSize } from "./attachments-card";

afterEach(cleanup);

const file: AttachmentRow = {
  id: "a1",
  fileName: "plan.pdf",
  size: 1500,
  type: "file",
  attachedBy: "Ada",
  createdTime: "Oct 1, 2026",
};
const link: AttachmentRow = {
  id: "a2",
  fileName: "https://example.com/x",
  size: 0,
  type: "link",
  linkUrl: "https://example.com/x",
  attachedBy: "Bob",
  createdTime: "Oct 2, 2026",
};

function setup(props: Partial<React.ComponentProps<typeof AttachmentsCard>> = {}) {
  const p = {
    rows: [] as AttachmentRow[],
    onAttach: vi.fn(),
    onFilesSelected: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  };
  render(<AttachmentsCard {...p} />);
  return p;
}

test("empty state has no badge or column headers", () => {
  setup();
  expect(screen.getByText("No Attachment")).toBeTruthy();
  expect(screen.queryByRole("columnheader")).toBeNull();
  expect(document.querySelector("[data-part=count]")).toBeNull();
});

test("menu opens, flips chevron, lists four sources, Documents disabled", async () => {
  const user = userEvent.setup();
  const p = setup();
  const btn = screen.getByRole("button", { name: "Attach" });
  expect(btn.querySelector("[data-chevron=down]")).toBeTruthy();
  await user.click(btn);
  expect(btn.querySelector("[data-chevron=up]")).toBeTruthy();
  const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
  expect(items).toEqual(["Upload File", "Documents", "Other Cloud Drives", "Link (URL)"]);
  expect(
    screen.getByRole("menuitem", { name: "Documents" }).hasAttribute("data-later-module"),
  ).toBe(true);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  await user.click(btn);
  await user.click(screen.getByRole("menuitem", { name: "Link (URL)" }));
  expect(p.onAttach).toHaveBeenCalledWith("link");
});

test("Upload File opens the picker and reports files", async () => {
  const user = userEvent.setup();
  const p = setup();
  await user.click(screen.getByRole("button", { name: "Attach" }));
  await user.click(screen.getByRole("menuitem", { name: "Upload File" }));
  const input = document.querySelector("input[type=file]") as HTMLInputElement;
  expect(input.multiple).toBe(true);
  const f = new File(["x"], "a.txt", { type: "text/plain" });
  await user.upload(input, f);
  expect(p.onFilesSelected).toHaveBeenCalledWith([f]);
});

test("filled rows, size format, link row, badge", async () => {
  const user = userEvent.setup();
  const p = setup({ rows: [file, link] });
  expect(document.querySelector("[data-part=count]")?.textContent).toBe("2");
  expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
    "File Name",
    "Attached By",
    "Date Added",
    "Size",
    "Actions",
  ]);
  expect(screen.getByText("1.5 KB")).toBeTruthy();
  expect(formatAttachmentSize(2_500_000)).toBe("2.5 MB");
  await user.click(screen.getByRole("button", { name: "plan.pdf" }));
  expect(p.onDownload).toHaveBeenCalledWith(file);
  const a = screen.getByRole("link", { name: "https://example.com/x" });
  expect(a.getAttribute("target")).toBe("_blank");
  expect(a.getAttribute("rel")).toBe("noopener noreferrer");
});

test("delete asks for confirmation; cancel keeps, confirm deletes", async () => {
  const user = userEvent.setup();
  const p = setup({ rows: [file] });
  await user.click(screen.getByRole("button", { name: "Delete plan.pdf" }));
  const dlg = screen.getByRole("alertdialog");
  expect(within(dlg).getByText("Are you sure you want to delete this attachment?")).toBeTruthy();
  await user.click(within(dlg).getByRole("button", { name: "Cancel" }));
  expect(p.onDelete).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Delete plan.pdf" }));
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
  expect(p.onDelete).toHaveBeenCalledWith(file);
});

test("upload progress and error rows", () => {
  setup({
    uploading: [
      { name: "big.pdf", progress: 40 },
      { name: "bad.exe", progress: 0, error: "File type not allowed" },
    ],
  });
  expect(screen.getByText("big.pdf")).toBeTruthy();
  expect(screen.getByText("40%")).toBeTruthy();
  expect(screen.getByText("File type not allowed").className).toContain("text-danger");
});

test("canEdit=false hides Attach and delete", () => {
  setup({ rows: [file], canEdit: false });
  expect(screen.queryByRole("button", { name: "Attach" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
});
