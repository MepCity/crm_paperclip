"use client";

import "./record-input.css";
import "./filter-control.css";

import { type ReactNode, useLayoutEffect, useState } from "react";
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
  variant?: "default" | "filter" | "sort";
  /** Keeps the accessible name and removes the label from the visual layout. */
  hideLabel?: boolean;
  description?: string;
  errorMessage?: string;
  items: Iterable<T>;
  children: (item: T) => ReactNode;
}

export function Select<T extends object>({
  label,
  variant = "default",
  hideLabel = false,
  description,
  errorMessage,
  items,
  children,
  ...props
}: SelectProps<T>) {
  const [filterMaxHeight, setFilterMaxHeight] = useState<number>();
  const [filterOffset, setFilterOffset] = useState<number>();
  useLayoutEffect(() => {
    if (variant !== "filter") {
      setFilterMaxHeight(undefined);
      return;
    }
    // Positioning takes a numeric limit and writes it directly to the element.
    const height = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--size-filter-operator-list-height",
      ),
    );
    setFilterMaxHeight(Number.isFinite(height) ? height : undefined);
    const offset = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--size-filter-operator-list-offset",
      ),
    );
    setFilterOffset(Number.isFinite(offset) ? offset : undefined);
  }, [variant]);
  return (
    <AriaSelect
      {...props}
      className={variant === "filter" ? "filter-select" : "flex flex-col gap-1"}
    >
      {({ isInvalid }: SelectRenderProps) => (
        <>
          <Label className={hideLabel ? "sr-only" : "record-label text-md"}>{label}</Label>
          {/* The trigger draws the border, but React Aria only reports the resolved
              invalid state (prop or Form validationErrors) on the Select root. */}
          <Button
            data-value={variant === "filter" ? props.value : undefined}
            data-invalid={isInvalid || undefined}
            data-required={props.isRequired || undefined}
            className={
              variant === "filter"
                ? "filter-operator-control"
                : variant === "sort"
                  ? "record-control record-control-sort flex items-center justify-between text-left"
                  : "record-control flex items-center justify-between text-left"
            }
          >
            <SelectValue className="truncate" />
            <Icons.chevronDown
              className={
                variant === "filter"
                  ? "h-3 w-3 shrink-0 text-text"
                  : "h-4 w-4 shrink-0 text-text-muted"
              }
              aria-hidden="true"
            />
          </Button>
          {description && (
            <Text slot="description" className="text-sm text-text-muted">
              {description}
            </Text>
          )}
          <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
          <Popover
            offset={variant === "filter" ? (filterOffset ?? 1) : undefined}
            maxHeight={filterMaxHeight}
            className={
              variant === "filter"
                ? "filter-operator-popover shadow-lg"
                : "max-h-60 overflow-auto rounded-md border border-border bg-surface shadow-lg outline-none"
            }
          >
            <ListBox
              items={items}
              className={variant === "filter" ? "filter-operator-list" : "p-1 outline-none"}
            >
              {children}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaSelect>
  );
}

export function SelectItem({
  variant = "default",
  ...props
}: ListBoxItemProps & { variant?: "default" | "filter" | "sort" }) {
  return (
    <ListBoxItem
      {...props}
      className={
        variant === "filter"
          ? "filter-operator-option"
          : variant === "sort"
            ? "cursor-default rounded px-3 py-2 text-sm font-normal outline-none data-disabled:opacity-50 data-focused:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-hovered:bg-surface-hover"
            : "cursor-default rounded px-3 py-2 text-sm outline-none data-disabled:opacity-50 data-focused:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-hovered:bg-surface-hover data-selected:font-semibold"
      }
    />
  );
}
