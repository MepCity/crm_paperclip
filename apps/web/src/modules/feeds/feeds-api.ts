import type {
  FeedComment,
  FeedFilter,
  FeedItem,
  FeedLikeTarget,
  FeedPage,
  FeedPostItem,
  FollowState,
} from "@crm/core/feeds";
import { apiFetch } from "@/lib/api/client/fetch";

const BASE = "/crm/v2.2/feeds";

export type { FeedComment, FeedItem, FeedPage, FeedPostItem, FollowState };

export interface FeedScope {
  filter?: FeedFilter;
  module?: string | null;
  record?: { module: string; id: string } | null;
}

function qs(params: Record<string, string | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function feedsApi(orgSlug: string) {
  const call = (path: string, method = "GET", body?: unknown) =>
    apiFetch(orgSlug, `${BASE}${path}`, { method, ...(body === undefined ? {} : { body }) });
  return {
    list: (scope: FeedScope, cursor?: string | null) =>
      (scope.record
        ? call(
            `/records/${encodeURIComponent(scope.record.module)}/${encodeURIComponent(scope.record.id)}${qs({ cursor })}`,
          )
        : call(
            `${qs({ filter: scope.filter, module: scope.module, cursor })}`,
          )) as Promise<FeedPage>,
    post: (body: string, mentionUserIds: string[], record?: FeedScope["record"]) =>
      call("/posts", "POST", {
        body,
        mentionUserIds,
        ...(record ? { recordModule: record.module, recordId: record.id } : {}),
      }) as Promise<FeedPostItem>,
    editPost: (id: string, body: string) => call(`/posts/${id}`, "PATCH", { body }),
    deletePost: (id: string) => call(`/posts/${id}`, "DELETE"),
    commentOnPost: (id: string, body: string, mentionUserIds: string[]) =>
      call(`/posts/${id}/comments`, "POST", { body, mentionUserIds }) as Promise<FeedComment>,
    commentOnEvent: (item: FeedItem, body: string, mentionUserIds: string[]) =>
      call(`/events/${encodeURIComponent(item.id)}/comments`, "POST", {
        body,
        mentionUserIds,
        recordModule: item.record?.module,
        recordId: item.record?.id,
      }) as Promise<FeedComment>,
    deleteComment: (id: string) => call(`/comments/${id}`, "DELETE"),
    like: (kind: FeedLikeTarget, id: string, item?: FeedItem) =>
      call(
        `/likes/${kind}/${encodeURIComponent(id)}`,
        "PUT",
        kind === "history_event" && item?.record
          ? { recordModule: item.record.module, recordId: item.record.id }
          : undefined,
      ),
    unlike: (kind: FeedLikeTarget, id: string) =>
      call(`/likes/${kind}/${encodeURIComponent(id)}`, "DELETE"),
    followState: (module: string, id: string) =>
      call(
        `/follows/record/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
      ) as Promise<FollowState>,
    follow: (module: string, id: string, on: boolean) =>
      call(
        `/follows/record/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
        on ? "PUT" : "DELETE",
      ),
  };
}
