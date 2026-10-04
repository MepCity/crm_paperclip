"use client";

import type { ReactNode } from "react";
import { Disclosure as AriaDisclosure, DisclosurePanel } from "react-aria-components";
import { Button } from "./button";
import { type Icon, Icons } from "./icon";

export function Disclosure({
  label,
  icon: IconComponent,
  children,
  defaultExpanded = false,
  variant = "default",
}: {
  label: string;
  icon?: Icon;
  children: ReactNode;
  defaultExpanded?: boolean;
  variant?: "default" | "rail";
}) {
  return (
    <AriaDisclosure defaultExpanded={defaultExpanded}>
      {({ isExpanded }) => (
        <>
          <Button
            slot="trigger"
            variant={variant === "rail" ? "rail" : "ghost"}
            size="compact"
            className={`w-full justify-start gap-(--size-rail-label-gap) h-(--size-rail-row-height) px-(--size-rail-inset) text-md font-semibold`}
          >
            {IconComponent && (
              <span className="inline-flex w-(--size-rail-icon) justify-center">
                <IconComponent className="size-(--size-rail-group-icon) text-primary" aria-hidden />
              </span>
            )}
            <span className="flex-1 text-left">{label}</span>
            {isExpanded ? (
              <Icons.chevronUp className="size-(--size-rail-group-icon)" aria-hidden />
            ) : (
              <Icons.chevronDown className="size-(--size-rail-group-icon)" aria-hidden />
            )}
          </Button>
          <DisclosurePanel>{children}</DisclosurePanel>
        </>
      )}
    </AriaDisclosure>
  );
}
