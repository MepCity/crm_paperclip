"use client";

import type { ModuleApiName, RecordData } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { laterModuleProps, resolveLaterModule } from "@/components/ui/later-module";
import { Link } from "@/components/ui/link";
import { SplitButton } from "@/components/ui/split-button";
import {
  ACTIVITY_ADD_NEW_ENTRIES,
  type ActivityModule,
  openActivityCreate,
} from "@/modules/activity-add-new";
import type {
  RelatedListBodyContext,
  RelatedListControlDefinition,
  RelatedListDefinition,
} from "@/modules/types";
import { ACTIVITY_PARENT_MODULES } from "./record-call-context";
export interface RelatedListCardProps {
  definition: RelatedListDefinition;
  context?: RelatedListBodyContext;
}

function ActivityAddNew({
  label,
  orgSlug,
  module,
  record,
  returnTo,
}: {
  label: string;
  orgSlug: string;
  module: ModuleApiName;
  record: RecordData;
  returnTo: string;
}) {
  const router = useRouter();
  const open = (activity: ActivityModule) =>
    openActivityCreate(orgSlug, activity, module, record, (path) => router.push(path), returnTo);
  return (
    <SplitButton
      label={label}
      onPress={() => open("Tasks")}
      items={ACTIVITY_ADD_NEW_ENTRIES.map((entry) => ({
        id: `add-new-${entry.module}`,
        label: entry.label,
        onAction: () => open(entry.module),
      }))}
    />
  );
}

