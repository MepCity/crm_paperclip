"use client";

import "./record-input.css";
import { parseDate } from "@internationalized/date";
import { useId, useRef, useState } from "react";
import { Calendar, FieldError, Input, Label, Popover, TextField } from "react-aria-components";
import { calendarShapeToDisplayDate, displayDateToModelShape } from "@/lib/records/calendar-date";
import { CalendarContent } from "./date-picker";
import type { TextFieldProps } from "./text-field";

/** The calendar supplements the existing editable date text and never normalizes invalid input. */
export function TextCalendarField({
  label,
  hideLabel,
  value,
  onChange,
  errorMessage,
  placeholder,
  ...props
}: TextFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const calendarId = useId();
  const [open, setOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  let selected = null;
  try {
    const shape = displayDateToModelShape(value ?? "");
    if (shape) {
      const date = parseDate(shape);
      if (calendarShapeToDisplayDate(date.toString()) === value) selected = date;
    }
  } catch {
    /* Invalid and partial entries remain editable and are validated by the form. */
  }
  return (
    <TextField {...props} value={value} onChange={onChange} className="flex flex-col gap-1">
      <Label className={hideLabel ? "sr-only" : "record-label text-md"}>{label}</Label>
      <Input
        ref={input}
        placeholder={placeholder}
        className="record-control"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
        onClick={() => {
          if (!props.isDisabled && !props.isReadOnly) {
            setKeyboardOpen(false);
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === "ArrowDown" && !props.isDisabled && !props.isReadOnly) {
            event.preventDefault();
            setKeyboardOpen(true);
            setOpen(true);
          }
        }}
      />
      <FieldError className="record-form-validation-error">{errorMessage}</FieldError>
      <Popover
        isNonModal
        triggerRef={input}
        isOpen={open}
        onOpenChange={setOpen}
        placement="bottom start"
        className="rounded-md border border-border bg-surface shadow-lg outline-none"
        style={{ minWidth: "var(--trigger-width)" }}
      >
        <section
          id={calendarId}
          role="dialog"
          aria-label={`${label} calendar`}
          className="p-3 outline-none"
        >
          <Calendar
            autoFocus={keyboardOpen}
            aria-label={label}
            value={selected}
            onChange={(day) => {
              onChange?.(calendarShapeToDisplayDate(day.toString()));
              setOpen(false);
              input.current?.focus();
            }}
          >
            <CalendarContent />
          </Calendar>
        </section>
      </Popover>
    </TextField>
  );
}
