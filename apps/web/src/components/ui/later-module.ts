"use client";

import type { Ref } from "react";
import { useCallback, useRef } from "react";

export type ModuleKey =
  | "M3"
  | "M4"
  | "M5"
  | "M6"
  | "M7"
  | "M8"
  | "M9"
  | "M10"
  | "M11"
  | "M12"
  | "M13"
  | "M14"
  | "M15"
  | "P2"
  | "P3";

export interface LaterModuleProp {
  laterModule?: ModuleKey;
}

export const LIVE_MODULE_KEYS = ["M2", "M3", "M4"] as const;
export type LiveModuleKey = (typeof LIVE_MODULE_KEYS)[number];

const LIVE_MODULE_SET: ReadonlySet<string> = new Set(LIVE_MODULE_KEYS);

/**
 * Resolves a module key against live modules.
 * Returns undefined if key is undefined, empty, or currently live (e.g. M2, M3, M4).
 * Otherwise returns the key itself so later-module controls remain locked/inert.
 */
export function resolveLaterModule<T extends string = ModuleKey>(
  key?: T | "M2" | null,
): ModuleKey | undefined {
  if (!key) return undefined;
  if (LIVE_MODULE_SET.has(key)) return undefined;
  return key as ModuleKey;
}

export interface UseLaterModuleOptions {
  /**
   * Whether to block ArrowDown / ArrowUp shortcuts used by menu and popover triggers.
   * Buttons with laterModule block them so menus do not open. MenuItems allow them so
   * arrow keys can navigate between rows.
   */
  blockMenuArrows?: boolean;
  /**
   * Whether to block ArrowRight / ArrowLeft shortcuts used by submenu triggers.
   * MenuItems with laterModule block them so submenus do not open, while vertical
   * arrows can still navigate between menu rows.
   */
  blockSubmenuArrows?: boolean;
}

const BLOCKED_EVENT_TYPES = [
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
  "keydown",
  "keyup",
] as const;

function isRtlDirection(el: Element): boolean {
  const dirAttr = el.closest("[dir]")?.getAttribute("dir");
  if (dirAttr) {
    return dirAttr.toLowerCase() === "rtl";
  }
  if (typeof document !== "undefined") {
    if (document.dir?.toLowerCase() === "rtl") return true;
    if (document.documentElement.getAttribute("dir")?.toLowerCase() === "rtl") return true;
    if (document.body?.getAttribute("dir")?.toLowerCase() === "rtl") return true;
  }
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    try {
      if (window.getComputedStyle(el).direction === "rtl") return true;
    } catch {}
  }
  return false;
}

function isSubmenuTriggerElement(element: Element | null): boolean {
  if (!element) return false;
  return (
    element.hasAttribute("data-has-submenu") ||
    element.getAttribute("aria-haspopup") === "menu" ||
    element.getAttribute("aria-haspopup") === "true" ||
    element.hasAttribute("aria-expanded")
  );
}

function blockLaterModuleEvent(e: Event, blockMenuArrows = false, blockSubmenuArrows = false) {
  if (e instanceof KeyboardEvent) {
    const isVerticalArrow = e.key === "ArrowDown" || e.key === "ArrowUp";
    let isOpeningSubmenuArrow = false;

    if (blockSubmenuArrows && e.currentTarget instanceof HTMLElement) {
      if (isSubmenuTriggerElement(e.currentTarget)) {
        const isRtl = isRtlDirection(e.currentTarget);
        const openKey = isRtl ? "ArrowLeft" : "ArrowRight";
        isOpeningSubmenuArrow = e.key === openKey;
      }
    }

    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "Spacebar" ||
      (blockMenuArrows && isVerticalArrow) ||
      isOpeningSubmenuArrow
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  } else if (e.type === "pointerdown" || e.type === "mousedown") {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.focus();
    }
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  } else {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}

/**
 * Returns DOM attributes for a later-module control:
 * - `aria-disabled="true"`
 * - `data-later-module="<key>"`
 * - `title={undefined}` (no description or tooltip)
 */
export function laterModuleProps(laterModule?: ModuleKey) {
  if (!laterModule) return {};
  return {
    "aria-disabled": "true" as const,
    "data-later-module": laterModule,
    title: undefined,
  };
}

/**
 * Shared hook for later-module controls.
 * Attaches capture-phase event blockers so click, Enter, and Space do nothing,
 * while maintaining keyboard focusability, focus ring, and active styling.
 */
export function useLaterModule<E extends HTMLElement = HTMLElement>(
  laterModule?: ModuleKey,
  forwardedRef?: Ref<E>,
  options?: UseLaterModuleOptions,
) {
  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback(
    (node: E | null) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      if (node && laterModule) {
        node.setAttribute("aria-disabled", "true");
        node.setAttribute("data-later-module", laterModule);

        const shouldBlockMenuArrows =
          Boolean(options?.blockMenuArrows) || node.tagName === "BUTTON";
        const shouldBlockSubmenuArrows =
          Boolean(options?.blockSubmenuArrows) || node.getAttribute("role") === "menuitem";

        const listener = (e: Event) =>
          blockLaterModuleEvent(e, shouldBlockMenuArrows, shouldBlockSubmenuArrows);

        for (const eventType of BLOCKED_EVENT_TYPES) {
          node.addEventListener(eventType, listener, { capture: true });
        }

        cleanupRef.current = () => {
          for (const eventType of BLOCKED_EVENT_TYPES) {
            node.removeEventListener(eventType, listener, { capture: true });
          }
        };
      }

      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (typeof forwardedRef === "object" && "current" in forwardedRef) {
          (forwardedRef as { current: E | null }).current = node;
        }
      }
    },
    [laterModule, forwardedRef, options?.blockMenuArrows, options?.blockSubmenuArrows],
  );
}
