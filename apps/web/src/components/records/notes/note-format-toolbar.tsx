"use client";

import {
  AArrowDown,
  AArrowUp,
  Bold,
  ChevronDown,
  Eraser,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Smile,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react";
import { type ComponentType, type ReactNode, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Popover } from "@/components/ui/popover";

export type NoteFormatCommand =
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

export interface NoteFormatToolbarProps {
  onCommand: (command: NoteFormatCommand, value?: string, text?: string) => void;
  colorPicker: ComponentType<{
    label: string;
    allowNone?: boolean;
    onPick: (color: string) => void;
    onClose: () => void;
  }>;
  linkPopover: ComponentType<{
    initialText?: string;
    onInsert: (href: string, text: string) => void;
    onClose: () => void;
  }>;
  /** Faded in an empty editor; the caller decides. */
  dimmed?: { outdent?: boolean; removeFormat?: boolean };
}

/** 40 common emoji, as Unicode characters (no image files). */
export const NOTE_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🙂",
  "😉",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😐",
  "😢",
  "😭",
  "😡",
  "😴",
  "🙏",
  "👍",
  "👎",
  "👏",
  "🙌",
  "👋",
  "💪",
  "👌",
  "✌️",
  "❤️",
  "💔",
  "🔥",
  "⭐",
  "✅",
  "❌",
  "⚠️",
  "🎉",
  "💡",
  "📌",
  "📞",
  "📅",
];

const LIST_STYLES: Record<"ul" | "ol", { label: string; value: string }[]> = {
  ul: [
    { label: "Disc", value: "disc" },
    { label: "Circle", value: "circle" },
    { label: "Square", value: "square" },
  ],
  ol: [
    { label: "1, 2, 3", value: "decimal" },
    { label: "a, b, c", value: "lower-alpha" },
    { label: "i, ii, iii", value: "lower-roman" },
  ],
};

const iconClass = "size-4 shrink-0";
const btnClass =
  "inline-flex size-7 items-center justify-center rounded-sm text-text-muted outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus-ring data-disabled:opacity-50";
const dimClass = "opacity-40";

const keepSelection = (e: { preventDefault: () => void }) => e.preventDefault();

function ToolButton({
  label,
  onPress,
  children,
  dim,
  buttonRef,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  dim?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={label}
      className={`${btnClass} ${dim ? dimClass : ""}`}
      onMouseDown={keepSelection}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

function ListButton({
  kind,
  onCommand,
}: {
  kind: "ul" | "ol";
  onCommand: NoteFormatToolbarProps["onCommand"];
}) {
  const ul = kind === "ul";
  const command = ul ? "insertUnorderedList" : "insertOrderedList";
  const name = ul ? "Bulleted List" : "Numbered List";
  return (
    <span className="inline-flex items-center">
      <ToolButton label={name} onPress={() => onCommand(command)}>
        {ul ? <List className={iconClass} /> : <ListOrdered className={iconClass} />}
      </ToolButton>
      <MenuTrigger>
        <AriaButton
          aria-label={`${name} style`}
          className={`${btnClass} w-4`}
          onMouseDown={keepSelection}
        >
          <ChevronDown className="size-3" />
        </AriaButton>
        <Menu aria-label={`${name} style`} onAction={(key) => onCommand(command, String(key))}>
          {LIST_STYLES[kind].map((s) => (
            <MenuItem key={s.value} id={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    </span>
  );
}

function PopoverTool({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <ToolButton label={label} onPress={() => setOpen((o) => !o)} buttonRef={ref}>
        {icon}
      </ToolButton>
      <Popover
        title={label}
        hideTitle
        triggerRef={ref}
        isOpen={open}
        onOpenChange={setOpen}
        placement="bottom start"
      >
        {children(() => setOpen(false))}
      </Popover>
    </>
  );
}

export function NoteFormatToolbar({
  onCommand,
  colorPicker: ColorPicker,
  linkPopover: LinkPopover,
  dimmed,
}: NoteFormatToolbarProps) {
  const simple = (command: NoteFormatCommand, label: string, icon: ReactNode, dim?: boolean) => (
    <ToolButton label={label} onPress={() => onCommand(command)} dim={dim}>
      {icon}
    </ToolButton>
  );
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
      {simple("bold", "Bold (Cmd+B)", <Bold className={iconClass} />)}
      {simple("italic", "Italics (Cmd+I)", <Italic className={iconClass} />)}
      {simple("underline", "Underline (Cmd+U)", <Underline className={iconClass} />)}
      {simple("strikeThrough", "Strikethrough", <Strikethrough className={iconClass} />)}
      <PopoverTool label="Font Color" icon={<Type className={iconClass} />}>
        {(close) => (
          <ColorPicker
            label="Font Color"
            onPick={(c) => {
              onCommand("foreColor", c);
              close();
            }}
            onClose={close}
          />
        )}
      </PopoverTool>
      <PopoverTool label="Font Background Color" icon={<Highlighter className={iconClass} />}>
        {(close) => (
          <ColorPicker
            label="Font Background Color"
            allowNone
            onPick={(c) => {
              onCommand("hiliteColor", c);
              close();
            }}
            onClose={close}
          />
        )}
      </PopoverTool>
      <ListButton kind="ul" onCommand={onCommand} />
      <ListButton kind="ol" onCommand={onCommand} />
      <PopoverTool label="Insert Link" icon={<Link2 className={iconClass} />}>
        {(close) => (
          <LinkPopover
            onInsert={(href, text) => {
              onCommand("createLink", href, text);
              close();
            }}
            onClose={close}
          />
        )}
      </PopoverTool>
      {simple("indent", "Increase Indent", <IndentIncrease className={iconClass} />)}
      {simple(
        "outdent",
        "Decrease Indent",
        <IndentDecrease className={iconClass} />,
        dimmed?.outdent,
      )}
      {simple("subscript", "Subscript", <AArrowDown className={iconClass} />)}
      {simple("superscript", "Superscript", <AArrowUp className={iconClass} />)}
      <PopoverTool label="Emojis" icon={<Smile className={iconClass} />}>
        {(close) => (
          <div className="grid grid-cols-10 gap-0.5">
            {NOTE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={emoji}
                className="size-7 rounded-sm text-base hover:bg-surface-hover"
                onMouseDown={keepSelection}
                onClick={() => {
                  onCommand("insertText", undefined, emoji);
                  close();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </PopoverTool>
      {simple(
        "removeFormat",
        "Clear Formatting",
        <Eraser className={iconClass} />,
        dimmed?.removeFormat,
      )}
    </div>
  );
}