export function RelatedListCard({ definition, context }: RelatedListCardProps) {
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
    subtabRowEndControl,
    tableColumns,
    tablePreviewRows,
    showEmptyTable,
    socialLinks,
    socialGuidance,
    introductoryText,
    bodyAction,
  } = definition;

  const [activeSubtab, setActiveSubtab] = useState(subtabs?.[0]?.id ?? "");
  const customCard = definition.renderCard?.({
    orgSlug: "",
    recordPath: () => "#",
    ...context,
    definition,
  });
  const customBody = definition.renderBody?.({
    orgSlug: "",
    recordPath: () => "#",
    ...context,
    definition,
  });

  const afterTitleControls = upperControls.filter((c) => c.position === "after-title");
  const rightControls = upperControls.filter((c) => c.position !== "after-title");

  function renderControl(ctrl: RelatedListControlDefinition) {
    const laterMod = resolveLaterModule(ctrl.moduleKey);
    const moreLaterMod =
      ctrl.moreModuleKey !== undefined ? resolveLaterModule(ctrl.moreModuleKey) : laterMod;
    if (
      ctrl.type === "split-button" &&
      ctrl.id === "add-new" &&
      id === "open-activities" &&
      context?.record &&
      context.module &&
      ACTIVITY_PARENT_MODULES.includes(context.module)
    ) {
      return (
        <ActivityAddNew
          key={ctrl.id}
          label={ctrl.label}
          orgSlug={context.orgSlug}
          module={context.module}
          record={context.record}
          returnTo={context.recordPath(context.module, context.record.id)}
        />
      );
    }
    if (ctrl.type === "split-button") {
      return (
        <SplitButton
          key={ctrl.id}
          label={ctrl.label}
          laterModule={laterMod}
          moreLaterModule={moreLaterMod}
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
                    label: ctrl.label,
                    laterModule: moreLaterMod,
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
        variant="relatedAction"
        size="relatedAction"
        className={ctrl.id === "add-campaigns" ? "min-w-[122px]" : undefined}
        laterModule={laterMod}
        onPress={ctrl.onAction}
      >
        {ctrl.label}
      </Button>
    );
  }

  if (customCard != null) return <>{customCard}</>;

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

      {customBody != null ? (
        customBody
      ) : tableColumns &&
        tableColumns.length > 0 &&
        tablePreviewRows &&
        tablePreviewRows.length > 0 ? (
        <div className="overflow-x-auto py-2">
          <table className="w-full text-left text-md">
            <thead>
              <tr className="border-b border-panel-border text-text-muted">
                <th scope="col" className="w-8 px-2 py-2">
                  <span className="sr-only">Selection</span>
                </th>
                {tableColumns.map((col) => (
                  <th key={col.id} className="px-2 py-2 font-semibold text-text-strong">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablePreviewRows.map((row) => (
                <tr key={row.id} className="border-b border-panel-border last:border-b-0">
                  <td className="px-2 py-2" />
                  {tableColumns.map((col) => {
                    const cellValue = row.cells[col.id] ?? "";
                    if (col.cellKind === "recordLink" && row.recordLink) {
                      return (
                        <td key={col.id} className="px-2 py-2">
                          <Link
                            href={row.recordLink.href}
                            variant="body"
                            className="text-primary hover:underline font-normal"
                          >
                            {cellValue}
                          </Link>
                        </td>
                      );
                    }
                    if (col.cellKind === "emailLink" && row.emailLink) {
                      return (
                        <td key={col.id} className="px-2 py-2">
                          <Link
                            href={row.emailLink.href}
                            variant="body"
                            laterModule="M10"
                            className="text-primary hover:underline font-normal"
                          >
                            {cellValue}
                          </Link>
                        </td>
                      );
                    }
                    if (col.cellKind === "phoneAction" && row.phoneAction) {
                      return (
                        <td key={col.id} className="px-2 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span>{cellValue}</span>
                            <Button
                              variant="icon"
                              size="compact"
                              aria-label="Call"
                              laterModule={row.phoneAction.moduleKey ?? "M5"}
                              className="size-6 text-text-muted"
                            >
                              <Icons.phone aria-hidden className="size-3.5" />
                            </Button>
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={col.id} className="px-2 py-2 text-text">
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : loadingText ? (
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          {loadingText}
        </div>
      ) : activityColumns && activityColumns.length > 0 ? (
        <div className="flex divide-x divide-panel-border overflow-x-auto py-2">
          {activityColumns.map((col) => {
            const ColumnIcon = col.icon;
            return (
              <div key={col.id} className="flex-1 min-w-[220px] px-4 py-2">
                <div className="flex items-center gap-2 mb-3">
                  {ColumnIcon && (
                    <ColumnIcon aria-hidden className="size-3.5 text-text-muted shrink-0" />
                  )}
                  <span className="text-md font-semibold text-text-strong">{col.title}</span>
                  <span className="inline-flex items-center justify-center min-w-5 h-4 px-1 rounded-full bg-surface-active text-2xs font-semibold text-text-muted">
                    {col.count}
                  </span>
                </div>
                <div data-part="empty" className="py-4 text-center text-md text-text-empty">
                  {col.emptyText}
                </div>
              </div>
            );
          })}
        </div>
      ) : subtabs && subtabs.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-4 border-b border-panel-border pt-2">
            <div role="tablist" className="flex gap-4">
              {subtabs.map((tab) => {
                const tabLater = resolveLaterModule(moduleKey);
                const isSelected = activeSubtab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => !tabLater && setActiveSubtab(tab.id)}
                    {...(tabLater ? laterModuleProps(tabLater) : {})}
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
              <div className="pb-2 shrink-0">{renderControl(subtabRowEndControl)}</div>
            ) : null}
          </div>
          <div data-part="empty" className="py-8 text-center text-md text-text-empty">
            {emptyStateText}
          </div>
        </div>
      ) : socialLinks && socialLinks.length > 0 ? (
        <div className="flex divide-x divide-panel-border py-4">
          <div className="flex flex-col gap-2.5 pr-8 min-w-[200px]">
            {socialLinks.map((link) => (
              <Link
                key={link.id}
                href={`#${link.id}`}
                variant="body"
                laterModule={resolveLaterModule(link.moduleKey)}
                className="text-primary hover:underline font-normal text-md"
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
              laterModule={resolveLaterModule(bodyAction.moduleKey)}
              onPress={bodyAction.onAction}
            >
              {bodyAction.label}
            </Button>
          )}
        </div>
      ) : showEmptyTable && tableColumns && tableColumns.length > 0 ? (
        <div className="overflow-x-auto py-2">
          <table className="w-full text-left text-md">
            <thead>
              <tr className="border-b border-panel-border text-text-muted">
                <th scope="col" className="w-8 px-2 py-2">
                  <span className="sr-only">Selection</span>
                </th>
                {tableColumns.map((col) => (
                  <th key={col.id} className="px-2 py-2 font-semibold text-text-strong">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
          <div data-part="empty" className="py-8 text-center text-md text-text-empty">
            {emptyStateText}
          </div>
        </div>
      ) : (
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          {emptyStateText}
        </div>
      )}
    </section>
  );
}
