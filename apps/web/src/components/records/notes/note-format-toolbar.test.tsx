import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { NOTE_EMOJIS, NoteFormatToolbar } from "./note-format-toolbar";

const ColorPicker = ({
  label,
  allowNone,
  onPick,
}: {
  label: string;
  allowNone?: boolean;
  onPick: (c: string) => void;
  onClose: () => void;
}) => (
  <div>
    <span>{`picker:${label}:${allowNone ? "none" : "solid"}`}</span>
    <button type="button" onClick={() => onPick("#ff0000")}>
      pick red
    </button>
    <button type="button" onClick={() => onPick("")}>
      pick none
    </button>
  </div>
);
const LinkPopover = ({
  onInsert,
}: {
  onInsert: (h: string, t: string) => void;
  onClose: () => void;
}) => (
  <button type="button" onClick={() => onInsert("https://x.test", "X")}>
    do link
  </button>
);

function setup(dimmed?: { outdent?: boolean; removeFormat?: boolean }) {
  const onCommand = vi.fn();
  render(
    <NoteFormatToolbar
      onCommand={onCommand}
      colorPicker={ColorPicker}
      linkPopover={LinkPopover}
      dimmed={dimmed}
    />,
  );
  return onCommand;
}

afterEach(cleanup);

test("renders the buttons in order with names", () => {
  setup();
  const names = screen
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label"))
    .filter((n) => n && !n.endsWith("style") && !NOTE_EMOJIS.includes(n));
  expect(names).toEqual([
    "Bold (Cmd+B)",
    "Italics (Cmd+I)",
    "Underline (Cmd+U)",
    "Strikethrough",
    "Font Color",
    "Font Background Color",
    "Bulleted List",
    "Numbered List",
    "Insert Link",
    "Increase Indent",
    "Decrease Indent",
    "Subscript",
    "Superscript",
    "Emojis",
    "Clear Formatting",
  ]);
});

test("simple buttons emit their command", async () => {
  const user = userEvent.setup();
  const onCommand = setup();
  const map: [string, string][] = [
    ["Bold (Cmd+B)", "bold"],
    ["Italics (Cmd+I)", "italic"],
    ["Underline (Cmd+U)", "underline"],
    ["Strikethrough", "strikeThrough"],
    ["Bulleted List", "insertUnorderedList"],
    ["Numbered List", "insertOrderedList"],
    ["Increase Indent", "indent"],
    ["Decrease Indent", "outdent"],
    ["Subscript", "subscript"],
    ["Superscript", "superscript"],
    ["Clear Formatting", "removeFormat"],
  ];
  for (const [name, cmd] of map) {
    await user.click(screen.getByRole("button", { name }));
    expect(onCommand).toHaveBeenLastCalledWith(cmd);
  }
});

test("colour popovers open with the right label and emit the command", async () => {
  const user = userEvent.setup();
  const onCommand = setup();
  await user.click(screen.getByRole("button", { name: "Font Color" }));
  expect(screen.getByText("picker:Font Color:solid")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "pick red" }));
  expect(onCommand).toHaveBeenLastCalledWith("foreColor", "#ff0000");
  expect(screen.queryByText("picker:Font Color:solid")).toBeNull();

  await user.click(screen.getByRole("button", { name: "Font Background Color" }));
  expect(screen.getByText("picker:Font Background Color:none")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "pick none" }));
  expect(onCommand).toHaveBeenLastCalledWith("hiliteColor", "");
});

test("list menus emit style values", async () => {
  const user = userEvent.setup();
  const onCommand = setup();
  await user.click(screen.getByRole("button", { name: "Bulleted List style" }));
  await user.click(screen.getByRole("menuitem", { name: "Square" }));
  expect(onCommand).toHaveBeenLastCalledWith("insertUnorderedList", "square");
  await user.click(screen.getByRole("button", { name: "Numbered List style" }));
  await user.click(screen.getByRole("menuitem", { name: "i, ii, iii" }));
  expect(onCommand).toHaveBeenLastCalledWith("insertOrderedList", "lower-roman");
});

test("link flow and emoji insertion", async () => {
  const user = userEvent.setup();
  const onCommand = setup();
  await user.click(screen.getByRole("button", { name: "Insert Link" }));
  await user.click(screen.getByRole("button", { name: "do link" }));
  expect(onCommand).toHaveBeenLastCalledWith("createLink", "https://x.test", "X");
  await user.click(screen.getByRole("button", { name: "Emojis" }));
  expect(NOTE_EMOJIS).toHaveLength(40);
  await user.click(screen.getByRole("button", { name: NOTE_EMOJIS[0] }));
  expect(onCommand).toHaveBeenLastCalledWith("insertText", undefined, NOTE_EMOJIS[0]);
});

test("mousedown default is prevented and Esc closes a popover", async () => {
  const user = userEvent.setup();
  setup();
  const bold = screen.getByRole("button", { name: "Bold (Cmd+B)" });
  expect(fireEvent.mouseDown(bold)).toBe(false);
  await user.click(screen.getByRole("button", { name: "Emojis" }));
  expect(screen.getByRole("button", { name: NOTE_EMOJIS[1] })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: NOTE_EMOJIS[1] })).toBeNull();
});

test("dimmed flags fade outdent and clear formatting", () => {
  setup({ outdent: true, removeFormat: true });
  expect(screen.getByRole("button", { name: "Decrease Indent" }).className).toContain("opacity-40");
  expect(screen.getByRole("button", { name: "Clear Formatting" }).className).toContain(
    "opacity-40",
  );
});
