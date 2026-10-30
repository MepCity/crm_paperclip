import { ValidationError } from "@crm/core/errors";
import { type ApiFetchFn, apiFetch } from "@/lib/api/client/fetch";
import { UnexpectedApiError } from "@/lib/api/wire/errors";
import {
  type EmailConversation,
  type EmailFolder,
  emailFolders,
} from "@/modules/emails/inbox/view-model";

export type MailConversationsResponse = { connected: boolean; data: EmailConversation[] };
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const string = (v: unknown): v is string => typeof v === "string";
const address = (v: unknown) => record(v) && string(v.name) && string(v.address);
const attachment = (v: unknown) =>
  record(v) && string(v.id) && string(v.name) && string(v.sizeLabel);
const list = (v: unknown, guard: (v: unknown) => boolean) => Array.isArray(v) && v.every(guard);
const message = (v: unknown) =>
  record(v) &&
  string(v.id) &&
  address(v.from) &&
  list(v.to, address) &&
  list(v.cc, address) &&
  string(v.date) &&
  /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v.date) &&
  Number.isFinite(Date.parse(v.date)) &&
  string(v.body) &&
  list(v.attachments, attachment);
function conversation(v: unknown): v is EmailConversation {
  return (
    record(v) &&
    string(v.id) &&
    emailFolders.some((f) => f.id === v.folder) &&
    string(v.subject) &&
    string(v.snippet) &&
    typeof v.unread === "boolean" &&
    Array.isArray(v.messages) &&
    v.messages.length > 0 &&
    v.messages.every(message)
  );
}

/** Browser convenience; server callers and tests supply an organization-bound fetcher. */
const browserFetch: ApiFetchFn = (path, options) => {
  const slug =
    typeof window === "undefined"
      ? undefined
      : window.location.pathname.match(/^\/crm\/([^/]+)\//)?.[1];
  if (!slug) throw new Error("Mail requests require an organization-bound fetcher.");
  return apiFetch(decodeURIComponent(slug), path, options);
};

export type MailRecordModule = "Leads" | "Contacts" | "Accounts" | "Deals";

function readResponse(body: unknown, folder?: EmailFolder): MailConversationsResponse {
  if (
    !record(body) ||
    typeof body.connected !== "boolean" ||
    !Array.isArray(body.data) ||
    !body.data.every(conversation) ||
    (folder !== undefined && body.data.some((row) => row.folder !== folder)) ||
    (!body.connected && body.data.length > 0)
  )
    throw new Error("Malformed mail response");
  return { connected: body.connected, data: body.data };
}

export async function fetchRecordConversations(
  module: MailRecordModule,
  recordId: string,
  fetchFn: ApiFetchFn = browserFetch,
): Promise<MailConversationsResponse> {
  return readResponse(
    await fetchFn(`/crm/v2.2/mail/conversations?${new URLSearchParams({ module, recordId })}`),
  );
}

export async function fetchConversations(
  folder: EmailFolder,
  fetchFn: ApiFetchFn = browserFetch,
): Promise<MailConversationsResponse> {
  let body: unknown;
  try {
    body = await fetchFn(`/crm/v2.2/mail/conversations?${new URLSearchParams({ folder })}`);
  } catch (error) {
    // INVALID_FOLDER is a route-specific wire code; preserve the shared client codec.
    if (error instanceof UnexpectedApiError && error.status === 400) {
      throw new ValidationError({ folder: ["Invalid folder."] });
    }
    throw error;
  }
  return readResponse(body, folder);
}

export function createHttpMailPort(
  orgSlug: string,
  fetcher: ApiFetchFn = (path, options) => apiFetch(orgSlug, path, options),
) {
  return {
    fetchConversations: (folder: EmailFolder) => fetchConversations(folder, fetcher),
    fetchRecordConversations: (module: MailRecordModule, recordId: string) =>
      fetchRecordConversations(module, recordId, fetcher),
  };
}
