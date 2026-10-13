"use client";

import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
import { Link } from "@/components/ui/link";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";

export interface RelatedListEntry {
  id: string;
  label: string;
  targetId: string;
  countBadge?: number | string;
  moduleKey?: ModuleKey | "M2";
  laterModule?: ModuleKey;
  railAction?: {
    id: string;
    label: string;
    moduleKey?: ModuleKey | "M2";
    laterModule?: ModuleKey;
    onAction?: () => void;
  };
}
export interface RecordPageTab {
  id: string;
  label: string;
  content: ReactNode;
}
export interface RecordPageFrameProps {
  header: ReactNode;
  relatedListLabel: string;
  relatedEntries?: readonly RelatedListEntry[];
  selectedRelatedId?: string;
  onRelatedSelectionChange?: (id: string) => void;
  tabsLabel: string;
  tabs: readonly RecordPageTab[];
  selectedTabId: string;
  onTabChange: (id: string) => void;
  relatedRailVisible?: boolean;
  railControl?: ReactNode;
  /** AD-35 / D-35: right end of the tab row, on the same line as the tabs. */
  tabRowEnd?: ReactNode;
  scrollTopLabel: string;
  relatedRailHeaderAction?: ReactNode;
  relatedRailFooter?: ReactNode;
}

export function getActiveRelatedEntryId(
  scroller: HTMLElement,
  entries: readonly RelatedListEntry[],
  currentSelectedId?: string,
): string | undefined {
  if (entries.length === 0) return undefined;

  const scrollerRect = scroller.getBoundingClientRect();
  const hasRealGeometry = scrollerRect.height > 0;
  const OFFSET = 36;

  const idMap = new Map<string, HTMLElement>();
  for (const node of scroller.querySelectorAll<HTMLElement>("[id]")) {
    if (node.id) idMap.set(node.id, node);
  }

  const items: Array<{ id: string; top: number; bottom: number }> = [];

  for (const entry of entries) {
    const target = idMap.get(entry.targetId);
    if (!target) continue;

    if (hasRealGeometry) {
      const rect = target.getBoundingClientRect();
      items.push({
        id: entry.id,
        top: rect.top - scrollerRect.top,
        bottom: rect.bottom - scrollerRect.top,
      });
    } else {
      const top = target.offsetTop - scroller.scrollTop;
      const height = target.offsetHeight || 100;
      items.push({
        id: entry.id,
        top,
        bottom: top + height,
      });
    }
  }

  const firstItem = items[0];
  if (!firstItem) return currentSelectedId ?? entries[0]?.id;

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item && item.top <= OFFSET && item.bottom > 0) {
      return item.id;
    }
  }

  if (firstItem.top > OFFSET) {
    return firstItem.id;
  }

  const lastItem = items[items.length - 1];
  if (
    lastItem &&
    scroller.scrollTop > 0 &&
    scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 2
  ) {
    return lastItem.id;
  }

  let closestId = firstItem.id;
  let minDiff = Infinity;
  for (const item of items) {
    const diff = Math.abs(item.top - OFFSET);
    if (diff < minDiff) {
      minDiff = diff;
      closestId = item.id;
    }
  }
  return closestId;
}

