"use client";

import type { ReactNode } from "react";
import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  type SelectRenderProps,
  SelectValue,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";

export interface SelectProps<T extends object> extends Omit<AriaSelectProps<T>, "children"> {
  label: string;
  description?: string;
  errorMessage?: string;
  items: Iterable<T>;
  children: (item: T) => ReactNode;
}

export function Select<T extends object>({
  label,
  description,
  errorMessage,
  items,
  children,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect {...props} className="flex flex-col gap-1">
      {({ isInvalid }: SelectRenderProps) => (
        <>
          <Label className="text-sm font-medium text-text">{label}</Label>
          {/* The trigger draws the border, but React Aria only reports the resolved
              invalid state (prop or Form validationErrors) on the Select root. */}
          <Button
            data-invalid={isInvalid || undefined}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-left outline-none data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-disabled:bg-surface-hover data-disabled:opacity-50 data-invalid:border-danger"
          >
            <SelectValue className="truncate" />
            <Icons.chevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          </Button>
          {description && (
            <Text slot="description" className="text-sm text-text-muted">
              {description}
            </Text>
          )}
          <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
          <Popover className="max-h-60 overflow-auto rounded-md border border-border bg-surface shadow-lg outline-none">
            <ListBox items={items} className="p-1 outline-none">
              {children}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaSelect>
  );
}

export function SelectItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className="cursor-default rounded px-3 py-2 text-sm outline-none data-disabled:opacity-50 data-focused:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-hovered:bg-surface-hover data-selected:font-semibold"
    />
  );
}
