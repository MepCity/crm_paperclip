"use client";

import "./record-input.css";

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
  /** Keeps the accessible name and removes the label from the visual layout. */
  hideLabel?: boolean;
  description?: string;
  errorMessage?: string;
  items: Iterable<T>;
  children: (item: T) => ReactNode;
}

export function Select<T extends object>({
  label,
  hideLabel = false,
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
          <Label className={hideLabel ? "sr-only" : "record-label text-md"}>{label}</Label>
          {/* The trigger draws the border, but React Aria only reports the resolved
              invalid state (prop or Form validationErrors) on the Select root. */}
          <Button
            data-invalid={isInvalid || undefined}
            data-required={props.isRequired || undefined}
            className="record-control flex items-center justify-between text-left"
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
