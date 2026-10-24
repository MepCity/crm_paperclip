"use client";

import { useState } from "react";
import { TextCalendarField } from "@/components/ui/text-calendar-field";
import { TextField } from "@/components/ui/text-field";
import { useFormat } from "@/lib/format-context";
import {
  calendarShapeToDisplayDate,
  datePatternToPlaceholder,
  displayDateToModelShape,
} from "@/lib/records/calendar-date";
import { dateTimePartsToIso, isoToDateTimeParts } from "@/lib/records/datetime-parts";

export interface DateTimeInputProps {
  id: string;
  label: string;
  /** UTC ISO text, or null while empty. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** All day: the time entry is hidden and only the day is stored. */
  dateOnly?: boolean;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
}

/**
 * Date followed by a time, as in the Meeting Information dialog (MF-05 – MF-08). An incomplete
 * entry stays visible and reports an empty value, so validation can ask for it.
 */
export function DateTimeInput({
  id,
  label,
  value,
  onChange,
  dateOnly = false,
  required,
  disabled,
  errorMessage,
}: DateTimeInputProps) {
  const format = useFormat();
  const pattern = format.datePattern ?? "dd.MM.yyyy";
  const placeholder = datePatternToPlaceholder(pattern);
  const [written, setWritten] = useState(value);
  const [parts, setParts] = useState(() => isoToDateTimeParts(value, dateOnly));
  const [writtenDateOnly, setWrittenDateOnly] = useState(dateOnly);
  if (written !== value || writtenDateOnly !== dateOnly) {
    setWritten(value);
    setWrittenDateOnly(dateOnly);
    setParts(isoToDateTimeParts(value, dateOnly));
  }
  function update(next: { date: string; time: string }) {
    setParts(next);
    const iso = dateTimePartsToIso(next, dateOnly);
    setWritten(iso);
    onChange(iso);
  }
  return (
    <div className="record-form-datetime" data-record-form-datetime>
      <TextCalendarField
        id={id}
        label={`${label} date`}
        hideLabel
        type="text"
        name={`${id}-date`}
        placeholder={placeholder}
        value={calendarShapeToDisplayDate(parts.date, pattern)}
        isRequired={required}
        isDisabled={disabled}
        isInvalid={Boolean(errorMessage)}
        errorMessage={errorMessage}
        validationBehavior="aria"
        onChange={(date) => update({ ...parts, date: displayDateToModelShape(date, pattern) ?? "" })}
      />
      {dateOnly ? null : (
        <TextField
          id={`${id}-time`}
          label={`${label} time`}
          hideLabel
          type="time"
          name={`${id}-time`}
          value={parts.time}
          isRequired={required}
          isDisabled={disabled}
          isInvalid={Boolean(errorMessage)}
          validationBehavior="aria"
          onChange={(time) => update({ ...parts, time })}
        />
      )}
    </div>
  );
}
