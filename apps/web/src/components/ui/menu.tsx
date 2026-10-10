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
  SubmenuTrigger,
} from "react-aria-components";
import { Button, type ButtonProps } from "./button";

export { MenuTrigger, SubmenuTrigger };

export function MenuGroup({ children }: { children: ReactNode }) {
  return <MenuSection>{children}</MenuSection>;
}

export function MenuDivider() {
  return <Separator className="my-(--size-record-menu-inset) h-px w-full bg-border" />;
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
          `cursor-default outline-none data-disabled:opacity-50 ${appearance === "record" ? "flex items-center h-(--size-menu-item-height) rounded-(--radius-record-menu-row) px-(--size-record-menu-text-inset) text-md font-normal" : appearance === "measured" ? "flex items-center gap-(--size-menu-label-gap) min-h-(--size-menu-item-height) rounded-md px-(--size-menu-inset) text-md font-normal" : "rounded-sm px-3 py-2 text-md font-normal"} ` +
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

const measuredMenuClass = "p-(--size-menu-inset) outline-none";

function menuPopoverClass(widthClass: string, appearance: "default" | "measured" | "record") {
  return (
    `${widthClass} ${appearance === "measured" ? "bg-menu-surface" : "bg-surface"} max-w-full ` +
    `${appearance === "record" ? "max-h-screen rounded-(--radius-record-menu)" : "max-h-80 rounded-md"} ` +
    "overflow-auto border border-border shadow-lg outline-none"
  );
}

/**
 * Content of a `SubmenuTrigger`: the submenu popover and its menu, in the measured row
 * style. The placement comes from the submenu trigger, so it must not be set here.
 * `list-views.md` › View Settings popover measures the parent popover only, so the
 * submenu sizes to its rows.
 */
export function Submenu<T extends object>({
  ariaLabel,
  ...props
}: AriaMenuProps<T> & { ariaLabel: string }) {
  return (
    <Popover className={menuPopoverClass("w-max", "measured")}>
      <AriaMenu {...props} aria-label={ariaLabel} className={measuredMenuClass} />
    </Popover>
  );
}

export function Menu<T extends object>({
  width,
  appearance = "default",
  placement,
  header,
  shouldCloseOnInteractOutside,
  ...props
}: AriaMenuProps<T> & {
  width?: "create" | "actions" | "settings" | "columnOptions";
  appearance?: "default" | "measured" | "record";
  placement?: ComponentProps<typeof Popover>["placement"];
  header?: ReactNode;
  /** Lets a nested submenu popover count as inside the menu (it portals outside it). */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
}) {
  const widthClass =
    appearance === "record"
      ? "w-(--size-record-menu-width)"
      : width === "create"
        ? "w-(--size-popover-import-width)"
        : width === "actions"
          ? "w-(--size-popover-actions-width)"
          : width === "settings"
            ? "w-(--size-popover-settings-width)"
            : width === "columnOptions"
              ? "w-(--size-popover-column-options-width)"
              : appearance === "measured"
                ? "w-(--size-menu-width)"
                : "w-48";
  return (
    <Popover
      placement={placement ?? "bottom end"}
      offset={appearance === "record" ? 0 : undefined}
      className={menuPopoverClass(widthClass, appearance)}
      {...(shouldCloseOnInteractOutside ? { shouldCloseOnInteractOutside } : {})}
    >
      {header && <div className="border-b border-border p-3 text-md text-text">{header}</div>}
      <AriaMenu
        {...props}
        className={
          appearance === "record"
            ? "py-(--size-record-menu-inset) px-(--size-record-menu-inset-inline) outline-none"
            : appearance === "measured"
              ? measuredMenuClass
              : "p-1 outline-none"
        }
      />
    </Popover>
  );
}
