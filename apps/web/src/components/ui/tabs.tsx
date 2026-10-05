"use client";

import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  composeRenderProps,
  type TabListProps,
  type TabPanelProps,
  type TabProps,
  type TabsProps,
} from "react-aria-components";

const tabListClass = "flex border-b border-border";

const tabClass =
  "px-4 py-2 text-sm font-semibold text-text-muted outline-none border-b-2 border-border " +
  "data-hovered:text-text data-selected:border-primary data-selected:text-primary " +
  "data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-disabled:opacity-50";

const tabPanelClass = "pt-4 text-text outline-none";

export function Tabs({ className, ...props }: TabsProps) {
  return (
    <AriaTabs
      {...props}
      orientation="horizontal"
      className={composeRenderProps(className, (extra) => `flex flex-col ${extra ?? ""}`)}
    />
  );
}

export function TabList<T extends object>({ className, ...props }: TabListProps<T>) {
  return (
    <AriaTabList
      {...props}
      className={composeRenderProps(className, (extra) => `${tabListClass} ${extra ?? ""}`)}
    />
  );
}

export function Tab({ className, ...props }: TabProps) {
  return (
    <AriaTab
      {...props}
      className={composeRenderProps(className, (extra) => `${tabClass} ${extra ?? ""}`)}
    />
  );
}

export function TabPanel({ className, ...props }: TabPanelProps) {
  return (
    <AriaTabPanel
      {...props}
      className={composeRenderProps(className, (extra) => `${tabPanelClass} ${extra ?? ""}`)}
    />
  );
}
