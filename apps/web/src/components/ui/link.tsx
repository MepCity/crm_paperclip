"use client";

import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
  composeRenderProps,
} from "react-aria-components";
import { buttonSizes, buttonStyles } from "./button";

export interface LinkProps extends Omit<AriaLinkProps, "render"> {
  href: string;
  variant?: "text" | keyof typeof buttonStyles;
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
    variant === "text"
      ? "text-primary rounded-sm data-hovered:underline"
      : `inline-flex items-center justify-center font-medium rounded-md ${buttonStyles[variant]} ${buttonSizes[size]}`;

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
