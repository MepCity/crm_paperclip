"use client";

import type { ReactNode } from "react";
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
  appearance = "default",
  className,
  ...props
}: MenuItemProps<T> & { variant?: "default" | "danger"; appearance?: "default" | "measured" }) {
  return (
    <AriaMenuItem
      {...props}
      className={composeRenderProps(
        className,
        (extra) =>
          `cursor-default outline-none data-disabled:opacity-50 ${appearance === "measured" ? "flex items-center gap-(--size-menu-label-gap) min-h-(--size-menu-item-height) rounded-md px-(--size-menu-inset) text-md font-normal" : "rounded-sm px-3 py-2"} ` +
          `data-focused:bg-surface-hover data-hovered:bg-surface-hover ` +
          `data-focus-visible:ring-2 data-focus-visible:ring-inset data-focus-visible:ring-focus-ring ` +
          `${variant === "danger" ? "text-danger" : "text-text"} ${extra ?? ""}`,
      )}
    />
  );
}

export interface MenuAction {
  id: string;
  label: string;
  onAction: () => void;
  isDisabled?: boolean;
}

export function Menu<T extends object>({
  width,
  appearance = "default",
  header,
  ...props
}: AriaMenuProps<T> & {
  width?: "create" | "actions";
  appearance?: "default" | "measured";
  header?: ReactNode;
}) {
  const widthClass =
    width === "create"
      ? "w-(--size-popover-import-width)"
      : width === "actions"
        ? "w-(--size-popover-actions-width)"
        : appearance === "measured"
          ? "w-(--size-menu-width)"
          : "w-48";
  return (
    <Popover
      placement="bottom end"
      className={`${widthClass} ${appearance === "measured" ? "bg-menu-surface" : "bg-surface"} max-w-full max-h-80 overflow-auto rounded-md border border-border shadow-lg outline-none`}
    >
      {header && <div className="border-b border-border p-3 text-md text-text">{header}</div>}
      <AriaMenu
        {...props}
        className={
          appearance === "measured" ? "p-(--size-menu-inset) outline-none" : "p-1 outline-none"
        }
      />
    </Popover>
  );
}
