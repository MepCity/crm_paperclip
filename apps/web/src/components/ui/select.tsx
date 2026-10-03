"use client";

import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  SelectValue,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";

export interface SelectProps<T extends object> extends Omit<AriaSelectProps<T>, "children"> {
  label: string;
  description?: string;
  items: Iterable<T>;
  children: (item: T) => React.ReactNode;
}

export function Select<T extends object>({
  label,
  description,
  items,
  children,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect {...props} className="flex flex-col gap-1">
      <Label className="text-sm font-medium text-text">{label}</Label>
      <Button className="flex items-center justify-between border border-border rounded-md px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-surface-hover bg-surface text-left">
        <SelectValue className="truncate" />
        <Icons.chevronDown className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
      </Button>
      {description && (
        <Text slot="description" className="text-sm text-text-muted">
          {description}
        </Text>
      )}
      <FieldError className="text-sm text-danger" />
      <Popover className="bg-surface border border-border rounded-md shadow-lg overflow-auto max-h-60 outline-none enter:animate-in enter:fade-in exit:animate-out exit:fade-out">
        <ListBox items={items} className="p-1 outline-none">
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SelectItem(props: import("react-aria-components").ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className="px-3 py-2 text-sm rounded cursor-default outline-none focus:bg-surface-hover focus:text-text"
    />
  );
}
