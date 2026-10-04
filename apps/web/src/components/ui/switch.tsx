"use client";

import {
  SwitchField as AriaSwitchField,
  type SwitchFieldProps as AriaSwitchFieldProps,
  FieldError,
  SwitchButton,
  Text,
} from "react-aria-components";

/** An "on" switch submits this value with `name`; an "off" switch submits nothing. */
const FORM_VALUE = "true";

const styles = {
  field: "flex flex-col gap-1",
  button:
    "flex w-fit cursor-default items-center gap-2 rounded-full outline-none " +
    "data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  track: "flex h-4 w-8 shrink-0 items-center rounded-full border px-0.5",
  trackBorder: {
    off: "border-border",
    on: "border-primary",
    invalid: "border-danger",
  },
  trackFill: {
    off: "justify-start bg-surface-pressed",
    on: "justify-end bg-primary",
  },
  knob: "h-3 w-3 rounded-full bg-surface shadow-sm",
  label: "text-sm text-text",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

type TrackBorder = keyof typeof styles.trackBorder;

function trackBorder(isSelected: boolean, isInvalid: boolean): TrackBorder {
  if (isInvalid) return "invalid";
  return isSelected ? "on" : "off";
}

export interface SwitchProps extends Omit<AriaSwitchFieldProps, "children" | "value"> {
  label: string;
  description?: string;
  errorMessage?: string;
}

export function Switch({ label, description, errorMessage, ...props }: SwitchProps) {
  return (
    <AriaSwitchField {...props} value={FORM_VALUE} className={styles.field}>
      <SwitchButton className={styles.button}>
        {({ isSelected, isInvalid }) => (
          <>
            <span
              aria-hidden="true"
              className={`${styles.track} ${styles.trackBorder[trackBorder(isSelected, isInvalid)]} ${
                styles.trackFill[isSelected ? "on" : "off"]
              }`}
            >
              <span className={styles.knob} />
            </span>
            <span className={styles.label}>{label}</span>
          </>
        )}
      </SwitchButton>
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
    </AriaSwitchField>
  );
}
