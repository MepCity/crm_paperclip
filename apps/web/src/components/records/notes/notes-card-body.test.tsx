import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { NotesCardBody } from "./notes-card-body";

const state = vi.hoisted(() => ({
  records: [] as unknown[],
  created: [] as unknown[],
  updated: [] as unknown[],
  deleted: [] as unknown[],
}));

vi.mock("@/lib/api/client/hooks", () => {
  return {
    useViews: () => ({ data: [{ id: "v1", isDefault: true }], isLoading: false, isError: false }),
    useUsers: () => ({ data: [{ userId: "u1", name: "Alex Morgan" }] }),
    useRecordList: (_module?: string, query?: { page?: number; perPage?: number }) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 100;
      const start = (page - 1) * perPage;
      const pagedRecords = state.records.slice(start, start + perPage);
      const moreRecords = start + perPage < state.records.length;
      return {
        data: { records: pagedRecords, moreRecords },
        isLoading: false,
        isError: false,
      };
    },
    useCreateRecord: () => ({
      mutateAsync: (data: unknown) => {
        state.created.push(data);
        return Promise.resolve();
      },
      isPending: false,
    }),
    useUpdateRecord: () => ({
      mutateAsync: (data: unknown) => {
        state.updated.push(data);
        return Promise.resolve();
      },
      isPending: false,
    }),
    useDeleteRecords: () => ({
      mutateAsync: (data: unknown) => {
        state.deleted.push(data);
        return Promise.resolve();
      },
      isPending: false,
    }),
  };
});

vi.mock("./note-attachments", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./note-attachments")>()),
  NoteAttachmentList: () => null,
  useUploadNoteAttachments: () => async () => [],
  useNoteAttachments: () => ({ data: [] }),
}));

const parent = { id: "p1", fields: { Account_Name: "Acme" } };
const props = { parentModule: "Accounts" as const, parentRecord: parent, recordPath: () => "#" };

afterEach(() => {
  cleanup();
  state.records = [];
  state.created = [];
  state.updated = [];
  state.deleted = [];
});

