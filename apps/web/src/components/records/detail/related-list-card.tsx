"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { laterModuleProps, useLaterModule } from "@/components/ui/later-module";
import { Link } from "@/components/ui/link";
import { SplitButton } from "@/components/ui/split-button";
import type { RelatedListControlDefinition, RelatedListDefinition } from "@/modules/types";

export interface RelatedListCardProps {
  definition: RelatedListDefinition;
}

export function RelatedListCard({ definition }: RelatedListCardProps) {
  const {
    id,
    title,
    moduleKey,
    targetId,
    upperControls = [],
    emptyStateText,
    loadingText,
    activityColumns,
    subtabs,
    socialLinks,
    socialGuidance,
    introductoryText,
    bodyAction,
  } = definition;

  const [activeSubtab, setActiveSubtab] = useState(subtabs?.[0]?.id ?? "");
  const notesLaterRef = useLaterModule<HTMLTextAreaElement>(id === "notes" ? "M6" : undefined);

  const afterTitleControls = upperControls.filter((c) => c.position === "after-title");
  const rightControls = upperControls.filter((c) => c.position !== "after-title");

  function renderControl(ctrl: RelatedListControlDefinition) {
    const laterMod = ctrl.moduleKey === "M2" ? undefined : ctrl.moduleKey;
    if (ctrl.type === "split-button") {
      return (
        <SplitButton
          key={ctrl.id}
          label={ctrl.label}
          laterModule={laterMod}
          items={
            ctrl.options
              ? ctrl.options.map((opt) => ({
                  id: opt.id,
                  label: opt.label,
                  laterModule: laterMod,
                  onAction: opt.onAction ?? (() => {}),
                }))
              : [
                  {
                    id: `${ctrl.id}-more`,
                    label: "More",
                    laterModule: laterMod,
                    onAction: () => {},
                  },
                ]
          }
        />
      );
    }
    if (ctrl.type === "select") {
      return (
        <Button
          key={ctrl.id}
          variant="secondary"
          size="compact"
          laterModule={laterMod}
          onPress={ctrl.onAction}
          className="flex items-center gap-1.5"
        >
          <span>{ctrl.label}</span>
          <Icons.chevronDown aria-hidden className="size-3 text-text-muted" />
        </Button>
      );
    }
    if (ctrl.type === "icon-button") {
      const IconComponent =
        ctrl.icon ??
        (ctrl.label.toLowerCase().includes("expand") || ctrl.id.toLowerCase().includes("expand")
          ? Icons.diagonalExpand
          : Icons.tablePlus);
      return (
        <Button
          key={ctrl.id}
          variant="icon"
          size="compact"
          aria-label={ctrl.label}
          laterModule={laterMod}
          onPress={ctrl.onAction}
        >
          <IconComponent aria-hidden className="size-4" />
        </Button>
      );
    }
    return (
      <Button
        key={ctrl.id}
        variant="secondary"
        size="compact"
        laterModule={laterMod}
        onPress={ctrl.onAction}
      >
        {ctrl.label}
      </Button>
    );
  }

  return (
    <section
      id={targetId}
      aria-label={title}
      data-related-card={id}
      className="detail-card border border-panel-border"
    >
      <div className="flex items-center justify-between min-h-(--size-list-header-height) py-2 border-b border-panel-border">
        <div className="flex items-center gap-3">
          <h3 className="text-md font-bold text-text-strong">{title}</h3>
          {afterTitleControls.map((ctrl) => renderControl(ctrl))}
        </div>
        {rightControls.length > 0 && (
          <div className="flex items-center gap-2">
            {rightControls.map((ctrl) => renderControl(ctrl))}
          </div>
        )}
      </div>

      {id === "notes" ? (
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="secondary"
              size="compact"
              laterModule="M6"
              className="flex items-center gap-1.5"
            >
              <span>Recent Last</span>
              <Icons.chevronDown aria-hidden className="size-3 text-text-muted" />
            </Button>
          </div>
          <textarea
            ref={notesLaterRef}
            {...laterModuleProps("M6")}
            readOnly
            rows={3}
            placeholder="Add a note"
            aria-label="Add a note"
            className="w-full resize-none rounded-(--radius-md) border border-control-border bg-surface px-3 py-2 text-md text-text focus:outline-primary placeholder:text-text-placeholder"
          />
        </div>
      ) : loadingText ? (
        <div className="py-8 text-center text-md text-text-empty">{loadingText}</div>
      ) : activityColumns && activityColumns.length > 0 ? (
        <div className="flex divide-x divide-panel-border overflow-x-auto py-2">
          {activityColumns.map((col) => {
            const ColumnIcon =
              col.icon ??
              (col.id.includes("task")
                ? Icons.check
                : col.id.includes("meeting")
                  ? Icons.calendar
                  : null);
            return (
              <div key={col.id} className="flex-1 min-w-[220px] px-4 py-2">
                <div className="flex items-center gap-2 mb-3">
                  {ColumnIcon && (
                    <ColumnIcon aria-hidden className="size-3.5 text-text-muted shrink-0" />
                  )}
                  <span className="text-md font-medium text-text-strong">{col.title}</span>
                  <span className="inline-flex items-center justify-center min-w-5 h-4 px-1 rounded-full bg-surface-active text-2xs font-semibold text-text-muted">
                    {col.count}
                  </span>
                </div>
                <div className="py-4 text-center text-md text-text-empty">{col.emptyText}</div>
              </div>
            );
          })}
        </div>
      ) : subtabs && subtabs.length > 0 ? (
        <div>
          <div role="tablist" className="flex gap-4 border-b border-panel-border pt-2">
            {subtabs.map((tab) => {
              const tabLater = moduleKey === "M2" ? undefined : moduleKey;
              const isSelected = activeSubtab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => !tabLater && setActiveSubtab(tab.id)}
                  {...(tabLater ? laterModuleProps(tabLater) : {})}
                  className={`pb-2 text-md font-medium transition-colors ${
                    isSelected
                      ? "border-b-2 border-primary text-primary"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="py-8 text-center text-md text-text-empty">{emptyStateText}</div>
        </div>
      ) : socialLinks && socialLinks.length > 0 ? (
        <div className="flex divide-x divide-panel-border py-4">
          <div className="flex flex-col gap-2.5 pr-8 min-w-[200px]">
            {socialLinks.map((link) => (
              <Link
                key={link.id}
                href={`#${link.id}`}
                variant="body"
                laterModule={link.moduleKey === "M2" ? undefined : link.moduleKey}
                className="text-primary hover:underline font-medium text-md"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {socialGuidance && (
            <div className="pl-8 flex items-center max-w-lg">
              <p className="text-sm text-text-muted leading-relaxed">{socialGuidance}</p>
            </div>
          )}
        </div>
      ) : introductoryText ? (
        <div className="py-5">
          <p className="text-md text-text-muted mb-4 max-w-2xl">{introductoryText}</p>
          {bodyAction && (
            <Button
              variant="secondary"
              size="compact"
              laterModule={bodyAction.moduleKey === "M2" ? undefined : bodyAction.moduleKey}
              onPress={bodyAction.onAction}
            >
              {bodyAction.label}
            </Button>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-md text-text-empty">{emptyStateText}</div>
      )}
    </section>
  );
}
