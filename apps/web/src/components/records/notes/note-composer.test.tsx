import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NoteComposer, type NoteComposerProps } from "./note-composer";

function setup(props: Partial<NoteComposerProps> = {}) {
  const p = {
    mode: "create" as const,
    expanded: true,
    onExpand: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    ...props,
  };
  render(<NoteComposer {...p} />);
  return p;
}
const body = () => screen.getByRole("textbox", { name: "Note content" });
const save = () => screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;

function typeBody(text: string) {
  body().innerHTML = text;
  fireEvent.input(body());
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NoteComposer", () => {
  it("collapsed expands on click", async () => {
    const p = setup({ expanded: false });
    await userEvent.click(screen.getByText("Add a note"));
    expect(p.onExpand).toHaveBeenCalled();
  });

  it("focuses body on open", () => {
    setup();
    expect(document.activeElement).toBe(body());
  });

  it("Save rules", async () => {
    setup();
    expect(save().disabled).toBe(true);
    await userEvent.type(screen.getByLabelText("Title"), "T");
    expect(save().disabled).toBe(false);
    await userEvent.clear(screen.getByLabelText("Title"));
    typeBody("<p><br></p>");
    expect(save().disabled).toBe(true);
    typeBody("<p>hi</p>");
    expect(save().disabled).toBe(false);
  });

  it("disables on length overflow", () => {
    setup();
    typeBody(`<p>${"a".repeat(65540)}</p>`);
    expect(save().disabled).toBe(true);
    expect(screen.getByText("Note content exceeds the maximum length.")).toBeTruthy();
  });

  it("disables while saving", async () => {
    setup({ saving: true });
    typeBody("x");
    expect(save().disabled).toBe(true);
  });

  it("saves trimmed title and clears the draft", async () => {
    const p = setup();
    await userEvent.type(screen.getByLabelText("Title"), "  T  ");
    typeBody("<p>hi</p>");
    await userEvent.click(save());
    expect(p.onSave).toHaveBeenCalledWith({ title: "T", content: "<p>hi</p>" });
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("");
  });

  it("Cancel and Esc call onCancel", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(body(), { key: "Escape" });
    expect(p.onCancel).toHaveBeenCalledTimes(2);
  });

  it("prefills in edit mode", () => {
    setup({ mode: "edit", initial: { title: "Old", content: "<p>body</p>" } });
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Old");
    expect(body().innerHTML).toBe("<p>body</p>");
  });

  it("toolbar toggles and hides the attachment button", async () => {
    const renderToolbar = vi.fn((exec) => (
      <button type="button" onClick={() => exec("bold")}>
        B
      </button>
    ));
    setup({ renderToolbar });
    expect(screen.getByRole("button", { name: "Attach file" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getByText("B")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Attach file" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.queryByText("B")).toBeNull();
  });

  it("exec applies the command to the editor", async () => {
    const fake = vi.fn(() => true);
    (document as unknown as { execCommand: unknown }).execCommand = fake;
    setup({
      renderToolbar: (exec) => (
        <button type="button" onClick={() => exec("bold")}>
          B
        </button>
      ),
    });
    await userEvent.click(screen.getByRole("button", { name: "Format" }));
    await act(async () => {
      await userEvent.click(screen.getByText("B"));
    });
    expect(fake).toHaveBeenCalledWith("bold", false, undefined);
  });

  it("pastes plain text", () => {
    const fake = vi.fn(() => true);
    (document as unknown as { execCommand: unknown }).execCommand = fake;
    setup();
    fireEvent.paste(body(), {
      clipboardData: { getData: (t: string) => (t === "text/plain" ? "plain" : "<b>x</b>") },
    });
    expect(fake).toHaveBeenCalledWith("insertText", false, "plain");
  });

  it("shows the error", () => {
    setup({ error: "Boom" });
    expect(screen.getByText("Boom")).toBeTruthy();
  });
});
