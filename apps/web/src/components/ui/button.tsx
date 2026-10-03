"use client";

import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { Spinner } from "./spinner";

export interface ButtonProps extends AriaButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  isPending,
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
      isPending={isPending}
      className={({ isFocusVisible, isHovered, isPressed, isDisabled }) => {
        let classes =
          "inline-flex items-center justify-center font-medium rounded-md outline-none transition-colors ";

        // Size
        if (size === "sm") classes += "text-sm px-3 py-1.5 ";
        else classes += "text-base px-4 py-2 ";

        // Variants
        if (variant === "primary") {
          classes += "bg-primary text-primary-text ";
          if (isHovered && !isDisabled) classes += "bg-primary-hover ";
          if (isPressed && !isDisabled) classes += "bg-primary-pressed ";
        } else if (variant === "secondary") {
          classes += "bg-surface text-text border border-border shadow-sm ";
          if (isHovered && !isDisabled) classes += "bg-surface-hover ";
          if (isPressed && !isDisabled) classes += "bg-surface-pressed ";
        } else if (variant === "ghost") {
          classes += "bg-transparent text-text ";
          if (isHovered && !isDisabled) classes += "bg-surface-hover ";
          if (isPressed && !isDisabled) classes += "bg-surface-pressed ";
        } else if (variant === "danger") {
          classes += "bg-danger text-danger-text ";
          if (isHovered && !isDisabled) classes += "bg-danger-hover ";
          if (isPressed && !isDisabled) classes += "bg-danger-pressed ";
        }

        // States
        if (isFocusVisible) classes += "ring-2 ring-focus-ring ring-offset-2 ";
        if (isDisabled || isPending) classes += "opacity-50 cursor-not-allowed ";

        return classes.trim();
      }}
    >
      {(renderProps) => (
        <>
          {renderProps.isPending && <Spinner className="w-4 h-4 mr-2" />}
          {typeof children === "function" ? children(renderProps) : children}
        </>
      )}
    </AriaButton>
  );
}
