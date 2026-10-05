"use client";

import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
  composeRenderProps,
} from "react-aria-components";
import { buttonSizes, buttonStyles } from "./button";

export type LinkVariant =
  | "text"
  | "body"
  | "rail"
  | "railNested"
  | "icon"
  | keyof typeof buttonStyles;

export interface LinkProps extends Omit<AriaLinkProps, "render"> {
  "aria-current"?: "page";
  href: string;
  variant?: LinkVariant;
  size?: keyof typeof buttonSizes;
  prefetch?: NextLinkProps["prefetch"];
  replace?: boolean;
  scroll?: boolean;
}

const linkBase =
  "outline-none transition-colors data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
  "data-focus-visible:ring-offset-2 data-disabled:opacity-50 data-disabled:cursor-not-allowed";

export function Link({
  variant = "text",
  size = "md",
  className,
  prefetch,
  replace,
  scroll,
  ...props
}: LinkProps) {
  const variantClasses =
    variant === "rail" || variant === "railNested"
      ? `flex items-center ${variant === "railNested" ? "gap-(--size-rail-nested-label-gap)" : "gap-(--size-rail-label-gap)"} h-(--size-rail-row-height) rounded-md px-(--size-rail-inset) text-md ${props["aria-current"] === "page" ? "bg-rail-item-active text-rail-item-active-text font-semibold" : "text-rail-text font-normal data-hovered:bg-rail-surface-raised"}`
      : variant === "icon"
        ? "inline-flex items-center justify-center rounded-md text-text-muted data-hovered:bg-surface-hover"
        : variant === "text"
          ? "text-primary rounded-sm data-hovered:underline"
          : variant === "body"
            ? "rounded-sm text-text"
            : `inline-flex items-center justify-center font-semibold rounded-md ${buttonStyles[variant]} ${buttonSizes[size]}`;

  return (
    <AriaLink
      {...props}
      className={composeRenderProps(
        className,
        (extra) => `${linkBase} ${variantClasses} ${extra ?? ""}`,
      )}
      render={(domProps, renderProps) =>
        "href" in domProps && !renderProps.isDisabled ? (
          <NextLink {...domProps} prefetch={prefetch} replace={replace} scroll={scroll} />
        ) : (
          <span {...domProps} />
        )
      }
    />
  );
}
