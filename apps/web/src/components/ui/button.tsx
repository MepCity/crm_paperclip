"use client";

import type { Ref } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  composeRenderProps,
} from "react-aria-components";
import { Spinner } from "./spinner";

export const buttonStyles = {
  rail: "rounded-md bg-transparent text-rail-text font-semibold data-hovered:bg-rail-surface-raised data-pressed:bg-rail-item-active",
  icon: "rounded-md bg-transparent text-text-muted data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  railIcon:
    "rounded-md bg-transparent text-rail-text data-hovered:bg-rail-surface-raised data-pressed:bg-rail-item-active",
  avatar: "rounded-full bg-avatar text-text font-semibold data-hovered:bg-surface-hover",
  primary:
    "font-medium rounded-md bg-primary text-primary-text data-hovered:bg-primary-hover data-pressed:bg-primary-pressed",
  secondary:
    "font-medium rounded-md bg-surface text-text border border-border shadow-sm data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  ghost:
    "font-medium rounded-md bg-transparent text-text data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  danger:
    "font-medium rounded-md bg-danger text-danger-text data-hovered:bg-danger-hover data-pressed:bg-danger-pressed",
};

export const buttonSizes = {
  compact: "p-0 text-md",
  selector: "p-0 text-base",
  avatar: "p-0 text-xs",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
};

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
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
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
