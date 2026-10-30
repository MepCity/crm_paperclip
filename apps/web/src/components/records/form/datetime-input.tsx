"use client";

import { useState } from "react";
import { TextCalendarField } from "@/components/ui/text-calendar-field";
import { TextField } from "@/components/ui/text-field";
import { useUiLanguage } from "@/i18n/client-provider";
import {
  calendarShapeToDisplayDate,
  DATE_MASK_PLACEHOLDER,
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
  const language = useUiLanguage();
  const [timeDraft, setTimeDraft] = useState<string | null>(null);
  const [written, setWritten] = useState(value);
  const [parts, setParts] = useState(() => isoToDateTimeParts(value, dateOnly));
  const [writtenDateOnly, setWrittenDateOnly] = useState(dateOnly);
  if (written !== value || writtenDateOnly !== dateOnly) {
    setTimeDraft(null);
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
        label={`${label} ${language === "tr" ? "tarih" : "date"}`}
        hideLabel
        type="text"
        name={`${id}-date`}
        placeholder={DATE_MASK_PLACEHOLDER}
        value={calendarShapeToDisplayDate(parts.date)}
        isRequired={required}
        isDisabled={disabled}
        isInvalid={Boolean(errorMessage)}
        errorMessage={errorMessage}
        validationBehavior="aria"
        onChange={(date) => update({ ...parts, date: displayDateToModelShape(date) ?? "" })}
      />
      {dateOnly ? null : (
        <TextField
          id={`${id}-time`}
          label={`${label} ${language === "tr" ? "saat" : "time"}`}
          hideLabel
          type={language === "tr" ? "text" : "time"}
          name={`${id}-time`}
          value={language === "tr" ? (timeDraft ?? turkishTime(parts.time)) : parts.time}
          isRequired={required}
          isDisabled={disabled}
          isInvalid={Boolean(errorMessage)}
          validationBehavior="aria"
          onChange={(time) => {
            if (language !== "tr") {
              update({ ...parts, time });
              return;
            }
            setTimeDraft(time);
            update({ ...parts, time: parseTurkishTime(time) });
          }}
          onBlur={() => {
            if (parts.time) setTimeDraft(null);
          }}
        />
      )}
    </div>
  );
}

function turkishTime(time: string): string {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  return `${String(Number(hour) % 12 || 12).padStart(2, "0")}:${minute} ${Number(hour) < 12 ? "ÖÖ" : "ÖS"}`;
}
function parseTurkishTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(ÖÖ|ÖS)?$/i.exec(value.trim());
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) return "";
  if (match[3]) hour = (hour % 12) + (match[3].toLocaleUpperCase("tr") === "ÖS" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}
