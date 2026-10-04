"use client";

import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";

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
      <Label className={variant === "filter-search" ? "sr-only" : "text-sm font-medium text-text"}>
        {label}
      </Label>
      <Input
        placeholder={placeholder}
        className={`${variant === "filter-search" ? "h-(--size-list-filter-search-height) w-full min-w-0 border-control-border text-sm placeholder:text-text-placeholder" : "border-border py-2"} border rounded-md px-3 outline-none bg-surface text-text data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-disabled:opacity-50 data-disabled:bg-surface-hover data-invalid:border-danger`}
      />
      {description && (
        <Text slot="description" className="text-sm text-text-muted">
          {description}
        </Text>
      )}
      <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
