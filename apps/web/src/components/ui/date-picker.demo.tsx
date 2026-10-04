"use client";
import { DatePicker } from "./date-picker";

export default function DatePickerDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <DatePicker name="demo-date" label="Empty" />
      <DatePicker name="demo-date-filled" label="Filled" defaultValue="2026-03-10" />
      <DatePicker
        name="demo-date-range"
        label="Limited to 2026"
        minValue="2026-01-01"
        maxValue="2026-12-31"
      />
      <DatePicker
        name="demo-date-description"
        label="With description"
        description="Type the date or open the calendar"
      />
      <DatePicker
        name="demo-date-error"
        label="With error"
        isInvalid
        errorMessage="Pick the closing date"
      />
      <DatePicker name="demo-date-disabled" label="Disabled" isDisabled defaultValue="2026-03-10" />
      <DatePicker name="demo-date-required" label="Required" isRequired />
    </div>
  );
}
