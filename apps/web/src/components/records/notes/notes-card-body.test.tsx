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
    useRecordList: () => ({ data: { records: state.records }, isLoading: false, isError: false }),
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
});
