"use client";

import "./record-input.css";

import type { ReactNode } from "react";
import {
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
  FieldError,
  I18nProvider,
  Input,
  Label,
  Text,
} from "react-aria-components";

const styles = {
  field: "flex flex-col gap-1",
  label: "record-label text-md",
  input: "record-control",
  description: "text-sm text-text-muted",
  error: "record-form-validation-error",
} as const;

export interface NumberFieldProps extends AriaNumberFieldProps {
  label: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  endAction?: ReactNode;
  placeholder?: string;
  hideLabel?: boolean;
  description?: string;
  errorMessage?: string;
  /** Fixes how many decimal digits are shown and accepted, e.g. 2 for an amount. */
  decimalPlaces?: number;
  /**
   * Locale the value is formatted and parsed in. Defaults to the app locale from `UiProvider`;
   * pass one only to format this field differently.
   */
  locale?: string;
}

export function NumberField({
  label,
  prefix,
  suffix,
  endAction,
  placeholder,
  hideLabel = false,
  description,
  errorMessage,
  decimalPlaces,
  locale,
  formatOptions,
  ...props
}: NumberFieldProps) {
  const fractionDigits =
    decimalPlaces === undefined
      ? {}
      : { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces };

  const field = (
    <AriaNumberField
      {...props}
      formatOptions={{ ...formatOptions, ...fractionDigits }}
      className={styles.field}
    >
      <Label className={hideLabel ? "sr-only" : styles.label}>{label}</Label>
      <div
        className="record-control record-input-frame"
        data-required={props.isRequired || undefined}
        data-invalid={props.isInvalid || undefined}
      >
        {prefix}
        <Input placeholder={placeholder} className={styles.input} />
        {suffix}
        {endAction}
      </div>
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
    </AriaNumberField>
  );

  // React Aria reads the locale from its provider and ignores formatOptions.locale, so a
  // per-field locale has to be applied as one. Without it the field inherits the app locale.
  return locale ? <I18nProvider locale={locale}>{field}</I18nProvider> : field;
}
