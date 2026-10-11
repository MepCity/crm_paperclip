"use client";

import type { Ref } from "react";
import { useCallback, useRef } from "react";
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
import { laterModuleProps, type ModuleKey, useLaterModule } from "./later-module";

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
  ref: forwardedRef,
  ...props
}: TabListProps<T> & {
  appearance?: "default" | "record";
  ref?: Ref<HTMLDivElement>;
}) {
  const cleanupRef = useRef<(() => void) | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      if (node) {
        const handleKeyDownCapture = (e: KeyboardEvent) => {
          if (
            e.key !== "ArrowRight" &&
            e.key !== "ArrowLeft" &&
            e.key !== "ArrowDown" &&
            e.key !== "ArrowUp" &&
            e.key !== "Home" &&
            e.key !== "End"
          ) {
            return;
          }

          const tabs = Array.from(node.querySelectorAll<HTMLElement>('[role="tab"]'));
          if (tabs.length === 0) return;

          const currentTab = tabs.find(
            (tab) => tab === document.activeElement || tab.contains(document.activeElement),
          );
          if (!currentTab) return;

          const currentIndex = tabs.indexOf(currentTab);
          let targetIndex = -1;

          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            targetIndex = (currentIndex + 1) % tabs.length;
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          } else if (e.key === "Home") {
            targetIndex = 0;
          } else if (e.key === "End") {
            targetIndex = tabs.length - 1;
          }

          if (targetIndex === -1 || targetIndex === currentIndex) return;

          const targetTab = tabs[targetIndex];
          if (targetTab?.hasAttribute("data-later-module")) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            targetTab.focus();
          }
        };

        node.addEventListener("keydown", handleKeyDownCapture, { capture: true });
        cleanupRef.current = () => {
          node.removeEventListener("keydown", handleKeyDownCapture, { capture: true });
        };
      }

      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (typeof forwardedRef === "object" && "current" in forwardedRef) {
          (forwardedRef as { current: HTMLDivElement | null }).current = node;
        }
      }
    },
    [forwardedRef],
  );

  return (
    <AriaTabList
      {...props}
      ref={setRef}
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
  laterModule,
  ref: forwardedRef,
  ...props
}: TabProps & {
  appearance?: "default" | "record";
  laterModule?: ModuleKey;
  ref?: Ref<HTMLElement>;
}) {
  const laterRef = useLaterModule(laterModule, forwardedRef);

  return (
    <AriaTab
      {...props}
      {...(laterModule ? laterModuleProps(laterModule) : {})}
      ref={laterRef}
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
