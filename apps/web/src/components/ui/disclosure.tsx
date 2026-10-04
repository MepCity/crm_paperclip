"use client";

import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  type DisclosureProps as AriaDisclosureProps,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { Button } from "./button";
import { type Icon, Icons } from "./icon";

export interface DisclosureProps extends Omit<AriaDisclosureProps, "children"> {
  label: string;
  icon?: Icon;
  children: ReactNode;
  variant?: "default" | "rail" | "filter";
}

export function Disclosure({
  label,
  icon: IconComponent,
  children,
  defaultExpanded = false,
  variant = "default",
  ...props
}: DisclosureProps) {
  return (
    <AriaDisclosure
      {...props}
      defaultExpanded={defaultExpanded}
      className={variant === "filter" ? "min-w-0" : undefined}
    >
      {({ isExpanded }) => (
        <>
          {variant === "filter" ? (
            <Heading level={3}>
              <AriaButton
                slot="trigger"
                className="relative flex w-full min-w-0 items-center rounded-sm py-2 text-left text-sm font-semibold text-text-strong outline-none data-focus-visible:ring-2 data-focus-visible:ring-focus-ring"
              >
                {isExpanded ? (
                  <Icons.filterChevronDown
                    aria-hidden
                    className="absolute top-1/2 left-0 h-(--size-list-filter-chevron-height) w-(--size-list-filter-chevron-width) -translate-y-1/2"
                  />
                ) : (
                  <Icons.filterChevronRight
                    aria-hidden
                    className="absolute top-1/2 left-0 h-(--size-list-filter-chevron-width) w-(--size-list-filter-chevron-height) -translate-y-1/2"
                  />
                )}
                <span
                  className="min-w-0 flex-1 truncate pl-(--size-list-filter-heading-inset)"
                  title={label}
                >
                  {label}
                </span>
              </AriaButton>
            </Heading>
          ) : (
            <Button
              slot="trigger"
              variant={variant === "rail" ? "rail" : "ghost"}
              size="compact"
              className={`w-full justify-start gap-(--size-rail-label-gap) h-(--size-rail-row-height) px-(--size-rail-inset) text-md font-semibold`}
            >
              {IconComponent && (
                <span className="inline-flex w-(--size-rail-icon) justify-center">
                  <IconComponent
                    className="size-(--size-rail-group-icon) text-primary"
                    aria-hidden
                  />
                </span>
              )}
              <span className="flex-1 text-left">{label}</span>
              {isExpanded ? (
                <Icons.chevronUp className="size-(--size-rail-group-icon)" aria-hidden />
              ) : (
                <Icons.chevronDown className="size-(--size-rail-group-icon)" aria-hidden />
              )}
            </Button>
          )}
          <DisclosurePanel>{children}</DisclosurePanel>
        </>
      )}
    </AriaDisclosure>
  );
}
