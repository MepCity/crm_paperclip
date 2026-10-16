import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyNoteEditorCommand,
  isNoteContentEmpty,
  restoreSelection,
  saveSelection,
} from "./note-editor-commands";

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

// ---------------------------------------------------------------------------
// saveSelection
// ---------------------------------------------------------------------------

describe("saveSelection", () => {
  it("returns null when there is no selection", () => {
    const { editor } = setup();
    window.getSelection()?.removeAllRanges();
    expect(saveSelection(editor)).toBeNull();
  });

  it("returns a cloned range when the selection is inside the editor", () => {
    const { editor } = setup();
    editor.textContent = "hello";
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const saved = saveSelection(editor);
    expect(saved).not.toBeNull();
    // cloneRange produces a distinct object
    expect(saved).not.toBe(range);
    expect(saved?.toString()).toBe("hello");
  });

  it("returns null when the selection is outside the editor", () => {
    const { editor } = setup();
    const outside = document.createElement("p");
    outside.textContent = "outside";
    document.body.append(outside);
    const range = document.createRange();
    range.selectNodeContents(outside);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    expect(saveSelection(editor)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// restoreSelection
// ---------------------------------------------------------------------------

describe("restoreSelection", () => {
  it("focuses the editor and restores the range", () => {
    const { editor } = setup();
    editor.textContent = "world";
    const range = document.createRange();
    range.selectNodeContents(editor);
    window.getSelection()?.removeAllRanges();
    const focusSpy = vi.spyOn(editor, "focus");
    restoreSelection(editor, range);
    expect(focusSpy).toHaveBeenCalled();
    expect(window.getSelection()?.toString()).toBe("world");
  });

  it("focuses the editor even when range is null", () => {
    const { editor } = setup();
    const focusSpy = vi.spyOn(editor, "focus");
    restoreSelection(editor, null);
    expect(focusSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// applyNoteEditorCommand — styleWithCSS always called first
// ---------------------------------------------------------------------------

describe("applyNoteEditorCommand", () => {
  it("enables styleWithCSS and runs the command", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "foreColor", "#f00");
    expect(fake).toHaveBeenCalledWith("styleWithCSS", false, "true");
    expect(fake).toHaveBeenCalledWith("foreColor", false, "#f00");
  });

  // -------------------------------------------------------------------------
  // Simple formatting commands
  // -------------------------------------------------------------------------

  it.each([
    ["bold"],
    ["italic"],
    ["underline"],
    ["strikeThrough"],
    ["hiliteColor"],
    ["indent"],
    ["outdent"],
    ["subscript"],
    ["superscript"],
    ["removeFormat"],
  ] as const)("passes command '%s' straight to execCommand", (command) => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, command);
    expect(fake).toHaveBeenCalledWith(command, false, undefined);
  });

  it("passes the value argument for foreColor", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "foreColor", "#00ff00");
    expect(fake).toHaveBeenCalledWith("foreColor", false, "#00ff00");
  });

  it("passes the value argument for hiliteColor", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "hiliteColor", "#ffff00");
    expect(fake).toHaveBeenCalledWith("hiliteColor", false, "#ffff00");
  });

  // -------------------------------------------------------------------------
  // insertUnorderedList
  // -------------------------------------------------------------------------

  it("applies list-style-type to the nearest UL list", () => {
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

  it("inserts unordered list without style when value is omitted", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "insertUnorderedList");
    expect(fake).toHaveBeenCalledWith("insertUnorderedList", false, undefined);
  });

  // -------------------------------------------------------------------------
  // insertOrderedList
  // -------------------------------------------------------------------------

  it("applies list-style-type to the nearest OL list", () => {
    const { editor, fake } = setup();
    editor.innerHTML = "<ol><li>1</li></ol>";
    const li = editor.querySelector("li") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(li);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    applyNoteEditorCommand(editor, "insertOrderedList", "lower-alpha", undefined, range);
    expect(fake).toHaveBeenCalledWith("insertOrderedList", false, undefined);
    expect(editor.querySelector("ol")?.style.listStyleType).toBe("lower-alpha");
  });

  it("inserts ordered list without style when value is omitted", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "insertOrderedList");
    expect(fake).toHaveBeenCalledWith("insertOrderedList", false, undefined);
  });

  // -------------------------------------------------------------------------
  // createLink — collapsed selection
  // -------------------------------------------------------------------------

  it("inserts a link with text when the selection is collapsed", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "createLink", "https://x.test", "Label");
    expect(fake).toHaveBeenCalledWith("insertHTML", false, '<a href="https://x.test">Label</a>');
  });

  it("inserts a link with value as label when text is omitted in collapsed selection", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "createLink", "https://x.test");
    expect(fake).toHaveBeenCalledWith(
      "insertHTML",
      false,
      '<a href="https://x.test">https://x.test</a>',
    );
  });

  it("inserts a link with empty href and empty label when both value and text are omitted", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "createLink");
    expect(fake).toHaveBeenCalledWith("insertHTML", false, '<a href=""></a>');
  });

  // -------------------------------------------------------------------------
  // createLink — non-collapsed selection
  // -------------------------------------------------------------------------

  it("creates a link wrapping selected text when selection is not collapsed", () => {
    const { editor, fake } = setup();
    editor.innerHTML = "<span>Selected</span>";
    const span = editor.querySelector("span") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    applyNoteEditorCommand(editor, "createLink", "https://x.test", undefined, range);
    expect(fake).toHaveBeenCalledWith("createLink", false, "https://x.test");
  });

  // -------------------------------------------------------------------------
  // insertText
  // -------------------------------------------------------------------------

  it("inserts text using the text argument when provided", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "insertText", undefined, "hello 🎉");
    expect(fake).toHaveBeenCalledWith("insertText", false, "hello 🎉");
  });

  it("falls back to value when text is omitted for insertText", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "insertText", "emoji");
    expect(fake).toHaveBeenCalledWith("insertText", false, "emoji");
  });

  it("inserts empty string when both text and value are omitted for insertText", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "insertText");
    expect(fake).toHaveBeenCalledWith("insertText", false, "");
  });

  // -------------------------------------------------------------------------
  // Unknown / default command
  // -------------------------------------------------------------------------

  it("does nothing for unknown commands", () => {
    const { editor, fake } = setup();
    applyNoteEditorCommand(editor, "bogus");
    expect(fake).toHaveBeenCalledTimes(1); // styleWithCSS only
  });

  // -------------------------------------------------------------------------
  // execCommand unavailable (guard branch)
  // -------------------------------------------------------------------------

  it("returns early without throwing when execCommand is not a function", () => {
    const { editor } = setup();
    (document as unknown as { execCommand: unknown }).execCommand = undefined;
    expect(() => applyNoteEditorCommand(editor, "bold")).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // savedRange parameter — restores selection before exec
  // -------------------------------------------------------------------------

  it("restores the saved range before executing the command", () => {
    const { editor, fake } = setup();
    editor.textContent = "test";
    const range = document.createRange();
    range.selectNodeContents(editor);
    window.getSelection()?.removeAllRanges();
    // Pass savedRange explicitly; it should be restored
    applyNoteEditorCommand(editor, "bold", undefined, undefined, range);
    expect(fake).toHaveBeenCalledWith("bold", false, undefined);
    expect(window.getSelection()?.toString()).toBe("test");
  });
});

