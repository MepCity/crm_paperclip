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
  description?: string;
  errorMessage?: string | ((v: import("react-aria-components").ValidationResult) => string);
}

export function TextField({ label, description, errorMessage, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} className="flex flex-col gap-1">
      <Label className="text-sm font-medium text-text">{label}</Label>
      <Input className="border border-border rounded-md px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-surface-hover" />
      {description && (
        <Text slot="description" className="text-sm text-text-muted">
          {description}
        </Text>
      )}
      <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
