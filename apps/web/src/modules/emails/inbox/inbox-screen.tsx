"use client";

import { formatDateTime } from "@crm/core/format";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import { useFormat } from "@/lib/format-context";
import { fetchComposeMailboxes } from "../compose/http-port";
import { MailCompose } from "../compose/mail-compose";
import type { ComposeMailbox } from "../compose/port";
import {
  type EmailAddress,
  type EmailFolder,
  type EmailMessage,
  emailFolders,
  type InboxViewModel,
  resolveInboxSelection,
} from "./view-model";

function addressLabel(person: EmailAddress) {
  return `${person.name} <${person.address}>`;
}

function MessageContent({ message }: { message: EmailMessage }) {
  const t = useUiTranslations();
  const orgFormat = useFormat();
  return (
    <div className="space-y-4 px-4 pb-4 text-sm">
      <dl className="space-y-1 break-words text-text-muted">
        <div>
          <dt className="inline font-semibold">{t("modules.emails.from")} </dt>
          <dd className="inline">{addressLabel(message.from)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">{t("modules.emails.to")} </dt>
          <dd className="inline">{message.to.map(addressLabel).join(", ")}</dd>
        </div>
        {message.cc.length > 0 && (
          <div>
            <dt className="inline font-semibold">{t("modules.emails.cc")} </dt>
            <dd className="inline">{message.cc.map(addressLabel).join(", ")}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-semibold">{t("modules.emails.date")} </dt>
          <dd className="inline">
            <time dateTime={message.date}>{formatDateTime(message.date, orgFormat)}</time>
          </dd>
        </div>
      </dl>
      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
      {message.attachments.length > 0 && (
        <section
          aria-label={t("modules.emails.attachments")}
          className="border-t border-border pt-3"
        >
          <h3 className="mb-2 font-semibold">
            {t("modules.emails.attachmentsCount", { count: message.attachments.length })}
          </h3>
          <ul className="space-y-2">
            {message.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-2 break-all rounded-md border border-border p-2"
              >
                <Icons.file aria-hidden className="size-4 shrink-0" />
                <span>{attachment.name}</span>
                <span className="text-text-muted">{attachment.sizeLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function InboxScreen({
  model,
  folderParam,
  messageParam,
  onNavigate,
  loadState,
}: {
  model: InboxViewModel;
  loadState?: "loading" | "error";
  folderParam: string | null;
  messageParam: string | null;
  onNavigate: (folder: EmailFolder, messageId?: string) => void;
}) {
  const t = useUiTranslations();
  const orgFormat = useFormat();
  const [composeOpen, setComposeOpen] = useState(false);
  const [mailboxes, setMailboxes] = useState<readonly ComposeMailbox[]>([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!composeOpen) return;
    let active = true;
    void fetchComposeMailboxes()
      .then((data) => {
        if (active) setMailboxes(data);
      })
      .catch(() => {
        if (active) setMailboxes([]);
      });
    return () => {
      active = false;
    };
  }, [composeOpen]);

  const { folder, conversations, selected } = resolveInboxSelection(
    model,
    folderParam,
    messageParam,
  );
  if (!loadState && !model.connected) {
    return (
      <EmptyState
        title={t("modules.emails.noMailboxConnected")}
        description={t("modules.emails.noMailboxDesc")}
      />
    );
  }

  const folderName = (id: string, fallback: string) => {
    switch (id) {
      case "inbox":
        return t("modules.emails.folderInbox");
      case "sent":
        return t("modules.emails.folderSent");
      case "drafts":
        return t("modules.emails.folderDrafts");
      case "scheduled":
        return t("modules.emails.folderScheduled");
      case "trash":
        return t("modules.emails.folderTrash");
      default:
        return fallback;
    }
  };

  const currentFolderDef = emailFolders.find((item) => item.id === folder);
  const folderLabel = currentFolderDef
    ? folderName(currentFolderDef.id, currentFolderDef.label)
    : folder;

  return (
    <div className="m-3 overflow-x-auto rounded-md border border-border bg-surface text-text">
      <div className="flex items-center justify-between border-b border-border p-3">
        <Button
          variant="primary"
          isDisabled={Boolean(loadState)}
          onPress={() => {
            setSent(false);
            setComposeOpen(true);
          }}
        >
          {t("modules.emails.compose")}
        </Button>
        {sent && <p role="status">{t("modules.emails.sendSuccess")}</p>}
      </div>
      {composeOpen && (
        <MailCompose
          mailboxes={mailboxes}
          onClose={() => setComposeOpen(false)}
          onSent={() => setSent(true)}
        />
      )}
      <div className="flex min-h-96 min-w-0 flex-col lg:flex-row">
        <nav
          aria-label={t("modules.emails.emailFolders")}
          className="shrink-0 border-b border-border p-3 lg:w-44 lg:border-r lg:border-b-0"
        >
          <h1 className="mb-4 px-2 text-xl font-semibold">{t("modules.emails.emailsHeading")}</h1>
          <ul className="space-y-1">
            {emailFolders.map((item) => {
              const label = folderName(item.id, item.label);
              const count = model.conversations.filter(
                (conversation) => conversation.folder === item.id,
              ).length;
              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${label} ${count}`}
                    aria-current={folder === item.id ? "page" : undefined}
                    onPress={() => onNavigate(item.id)}
                    className={`w-full justify-between gap-3 ${folder === item.id ? "bg-primary-subtle! text-text!" : ""}`}
                  >
                    <span>{label}</span>
                    <span>{count}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
        <section
          aria-label={t("modules.emails.messageList")}
          className="min-w-0 border-b border-border lg:w-80 lg:shrink-0 lg:border-r lg:border-b-0"
        >
          <h2 className="border-b border-border p-4 text-lg font-semibold">{folderLabel}</h2>
          {loadState ? (
            <div role={loadState === "error" ? "alert" : "status"}>
              <EmptyState
                title={
                  loadState === "loading"
                    ? t("modules.emails.loadingEmails")
                    : t("modules.emails.unableToLoad")
                }
              />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState title={t("modules.emails.emptyFolder", { folder: folderLabel })} />
          ) : (
            <ul aria-label={`${folderLabel} messages`}>
              {conversations.map((conversation) => {
                const latest = conversation.messages.at(-1);
                if (!latest) return null;
                return (
                  <li key={conversation.id} className="border-b border-row-separator">
                    <Button
                      variant="ghost"
                      size="compact"
                      aria-pressed={selected?.id === conversation.id}
                      onPress={() => onNavigate(folder, conversation.id)}
                      className={`w-full flex-col items-stretch whitespace-normal! rounded-none p-4 text-left ${selected?.id === conversation.id ? "bg-primary-subtle!" : ""} ${conversation.unread ? "font-semibold" : "font-normal!"}`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate">{latest.from.name}</span>
                        {conversation.unread && (
                          <span className="text-xs text-primary">{t("modules.emails.unread")}</span>
                        )}
                      </span>
                      <span className="block truncate">{conversation.subject}</span>
                      <span className="block truncate font-normal text-sm text-text-muted">
                        {conversation.snippet}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 font-normal text-xs text-text-muted">
                        <time dateTime={latest.date}>{formatDateTime(latest.date, orgFormat)}</time>
                        {conversation.messages.some(
                          (message) => message.attachments.length > 0,
                        ) && (
                          <span role="img" aria-label={t("modules.emails.hasAttachments")}>
                            <Icons.file aria-hidden className="size-4" />
                          </span>
                        )}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section aria-label={t("modules.emails.readingPane")} className="min-w-0 flex-1 p-4">
          {!loadState && selected ? (
            <article key={selected.id}>
              <h2 className="mb-4 break-words text-xl font-semibold">{selected.subject}</h2>
              <div className="space-y-3">
                {selected.messages.map((message, index) => (
                  <div key={message.id} className="rounded-md border border-border">
                    <Disclosure
                      label={`${message.from.name} · ${formatDateTime(message.date, orgFormat)}`}
                      defaultExpanded={index === selected.messages.length - 1}
                    >
                      <MessageContent message={message} />
                    </Disclosure>
                  </div>
                ))}
              </div>
            </article>
          ) : (
            <EmptyState
              title={t("modules.emails.selectMessage")}
              description={t("modules.emails.selectMessageDesc")}
            />
          )}
        </section>
      </div>
    </div>
  );
}