// ---------------------------------------------------------------------------
// isNoteContentEmpty
// ---------------------------------------------------------------------------

describe("isNoteContentEmpty", () => {
  it("treats markup-only content as empty", () => {
    expect(isNoteContentEmpty("<p><br></p>")).toBe(true);
    expect(isNoteContentEmpty("&nbsp; ")).toBe(true);
    expect(isNoteContentEmpty("<b>hi</b>")).toBe(false);
  });

  it("treats empty string as empty", () => {
    expect(isNoteContentEmpty("")).toBe(true);
  });

  it("treats whitespace-only string as empty", () => {
    expect(isNoteContentEmpty("   ")).toBe(true);
  });

  it("treats multiple nested tags with no text as empty", () => {
    expect(isNoteContentEmpty("<div><p><br></p></div>")).toBe(true);
  });

  it("treats multiple &nbsp; entities as empty", () => {
    expect(isNoteContentEmpty("&nbsp;&nbsp;&nbsp;")).toBe(true);
  });

  it("treats visible text inside tags as non-empty", () => {
    expect(isNoteContentEmpty("<p>Hello</p>")).toBe(false);
  });

  it("treats text with surrounding whitespace as non-empty", () => {
    expect(isNoteContentEmpty("<p>  word  </p>")).toBe(false);
  });

  it("treats mixed &nbsp; and real text as non-empty", () => {
    expect(isNoteContentEmpty("&nbsp;hello&nbsp;")).toBe(false);
  });
});