export function RecordPageFrame({
  header,
  relatedListLabel,
  relatedEntries = [],
  selectedRelatedId,
  onRelatedSelectionChange,
  tabsLabel,
  tabs,
  selectedTabId,
  onTabChange,
  relatedRailVisible = true,
  railControl,
  tabRowEnd,
  scrollTopLabel,
  relatedRailHeaderAction,
  relatedRailFooter,
}: RecordPageFrameProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState<string | undefined>(
    selectedRelatedId ?? relatedEntries[0]?.id,
  );
  const activeSelectedId =
    selectedRelatedId !== undefined ? selectedRelatedId : uncontrolledSelectedId;

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;
    setScrolled(scroller.scrollTop > 0);
    if (relatedEntries.length > 0) {
      const activeId = getActiveRelatedEntryId(scroller, relatedEntries, activeSelectedId);
      if (activeId && activeId !== activeSelectedId) {
        setUncontrolledSelectedId(activeId);
        onRelatedSelectionChange?.(activeId);
      }
    }
  }

  function selectRelated(entry: RelatedListEntry) {
    const scroller = scrollRef.current;
    // Find only within this frame; data targets never become a CSS selector.
    const target = Array.from(scroller?.querySelectorAll<HTMLElement>("[id]") ?? []).find(
      (node) => node.id === entry.targetId,
    );
    if (scroller && target) {
      const delta = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      if (delta !== 0) {
        scroller.scrollTop += delta;
      } else if (target.offsetTop !== undefined) {
        scroller.scrollTop = target.offsetTop;
      }
    }
    setUncontrolledSelectedId(entry.id);
    onRelatedSelectionChange?.(entry.id);
  }
  return (
    <section data-record-frame className="relative flex h-full min-h-0 flex-col overflow-hidden">
      {header}
      <div className="flex flex-1 min-h-0">
        {relatedRailVisible ? (
          <nav
            id="record-related-rail"
            aria-label={relatedListLabel}
            data-record-rail
            className="shrink-0 w-(--size-record-rail-width) overflow-y-auto bg-surface px-3"
          >
            <div className="flex items-center justify-between h-(--size-record-rail-heading-height) pl-(--size-record-rail-text-inset) pr-1">
              <h2 className="text-lg font-bold text-text-strong">{relatedListLabel}</h2>
              {relatedRailHeaderAction}
            </div>
            <div className="flex flex-col gap-(--size-rail-nested-row-gap)">
              {relatedEntries.map((entry) => {
                const isSelected = activeSelectedId === entry.id;
                const hasExtra = Boolean(entry.countBadge !== undefined || entry.railAction);
                if (!hasExtra) {
                  return (
                    <Link
                      key={entry.id}
                      href={`#${entry.targetId}`}
                      variant="body"
                      aria-current={isSelected ? "page" : undefined}
                      laterModule={entry.laterModule}
                      onPress={() => selectRelated(entry)}
                      onClick={(event) => event.preventDefault()}
                      className={`flex items-center h-(--size-menu-item-height) px-(--size-record-rail-text-inset) text-md font-normal rounded-(--radius-md) ${
                        isSelected ? "bg-(--color-surface-active)" : ""
                      }`}
                    >
                      <span className="truncate" title={entry.label}>
                        {entry.label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between h-(--size-menu-item-height) px-(--size-record-rail-text-inset) rounded-(--radius-md) ${
                      isSelected ? "bg-(--color-surface-active)" : ""
                    }`}
                  >
                    <Link
                      href={`#${entry.targetId}`}
                      variant="body"
                      aria-current={isSelected ? "page" : undefined}
                      laterModule={entry.laterModule}
                      onPress={() => selectRelated(entry)}
                      onClick={(event) => event.preventDefault()}
                      className="flex flex-1 min-w-0 items-center text-md font-normal text-text truncate"
                    >
                      <span className="truncate" title={entry.label}>
                        {entry.label}
                      </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1.5 ml-1">
                      {entry.countBadge !== undefined && (
                        <span className="inline-flex items-center justify-center min-w-5 h-4 px-1 rounded-full bg-surface-active text-2xs font-semibold text-text-muted">
                          {entry.countBadge}
                        </span>
                      )}
                      {entry.railAction && isSelected && (
                        <Button
                          variant="icon"
                          size="compact"
                          aria-label={entry.railAction.label}
                          laterModule={entry.railAction.laterModule}
                          onPress={entry.railAction.onAction}
                          className="shrink-0 size-5 text-text-muted hover:text-text"
                        >
                          <Icons.plus aria-hidden className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {relatedRailFooter}
            </div>
          </nav>
        ) : null}
        <Tabs
          selectedKey={selectedTabId}
          onSelectionChange={(id) => {
            onTabChange(String(id));
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            setScrolled(false);
          }}
          className="flex-1 min-w-0 min-h-0 bg-bg"
        >
          <div
            data-record-tab-row
            className="flex shrink-0 items-start gap-3 h-(--size-record-tab-row-height) px-3 pt-(--size-record-tab-top)"
          >
            <div data-record-rail-control className="shrink-0 size-(--size-record-toggle-slot)">
              {railControl}
            </div>
            <TabList aria-label={tabsLabel} appearance="record">
              {tabs.map((tab) => (
                <Tab key={tab.id} id={tab.id} appearance="record">
                  {tab.label}
                </Tab>
              ))}
            </TabList>
            {tabRowEnd ? (
              <div className="ml-auto flex h-(--size-record-tab-height) shrink-0 items-center">
                {tabRowEnd}
              </div>
            ) : null}
          </div>
          <div
            ref={scrollRef}
            data-record-scroller
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto px-3 pb-3"
          >
            {tabs.map((tab) => (
              <TabPanel
                key={tab.id}
                id={tab.id}
                appearance="record"
                className="flex flex-col gap-3"
              >
                {tab.content}
              </TabPanel>
            ))}
          </div>
        </Tabs>
      </div>
      {scrolled && (
        <Button
          variant="icon"
          size="compact"
          aria-label={scrollTopLabel}
          onPress={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: 0 });
              const first = relatedEntries[0];
              if (first) {
                setUncontrolledSelectedId(first.id);
                onRelatedSelectionChange?.(first.id);
              }
            }
            setScrolled(false);
          }}
          className="absolute right-(--size-record-scroll-offset) bottom-(--size-record-scroll-offset) size-(--size-record-scroll-top) rounded-full! border border-panel-border bg-surface! shadow-md"
        >
          <Icons.chevronUp aria-hidden className="h-4 w-4" />
        </Button>
      )}
    </section>
  );
}
