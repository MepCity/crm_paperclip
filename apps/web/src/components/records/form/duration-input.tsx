"use client";

import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { FieldInput } from "./field-input";

/** Splits an `MM:SS` text value; anything else reads as empty boxes. */
export function parseDuration(value: FieldValue | undefined): {
  minutes: number | null;
  seconds: number | null;
} {
  const match = typeof value === "string" ? /^(\d+):(\d{1,2})$/.exec(value) : null;
  return match
    ? { minutes: Number(match[1]), seconds: Number(match[2]) }
    : { minutes: null, seconds: null };
}

/** Joins the two boxes into `MM:SS`; both empty is an empty value. */
export function formatDuration(minutes: number | null, seconds: number | null): string | null {
  if (minutes === null && seconds === null) return null;
  const pad = (part: number | null) => String(Math.max(0, Math.trunc(part ?? 0))).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

function part(field: FieldDefinition, suffix: string, label: string): FieldDefinition {
  return {
    ...field,
    apiName: `${field.apiName}__${suffix}`,
    label,
    dataType: "integer",
    required: false,
  };
}

export interface DurationInputProps {
  field: FieldDefinition;
  id: string;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  errorMessage?: string;
  disabled?: boolean;
}

/** Call duration entry: whole minutes and whole seconds in two boxes, stored as `MM:SS`. */
export function DurationInput({
  field,
  id,
  value,
  onChange,
  errorMessage,
  disabled,
}: DurationInputProps) {
  const { minutes, seconds } = parseDuration(value);
  return (
    <div className="record-duration-input" data-record-duration>
      <FieldInput
        id={id}
        hideLabel
        field={part(field, "minutes", `${field.label} minutes`)}
        value={minutes}
        numberLimits={{ min: 0 }}
        placeholder="mm"
        errorMessage={errorMessage}
        disabled={disabled}
        onChange={(next) =>
          onChange(formatDuration(typeof next === "number" ? next : null, seconds))
        }
      />
      <FieldInput
        id={`${id}-seconds`}
        hideLabel
        field={part(field, "seconds", `${field.label} seconds`)}
        value={seconds}
        numberLimits={{ min: 0, max: 59 }}
        placeholder="ss"
        disabled={disabled}
        onChange={(next) =>
          onChange(formatDuration(minutes, typeof next === "number" ? next : null))
        }
      />
    </div>
  );
}
