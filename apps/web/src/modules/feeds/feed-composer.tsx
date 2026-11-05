"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import { useUsers } from "@/lib/api/client/hooks";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text with @Name mentions becomes the sanitised paragraph HTML the API stores. */
export function textToFeedHtml(text: string): string {
  return text
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export interface FeedComposerProps {
  placeholder?: string;
  submitLabel?: string;
  busy?: boolean;
  compact?: boolean;
  onSubmit: (html: string, mentionUserIds: string[]) => Promise<void>;
}

export function FeedComposer({
  placeholder,
  submitLabel,
  busy,
  compact,
  onSubmit,
}: FeedComposerProps) {
  const t = useUiTranslations();
  const users = useUsers();
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState(false);

  const members = users.data ?? [];
  const query = /(?:^|\s)@(\S*)$/.exec(text)?.[1]?.toLowerCase();
  const suggestions =
    query === undefined
      ? picker
        ? members.slice(0, 8)
        : []
      : members.filter((m) => m.name.toLowerCase().includes(query)).slice(0, 8);

  function pick(id: string, name: string) {
    setText((current) =>
      /(?:^|\s)@\S*$/.test(current)
        ? current.replace(/@\S*$/, `@${name} `)
        : `${current}${current && !current.endsWith(" ") ? " " : ""}@${name} `,
    );
    setMentions((m) => ({ ...m, [id]: name }));
    setPicker(false);
  }

  async function submit() {
    const html = textToFeedHtml(text);
    if (!html) return;
    const ids = Object.entries(mentions)
      .filter(([, name]) => text.includes(`@${name}`))
      .map(([id]) => id);
    setError(false);
    try {
      await onSubmit(html, ids);
      setText("");
      setMentions({});
    } catch {
      setError(true);
    }
  }

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-2 p-4"}>
      <textarea
        aria-label={placeholder ?? t("feeds.composerPlaceholder")}
        placeholder={placeholder ?? t("feeds.composerPlaceholder")}
        value={text}
        rows={compact ? 2 : 3}
        maxLength={4000}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-y rounded-md border border-border bg-surface p-2 text-md text-text"
      />
      {suggestions.length > 0 ? (
        <ul className="rounded-md border border-border bg-surface" aria-label={t("feeds.mention")}>
          {suggestions.map((m) => (
            <li key={m.userId}>
              <button
                type="button"
                className="w-full px-3 py-1 text-left text-md hover:bg-surface-hover"
                onClick={() => pick(m.userId, m.name)}
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {t("feeds.actionFailed")}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="relatedAction" onPress={() => setPicker((v) => !v)}>
          @
        </Button>
        <Button
          size="relatedAction"
          isDisabled={busy || !text.trim()}
          onPress={() => void submit()}
        >
          {busy ? t("feeds.posting") : (submitLabel ?? t("feeds.post"))}
        </Button>
      </div>
    </div>
  );
}
