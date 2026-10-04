"use client";

import {
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
  FieldError,
  Label,
  RadioButton,
  RadioField,
  Text,
} from "react-aria-components";

const styles = {
  field: "flex flex-col gap-1",
  label: "text-sm font-medium text-text",
  options: {
    vertical: "flex flex-col gap-2",
    horizontal: "flex flex-row flex-wrap gap-4",
  },
  option:
    "flex w-fit cursor-default items-center gap-2 rounded-full outline-none " +
    "data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  circle: "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-surface",
  circleBorder: {
    unselected: "border-border",
    selected: "border-primary",
    invalid: "border-danger",
  },
  dot: "h-2 w-2 rounded-full bg-primary",
  optionLabel: "text-sm text-text",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

type CircleBorder = keyof typeof styles.circleBorder;

function circleBorder(isSelected: boolean, isInvalid: boolean): CircleBorder {
  if (isInvalid) return "invalid";
  return isSelected ? "selected" : "unselected";
}

export interface RadioOption {
  value: string;
  label: string;
  isDisabled?: boolean;
}

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, "children"> {
  label: string;
  description?: string;
  errorMessage?: string;
  options: RadioOption[];
}

export function RadioGroup({
  label,
  description,
  errorMessage,
  options,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup {...props} className={styles.field}>
      {({ orientation }) => (
        <>
          <Label className={styles.label}>{label}</Label>
          <div className={styles.options[orientation]}>
            {options.map((option) => (
              <RadioField key={option.value} value={option.value} isDisabled={option.isDisabled}>
                <RadioButton className={styles.option}>
                  {({ isSelected, isInvalid }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={`${styles.circle} ${
                          styles.circleBorder[circleBorder(isSelected, isInvalid)]
                        }`}
                      >
                        {isSelected && <span className={styles.dot} />}
                      </span>
                      <span className={styles.optionLabel}>{option.label}</span>
                    </>
                  )}
                </RadioButton>
              </RadioField>
            ))}
          </div>
          {description && (
            <Text slot="description" className={styles.description}>
              {description}
            </Text>
          )}
          <FieldError className={styles.error}>{errorMessage}</FieldError>
        </>
      )}
    </AriaRadioGroup>
  );
}
