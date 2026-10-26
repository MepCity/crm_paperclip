"use client";

import { Paperclip, Type } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import { addPendingFiles, notifyOverBudget, PendingFileChips } from "./note-attachments";
import { sanitizeNoteHtml } from "./note-content-policy";
import {
  applyNoteEditorCommand,
  isNoteContentEmpty,
  restoreSelection,
  saveSelection,
} from "./note-editor-commands";

export interface NoteDraft {
  title: string;
  content: string;
  /** Files picked with the paperclip; the caller uploads them after the note is saved. */
  files?: File[];
}
export type NoteEditorExec = (command: string, value?: string, text?: string) => void;
export interface NoteComposerProps {
  mode: "create" | "edit";
  initial?: NoteDraft;
  expanded: boolean;
  onExpand: () => void;
  onCancel: () => void;
  onSave: (draft: NoteDraft) => void | Promise<void>;
  saving?: boolean;
  error?: string | null;
  renderToolbar?: (exec: NoteEditorExec) => React.ReactNode;
  /** Already-saved attachments shown above the buttons (edit mode). */
  attachments?: React.ReactNode;
  /** How many attachments the note already has; counts against the file budget. */
  attachedCount?: number;
  /** Total bytes of those attachments; counts against the size budget. */
  attachedBytes?: number;
}

export const NOTE_CONTENT_MAX_LENGTH = 65535;
const TITLE_MAX_LENGTH = 120;

export function NoteComposer({
  mode,
  initial,
  expanded,
  onExpand,
  onCancel,
  onSave,
  saving = false,
  error = null,
  renderToolbar,
  attachments,
  attachedCount = 0,
  attachedBytes = 0,
}: NoteComposerProps) {
  const t = useUiTranslations();
  const editorRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialRef = useRef(initial);
  initialRef.current = initial;

  // Seed the uncontrolled editor and focus it when the composer opens.
  useEffect(() => {
    if (!expanded) return;
    const editor = editorRef.current;
    if (!editor) return;
    const seed = initialRef.current;
    const clean = sanitizeNoteHtml(seed?.content ?? "");
    editor.innerHTML = clean;
    setContent(clean);
    setTitle(seed?.title ?? "");
    editor.focus();
  }, [expanded]);

  const reset = useCallback(() => {
    setTitle("");
    setContent("");
    setToolbarOpen(false);
    setFiles([]);
    if (editorRef.current) editorRef.current.innerHTML = "";
  }, []);

  const cancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const exec = useCallback<NoteEditorExec>((command, value, text) => {
    const editor = editorRef.current;
    if (!editor) return;
    applyNoteEditorCommand(editor, command, value, text, rangeRef.current);
    setContent(editor.innerHTML);
    rangeRef.current = saveSelection(editor);
  }, []);

  if (!expanded) {
    return (
      <button
        type="button"
        data-testid="note-composer-collapsed"
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-left text-base text-text-muted"
        onClick={onExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onExpand();
          }
        }}
      >
        Add a note
      </button>
    );
  }

  const tooLong = content.length > NOTE_CONTENT_MAX_LENGTH;
  const empty = title.trim() === "" && isNoteContentEmpty(content);
  const saveDisabled = saving || empty || tooLong;

  const save = async () => {
    if (saveDisabled) return;
    try {
      await onSave({ title: title.trim(), content, ...(files.length > 0 ? { files } : {}) });
    } catch {
      return; // keep the draft; the caller reports the failure via `error`
    }
    reset();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Esc cancels from anywhere inside the composer
    <div
      data-testid="note-composer"
      data-mode={mode}
      className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          cancel();
        }
      }}
    >
      <input
        aria-label={t("records.notes.title")}
        placeholder={t("records.notes.title")}
        maxLength={TITLE_MAX_LENGTH}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-b border-border bg-transparent pb-1 text-base outline-none"
      />
      {/* biome-ignore lint/a11y/useSemanticElements: rich text needs contentEditable */}
      <div
        ref={editorRef}
        role="textbox"
        tabIndex={0}
        aria-multiline="true"
        aria-label={t("records.notes.noteContent")}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={t("records.notes.placeholder")}
        data-empty={isNoteContentEmpty(content) ? "true" : "false"}
        className="min-h-24 resize-y overflow-auto text-base outline-none data-[empty=true]:before:pointer-events-none data-[empty=true]:before:text-text-muted data-[empty=true]:before:content-[attr(data-placeholder)]"
        onInput={(e) => setContent(e.currentTarget.innerHTML)}
        onKeyUp={(e) => {
          rangeRef.current = saveSelection(e.currentTarget);
        }}
        onMouseUp={(e) => {
          rangeRef.current = saveSelection(e.currentTarget);
        }}
        onBlur={(e) => {
          rangeRef.current = saveSelection(e.currentTarget) ?? rangeRef.current;
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          const editor = e.currentTarget;
          restoreSelection(editor, rangeRef.current);
          applyNoteEditorCommand(editor, "insertText", undefined, text);
          setContent(editor.innerHTML);
        }}
      />
      {toolbarOpen && renderToolbar ? (
        <div
          role="toolbar"
          aria-label="Formatting"
          data-testid="note-composer-toolbar"
          onMouseDown={(e) => e.preventDefault()}
        >
          {renderToolbar(exec)}
        </div>
      ) : null}
      <PendingFileChips
        files={files}
        onRemove={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
      />
      {attachments}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        data-testid="note-file-input"
        onChange={(e) => {
          const picked = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          if (picked.length === 0) return;
          const result = addPendingFiles(files, picked, attachedCount, attachedBytes);
          if (result.overBudget) notifyOverBudget();
          else setFiles(result.files);
        }}
      />
      {tooLong ? (
        <p role="alert" className="text-sm text-danger">
          {t("records.notes.contentExceeds")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" data-testid="note-composer-error" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="icon"
            aria-label={t("records.notes.format")}
            aria-pressed={toolbarOpen}
            onPress={() => setToolbarOpen((v) => !v)}
          >
            <Type className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Button>
          {toolbarOpen ? null : (
            <Button
              variant="icon"
              aria-label={t("records.notes.attachFile")}
              onPress={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onPress={cancel}>
            {t("common.actions.cancel")}
          </Button>
          <Button size="sm" isDisabled={saveDisabled} onPress={save}>
            {t("common.actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
