"use client";

import {
  CheckboxField as AriaCheckboxField,
  type CheckboxFieldProps as AriaCheckboxFieldProps,
  CheckboxButton,
  FieldError,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";

/** A checked box submits this value with `name`; an unchecked box submits nothing. */
const FORM_VALUE = "true";

const styles = {
  field: "flex flex-col gap-1",
  fieldWrap: "flex w-full min-w-0 flex-col gap-1",
  button:
    "flex w-fit cursor-default items-center gap-2 rounded-sm outline-none " +
    "data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  buttonFirstLine:
    "flex w-full min-w-0 cursor-default items-start gap-(--size-list-filter-label-gap) rounded-sm outline-none " +
    "data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  box: "flex shrink-0 items-center justify-center rounded-sm bg-surface",
  boxFirstLine: "mt-px",
  boxSize: {
    unselected: "h-(--size-checkbox) w-(--size-checkbox) border-(length:--size-checkbox-border)",
    selected: "h-4 w-4 border",
  },
  boxBorder: {
    unselected: "border-control-border",
    selected: "border-primary",
    invalid: "border-danger",
  },
  boxChecked: "bg-primary",
  check: "h-3 w-3 text-primary-text",
  label: "text-sm text-text",
  labelFirstLine: "min-w-0 text-sm leading-(--size-list-filter-row-line)! text-text",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

type BoxBorder = keyof typeof styles.boxBorder;

function boxBorder(isSelected: boolean, isInvalid: boolean): BoxBorder {
  if (isInvalid) return "invalid";
  return isSelected ? "selected" : "unselected";
}

export interface CheckboxProps extends Omit<AriaCheckboxFieldProps, "children" | "value"> {
  label: string;
  description?: string;
  errorMessage?: string;
  /** `first-line` keeps the box on the first wrapped line. The default stays centered. */
  align?: "center" | "first-line";
}

export function Checkbox({
  label,
  description,
  errorMessage,
  align = "center",
  ...props
}: CheckboxProps) {
  const wraps = align === "first-line";
  return (
    <AriaCheckboxField
      {...props}
      value={FORM_VALUE}
      className={wraps ? styles.fieldWrap : styles.field}
    >
      <CheckboxButton className={wraps ? styles.buttonFirstLine : styles.button}>
        {({ isSelected, isInvalid }) => (
          <>
            <span
              aria-hidden="true"
              className={`${styles.box} ${wraps ? styles.boxFirstLine : ""} ${styles.boxSize[isSelected ? "selected" : "unselected"]} ${styles.boxBorder[boxBorder(isSelected, isInvalid)]} ${
                isSelected ? styles.boxChecked : ""
              }`}
            >
              {isSelected && <Icons.check className={styles.check} />}
            </span>
            <span className={wraps ? styles.labelFirstLine : styles.label}>{label}</span>
          </>
        )}
      </CheckboxButton>
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
    </AriaCheckboxField>
  );
}
