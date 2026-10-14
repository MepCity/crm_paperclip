import { afterEach, describe, expect, it, vi } from "vitest";
import { applyNoteEditorCommand, isNoteContentEmpty } from "./note-editor-commands";

function setup() {
  const editor = document.createElement("div");
  editor.contentEditable = "true";
  document.body.append(editor);
  const fake = vi.fn(() => true);
  (document as unknown as { execCommand: unknown }).execCommand = fake;
  return { editor, fake };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("applyNoteEditorCommand", () => {
  it("enables styleWithCSS and runs the command", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "foreColor", "#f00");
    expect(fake).toHaveBeenCalledWith("styleWithCSS", false, "true");
    expect(fake).toHaveBeenCalledWith("foreColor", false, "#f00");
  });

  it("applies list-style-type to the nearest list", () => {
    const { editor, fake } = setup();
    editor.innerHTML = "<ul><li>a</li></ul>";
    const li = editor.querySelector("li") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(li);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    applyNoteEditorCommand(editor, "insertUnorderedList", "square", undefined, range);
    expect(fake).toHaveBeenCalledWith("insertUnorderedList", false, undefined);
    expect(editor.querySelector("ul")?.style.listStyleType).toBe("square");
  });

  it("inserts a link with text when the selection is collapsed", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "createLink", "https://x.test", "Label");
    expect(fake).toHaveBeenCalledWith("insertHTML", false, '<a href="https://x.test">Label</a>');
  });

  it("does nothing for unknown commands", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "bogus");
    expect(fake).toHaveBeenCalledTimes(1); // styleWithCSS only
  });
});

describe("isNoteContentEmpty", () => {
  it("treats markup-only content as empty", () => {
    expect(isNoteContentEmpty("<p><br></p>")).toBe(true);
    expect(isNoteContentEmpty("&nbsp; ")).toBe(true);
    expect(isNoteContentEmpty("<b>hi</b>")).toBe(false);
  });
});
