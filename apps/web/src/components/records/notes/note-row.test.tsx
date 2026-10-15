import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import type { NoteListItem } from "./note-list";
import { NoteRow } from "./note-row";

afterEach(cleanup);

const baseItem: NoteListItem = {
  id: "note-1",
  title: "Meeting summary",
  body: "Discussed project milestones and timelines.",
  parentLabel: "Account - Acme Corp",
  parentHref: "/crm/demo/Accounts/a-1",
  createdAt: "2026-10-10T12:00:00Z",
  authorName: "Jane Doe",
  canEdit: true,
  canDelete: true,
};

describe("NoteRow", () => {
  it("renders avatar, title, body, and metadata correctly", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<NoteRow item={baseItem} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText("Meeting summary")).toBeTruthy();
    expect(screen.getByText("Discussed project milestones and timelines.")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Account - Acme Corp" });
    expect(link.getAttribute("href")).toBe("/crm/demo/Accounts/a-1");
    expect(screen.getByText("Add Note")).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
  });

  it("renders without title when title is null", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<NoteRow item={{ ...baseItem, title: null }} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.queryByText("Meeting summary")).toBeNull();
    expect(screen.getByText("Discussed project milestones and timelines.")).toBeTruthy();
  });

  it("omits edit and delete buttons when permissions are false", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <NoteRow
        item={{ ...baseItem, canEdit: false, canDelete: false }}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.queryByRole("button", { name: "Edit note" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete note" })).toBeNull();
  });

  it("calls onEdit with note id when edit button is clicked", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<NoteRow item={baseItem} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit note" }));
    expect(onEdit).toHaveBeenCalledWith("note-1");
  });

  it("opens delete confirmation and cancels without deleting", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<NoteRow item={baseItem} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));
    expect(screen.getByText("Delete Note")).toBeTruthy();
    expect(screen.getByText("Are you sure you want to delete this note?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete Note")).toBeNull();
  });

  it("handles async onDelete resolution properly", async () => {
    let resolveDelete: () => void = () => {};
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    const onDelete = vi.fn().mockReturnValue(deletePromise);

    render(<NoteRow item={baseItem} onEdit={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));
    const dialog = screen.getByRole("alertdialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "Delete" });

    fireEvent.click(confirmBtn);
    expect(onDelete).toHaveBeenCalledWith("note-1");

    // Resolving delete closes the dialog
    resolveDelete();
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
  });

  it("toggles Show More and Show Less when text overflows", () => {
    const spyScroll = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(250);
    const spyClient = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);

    render(<NoteRow item={baseItem} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const showMoreBtn = screen.getByRole("button", { name: /Show More/ });
    expect(showMoreBtn).toBeTruthy();

    fireEvent.click(showMoreBtn);
    const showLessBtn = screen.getByRole("button", { name: /Show Less/ });
    expect(showLessBtn).toBeTruthy();

    fireEvent.click(showLessBtn);
    expect(screen.getByRole("button", { name: /Show More/ })).toBeTruthy();

    spyScroll.mockRestore();
    spyClient.mockRestore();
    vi.restoreAllMocks();
  });
});
