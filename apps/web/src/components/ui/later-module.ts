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

export interface UseLaterModuleOptions {
  /**
   * Whether to block ArrowDown / ArrowUp shortcuts used by menu and popover triggers.
   * Buttons with laterModule block them so menus do not open. MenuItems allow them so
   * arrow keys can navigate between rows.
   */
  blockMenuArrows?: boolean;
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

function blockLaterModuleEvent(e: Event, blockMenuArrows = false) {
  if (e instanceof KeyboardEvent) {
    const isArrow = e.key === "ArrowDown" || e.key === "ArrowUp";
    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "Spacebar" ||
      (blockMenuArrows && isArrow)
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

        const shouldBlockArrows = Boolean(options?.blockMenuArrows) || node.tagName === "BUTTON";

        const listener = (e: Event) => blockLaterModuleEvent(e, shouldBlockArrows);

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
    [laterModule, forwardedRef, options?.blockMenuArrows],
  );
}