describe("NotesCardBody", () => {
  it("shows the empty state and the collapsed composer", () => {
    render(<NotesCardBody {...props} />);
    expect(screen.getByText("No records found")).toBeTruthy();
    expect(screen.getByTestId("note-composer-collapsed")).toBeTruthy();
  });

  it("renders stored notes through the safe content renderer", () => {
    state.records = [
      {
        id: "n1",
        fields: {
          Note_Title: "Call recap",
          Note_Content: "<p>Hello <script>x</script>world</p>",
          Created_By: "u1",
          Created_Time: "2026-01-15T12:00:00.000Z",
        },
      },
    ];
    render(<NotesCardBody {...props} />);
    expect(screen.getByText("Call recap")).toBeTruthy();
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
    expect(document.querySelector("script")).toBeNull();
  });

  it("creates a new note when saving from expanded composer", async () => {
    const user = userEvent.setup();
    render(<NotesCardBody {...props} />);

    await user.click(screen.getByTestId("note-composer-collapsed"));
    expect(screen.getByTestId("note-composer")).toBeTruthy();

    await user.type(screen.getByLabelText("Title"), "New Note Title");
    const editor = screen.getByRole("textbox", { name: "Note content" });
    fireEvent.input(editor, { target: { innerHTML: "<p>Some note content</p>" } });

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(state.created).toHaveLength(1);
    expect(state.created[0]).toEqual({
      Parent_Id: { module: "Accounts", id: "p1" },
      Note_Title: "New Note Title",
      Note_Content: "<p>Some note content</p>",
    });
  });

  it("updates an existing note on edit save", async () => {
    const user = userEvent.setup();
    state.records = [
      {
        id: "n1",
        fields: {
          Note_Title: "Initial Title",
          Note_Content: "Initial Content",
          Created_By: "u1",
          Created_Time: "2026-01-15T12:00:00.000Z",
        },
      },
    ];
    render(<NotesCardBody {...props} />);
    await user.click(screen.getByRole("button", { name: "Edit note" }));
    expect(screen.getByTestId("note-composer")).toBeTruthy();

    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(state.updated).toHaveLength(1);
    expect(state.updated[0]).toEqual({
      id: "n1",
      input: {
        Note_Title: "Updated Title",
        Note_Content: "Initial Content",
      },
    });
  });

  it("deletes a note after confirmation", async () => {
    const user = userEvent.setup();
    state.records = [
      {
        id: "n1",
        fields: {
          Note_Title: "Note to delete",
          Note_Content: "Content",
          Created_By: "u1",
          Created_Time: "2026-01-15T12:00:00.000Z",
        },
      },
    ];
    render(<NotesCardBody {...props} />);
    await user.click(screen.getByRole("button", { name: "Delete note" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    expect(state.deleted).toEqual([["n1"]]);
  });

  it("handles 101 notes: shows first 100, View more appends the 101st, and deleting from page 2 works", () => {
    state.records = Array.from({ length: 101 }, (_, i) => ({
      id: `n${i + 1}`,
      fields: {
        Note_Title: `Note ${i + 1}`,
        Note_Content: `Content ${i + 1}`,
        Created_By: "u1",
        Created_Time: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      },
    }));

    render(<NotesCardBody {...props} />);

    // First page shows exactly 100 notes
    const initialRows = screen.getAllByRole("listitem");
    expect(initialRows).toHaveLength(100);
    expect(screen.getByText("Note 1")).toBeTruthy();
    expect(screen.getByText("Note 100")).toBeTruthy();
    expect(screen.queryByText("Note 101")).toBeNull();

    // "View more" button is visible
    const viewMoreButton = screen.getByRole("button", { name: "View more" });
    expect(viewMoreButton).toBeTruthy();

    // Click "View more" to reveal page 2 (Note 101)
    fireEvent.click(viewMoreButton);

    const expandedRows = screen.getAllByRole("listitem");
    expect(expandedRows).toHaveLength(101);
    expect(screen.getByText("Note 101")).toBeTruthy();

    // "View more" is gone since page 2 had moreRecords: false
    expect(screen.queryByRole("button", { name: "View more" })).toBeNull();

    // Delete note 101 from page 2
    const deleteButtons = screen.getAllByRole("button", { name: "Delete note" });
    expect(deleteButtons).toHaveLength(101);
    const deleteBtn = deleteButtons[100];
    if (!deleteBtn) {
      throw new Error("Expected 101st delete button");
    }
    fireEvent.click(deleteBtn);
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
    expect(state.deleted).toEqual([["n101"]]);
  });

  it("refreshes edited content on an already loaded second page", () => {
    state.records = Array.from({ length: 101 }, (_, i) => ({
      id: `n${i + 1}`,
      fields: { Note_Title: `Note ${i + 1}`, Note_Content: `Content ${i + 1}` },
    }));
    const { rerender } = render(<NotesCardBody {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "View more" }));
    expect(screen.getByText("Content 101")).toBeTruthy();

    state.records[100] = {
      id: "n101",
      fields: { Note_Title: "Edited note", Note_Content: "Edited content" },
    };
    rerender(<NotesCardBody {...props} />);

    expect(screen.getByText("Edited note")).toBeTruthy();
    expect(screen.getByText("Edited content")).toBeTruthy();
    expect(screen.queryByText("Content 101")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(101);
  });

  it("handles 250 notes: shows 100 notes, second click reveals 200, third click reveals all 250", () => {
    state.records = Array.from({ length: 250 }, (_, i) => ({
      id: `n${i + 1}`,
      fields: {
        Note_Title: `Note ${i + 1}`,
        Note_Content: `Content ${i + 1}`,
        Created_By: "u1",
        Created_Time: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      },
    }));

    render(<NotesCardBody {...props} />);

    // Page 1: 100 notes
    expect(screen.getAllByRole("listitem")).toHaveLength(100);
    expect(screen.getByText("Note 1")).toBeTruthy();
    expect(screen.getByText("Note 100")).toBeTruthy();
    expect(screen.queryByText("Note 101")).toBeNull();

    // Click "View more" for page 2
    fireEvent.click(screen.getByRole("button", { name: "View more" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(200);
    expect(screen.getByText("Note 101")).toBeTruthy();
    expect(screen.getByText("Note 200")).toBeTruthy();
    expect(screen.queryByText("Note 201")).toBeNull();

    // "View more" is still present because moreRecords is true
    const secondViewMore = screen.getByRole("button", { name: "View more" });
    expect(secondViewMore).toBeTruthy();

    // Click "View more" for page 3
    fireEvent.click(secondViewMore);
    expect(screen.getAllByRole("listitem")).toHaveLength(250);
    expect(screen.getByText("Note 201")).toBeTruthy();
    expect(screen.getByText("Note 250")).toBeTruthy();

    // "View more" is now gone since page 3 was the final page
    expect(screen.queryByRole("button", { name: "View more" })).toBeNull();
  });
});
