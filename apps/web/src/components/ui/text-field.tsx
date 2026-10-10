"use client";

import "./record-input.css";

import type { ReactNode } from "react";
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";

export interface TextFieldProps extends AriaTextFieldProps {
  label: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  endAction?: ReactNode;
  hideLabel?: boolean;
  placeholder?: string;
  variant?: "default" | "filter-search";
  /** `measured` keeps the filter search width token; `fill` spans the container it sits in. */
  size?: "measured" | "fill";
  description?: string;
  errorMessage?: string | ((v: import("react-aria-components").ValidationResult) => string);
}

export function TextField({
  label,
  prefix,
  suffix,
  endAction,
  hideLabel = false,
  placeholder,
  variant = "default",
  size = "measured",
  description,
  errorMessage,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      className={
        variant === "filter-search"
          ? size === "fill"
            ? "flex w-full flex-col gap-0"
            : "flex flex-col gap-0"
          : "flex flex-col gap-1"
      }
    >
      <Label
        className={variant === "filter-search" || hideLabel ? "sr-only" : "record-label text-md"}
      >
        {label}
      </Label>
      {variant === "filter-search" ? (
        <div
          className={
            size === "fill"
              ? "relative w-full"
              : "relative w-full max-w-(--size-list-filter-search-width)"
          }
        >
          <Icons.filterSearch
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-(--size-list-filter-search-icon-inset) h-(--size-list-filter-search-icon) w-(--size-list-filter-search-icon) -translate-y-1/2 text-text"
          />
          <Input
            placeholder={placeholder}
            className="h-(--size-list-filter-search-height) w-full min-w-0 rounded-md border border-control-border bg-surface pr-3 pl-(--size-list-filter-search-padding) text-md font-normal text-text outline-none placeholder:text-md placeholder:font-normal placeholder:text-text-placeholder data-disabled:bg-surface-hover data-disabled:opacity-50 data-focused:border-primary data-focused:ring-2 data-focused:ring-focus-ring data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-invalid:border-danger"
          />
        </div>
      ) : (
        <div
          className="record-control record-input-frame"
          data-required={props.isRequired || undefined}
          data-invalid={props.isInvalid || undefined}
        >
          {prefix}
          <Input placeholder={placeholder} className="record-control" />
          {suffix}
          {endAction}
        </div>
      )}
      {description && (
        <Text slot="description" className="text-sm text-text-muted">
          {description}
        </Text>
      )}
      <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
