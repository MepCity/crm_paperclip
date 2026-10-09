"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuProps as AriaMenuProps,
  composeRenderProps,
  type MenuItemProps,
  MenuSection,
  MenuTrigger,
  Popover,
  Separator,
} from "react-aria-components";
import { Button, type ButtonProps } from "./button";

export { MenuTrigger };

export function MenuGroup({ children }: { children: ReactNode }) {
  return <MenuSection>{children}</MenuSection>;
}

export function MenuDivider() {
  return (
    <Separator className="my-(--size-record-menu-inset) -mx-(--size-record-menu-inset-inline) h-px bg-border" />
  );
}

export function MenuButton(props: ButtonProps) {
  return <Button variant="secondary" {...props} />;
}

export function MenuItem<T extends object>({
  variant = "default",
  appearance = "default",
  className,
  ...props
}: MenuItemProps<T> & {
  variant?: "default" | "danger";
  appearance?: "default" | "measured" | "record";
}) {
  return (
    <AriaMenuItem
      {...props}
      className={composeRenderProps(
        className,
        (extra) =>
          `cursor-default outline-none data-disabled:opacity-50 ${appearance === "record" ? "flex items-center h-(--size-menu-item-height) px-(--size-record-menu-text-inset) text-md font-normal" : appearance === "measured" ? "flex items-center gap-(--size-menu-label-gap) min-h-(--size-menu-item-height) rounded-md px-(--size-menu-inset) text-md font-normal" : "rounded-sm px-3 py-2"} ` +
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
  placement,
  header,
  ...props
}: AriaMenuProps<T> & {
  width?: "create" | "actions" | "columnOptions";
  appearance?: "default" | "measured" | "record";
  placement?: ComponentProps<typeof Popover>["placement"];
  header?: ReactNode;
}) {
  const widthClass =
    appearance === "record"
      ? "w-(--size-record-menu-width)"
      : width === "create"
        ? "w-(--size-popover-import-width)"
        : width === "actions"
          ? "w-(--size-popover-actions-width)"
          : width === "columnOptions"
            ? "w-(--size-popover-column-options-width)"
            : appearance === "measured"
              ? "w-(--size-menu-width)"
              : "w-48";
  return (
    <Popover
      placement={placement ?? "bottom end"}
      className={`${widthClass} ${appearance === "measured" ? "bg-menu-surface" : "bg-surface"} max-w-full ${appearance === "record" ? "max-h-screen rounded-(--radius-record-menu)" : "max-h-80 rounded-md"} overflow-auto border border-border shadow-lg outline-none`}
    >
      {header && <div className="border-b border-border p-3 text-md text-text">{header}</div>}
      <AriaMenu
        {...props}
        className={
          appearance === "record"
            ? "py-(--size-record-menu-inset) px-(--size-record-menu-inset-inline) outline-none"
            : appearance === "measured"
              ? "p-(--size-menu-inset) outline-none"
              : "p-1 outline-none"
        }
      />
    </Popover>
  );
}
