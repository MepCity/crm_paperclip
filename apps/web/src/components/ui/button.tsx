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

/** Drops assertive live-region nodes left by react-aria pending announcements. */
function clearAssertiveLiveAnnouncer(): void {
  const root = document.querySelector('[data-live-announcer="true"]');
  const assertive = root?.querySelector('[aria-live="assertive"]');
  if (assertive) assertive.innerHTML = "";
}

/** Clears now and again after RAC's delayed pending announce (~100ms). */
function scheduleClearAssertiveLiveAnnouncer(): void {
  clearAssertiveLiveAnnouncer();
  window.setTimeout(clearAssertiveLiveAnnouncer, 150);
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
  const isPendingRef = useRef(isPending ?? false);
  isPendingRef.current = isPending ?? false;
  useEffect(() => {
    return () => {
      if (isPendingRef.current) scheduleClearAssertiveLiveAnnouncer();
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
