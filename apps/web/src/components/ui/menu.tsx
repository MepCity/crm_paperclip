"use client";

import {
  Menu as AriaMenu,
  type MenuProps as AriaMenuProps,
  Button,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";

export { MenuItem, MenuTrigger };

export function MenuButton(props: import("react-aria-components").ButtonProps) {
  return <Button {...props} className={`outline-none ${props.className || ""}`} />;
}

export function Menu<T extends object>(props: AriaMenuProps<T>) {
  return (
    <Popover className="bg-surface border border-border rounded-md shadow-lg outline-none w-48 enter:animate-in enter:fade-in exit:animate-out exit:fade-out">
      <AriaMenu {...props} className="p-1 outline-none" />
    </Popover>
  );
}
