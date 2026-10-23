import type { ApiFetchFn } from "@/lib/api/client/fetch";
import { createHttpMailPort, type MailRecordModule } from "@/lib/mail/http-port";
import type { EmailRecordCardLoader } from "./types";

const supportedModules: readonly string[] = ["Leads", "Contacts", "Accounts", "Deals"];

/** Loads a record's conversations from the mail endpoint; `connected: false` yields no rows. */
export function createHttpRecordCardLoader(
  orgSlug: string,
  fetcher?: ApiFetchFn,
): EmailRecordCardLoader {
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
