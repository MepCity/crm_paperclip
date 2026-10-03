"use client";

import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { ReactNode } from "react";

export interface LinkProps extends NextLinkProps {
  className?: string;
  variant?: "text" | "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children?: ReactNode;
}

export function Link({
  variant = "text",
  size = "md",
  className = "",
  children,
  ...props
}: LinkProps) {
  if (variant === "text") {
    const classes =
      "text-primary outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed ";
    return (
      <NextLink className={classes + className} {...props}>
        {children}
      </NextLink>
    );
  }

  let classes =
    "inline-flex items-center justify-center font-medium rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ";

  // Size
  if (size === "sm") classes += "text-sm px-3 py-1.5 ";
  else classes += "text-base px-4 py-2 ";

  // Variants
  if (variant === "primary") {
    classes += "bg-primary text-primary-text hover:bg-primary-hover active:bg-primary-pressed ";
  } else if (variant === "secondary") {
    classes +=
      "bg-surface text-text border border-border shadow-sm hover:bg-surface-hover active:bg-surface-pressed ";
  } else if (variant === "ghost") {
    classes += "bg-transparent text-text hover:bg-surface-hover active:bg-surface-pressed ";
  } else if (variant === "danger") {
    classes += "bg-danger text-danger-text hover:bg-danger-hover active:bg-danger-pressed ";
  }

  return (
    <NextLink className={classes + className} {...props}>
      {children}
    </NextLink>
  );
}
