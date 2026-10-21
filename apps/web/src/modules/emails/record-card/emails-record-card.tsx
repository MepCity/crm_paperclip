"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { resolveLaterModule } from "@/components/ui/later-module";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import type { RelatedListControlDefinition } from "@/modules/types";
import { COMPOSE_EMAIL_TOOLTIP, EMAIL_CARD_TABS, EMPTY_STATE_TEXT } from "./fixtures";
import type { EmailsRecordCardProps, EmailTabKey } from "./types";

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

export function EmailsRecordCard({
  targetId = "related-list-emails",
  subtabRowEndControl,
  initialTab = "mails",
  onTabChange,
  tooltipOpen,
}: EmailsRecordCardProps) {
  const [activeTab, setActiveTab] = useState<EmailTabKey>(initialTab);

  function handleTabSelect(tabId: EmailTabKey) {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }

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
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          {EMPTY_STATE_TEXT}
        </div>
      </div>
    </section>
  );
}
