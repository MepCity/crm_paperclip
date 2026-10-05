"use client";

import { type DateValue, parseDate } from "@internationalized/date";
import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateField,
  DateInput,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";

const styles = {
  field: "flex flex-col gap-1",
  label: "text-md font-normal text-text",
  group:
    "flex items-center rounded-md border border-border bg-surface " +
    "data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-disabled:bg-surface-hover data-disabled:opacity-50 data-invalid:border-danger",
  dateField: "flex min-w-0 flex-1",
  dateInput: "flex flex-1 items-center px-3 py-2 text-text outline-none",
  segment:
    "rounded-sm px-0.5 text-text outline-none data-disabled:opacity-50 data-focused:bg-primary " +
    "data-focused:text-primary-text data-invalid:text-danger data-placeholder:text-text-muted",
  trigger:
    "flex cursor-default items-center justify-center rounded-md px-2 py-2 outline-none " +
    "data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  popover: "rounded-md border border-border bg-surface shadow-lg outline-none",
  dialog: "p-3 outline-none",
  calendarHeader: "mb-2 flex items-center justify-between gap-1",
  heading: "flex-1 text-center text-sm font-semibold text-text",
  navButton:
    "flex cursor-default items-center justify-center rounded-md p-1 text-text outline-none " +
    "data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  weekday: "w-8 pb-1 text-center text-xs font-semibold text-text-muted",
  day:
    "flex h-8 w-8 cursor-default items-center justify-center rounded-md text-sm text-text outline-none " +
    "data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-hovered:bg-surface-hover data-outside-month:text-text-muted data-pressed:bg-surface-pressed " +
    "data-selected:bg-primary data-selected:text-primary-text data-today:font-semibold",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

/**
 * `undefined` keeps the field uncontrolled, `null` clears it. The value is a calendar day, so it
 * carries no time zone and never shifts when the browser is somewhere else.
 */
function toCalendarDate(value: string | null | undefined): DateValue | null | undefined {
  if (value === undefined) return undefined;
  return value === "" || value === null ? null : parseDate(value);
}

export interface DatePickerProps
  extends Omit<
    AriaDatePickerProps<DateValue>,
    | "children"
    | "value"
    | "defaultValue"
    | "placeholderValue"
    | "minValue"
    | "maxValue"
    | "onChange"
  > {
  label: string;
  description?: string;
  errorMessage?: string;
  /** Calendar day as `YYYY-MM-DD`, which is also what the form submits. */
  value?: string | null;
  defaultValue?: string | null;
  placeholderValue?: string;
  minValue?: string;
  maxValue?: string;
  onChange?: (value: string | null) => void;
  /**
   * Locale the field and the calendar are formatted in. Defaults to the app locale from
   * `UiProvider`; pass one only to format this field differently.
   */
  locale?: string;
}

export function DatePicker({
  label,
  description,
  errorMessage,
  value,
  defaultValue,
  placeholderValue,
  minValue,
  maxValue,
  onChange,
  locale,
  ...props
}: DatePickerProps) {
  const picker = (
    <AriaDatePicker
      {...props}
      value={toCalendarDate(value)}
      defaultValue={toCalendarDate(defaultValue)}
      placeholderValue={toCalendarDate(placeholderValue)}
      minValue={toCalendarDate(minValue)}
      maxValue={toCalendarDate(maxValue)}
      onChange={(date) => onChange?.(date ? date.toString() : null)}
      className={styles.field}
    >
      {({ isInvalid, isFocusVisible }) => (
        <>
          <Label className={styles.label}>{label}</Label>
          {/* The group draws the border, but React Aria reports the resolved invalid and focus
              state only on the DatePicker root. */}
          <Group
            data-invalid={isInvalid || undefined}
            data-focus-visible={isFocusVisible || undefined}
            className={styles.group}
          >
            <DateField className={styles.dateField}>
              <DateInput className={styles.dateInput}>
                {(segment) => <DateSegment segment={segment} className={styles.segment} />}
              </DateInput>
            </DateField>
            <Button slot="trigger" className={styles.trigger}>
              <Icons.calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
            </Button>
          </Group>
          {description && (
            <Text slot="description" className={styles.description}>
              {description}
            </Text>
          )}
          <FieldError className={styles.error}>{errorMessage}</FieldError>
          <Popover className={styles.popover}>
            <Dialog className={styles.dialog}>
              <Calendar>
                <header className={styles.calendarHeader}>
                  <Button slot="previous" className={styles.navButton}>
                    <Icons.chevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Heading className={styles.heading} />
                  <Button slot="next" className={styles.navButton}>
                    <Icons.chevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </header>
                <CalendarGrid>
                  <CalendarGridHeader>
                    {(day) => (
                      <CalendarHeaderCell className={styles.weekday}>{day}</CalendarHeaderCell>
                    )}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => <CalendarCell date={date} className={styles.day} />}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>
            </Dialog>
          </Popover>
        </>
      )}
    </AriaDatePicker>
  );

  // React Aria reads the locale from its provider, so a per-field locale has to be applied as one.
  return locale ? <I18nProvider locale={locale}>{picker}</I18nProvider> : picker;
}
