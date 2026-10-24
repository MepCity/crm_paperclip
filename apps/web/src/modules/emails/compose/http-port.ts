import { type ApiFetchFn, apiFetch } from "@/lib/api/client/fetch";
import type { ComposeMailbox, MailComposePort } from "./port";

export type ComposeResult = {
  id: string;
  status: "queued" | "sending" | "sent" | "failed" | "cancelled";
  scheduledAt: string | null;
};

export function browserComposeOrg(): string | undefined {
  const slug =
    typeof window === "undefined"
      ? undefined
      : window.location.pathname.match(/^\/crm\/([^/]+)\//)?.[1];
  return slug ? decodeURIComponent(slug) : undefined;
}

const browserFetch: ApiFetchFn = (path, options) => {
  const slug = browserComposeOrg();
  if (!slug) throw new Error("Mail requests require an organization-bound fetcher.");
  return apiFetch(slug, path, options);
};

export function readComposeMailboxesResponse(response: unknown): ComposeMailbox[] {
  if (typeof response !== "object" || response === null || Array.isArray(response)) {
    throw new Error("Malformed compose mailboxes response");
  }
  const keys = Object.keys(response);
  if (keys.length !== 1 || keys[0] !== "data") {
    throw new Error("Malformed compose mailboxes response");
  }
  const { data } = response as { data?: unknown };
  if (!Array.isArray(data)) {
    throw new Error("Malformed compose mailboxes response");
  }
  return data.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error("Malformed compose mailbox item");
    }
    const itemKeys = Object.keys(item);
    for (const key of itemKeys) {
      if (key !== "id" && key !== "address" && key !== "name") {
        throw new Error(`Unexpected field in compose mailbox item: ${key}`);
      }
    }
    const { id, address, name } = item as { id?: unknown; address?: unknown; name?: unknown };
    if (typeof id !== "string" || !id.trim()) {
      throw new Error("Invalid compose mailbox id");
    }
    if (typeof address !== "string" || !address.trim()) {
      throw new Error("Invalid compose mailbox address");
    }
    if (name !== undefined && typeof name !== "string") {
      throw new Error("Invalid compose mailbox name");
    }
    const mailbox: ComposeMailbox = { id, address };
    if (name !== undefined) mailbox.name = name;
    return mailbox;
  });
}

export async function fetchComposeMailboxes(
  fetchFn: ApiFetchFn = browserFetch,
): Promise<ComposeMailbox[]> {
  const response = await fetchFn("/crm/v2.2/mail/mailboxes");
  return readComposeMailboxesResponse(response);
}

export function createHttpComposePort(
  orgSlug: string,
  fetcher: ApiFetchFn = (path, options) => apiFetch(orgSlug, path, options),
): MailComposePort {
  return {
    async send(input): Promise<ComposeResult> {
      const response = await fetcher("/crm/v2.2/mail/messages", {
        method: "POST",
        body: input,
      });
      const data =
        typeof response === "object" && response !== null && "data" in response
          ? response.data
          : null;
      if (
        typeof data !== "object" ||
        data === null ||
        !("id" in data) ||
        typeof data.id !== "string" ||
        !data.id ||
        !("status" in data) ||
        (data.status !== "queued" &&
          data.status !== "sending" &&
          data.status !== "sent" &&
          data.status !== "failed" &&
          data.status !== "cancelled") ||
        !("scheduledAt" in data) ||
        (data.scheduledAt !== null &&
          (typeof data.scheduledAt !== "string" || !Number.isFinite(Date.parse(data.scheduledAt))))
      ) {
        throw new Error("Malformed compose response");
      }
      return { id: data.id, status: data.status, scheduledAt: data.scheduledAt };
    },
  };
}
