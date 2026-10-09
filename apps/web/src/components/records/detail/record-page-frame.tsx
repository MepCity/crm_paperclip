"use client";

import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";

export interface RelatedListEntry {
  id: string;
  label: string;
  targetId: string;
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
  scrollTopLabel: string;
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
  scrollTopLabel,
}: RecordPageFrameProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  function selectRelated(entry: RelatedListEntry) {
    const scroller = scrollRef.current;
    // Find only within this frame; data targets never become a CSS selector.
    const target = Array.from(scroller?.querySelectorAll<HTMLElement>("[id]") ?? []).find(
      (node) => node.id === entry.targetId,
    );
    if (scroller && target)
      scroller.scrollTop +=
        target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
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
            <h2 className="flex items-center h-(--size-record-rail-heading-height) pl-(--size-record-rail-text-inset) text-lg font-bold text-text-strong">
              {relatedListLabel}
            </h2>
            <div className="flex flex-col gap-(--size-rail-nested-row-gap)">
              {relatedEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`#${entry.targetId}`}
                  variant="body"
                  aria-current={selectedRelatedId === entry.id ? "page" : undefined}
                  onPress={() => selectRelated(entry)}
                  onClick={(event) => event.preventDefault()}
                  className={`flex items-center h-(--size-menu-item-height) px-(--size-record-rail-text-inset) text-md font-normal ${selectedRelatedId === entry.id ? "bg-(--color-surface-active)" : ""}`}
                >
                  <span className="truncate" title={entry.label}>
                    {entry.label}
                  </span>
                </Link>
              ))}
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
          </div>
          <div
            ref={scrollRef}
            data-record-scroller
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
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
            scrollRef.current?.scrollTo({ top: 0 });
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
