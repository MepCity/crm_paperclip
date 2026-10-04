"use client";

import type { ReactNode } from "react";
import {
  Disclosure as AriaDisclosure,
  type DisclosureProps as AriaDisclosureProps,
  Button,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { Icons } from "./icon";

export interface DisclosureProps extends Omit<AriaDisclosureProps, "children"> {
  label: string;
  children: ReactNode;
}

/** A compact heading that retains its full accessible name when visually clipped. */
export function Disclosure({ label, children, ...props }: DisclosureProps) {
  return (
    <AriaDisclosure {...props} className="min-w-0">
      {({ isExpanded }) => (
        <>
          <Heading level={3}>
            <Button
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
            </Button>
          </Heading>
          <DisclosurePanel>{children}</DisclosurePanel>
        </>
      )}
    </AriaDisclosure>
  );
}
