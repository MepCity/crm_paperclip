"use client";

import type { FeedComment, FeedItem, FeedPage } from "@crm/core/feeds";
import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import { FeedComposer } from "./feed-composer";
import { FeedItemCard } from "./feed-item-card";
import { type FeedScope, feedsApi } from "./feeds-api";

export interface FeedListProps {
  orgSlug: string;
  userId: string | null;
  scope: FeedScope;
  emptyKey?: "feeds.empty" | "feeds.emptyFollowed" | "feeds.emptyMine";
  /** Record feed tab posts onto this record; the wall posts without one. */
  postRecord?: { module: string; id: string } | null;
}

export function FeedList({ orgSlug, userId, scope, emptyKey, postRecord }: FeedListProps) {
  const t = useUiTranslations();
  const api = useMemo(() => feedsApi(orgSlug), [orgSlug]);
  const queryClient = useQueryClient();
  const key = useMemo(
    () => ["feeds", orgSlug, scope.record?.module, scope.record?.id, scope.filter, scope.module],
    [orgSlug, scope],
  );
  const [busy, setBusy] = useState(false);
  const query = useInfiniteQuery<FeedPage, Error, InfiniteData<FeedPage>, unknown[], string | null>(
    {
      queryKey: key,
      initialPageParam: null,
      queryFn: ({ pageParam }) => api.list(scope, pageParam),
      getNextPageParam: (last) => last.nextCursor,
    },
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["feeds", orgSlug] });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  async function after<T>(action: () => Promise<T>) {
    await action();
    await refresh();
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border">
        <FeedComposer
          busy={busy}
          onSubmit={async (html, mentions) => {
            setBusy(true);
            try {
              await after(() => api.post(html, mentions, postRecord));
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {query.isError ? (
        <p role="alert" className="p-4 text-md text-danger">
          {t("feeds.loadFailed")}
        </p>
      ) : null}
      {!query.isLoading && !query.isError && items.length === 0 ? (
        <p className="p-6 text-md text-text-muted">{t(emptyKey ?? "feeds.empty")}</p>
      ) : null}
      {items.map((item) => (
        <FeedItemCard
          key={`${item.type}:${item.id}`}
          item={item}
          orgSlug={orgSlug}
          currentUserId={userId}
          onLike={(it: FeedItem, on) =>
            after(() => {
              const kind = it.type === "post" ? "post" : "history_event";
              return on ? api.like(kind, it.id, it) : api.unlike(kind, it.id);
            })
          }
          onComment={(it, html, mentions) =>
            after(() =>
              it.type === "post"
                ? api.commentOnPost(it.id, html, mentions)
                : api.commentOnEvent(it, html, mentions),
            )
          }
          onDelete={(it) => after(() => api.deletePost(it.id))}
          onDeleteComment={(_it: FeedItem, c: FeedComment) => after(() => api.deleteComment(c.id))}
        />
      ))}
      {query.hasNextPage ? (
        <div className="p-4">
          <Button
            variant="secondary"
            isDisabled={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          >
            {t("feeds.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
