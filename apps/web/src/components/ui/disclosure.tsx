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
              className="flex w-full min-w-0 items-center gap-1 rounded-sm py-2 text-left text-sm font-semibold text-text outline-none data-focus-visible:ring-2 data-focus-visible:ring-focus-ring"
            >
              <span className="min-w-0 flex-1 truncate" title={label}>
                {label}
              </span>
              {isExpanded ? (
                <Icons.filterChevronDown aria-hidden className="h-3 w-3 shrink-0" />
              ) : (
                <Icons.filterChevronRight aria-hidden className="h-3 w-3 shrink-0" />
              )}
            </Button>
          </Heading>
          <DisclosurePanel>{children}</DisclosurePanel>
        </>
      )}
    </AriaDisclosure>
  );
}
