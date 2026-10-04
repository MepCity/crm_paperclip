"use client";

import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
  composeRenderProps,
  DialogTrigger,
  Heading,
} from "react-aria-components";

export { DialogTrigger as PopoverTrigger };

const popoverClass = "rounded-md border border-border bg-surface shadow-lg outline-none";

export function Popover({
  title,
  children,
  hideTitle = false,
  contentClassName,
  className,
  ...props
}: Omit<AriaPopoverProps, "children"> & {
  title: string;
  children: ReactNode;
  hideTitle?: boolean;
  contentClassName?: string;
}) {
  return (
    <AriaPopover
      {...props}
      className={composeRenderProps(className, (extra) => `${popoverClass} ${extra ?? ""}`)}
    >
      <AriaDialog className={`p-4 outline-none ${contentClassName ?? ""}`}>
        <Heading
          slot="title"
          className={hideTitle ? "sr-only" : "mb-2 text-base font-medium text-text"}
        >
          {title}
        </Heading>
        {children}
      </AriaDialog>
    </AriaPopover>
  );
}
