"use client";

import { formatDateTime } from "@crm/core/format";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icon";
import { resolveLaterModule } from "@/components/ui/later-module";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_FORMAT } from "@/lib/locale";
import type { RelatedListControlDefinition } from "@/modules/types";
import type { EmailConversation } from "../inbox/view-model";
import {
  COMPOSE_EMAIL_TOOLTIP,
  EMAIL_CARD_TABS,
  EMPTY_STATE_TEXT,
  loadEmailRecordCardFixture,
} from "./fixtures";
import type {
  EmailParentModule,
  EmailRecordCardLoader,
  EmailsRecordCardProps,
  EmailTabKey,
} from "./types";

function renderSubtabRowEndControl(ctrl: RelatedListControlDefinition) {
  const laterMod = resolveLaterModule(ctrl.moduleKey);
  if (ctrl.type === "select") {
    return (
      <Button
        key={ctrl.id}
        variant="recordSelector"
        size="cardSelector"
        laterModule={laterMod}
        onPress={ctrl.onAction}
      >
        <span>{ctrl.label}</span>
        <Icons.chevronDown aria-hidden className="size-3 text-(--color-form-caret)" />
      </Button>
    );
  }
  return (
    <Button
      key={ctrl.id}
      variant="relatedAction"
      size="relatedAction"
      laterModule={laterMod}
      onPress={ctrl.onAction}
    >
      <span data-related-action-label>{ctrl.label}</span>
    </Button>
  );
}

type LoadStatus = "loading" | "ready" | "error";

interface LoadState {
  loader: EmailRecordCardLoader;
  parentModule?: EmailParentModule;
  recordId?: string;
  status: LoadStatus;
  conversations: EmailConversation[];
}

export function EmailsRecordCard({
  parentModule,
  recordId,
  targetId = "related-list-emails",
  subtabRowEndControl,
  initialTab = "mails",
  onTabChange,
  tooltipOpen,
  load,
  loader,
}: EmailsRecordCardProps) {
  const [activeTab, setActiveTab] = useState<EmailTabKey>(initialTab);

  const isCustomLoader = loader !== undefined || load !== undefined;
  const effectiveLoader = loader ?? load ?? loadEmailRecordCardFixture;

  const [state, setState] = useState<LoadState>(() => ({
    loader: effectiveLoader,
    parentModule,
    recordId,
    status: isCustomLoader ? "loading" : "ready",
    conversations: [],
  }));

  useEffect(() => {
    let live = true;
    if (activeTab !== "mails") return;

    if (!isCustomLoader) {
      setState({
        loader: effectiveLoader,
        parentModule,
        recordId,
        status: "ready",
        conversations: [],
      });
      return;
    }

    setState((prev) => ({
      loader: effectiveLoader,
      parentModule,
      recordId,
      status: "loading",
      conversations: prev.conversations,
    }));

    async function fetchEmails() {
      try {
        const data = await effectiveLoader(parentModule, recordId);
        if (live) {
          setState({
            loader: effectiveLoader,
            parentModule,
            recordId,
            status: "ready",
            conversations: data,
          });
        }
      } catch {
        if (live) {
          setState({
            loader: effectiveLoader,
            parentModule,
            recordId,
            status: "error",
            conversations: [],
          });
        }
      }
    }

    void fetchEmails();
    return () => {
      live = false;
    };
  }, [activeTab, effectiveLoader, isCustomLoader, parentModule, recordId]);

  function handleTabSelect(tabId: EmailTabKey) {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }

  const isCurrent =
    state.loader === effectiveLoader &&
    state.parentModule === parentModule &&
    state.recordId === recordId;
  const status = isCustomLoader && !isCurrent ? "loading" : state.status;
  const conversations = isCurrent ? state.conversations : [];

  return (
    <section
      id={targetId}
      aria-label="Emails"
      data-related-card="emails"
      className="detail-card border border-panel-border"
    >
      <div className="flex items-center justify-between min-h-(--size-list-header-height) py-2 border-b border-panel-border">
        <div className="flex items-center gap-3">
          <h3 className="text-md font-bold text-text-strong">Emails</h3>
        </div>
        <div className="flex items-center gap-2">
          <TooltipTrigger delay={0} closeDelay={0} isOpen={tooltipOpen}>
            <Button
              variant="relatedAction"
              size="relatedAction"
              isDisabled
              aria-label="Compose Email"
            >
              <span data-related-action-label>Compose Email</span>
            </Button>
            <Tooltip>{COMPOSE_EMAIL_TOOLTIP}</Tooltip>
          </TooltipTrigger>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 border-b border-panel-border pt-2">
          <div role="tablist" aria-label="Email folders" className="flex gap-4">
            {EMAIL_CARD_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={tab.id}
                  aria-selected={isSelected}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`pb-2 text-md transition-colors ${
                    isSelected
                      ? "border-b-2 border-primary text-primary font-semibold"
                      : "text-text-muted hover:text-text font-normal"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {subtabRowEndControl ? (
            <div className="pb-2 shrink-0">{renderSubtabRowEndControl(subtabRowEndControl)}</div>
          ) : null}
        </div>

        {activeTab === "mails" ? (
          status === "loading" ? (
            <div role="status">
              <EmptyState title="Loading emails..." />
            </div>
          ) : status === "error" ? (
            <div role="alert">
              <EmptyState title="Unable to load emails" />
            </div>
          ) : conversations.length === 0 ? (
            <div data-part="empty" className="py-8 text-center text-md text-text-empty">
              {EMPTY_STATE_TEXT}
            </div>
          ) : (
            <ul aria-label="Emails list" className="divide-y divide-panel-border">
              {conversations.map((conversation) => {
                const latest = conversation.messages.at(-1);
                const sender = latest ? latest.from.name || latest.from.address : "";
                const dateLabel = latest?.date ? formatDateTime(latest.date, DEFAULT_FORMAT) : "";

                return (
                  <li key={conversation.id} data-email-conversation={conversation.id}>
                    <button
                      type="button"
                      onClick={() => {
                        // Clicking a row does nothing yet (no navigation)
                      }}
                      className={`w-full flex flex-col items-stretch text-left p-3 hover:bg-surface-hover transition-colors ${
                        conversation.unread ? "font-semibold" : "font-normal"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm text-text-strong">{sender}</span>
                        <div className="flex items-center gap-2 shrink-0 font-normal">
                          {conversation.unread && (
                            <span className="text-xs text-primary">Unread</span>
                          )}
                          {latest?.date ? (
                            <time dateTime={latest.date} className="text-xs text-text-muted">
                              {dateLabel}
                            </time>
                          ) : null}
                        </div>
                      </div>
                      <span className="block truncate text-sm text-text">
                        {conversation.subject}
                      </span>
                      <span className="block truncate font-normal text-xs text-text-muted">
                        {conversation.snippet}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <div data-part="empty" className="py-8 text-center text-md text-text-empty">
            {EMPTY_STATE_TEXT}
          </div>
        )}
      </div>
    </section>
  );
}
