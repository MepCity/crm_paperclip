"use client";

import { formatDateTime } from "@crm/core/format";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icon";
import { DEFAULT_FORMAT } from "@/lib/locale";
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
  return (
    <div className="space-y-4 px-4 pb-4 text-sm">
      <dl className="space-y-1 break-words text-text-muted">
        <div>
          <dt className="inline font-semibold">From: </dt>
          <dd className="inline">{addressLabel(message.from)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">To: </dt>
          <dd className="inline">{message.to.map(addressLabel).join(", ")}</dd>
        </div>
        {message.cc.length > 0 && (
          <div>
            <dt className="inline font-semibold">Cc: </dt>
            <dd className="inline">{message.cc.map(addressLabel).join(", ")}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-semibold">Date: </dt>
          <dd className="inline">
            <time dateTime={message.date}>{formatDateTime(message.date, DEFAULT_FORMAT)}</time>
          </dd>
        </div>
      </dl>
      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
      {message.attachments.length > 0 && (
        <section aria-label="Attachments" className="border-t border-border pt-3">
          <h3 className="mb-2 font-semibold">Attachments ({message.attachments.length})</h3>
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
}: {
  model: InboxViewModel;
  folderParam: string | null;
  messageParam: string | null;
  onNavigate: (folder: EmailFolder, messageId?: string) => void;
}) {
  const { folder, conversations, selected } = resolveInboxSelection(
    model,
    folderParam,
    messageParam,
  );
  if (!model.connected) {
    return (
      <EmptyState
        title="No mailbox connected"
        description="Your emails will appear here when a mailbox is connected."
      />
    );
  }
  const folderLabel = emailFolders.find((item) => item.id === folder)?.label;
  return (
    <div className="m-3 overflow-x-auto rounded-md border border-border bg-surface text-text">
      <div className="flex min-h-96 min-w-0 flex-col lg:flex-row">
        <nav
          aria-label="Email folders"
          className="shrink-0 border-b border-border p-3 lg:w-44 lg:border-r lg:border-b-0"
        >
          <h1 className="mb-4 px-2 text-xl font-semibold">Emails</h1>
          <ul className="space-y-1">
            {emailFolders.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${item.label} ${model.conversations.filter((conversation) => conversation.folder === item.id).length}`}
                  aria-current={folder === item.id ? "page" : undefined}
                  onPress={() => onNavigate(item.id)}
                  className={`w-full justify-between gap-3 ${folder === item.id ? "bg-primary-subtle! text-text!" : ""}`}
                >
                  <span>{item.label}</span>
                  <span>
                    {
                      model.conversations.filter((conversation) => conversation.folder === item.id)
                        .length
                    }
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <section
          aria-label="Message list"
          className="min-w-0 border-b border-border lg:w-80 lg:shrink-0 lg:border-r lg:border-b-0"
        >
          <h2 className="border-b border-border p-4 text-lg font-semibold">{folderLabel}</h2>
          {conversations.length === 0 ? (
            <EmptyState title={`No messages in ${folderLabel}`} />
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
                          <span className="text-xs text-primary">Unread</span>
                        )}
                      </span>
                      <span className="block truncate">{conversation.subject}</span>
                      <span className="block truncate font-normal text-sm text-text-muted">
                        {conversation.snippet}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 font-normal text-xs text-text-muted">
                        <time dateTime={latest.date}>
                          {formatDateTime(latest.date, DEFAULT_FORMAT)}
                        </time>
                        {conversation.messages.some(
                          (message) => message.attachments.length > 0,
                        ) && (
                          <span role="img" aria-label="Has attachments">
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
        <section aria-label="Reading pane" className="min-w-0 flex-1 p-4">
          {selected ? (
            <article key={selected.id}>
              <h2 className="mb-4 break-words text-xl font-semibold">{selected.subject}</h2>
              <div className="space-y-3">
                {selected.messages.map((message, index) => (
                  <div key={message.id} className="rounded-md border border-border">
                    <Disclosure
                      label={`${message.from.name} · ${formatDateTime(message.date, DEFAULT_FORMAT)}`}
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
              title="Select a message"
              description="Choose a message to read its conversation."
            />
          )}
        </section>
      </div>
    </div>
  );
}
