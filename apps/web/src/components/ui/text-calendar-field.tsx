"use client";

import "./record-input.css";
import { parseDate } from "@internationalized/date";
import { useRef, useState } from "react";
import {
  Calendar,
  Dialog,
  FieldError,
  Input,
  Label,
  Popover,
  TextField,
} from "react-aria-components";
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
  const [open, setOpen] = useState(false);
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
        onClick={() => {
          if (!props.isDisabled && !props.isReadOnly) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === "ArrowDown" && !props.isDisabled && !props.isReadOnly) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      />
      <FieldError className="record-form-validation-error">{errorMessage}</FieldError>
      <Popover
        triggerRef={input}
        isOpen={open}
        onOpenChange={setOpen}
        placement="bottom start"
        className="rounded-md border border-border bg-surface shadow-lg outline-none"
        style={{ minWidth: "var(--trigger-width)" }}
      >
        <Dialog aria-label={`${label} calendar`} className="p-3 outline-none">
          <Calendar
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
        </Dialog>
      </Popover>
    </TextField>
  );
}
