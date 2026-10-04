"use client";

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
  label: "text-sm font-medium text-text",
  input:
    "w-full border border-border rounded-md px-3 py-2 outline-none bg-surface text-text " +
    "data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:opacity-50 data-disabled:bg-surface-hover data-invalid:border-danger",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

export interface NumberFieldProps extends AriaNumberFieldProps {
  label: string;
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
      <Label className={styles.label}>{label}</Label>
      <Input className={styles.input} />
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
