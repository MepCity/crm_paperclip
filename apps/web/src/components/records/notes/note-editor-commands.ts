export type NoteEditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "foreColor"
  | "hiliteColor"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "createLink"
  | "indent"
  | "outdent"
  | "subscript"
  | "superscript"
  | "insertText"
  | "removeFormat";

/** Selection saved before a toolbar click steals focus from the editor. */
export interface SavedSelection {
  range: Range | null;
}

export function saveSelection(editor: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

export function restoreSelection(editor: HTMLElement, range: Range | null): void {
  editor.focus();
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

function exec(command: string, value?: string): boolean {
  if (typeof document.execCommand !== "function") return false;
  return document.execCommand(command, false, value);
}

function nearestList(node: Node | null, editor: HTMLElement): HTMLElement | null {
  let el: Node | null = node;
  while (el && el !== editor) {
    if (el instanceof HTMLElement && (el.tagName === "UL" || el.tagName === "OL")) return el;
    el = el.parentNode;
  }
  return null;
}

/** Applies a formatting command to the editor, restoring the saved selection first. */
export function applyNoteEditorCommand(
  editor: HTMLElement,
  command: string,
  value?: string,
  text?: string,
  savedRange: Range | null = null,
): void {
  restoreSelection(editor, savedRange);
  exec("styleWithCSS", "true");
  switch (command) {
    case "insertUnorderedList":
    case "insertOrderedList": {
      exec(command);
      if (value) {
        const sel = window.getSelection();
        const list = nearestList(
          sel?.anchorNode ?? savedRange?.commonAncestorContainer ?? null,
          editor,
        );
        if (list) list.style.listStyleType = value;
      }
      return;
    }
    case "createLink": {
      const sel = window.getSelection();
      const href = value ?? "";
      if (sel && !sel.isCollapsed) {
        exec("createLink", href);
      } else {
        const label = text || value || "";
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        exec("insertHTML", a.outerHTML);
      }
      return;
    }
    case "insertText":
      exec("insertText", text ?? value ?? "");
      return;
    case "bold":
    case "italic":
    case "underline":
    case "strikeThrough":
    case "foreColor":
    case "hiliteColor":
    case "indent":
    case "outdent":
    case "subscript":
    case "superscript":
    case "removeFormat":
      exec(command, value);
      return;
    default:
      return;
  }
}

/** True when the HTML holds no visible text (tags, nbsp and whitespace only). */
export function isNoteContentEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length === 0;
}
