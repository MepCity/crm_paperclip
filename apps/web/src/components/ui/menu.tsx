"use client";

import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuProps as AriaMenuProps,
  composeRenderProps,
  type MenuItemProps,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { Button, type ButtonProps } from "./button";

export { MenuTrigger };

export function MenuButton(props: ButtonProps) {
  return <Button variant="secondary" {...props} />;
}

export function MenuItem<T extends object>({
  variant = "default",
  className,
  ...props
}: MenuItemProps<T> & { variant?: "default" | "danger" }) {
  return (
    <AriaMenuItem
      {...props}
      className={composeRenderProps(
        className,
        (extra) =>
          `cursor-default rounded-sm px-3 py-2 outline-none data-disabled:opacity-50 ` +
          `data-focused:bg-surface-hover data-hovered:bg-surface-hover ` +
          `data-focus-visible:ring-2 data-focus-visible:ring-inset data-focus-visible:ring-focus-ring ` +
          `${variant === "danger" ? "text-danger" : "text-text"} ${extra ?? ""}`,
      )}
    />
  );
}

export function Menu<T extends object>(props: AriaMenuProps<T>) {
  return (
    <Popover className="w-48 rounded-md border border-border bg-surface shadow-lg outline-none">
      <AriaMenu {...props} className="p-1 outline-none" />
    </Popover>
  );
}
