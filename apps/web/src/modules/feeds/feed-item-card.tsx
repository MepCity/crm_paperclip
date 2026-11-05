"use client";

import type { FeedComment, FeedItem } from "@crm/core/feeds";
import { formatDateTime } from "@crm/core/format";
import Link from "next/link";
import { useState } from "react";
import { NoteContent } from "@/components/records/notes/note-content";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import { moduleRecordPath } from "@/lib/crm-paths";
import { useFormat } from "@/lib/format-context";
import { FeedComposer } from "./feed-composer";

export interface FeedItemCardProps {
  item: FeedItem;
  orgSlug: string;
  currentUserId: string | null;
  onLike: (item: FeedItem, on: boolean) => Promise<void>;
  onComment: (item: FeedItem, html: string, mentions: string[]) => Promise<void>;
  onDelete: (item: FeedItem) => Promise<void>;
  onDeleteComment: (item: FeedItem, comment: FeedComment) => Promise<void>;
}

function Html({ html }: { html: string }) {
  return <NoteContent html={html} className="text-md text-text" />;
}

export function FeedItemCard(props: FeedItemCardProps) {
  const { item, orgSlug, currentUserId, onLike, onComment, onDelete, onDeleteComment } = props;
  const t = useUiTranslations();
  const format = useFormat();
  const [open, setOpen] = useState(item.commentCount > 0);
  const [busy, setBusy] = useState(false);
  const actor = item.type === "post" ? item.author : item.actor;
  const when = formatDateTime(item.at, format);
  const recordLink = item.record ? (
    <Link
      className="text-link"
      href={moduleRecordPath(orgSlug, item.record.module, item.record.id)}
    >
      {item.record.name ?? item.record.id}
    </Link>
  ) : null;

  let verb: React.ReactNode = null;
  if (item.type === "post") {
    verb = recordLink ? t("feeds.onRecord", { record: "" }).trim() : null;
  } else {
    const key =
      item.eventKind === "record_created"
        ? "feeds.created"
        : item.eventKind === "note_added"
          ? "feeds.noteAdded"
          : item.eventKind === "record_converted"
            ? "feeds.converted"
            : "feeds.updated";
    verb = t(key, { record: "" }).trim();
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col gap-2 border-b border-border p-4" data-feed-item={item.type}>
      <header className="flex flex-wrap items-baseline gap-1 text-md">
        <strong className="font-semibold text-text">{actor.name}</strong>
        {verb ? <span className="text-text-muted">{verb}</span> : null}
        {recordLink}
        <span className="ml-auto text-sm text-text-muted">
          {when}
          {item.type === "post" && item.editedAt ? ` · ${t("feeds.edited")}` : ""}
        </span>
      </header>
      {item.type === "post" ? (
        <Html html={item.body} />
      ) : (
        <ul className="flex flex-col gap-1 text-md">
          {item.changes.map((c) => (
            <li key={c.apiName}>
              {t("feeds.changedField", {
                field: c.label,
                from: c.oldDisplay ?? t("feeds.emptyValue"),
                to: c.newDisplay ?? t("feeds.emptyValue"),
              })}
            </li>
          ))}
        </ul>
      )}
      <footer className="flex items-center gap-3 text-sm">
        <Button
          variant="ghost"
          size="relatedAction"
          isDisabled={busy}
          aria-pressed={item.likedByMe}
          onPress={() => void run(() => onLike(item, !item.likedByMe))}
        >
          {item.likedByMe ? t("feeds.unlike") : t("feeds.like")}
        </Button>
        <Button variant="ghost" size="relatedAction" onPress={() => setOpen((v) => !v)}>
          {t("feeds.comment")}
        </Button>
        <span className="text-text-muted">{t("feeds.likeCount", { count: item.likeCount })}</span>
        <span className="text-text-muted">
          {t("feeds.commentCount", { count: item.commentCount })}
        </span>
        {item.type === "post" && item.author.id === currentUserId ? (
          <Button
            variant="ghost"
            size="relatedAction"
            isDisabled={busy}
            onPress={() => void run(() => onDelete(item))}
          >
            {t("feeds.delete")}
          </Button>
        ) : null}
      </footer>
      {open ? (
        <div className="flex flex-col gap-2 pl-4">
          {item.comments.map((c) => (
            <div key={c.id} className="flex flex-col text-md">
              <span>
                <strong className="font-semibold">{c.author.name}</strong>{" "}
                <span className="text-sm text-text-muted">
                  {formatDateTime(c.createdAt, format)}
                </span>
              </span>
              <Html html={c.body} />
              {c.author.id === currentUserId ? (
                <button
                  type="button"
                  className="self-start text-sm text-text-muted"
                  onClick={() => void run(() => onDeleteComment(item, c))}
                >
                  {t("feeds.delete")}
                </button>
              ) : null}
            </div>
          ))}
          <FeedComposer
            compact
            placeholder={t("feeds.commentPlaceholder")}
            submitLabel={t("feeds.commentSubmit")}
            onSubmit={(html, mentions) => onComment(item, html, mentions)}
          />
        </div>
      ) : null}
    </article>
  );
}
