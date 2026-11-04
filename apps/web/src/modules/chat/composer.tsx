"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useUiTranslations } from "@/i18n/client-provider";
import { SendIcon } from "./chat-icons";
import type { ChatMemberView } from "./data";
import { extractMentions } from "./text";

const MAX_LENGTH = 10_000;
const MENTION_AT_CARET = /(^|\s)@([^\s@]{0,40})$/;

export interface ComposerProps {
  members: readonly ChatMemberView[];
  /** Called with the trimmed body and the resolved mention ids. */
  onSend(body: string, mentions: string[]): void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Message composer (ADR §7.3): Enter sends, Shift+Enter inserts a new line,
 * `@` opens a member picker that fills `mentions`.
 * Refs: MEP-1420
 */
export function Composer({ members, onSend, disabled, placeholder }: ComposerProps) {
  const t = useUiTranslations();
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const query = useMemo(() => {
    const match = text.slice(0, caret).match(MENTION_AT_CARET);
    return match ? (match[2] ?? "") : null;
  }, [text, caret]);

  const options = useMemo(() => {
    if (query === null || pickerDismissed) return [];
    const needle = query.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [members, query, pickerDismissed]);

  const pickerOpen = options.length > 0;

  // Keep the textarea one to five lines tall and position cursor after pick.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resize whenever the text changes
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 110)}px`;
    if (pendingCaretRef.current !== null) {
      const pos = pendingCaretRef.current;
      pendingCaretRef.current = null;
      area.focus();
      area.setSelectionRange(pos, pos);
      setCaret(pos);
    }
  }, [text]);

  function pick(member: ChatMemberView) {
    const before = text.slice(0, caret).replace(MENTION_AT_CARET, `$1@${member.name} `);
    const next = before + text.slice(caret);
    pendingCaretRef.current = before.length;
    setText(next);
    setCaret(before.length);
    setPickerDismissed(false);
  }

  function submit() {
    const body = text.trim();
    if (!body || disabled) return;
    onSend(body, extractMentions(body, members));
    setText("");
    setCaret(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if (pickerOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => (i + 1) % options.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => (i - 1 + options.length) % options.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const choice = options[active] ?? options[0];
        if (choice) pick(choice);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setPickerDismissed(true);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="chat-composer" data-testid="chat-composer">
      {pickerOpen && (
        <div className="chat-mention-picker" role="listbox" aria-label={t("chat.mentionPicker")}>
          {options.map((member, index) => (
            <button
              key={member.id}
              type="button"
              role="option"
              aria-selected={index === active}
              className={`chat-mention-option${index === active ? " chat-mention-option-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(member)}
              data-testid="chat-mention-option"
            >
              {member.name}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={areaRef}
        className="chat-composer-input"
        rows={1}
        maxLength={MAX_LENGTH}
        value={text}
        placeholder={placeholder ?? t("chat.composerPlaceholder")}
        aria-label={t("chat.composerLabel")}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
          setPickerDismissed(false);
          setActive(0);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
        onKeyDown={onKeyDown}
        data-testid="chat-composer-input"
      />
      <button
        type="button"
        className="chat-composer-send"
        aria-label={t("chat.send")}
        disabled={disabled || text.trim().length === 0}
        onClick={submit}
        data-testid="chat-composer-send"
      >
        <SendIcon className="size-4" aria-hidden />
      </button>
    </div>
  );
}
