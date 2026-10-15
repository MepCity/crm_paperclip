import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { NoteList, type NoteListItem } from "./note-list";

afterEach(cleanup);

const base: NoteListItem = {
  id: "n1",
  title: "Kickoff",
  body: "First body",
  parentLabel: "Account - Sample Co",
  parentHref: "/crm/demo/Accounts/a1",
  createdAt: "2026-10-01T10:00:00Z",
  authorName: "Alex Example",
  canEdit: true,
  canDelete: true,
};
const second: NoteListItem = {
  ...base,
  id: "n2",
  title: null,
  body: "Second body",
  createdAt: "2026-10-02T10:00:00Z",
  canEdit: false,
  canDelete: false,
};

function setup(over: Partial<React.ComponentProps<typeof NoteList>> = {}) {
  const props = {
    items: [base, second],
    sort: "recentLast" as const,
    onSortChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...over,
  };
  render(<NoteList {...props} />);
  return props;
}

describe("NoteList", () => {
  it("orders rows by the sort prop and shows the selector label", () => {
    setup({ sort: "recentFirst" });
    const rows = screen.getAllByTestId("note-row");
    expect(within(rows[0] as HTMLElement).getByText("Second body")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Recent First/ })).toBeTruthy();
  });

  it("reports a sort change", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /Recent Last/ }));
    fireEvent.click(screen.getByRole("option", { name: "Recent First" }));
    expect(props.onSortChange).toHaveBeenCalledWith("recentFirst");
  });

  it("keeps selector and footer on an empty list without a message", () => {
    setup({ items: [], footer: <div>composer</div> });
    expect(screen.getByRole("button", { name: /Recent Last/ })).toBeTruthy();
    expect(screen.getByText("composer")).toBeTruthy();
    expect(screen.queryAllByTestId("note-row")).toHaveLength(0);
    expect(screen.queryByText(/no notes/i)).toBeNull();
  });

  it("renders the meta row", () => {
    setup();
    const row = screen.getAllByTestId("note-row")[0] as HTMLElement;
    expect(
      within(row).getByRole("link", { name: "Account - Sample Co" }).getAttribute("href"),
    ).toBe("/crm/demo/Accounts/a1");
    expect(within(row).getByText("Add Note").closest("button")).toBeNull();
    expect(within(row).getByText("Alex Example")).toBeTruthy();
    expect(within(row).getByText("Kickoff")).toBeTruthy();
  });

  it("draws action buttons per permission flag", () => {
    setup();
    const [r1, r2] = screen.getAllByTestId("note-row") as HTMLElement[];
    expect(within(r1 as HTMLElement).getByRole("button", { name: "Edit note" })).toBeTruthy();
    expect(within(r1 as HTMLElement).getByRole("button", { name: "Delete note" })).toBeTruthy();
    expect(within(r2 as HTMLElement).queryByRole("button", { name: "Edit note" })).toBeNull();
    expect(within(r2 as HTMLElement).queryByRole("button", { name: "Delete note" })).toBeNull();
  });

  it("calls onEdit and swaps the row for the editor", () => {
    const props = setup();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit note" })[0] as HTMLElement);
    expect(props.onEdit).toHaveBeenCalledWith("n1");
    cleanup();
    setup({ editingId: "n1", renderEditor: (id) => <div>editor {id}</div> });
    expect(screen.getByText("editor n1")).toBeTruthy();
    expect(screen.queryByText("First body")).toBeNull();
  });

  it("confirms before deleting", async () => {
    const props = setup();
    fireEvent.click(screen.getAllByRole("button", { name: "Delete note" })[0] as HTMLElement);
    expect(screen.getByText("Are you sure you want to delete this note?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Delete note" })[0] as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(props.onDelete).toHaveBeenCalledWith("n1"));
  });

  it("toggles Show More / Show Less when the body overflows", () => {
    const spy = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(80);
    setup({ items: [base] });
    fireEvent.click(screen.getByRole("button", { name: /Show More/ }));
    expect(screen.getByRole("button", { name: /Show Less/ })).toBeTruthy();
    spy.mockRestore();
    vi.restoreAllMocks();
  });

  it("hides Show More for a short body", () => {
    setup({ items: [base] });
    expect(screen.queryByRole("button", { name: /Show More/ })).toBeNull();
  });
});
