import { type ApiFetchFn, apiFetch } from "@/lib/api/client/fetch";
import type { MailComposePort } from "./port";

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
