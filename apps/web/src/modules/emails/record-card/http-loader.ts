import type { ApiFetchFn } from "@/lib/api/client/fetch";
import { createHttpMailPort, type MailRecordModule } from "@/lib/mail/http-port";
import type { EmailRecordCardLoader } from "./types";

const supportedModules: readonly string[] = ["Leads", "Contacts", "Accounts", "Deals"];

const defaultLoaders = new Map<string, EmailRecordCardLoader>();

/**
 * Loads a record's conversations from the mail endpoint; `connected: false` yields no rows.
 * Without a custom fetcher the loader is stable per org, so re-renders do not reload the card.
 */
export function createHttpRecordCardLoader(
  orgSlug: string,
  fetcher?: ApiFetchFn,
): EmailRecordCardLoader {
  if (fetcher) return buildLoader(orgSlug, fetcher);
  let loader = defaultLoaders.get(orgSlug);
  if (!loader) {
    loader = buildLoader(orgSlug);
    defaultLoaders.set(orgSlug, loader);
  }
  return loader;
}

function buildLoader(orgSlug: string, fetcher?: ApiFetchFn): EmailRecordCardLoader {
  const port = createHttpMailPort(orgSlug, fetcher);
  return async (parentModule, recordId) => {
    if (!parentModule || !recordId || !supportedModules.includes(parentModule)) return [];
    const { data } = await port.fetchRecordConversations(
      parentModule as MailRecordModule,
      recordId,
    );
    return data;
  };
}
