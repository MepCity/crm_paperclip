"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import { useUiTranslations } from "@/i18n/client-provider";
import { useCurrentUserId } from "@/lib/preferences";
import { FeedList } from "./feed-list";
import { useFeedsAccess } from "./feeds-access";
import { feedsApi } from "./feeds-api";

/** Modules with a record feed tab (ADR 0018 §8: Deals by default). */
export const RECORD_FEED_MODULES: readonly string[] = ["Deals"];

export function hasRecordFeed(module: string): boolean {
  return RECORD_FEED_MODULES.includes(module);
}

export function RecordFeedTab({
  orgSlug,
  module,
  recordId,
}: {
  orgSlug: string;
  module: string;
  recordId: string;
}) {
  const userId = useCurrentUserId();
  return (
    <FeedList
      orgSlug={orgSlug}
      userId={userId}
      scope={{ record: { module, id: recordId } }}
      postRecord={{ module, id: recordId }}
    />
  );
}

/** Follow / unfollow row for the record header overflow menu; no request on other modules. */
export function useFollowMenuGroup(
  orgSlug: string,
  module: string,
  recordId: string,
): RecordMenuGroup | null {
  const t = useUiTranslations();
  const feedsView = useFeedsAccess().view;
  const enabled = feedsView && hasRecordFeed(module);
  const api = useMemo(() => feedsApi(orgSlug), [orgSlug]);
  const queryClient = useQueryClient();
  const key = ["feeds", orgSlug, "follow", module, recordId];
  const state = useQuery({
    queryKey: key,
    queryFn: () => api.followState(module, recordId),
    enabled,
  });
  const toggle = useMutation({
    mutationFn: (on: boolean) => api.follow(module, recordId, on),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feeds", orgSlug] }),
  });
  if (!enabled || !state.data) return null;
  const following = state.data.following;
  return {
    id: "feed-follow",
    items: [
      {
        id: "feed-follow-toggle",
        label: following ? t("feeds.unfollow") : t("feeds.follow"),
        onAction: () => toggle.mutate(!following),
      },
    ],
  };
}
