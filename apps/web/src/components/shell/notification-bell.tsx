"use client";

import type { NotificationItem, NotificationPage } from "@crm/core/notifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useUiTranslations } from "@/i18n/client-provider";
import { apiFetch } from "@/lib/api/client/fetch";
import { moduleRecordPath } from "@/lib/crm-paths";

const BASE = "/crm/v2.2/notifications";
const POLL_MS = 30_000;

const KIND_KEYS = {
  mention: "feeds.bellMention",
  post_comment: "feeds.bellComment",
  post_like: "feeds.bellLike",
  followed_update: "feeds.bellFollowedUpdate",
} as const;

function targetHref(orgSlug: string, item: NotificationItem): string | null {
  const { recordModule, recordId } = item.subject;
  if (typeof recordModule === "string" && typeof recordId === "string")
    return moduleRecordPath(orgSlug, recordModule, recordId);
  if (item.subject.postId) return `/crm/${orgSlug}/tab/Feeds`;
  return null;
}

/** Top-bar bell: unseen badge polled every 30 s while the tab is visible; list opens in a popover. */
export function NotificationBell({ orgSlug }: { orgSlug: string }) {
  const t = useUiTranslations();
  const router = useRouter();
  const [unseen, setUnseen] = useState(0);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const r = (await apiFetch(orgSlug, `${BASE}/unseen_count`)) as { count: number };
      setUnseen(r.count);
    } catch {}
  }, [orgSlug]);

  useEffect(() => {
    void refreshCount();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refreshCount();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  async function onOpenChange(open: boolean) {
    if (!open) return;
    setFailed(false);
    try {
      const page = (await apiFetch(orgSlug, BASE)) as NotificationPage;
      setItems(page.items);
      if (page.items.some((i) => !i.seenAt)) {
        await apiFetch(orgSlug, `${BASE}/actions/seen`, {
          method: "POST",
          body: { ids: page.items.filter((i) => !i.seenAt).map((i) => i.id) },
        });
      }
      await refreshCount();
    } catch {
      setFailed(true);
    }
  }

  async function open(item: NotificationItem) {
    const href = targetHref(orgSlug, item);
    try {
      await apiFetch(orgSlug, `${BASE}/${item.id}/actions/read`, { method: "POST" });
    } catch {}
    setItems(
      (list) =>
        list?.map((i) => (i.id === item.id ? { ...i, readAt: i.readAt ?? "read" } : i)) ?? null,
    );
    if (href) router.push(href);
  }

  return (
    <PopoverTrigger onOpenChange={onOpenChange}>
      <Button
        variant="icon"
        size="compact"
        aria-label={t("shell.notifications")}
        className="relative size-(--size-topbar-control-pitch)"
      >
        <Icons.bell className="size-(--size-topbar-icon)" aria-hidden />
        {unseen > 0 ? (
          <span
            data-testid="notification-badge"
            className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-xs text-white"
          >
            {unseen > 99 ? "99+" : unseen}
          </span>
        ) : null}
      </Button>
      <Popover title={t("shell.notifications")} placement="bottom end" contentClassName="w-80">
        {failed ? (
          <p className="text-md text-text-muted">{t("feeds.bellError")}</p>
        ) : items === null ? null : items.length === 0 ? (
          <p className="text-md text-text-muted">{t("feeds.bellEmpty")}</p>
        ) : (
          <ul className="flex max-h-96 flex-col overflow-auto">
            {items.map((item) => {
              const known = item.kind in KIND_KEYS;
              const href = targetHref(orgSlug, item);
              const key = known ? KIND_KEYS[item.kind as keyof typeof KIND_KEYS] : null;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void open(item)}
                    className={`w-full rounded-md px-2 py-2 text-left text-md hover:bg-surface-hover ${item.readAt ? "text-text-muted" : "font-semibold text-text"}`}
                  >
                    {key ? t(key, { actor: item.actor?.name ?? "" }) : item.kind}
                    {href ? null : (
                      <span className="block text-sm font-normal text-text-muted">
                        {t("feeds.bellUnavailable")}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Popover>
    </PopoverTrigger>
  );
}
