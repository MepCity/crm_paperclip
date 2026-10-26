"use client";

import { useRef, useState } from "react";
import {
  applyNoteEditorCommand,
  saveSelection,
} from "@/components/records/notes/note-editor-commands";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Select, SelectItem } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";

/** L13–L14 establish an unsaved editor and the missing-sender branch only. */
export function SignatureCreate({ onCancel }: { onCancel: () => void }) {
  const t = useUiTranslations();
  const [error, setError] = useState(false);
  const [plain, setPlain] = useState(false);
  const [body, setBody] = useState("");
  const editor = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  return (
    <section aria-label={t("modules.observedFlows.newEmailSignature")} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-3 rounded border border-danger bg-surface p-3 text-danger shadow-md"
        >
          <Icons.error className="size-6" aria-hidden />
          <span>{t("modules.observedFlows.missingSender")}</span>
          <Button
            variant="icon"
            size="compact"
            aria-label={t("common.actions.close")}
            onPress={() => setError(false)}
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>
      )}
      <div className="w-64">
        <TextField
          label={t("modules.observedFlows.signatureName")}
          hideLabel
          placeholder={t("modules.observedFlows.signatureName")}
          autoFocus
        />
      </div>
      <div className="border border-border bg-surface">
        <div className={error ? "border-b border-danger" : "border-b border-border"}>
          <Select
            label={t("modules.observedFlows.associateSenderAddress")}
            hideLabel
            placeholder={t("modules.observedFlows.selectAnEmailAddress")}
            items={[]}
            isInvalid={error}
            isDisabled
          >
            {(item: { id: string }) => <SelectItem id={item.id}>{item.id}</SelectItem>}
          </Select>
        </div>
        <div
          role="toolbar"
          aria-label={t("modules.observedFlows.signatureFormatting")}
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
          <TextArea
            label={t("modules.observedFlows.signatureBody")}
            hideLabel
            rows={14}
            value={body}
            onChange={setBody}
          />
        ) : (
          /* biome-ignore lint/a11y/useSemanticElements: Rich-text editing requires contenteditable. */
          <div
            role="textbox"
            aria-label={t("modules.observedFlows.signatureBody")}
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
        <Button onPress={() => setError(true)}>{t("modules.observedFlows.save")}</Button>
        <Button variant="secondary" onPress={onCancel}>
          {t("modules.observedFlows.cancel")}
        </Button>
      </div>
    </section>
  );
}
