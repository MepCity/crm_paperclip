"use client";

import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  Text,
  type ValidationResult,
} from "react-aria-components";

const styles = {
  field: "flex flex-col gap-1",
  label: "text-md font-normal text-text",
  input:
    "resize-y border border-border rounded-md px-3 py-2 outline-none bg-surface text-text " +
    "data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:opacity-50 data-disabled:bg-surface-hover data-invalid:border-danger",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

export interface TextAreaProps extends Omit<AriaTextFieldProps, "rows"> {
  label: string;
  description?: string;
  errorMessage?: string | ((v: ValidationResult) => string);
  /** How many rows of text are visible before the field starts scrolling. */
  rows?: number;
}

export function TextArea({ label, description, errorMessage, rows = 4, ...props }: TextAreaProps) {
  return (
    <AriaTextField {...props} className={styles.field}>
      <Label className={styles.label}>{label}</Label>
      <AriaTextArea rows={rows} className={styles.input} />
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
