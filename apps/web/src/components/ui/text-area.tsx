"use client";

import "./record-input.css";

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
  label: "record-label text-md",
  input: "record-control record-textarea",
  description: "text-sm text-text-muted",
  error: "record-form-validation-error",
} as const;

export interface TextAreaProps extends Omit<AriaTextFieldProps, "rows"> {
  label: string;
  hideLabel?: boolean;
  description?: string;
  errorMessage?: string | ((v: ValidationResult) => string);
  /** How many rows of text are visible before the field starts scrolling. */
  rows?: number;
}

export function TextArea({
  label,
  hideLabel = false,
  description,
  errorMessage,
  rows = 4,
  ...props
}: TextAreaProps) {
  return (
    <AriaTextField {...props} className={styles.field}>
      <Label className={hideLabel ? "sr-only" : styles.label}>{label}</Label>
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
