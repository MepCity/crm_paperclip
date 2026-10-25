"use client";

import { useRef, useState } from "react";
import {
  applyNoteEditorCommand,
  saveSelection,
} from "@/components/records/notes/note-editor-commands";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";

/** L13–L14 establish an unsaved editor and the missing-sender branch only. */
export function SignatureCreate({ onCancel }: { onCancel: () => void }) {
  const [error, setError] = useState(false);
  const [plain, setPlain] = useState(false);
  const [body, setBody] = useState("");
  const editor = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  return (
    <section aria-label="New email signature" className="space-y-4">
      {error && (
        <p role="alert" className="rounded border border-danger bg-surface p-3 text-danger">
          En az bir Gönderen adresini ilişkilendirin.
        </p>
      )}
      <div className="w-64">
        <TextField label="Signature name" hideLabel placeholder="Signature name" autoFocus />
      </div>
      <div className="border border-border bg-surface">
        <Select
          label="Associate sender address"
          hideLabel
          placeholder="Select an email address"
          items={[]}
          isInvalid={error}
          isDisabled
        >
          {(item: { id: string }) => <SelectItem id={item.id}>{item.id}</SelectItem>}
        </Select>
        <div
          role="toolbar"
          aria-label="Signature formatting"
          className="flex flex-wrap items-center gap-1 border-b border-border p-2"
        >
          {!plain && (
            <>
              {(
                [
                  ["Bold", "B", "bold"],
                  ["Italic", "I", "italic"],
                  ["Underline", "U", "underline"],
                  ["Strikethrough", "S", "strikeThrough"],
                  ["Alignment", "≡", "justifyLeft"],
                  ["Numbered list", "1.", "insertOrderedList"],
                  ["Bulleted list", "•", "insertUnorderedList"],
                ] as const
              ).map(([label, glyph, command]) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="compact"
                  aria-label={label}
                  isDisabled={command.startsWith("justify")}
                  onPress={() => {
                    if (editor.current)
                      applyNoteEditorCommand(
                        editor.current,
                        command,
                        undefined,
                        undefined,
                        range.current,
                      );
                  }}
                >
                  {glyph}
                </Button>
              ))}
              {[
                ["Font", "F⌄"],
                ["Font size", "10⌄"],
                ["Link", "↗"],
                ["Table", "▦"],
                ["Source", "‹/›"],
                ["Image", "▧"],
                ["Quote", "❞"],
              ].map(([label, glyph]) => (
                <Button key={label} variant="ghost" size="compact" aria-label={label} isDisabled>
                  {glyph}
                </Button>
              ))}
            </>
          )}
          <Button
            variant="ghost"
            className="ml-auto"
            onPress={() => {
              setBody(editor.current?.textContent ?? body);
              setPlain(!plain);
            }}
          >
            {plain ? "HTML" : "Plain text"}
          </Button>
        </div>
        {plain ? (
          <TextArea label="Signature body" hideLabel rows={14} value={body} onChange={setBody} />
        ) : (
          /* biome-ignore lint/a11y/useSemanticElements: Rich-text editing requires contenteditable. */
          <div
            role="textbox"
            aria-label="Signature body"
            aria-multiline="true"
            contentEditable
            suppressContentEditableWarning
            tabIndex={0}
            ref={(node) => {
              editor.current = node;
              if (node && !node.hasChildNodes()) node.textContent = body;
            }}
            onInput={(event) => setBody(event.currentTarget.textContent ?? "")}
            onBlur={() => {
              if (editor.current) range.current = saveSelection(editor.current);
            }}
            onPaste={(event) => {
              event.preventDefault();
              if (editor.current)
                applyNoteEditorCommand(
                  editor.current,
                  "insertText",
                  undefined,
                  event.clipboardData.getData("text/plain"),
                  range.current,
                );
            }}
            className="min-h-72 bg-surface p-3 outline-none focus:ring-2 focus:ring-primary"
          />
        )}
      </div>
      <div className="flex gap-3">
        <Button onPress={() => setError(true)}>Save</Button>
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
