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

export function TabList<T extends object>({
  className,
  appearance = "default",
  ...props
}: TabListProps<T> & { appearance?: "default" | "record" }) {
  return (
    <AriaTabList
      {...props}
      className={composeRenderProps(
        className,
        (extra) =>
          `${appearance === "record" ? "flex shrink-0 items-center w-(--size-record-tab-width) h-(--size-record-tab-height) p-(--size-record-tab-inset) rounded-full border border-panel-border bg-surface" : tabListClass} ${extra ?? ""}`,
      )}
    />
  );
}

export function Tab({
  className,
  appearance = "default",
  ...props
}: TabProps & { appearance?: "default" | "record" }) {
  return (
    <AriaTab
      {...props}
      className={composeRenderProps(
        className,
        (extra) =>
          `${appearance === "record" ? "flex flex-1 items-center justify-center h-(--size-record-tab-slice-height) text-lg font-normal text-text rounded-full border border-transparent outline-none data-selected:flex-none data-selected:w-(--size-record-tab-slice-width) data-selected:bg-(--color-record-tab-selected) data-selected:border-(--color-record-tab-border) data-selected:text-text-strong data-selected:font-semibold data-focus-visible:ring-2 data-focus-visible:ring-focus-ring" : tabClass} ${extra ?? ""}`,
      )}
    />
  );
}

export function TabPanel({
  className,
  appearance = "default",
  ...props
}: TabPanelProps & { appearance?: "default" | "record" }) {
  return (
    <AriaTabPanel
      {...props}
      className={composeRenderProps(
        className,
        (extra) =>
          `${appearance === "record" ? "text-text outline-none" : tabPanelClass} ${extra ?? ""}`,
      )}
    />
  );
}
