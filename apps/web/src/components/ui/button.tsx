"use client";

import type { Ref } from "react";
import { useEffect, useRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  composeRenderProps,
} from "react-aria-components";
import { buttonSizes, buttonStyles } from "./button-styles";
import { Spinner } from "./spinner";

export { buttonSizes, buttonStyles };

/** Drops live-region nodes left by react-aria pending announcements whose target unmounted. */
function clearStalePendingAnnouncements(): void {
  const root = document.querySelector('[data-live-announcer="true"]');
  if (!root) return;
  for (const node of root.querySelectorAll('[role="img"][aria-labelledby]')) {
    const ids = node.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
    for (const id of ids) {
      if (id && !document.getElementById(id)) {
        node.remove();
        break;
      }
    }
  }
}

/** Observes and cleans live region announcements after RAC's delayed pending announce. */
function scheduleClearPendingAnnouncements(): void {
  clearStalePendingAnnouncements();
  if (typeof document === "undefined" || !document.body) return;
  const observer = new MutationObserver(() => {
    clearStalePendingAnnouncements();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(() => {
    clearStalePendingAnnouncements();
    observer.disconnect();
  }, 1000);
}

const buttonBase =
  "inline-flex items-center justify-center outline-none transition-colors " +
  "data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-focus-visible:ring-offset-2 " +
  "data-disabled:opacity-50 data-disabled:cursor-not-allowed " +
  "data-pending:opacity-50 data-pending:cursor-wait";

export interface ButtonProps extends AriaButtonProps {
  ref?: Ref<HTMLButtonElement>;
  variant?: keyof typeof buttonStyles;
  size?: keyof typeof buttonSizes;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  isPending,
  ...props
}: ButtonProps) {
  const wasPendingRef = useRef(isPending ?? false);
  if (isPending) wasPendingRef.current = true;

  useEffect(() => {
    if (!isPending && wasPendingRef.current) {
      scheduleClearPendingAnnouncements();
    }
  }, [isPending]);

  useEffect(() => {
    return () => {
      if (wasPendingRef.current) scheduleClearPendingAnnouncements();
    };
  }, []);

  return (
    <AriaButton
      {...props}
      isPending={isPending}
      className={composeRenderProps(
        className,
        (extra) => `${buttonBase} ${buttonStyles[variant]} ${buttonSizes[size]} ${extra ?? ""}`,
      )}
    >
      {(renderProps) => (
        <>
          {renderProps.isPending && <Spinner className="mr-2 h-4 w-4" aria-hidden />}
          {typeof children === "function" ? children(renderProps) : children}
        </>
      )}
    </AriaButton>
  );
}
