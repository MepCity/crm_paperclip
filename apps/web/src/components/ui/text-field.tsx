"use client";

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
  placeholder?: string;
  variant?: "default" | "filter-search";
  description?: string;
  errorMessage?: string | ((v: import("react-aria-components").ValidationResult) => string);
}

export function TextField({
  label,
  placeholder,
  variant = "default",
  description,
  errorMessage,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField {...props} className="flex flex-col gap-1">
      <Label className={variant === "filter-search" ? "sr-only" : "text-md font-normal text-text"}>
        {label}
      </Label>
      {variant === "filter-search" ? (
        <div className="relative w-full max-w-(--size-list-filter-search-width)">
          <Icons.filterSearch
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-(--size-list-filter-search-icon-inset) h-(--size-list-filter-search-icon) w-(--size-list-filter-search-icon) -translate-y-1/2 text-text"
          />
          <Input
            placeholder={placeholder}
            className="h-(--size-list-filter-search-height) w-full min-w-0 rounded-md border border-control-border bg-surface pr-3 pl-(--size-list-filter-search-padding) text-md font-normal text-text outline-none placeholder:text-md placeholder:font-normal placeholder:text-text-placeholder data-disabled:bg-surface-hover data-disabled:opacity-50 data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-invalid:border-danger"
          />
        </div>
      ) : (
        <Input
          placeholder={placeholder}
          className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none data-disabled:bg-surface-hover data-disabled:opacity-50 data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-invalid:border-danger"
        />
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
