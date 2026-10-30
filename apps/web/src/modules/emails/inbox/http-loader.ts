import type { ApiFetchFn } from "@/lib/api/client/fetch";
import { fetchConversations } from "@/lib/mail/http-port";
import type { InboxLoader } from "./inbox-client";

export function createHttpInboxLoader(fetcher?: ApiFetchFn): InboxLoader {
  return async (folder) => {
    const response = await fetchConversations(folder, fetcher);
    // The endpoint has no folder totals; keep counters derived from returned rows.
    return { connected: response.connected, conversations: response.data };
  };
}

export const loadInboxHttp = createHttpInboxLoader();
