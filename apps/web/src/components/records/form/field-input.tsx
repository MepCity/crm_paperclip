"use client";

import type {
  FieldDefinition,
  FieldValue,
  JsonObject,
  ModuleRecordReference,
  PicklistOption,
  RecordService,
} from "@crm/core/records";
import { lookupTargetModules } from "@crm/core/records";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { laterModuleProps, type ModuleKey, useLaterModule } from "@/components/ui/later-module";
import { NumberField } from "@/components/ui/number-field";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { RecordChoice } from "@/components/ui/record-choice";
import { SuggestionField } from "@/components/ui/suggestion-field";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/text-area";
import { TextCalendarField } from "@/components/ui/text-calendar-field";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";
import type { ClientRecordService } from "@/lib/api/client/provider";
import {
  calendarShapeToDisplayDate,
  DATE_MASK_PLACEHOLDER,
  displayDateToModelShape,
} from "@/lib/records/calendar-date";
import { REMINDER_OFFSETS, reminderOffsetOf, reminderValue } from "@/lib/records/reminder-options";
import {
  isModuleRegistered,
  resolveModuleLaterKey,
  resolveModuleScreenByApiName,
} from "@/modules/registry";
import { DateTimeInput } from "./datetime-input";
import type { FormRules, LookupPickerRule, NumberLimits } from "./form-model";
import { ParticipantsInput } from "./participants-input";
import { SelectRecordDialog } from "./select-record-dialog";

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
}
export interface FieldInputProps {
  field: FieldDefinition;
  variant?: "activity";
  /** Module selected by a label-side selector; suppresses the input prefix selector. */
  lookupModule?: string;
  /** Suppresses the polymorphic prefix select inside the input (CF-08, Activities Call form). */
  suppressPolymorphicPrefix?: boolean;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  errorMessage?: string;
  disabled?: boolean;
  searchable?: boolean;
  options?: readonly PicklistOption[];
  users?: readonly OwnerOption[];
  onOpenPicker?: () => void;
  pickerLabel?: string;
  searchLabel?: string;
  currencyPrefix?: string;
  currencyInformation?: string;
  currencyHelp?: NonNullable<FormRules["currencyHelp"]>[string];
  textPrefix?: string;
  suggestions?: readonly string[];
  /** Business range of a numeric entry; metadata carries no minimum or maximum. */
  numberLimits?: NumberLimits;
  /** Picker shape for this lookup field, when it differs from the target module's configuration. */
  lookupPicker?: LookupPickerRule;
  placeholder?: string;
  defaultOpen?: boolean;
  id?: string;
  hideLabel?: boolean;
  inline?: boolean;
  recordService?: RecordService | ClientRecordService;
  /** Record address for the name-cell links of an observed record picker. */
  lookupRecordHref?: (id: string, module?: string) => string;
  /** Owner id to display name, forwarded to the record picker's owner columns. */
  lookupOwnerNames?: Readonly<Record<string, string>>;
  /** All day: a `datetime` entry shows the day only. */
  dateOnly?: boolean;
  /** Modules a record-array participants field can pick from. */
  participantModules?: readonly string[];
  /** Draws a toggle in place but inert, for behaviour that belongs to a later module. */
  laterModule?: ModuleKey;
}

function InertToggleFrame({
  laterModule,
  children,
}: {
  laterModule: ModuleKey;
  children: ReactNode;
}) {
  const ref = useLaterModule<HTMLDivElement>(laterModule);
  return (
    <div ref={ref} aria-disabled="true" data-later-module={laterModule}>
      {children}
    </div>
  );
}

/** `Sales_Orders` reads `Sales Order`; a registered module's own singular label wins. */
export function moduleSingularLabel(module: string): string {
  const registered = resolveModuleScreenByApiName(module)?.singularLabel;
  if (registered) return registered;
  return module.replace(/_/g, " ").replace(/ies$/, "y").replace(/s$/, "");
}

/**
 * Provisional: switching Reminder or Repeat on stores a minimal opaque object because the
 * reference's interior controls are write-only and were never observed (`activities-form.md`).
 */
const TOGGLE_DEFAULTS: Partial<Record<FieldDefinition["dataType"], JsonObject>> = {
  ALARM: { ALARM: "FREQ=NONE;ACTION=EMAIL;TRIGGER=-P1D" },
  RRULE: { RRULE: "FREQ=DAILY;INTERVAL=1" },
};

export function picklistChoices(options: readonly PicklistOption[], value: string | null) {
  const choices: { value: string | null; label: string }[] = [
    { value: null, label: "-None-" },
    ...options
      .filter((option) => option.storedValue !== "-None-")
      .map((option) => ({ value: option.storedValue, label: option.displayValue })),
  ];
  if (value !== null && !choices.some((option) => option.value === value))
    choices.push({ value, label: value });
  return choices;
}

type DateFieldProps = Omit<TextFieldProps, "value" | "onChange"> & {
  /**
   * The contract value: `YYYY-MM-DD`, the entry as typed while it is not a full day, or empty when
   * the field has no day.
   */
  value: string;
  onModelChange: (value: FieldValue) => void;
};

/**
 * A `date` field is typed as `DD.MM.YYYY` while the form model carries `YYYY-MM-DD`, so the entry
 * and the model cannot be the same string. What is typed stays visible, including a day that does
 * not exist: the shape is mapped to `YYYY-MM-DD` and `form-validation` rejects the impossible day,
 * instead of the input silently dropping it.
 *
 * An entry that is not a full day yet keeps what is typed in the model too. Dropping it to the
 * empty value would let `Save` clear a stored day with half an entry, because the field is optional
 * and validation cannot tell the two apart. Only a genuinely blank entry means "no day".
 *
 * Only a model write that did not come from this input replaces the entry. Treating the echo of
 * our own write as an outside write would clear the text the moment somebody deletes a character
 * from a date that is already filled in.
 */
function DateField({ value, onModelChange, ...textField }: DateFieldProps) {
  const [written, setWritten] = useState(value);
  const [entry, setEntry] = useState(() => calendarShapeToDisplayDate(value));
  if (written !== value) {
    setWritten(value);
    setEntry(calendarShapeToDisplayDate(value));
  }
  return (
    <TextCalendarField
      {...textField}
      type="text"
      value={entry}
      placeholder={textField.placeholder ?? DATE_MASK_PLACEHOLDER}
      onChange={(next) => {
        const shape = displayDateToModelShape(next);
        // The empty model comes back as "" (`FieldInput` reads a non-string value as empty).
        setWritten(shape ?? "");
        setEntry(next);
        onModelChange(shape);
      }}
    />
  );
}

export function FieldInput({
  field,
  variant,
  lookupModule,
  suppressPolymorphicPrefix,
  value,
  onChange,
  errorMessage,
  disabled = false,
  searchable,
  options,
  users = [],
  onOpenPicker,
  pickerLabel = "Open owner picker",
  searchLabel,
  currencyPrefix,
  currencyInformation,
  currencyHelp,
  textPrefix,
  suggestions,
  numberLimits,
  lookupPicker,
  placeholder,
  defaultOpen,
  id,
  hideLabel,
  inline,
  recordService,
  lookupRecordHref,
  lookupOwnerNames,
  dateOnly,
  participantModules,
  laterModule,
}: FieldInputProps) {
  const controlId = id ?? field.apiName;
  const common = {
    label: field.label,
    name: field.apiName,
    id: controlId,
    hideLabel,
    inline,
    isRequired: field.required,
    isDisabled: disabled || field.readOnly,
    isInvalid: Boolean(errorMessage),
    errorMessage,
    validationBehavior: "aria" as const,
  };
  const isLookup = field.dataType === "lookup";
  const [pickedModule, setPickedModule] = useState<string | null>(null);
  const lookupTargets = isLookup ? lookupTargetModules(field) : [];
  const isPolymorphic = lookupTargets.length > 1;
  const referenceModule =
    typeof value === "object" && value !== null && "module" in value
      ? (value as ModuleRecordReference).module
      : undefined;
  const targetModule = isPolymorphic
    ? (lookupModule ?? referenceModule ?? pickedModule ?? lookupTargets[0] ?? "")
    : (field.lookup?.module ?? "");
  const isTargetRegistered = isLookup && isModuleRegistered(targetModule);
  const targetLaterModule =
    isLookup && !isTargetRegistered ? resolveModuleLaterKey(targetModule) : undefined;
  const lookupChrome = resolveModuleScreenByApiName(targetModule)?.form.recordPickerChrome;
  const lookupButtonRef = useLaterModule<HTMLButtonElement>(targetLaterModule);
  const [lookupOpen, setLookupOpen] = useState(false);
  const reference =
    isLookup && typeof value === "object" && value !== null && "id" in value
      ? (value as ModuleRecordReference)
      : undefined;

  const text = typeof value === "string" ? value : "";
  const number = typeof value === "number" ? value : Number.NaN;
  switch (field.dataType) {
    case "autonumber":
    case "text":
    case "email":
    case "phone":
    case "website":
      if (field.dataType === "text" && suggestions) {
        return (
          <SuggestionField
            {...common}
            value={text}
            suggestions={suggestions}
            maxLength={field.maxLength}
            onChange={(next) => onChange(next === "" ? null : next)}
          />
        );
      }
      return (
        <TextField
          {...common}
          value={text}
          maxLength={field.maxLength}
          placeholder={placeholder}
          type={
            field.dataType === "phone"
              ? "tel"
              : field.dataType === "email"
                ? "email"
                : field.dataType === "website"
                  ? "url"
                  : "text"
          }
          prefix={
            textPrefix ? (
              <span className="record-prefix pl-(--space-3)">{textPrefix}</span>
            ) : undefined
          }
          endAction={
            field.readOnly ? (
              <span role="img" className="record-input-end" aria-label="Locked">
                <Icons.lock className="record-input-end-icon" aria-hidden />
              </span>
            ) : undefined
          }
          onChange={(next) => onChange(next === "" ? null : next)}
        />
      );
    case "textarea":
      return (
        <TextArea
          {...common}
          value={text}
          maxLength={field.maxLength}
          onChange={(next) => onChange(next === "" ? null : next)}
        />
      );
    case "date":
      return (
        <DateField {...common} value={text} onModelChange={onChange} placeholder={placeholder} />
      );
    // A `bigint` field is a long integer, so the form keeps it as digit text end to end: parsing it
    // into a JavaScript number would round the last digits away, and the service only accepts decimal
    // text for it. The entry is drawn like the numeric ones — the same single-line frame — but what is
    // typed is never parsed; `form-validation` reports an entry that is not digits.
    case "bigint":
      if (field.acceptsJsonArray && participantModules) {
        return (
          <ParticipantsInput
            id={controlId}
            label={field.label}
            value={value}
            onChange={onChange}
            modules={participantModules}
            disabled={common.isDisabled}
          />
        );
      }
      return (
        <TextField
          {...common}
          value={text}
          inputMode="numeric"
          maxLength={field.maxLength}
          placeholder={placeholder}
          onChange={(next) => onChange(next === "" ? null : next)}
        />
      );
    case "integer":
    case "double":
    case "currency":
      return (
        <NumberField
          {...common}
          value={number}
          placeholder={placeholder}
          isReadOnly={field.readOnly || undefined}
          minValue={numberLimits?.min}
          maxValue={numberLimits?.max}
          // An integer field still accepts what is typed: `Save` rejects a decimal with
          // `Please enter a valid <label>.`, which needs the value to survive in the input.
          formatOptions={{ useGrouping: false, maximumFractionDigits: 20 }}
          prefix={
            field.dataType === "currency" && currencyPrefix ? (
              <span className="record-currency-prefix">
                <span>{currencyPrefix}</span>
                <span className="record-currency-divider" aria-hidden />
              </span>
            ) : undefined
          }
          endAction={
            field.readOnly ? (
              <span role="img" className="record-input-end" aria-label="Locked">
                <Icons.lock className="record-input-end-icon" aria-hidden />
              </span>
            ) : field.dataType === "currency" && currencyHelp ? (
              <PopoverTrigger>
                <Button
                  slot={null}
                  variant="ghost"
                  className="record-input-end"
                  aria-label={`${field.label} information`}
                  isDisabled={disabled}
                >
                  <Icons.recordInfo className="record-input-end-icon" aria-hidden />
                </Button>
                <Popover
                  title={`${field.label} information`}
                  hideTitle
                  placement="bottom end"
                  className="max-w-xs text-md text-text"
                >
                  <span
                    aria-hidden
                    className="absolute -top-1 right-4 size-2 rotate-45 border-l border-t border-border bg-surface"
                  />
                  <p>{currencyHelp.text}</p>
                  <p>
                    For example, <strong>{currencyHelp.expression}</strong> gives{" "}
                    <strong>{currencyHelp.result}</strong>.
                  </p>
                </Popover>
              </PopoverTrigger>
            ) : field.dataType === "currency" && currencyInformation ? (
              <span role="img" className="record-input-end" aria-label={currencyInformation}>
                <Icons.recordInfo className="record-input-end-icon" aria-hidden />
              </span>
            ) : undefined
          }
          onChange={(next) => onChange(Number.isFinite(next) ? next : null)}
        />
      );
    case "boolean":
      return (
        <Checkbox
          {...common}
          hideLabel={variant === "activity" || hideLabel}
          aria-label={field.label}
          isSelected={value === true}
          onChange={onChange}
        />
      );
    case "picklist":
      return (
        <RecordChoice
          id={controlId}
          hideLabel={hideLabel}
          label={field.label}
          value={text || null}
          onChange={onChange}
          options={picklistChoices(options ?? field.picklist ?? [], text || null)}
          searchable={searchable}
          searchLabel={searchLabel}
          disabled={common.isDisabled}
          required={field.required}
          errorMessage={errorMessage}
          defaultOpen={defaultOpen}
          inline={inline}
        />
      );
    case "ownerlookup": {
      const ownerOptions = users.map((user) => ({
        value: user.id,
        label: user.name,
        secondaryLabel: user.email,
      }));
      if (text && !ownerOptions.some((user) => user.value === text))
        ownerOptions.push({ value: text, label: text, secondaryLabel: "" });
      return (
        <RecordChoice
          id={controlId}
          hideLabel={hideLabel}
          label={field.label}
          value={text || null}
          onChange={onChange}
          options={ownerOptions}
          searchable
          owner
          searchLabel={searchLabel ?? "Search Users"}
          disabled={common.isDisabled}
          required={field.required}
          errorMessage={errorMessage}
          defaultOpen={defaultOpen}
          inline={inline}
          endAction={
            onOpenPicker ? (
              <button
                type="button"
                className="record-input-end"
                aria-label={pickerLabel}
                disabled={common.isDisabled}
                onClick={onOpenPicker}
              >
                <Icons.recordUser className="record-input-end-icon" aria-hidden />
              </button>
            ) : undefined
          }
        />
      );
    }
    case "profileimage":
      return (
        <div role="img" aria-label={field.label} className="record-profile">
          <Icons.recordPortraitSilhouette
            aria-hidden
            className="record-profile-silhouette h-full w-full"
          />
        </div>
      );
    case "lookup": {
      const displayText = reference?.name ?? (typeof value === "string" ? value : "");
      return (
        <>
          <TextField
            {...common}
            placeholder={placeholder}
            value={displayText}
            laterModule={targetLaterModule}
            prefix={
              isPolymorphic && lookupModule === undefined && !suppressPolymorphicPrefix ? (
                <div className="record-prefix-select">
                  <RecordChoice
                    id={`${controlId}-module`}
                    label={`${field.label} module`}
                    hideLabel
                    prefix
                    value={targetModule}
                    onChange={(next) => {
                      if (!next || next === targetModule) return;
                      setPickedModule(next);
                      onChange(null);
                    }}
                    options={lookupTargets.map((module) => ({
                      value: module,
                      label: moduleSingularLabel(module),
                    }))}
                    disabled={common.isDisabled}
                  />
                  <span className="record-prefix-divider" aria-hidden />
                </div>
              ) : undefined
            }
            onChange={(next) => {
              if (next === "") {
                onChange(null);
              }
            }}
            endAction={
              <button
                ref={lookupButtonRef}
                type="button"
                className="record-input-end"
                aria-label={
                  pickerLabel !== "Open owner picker" ? pickerLabel : `Open ${field.label} lookup`
                }
                disabled={common.isDisabled}
                onClick={() => {
                  if (isTargetRegistered) {
                    setLookupOpen(true);
                  }
                }}
                {...(targetLaterModule ? laterModuleProps(targetLaterModule) : {})}
              >
                {variant === "activity" ? (
                  <Icons.recordPanelSearch className="record-input-end-icon" aria-hidden />
                ) : (
                  <Icons.recordLookup
                    module={targetModule}
                    className="record-input-end-icon"
                    aria-hidden
                  />
                )}
              </button>
            }
          />
          {lookupOpen && isTargetRegistered && (
            <SelectRecordDialog
              module={targetModule}
              selectedId={reference?.id}
              recordService={recordService}
              chrome={lookupPicker?.chrome ?? lookupChrome ?? "interim"}
              searchLabel={lookupPicker?.searchLabel}
              recordHref={lookupRecordHref ? (id) => lookupRecordHref(id, targetModule) : undefined}
              ownerNames={
                lookupOwnerNames ??
                (users ? Object.fromEntries(users.map((u) => [u.id, u.name])) : undefined)
              }
              onDone={(selected) => {
                onChange(selected);
                setLookupOpen(false);
              }}
              onCancel={() => setLookupOpen(false)}
            />
          )}
        </>
      );
    }
    case "ALARM":
    case "RRULE": {
      const toggle = (
        <Switch
          label={field.label}
          hideLabel={variant === "activity"}
          variant={variant}
          aria-label={field.label}
          isSelected={typeof value === "object" && value !== null}
          isDisabled={common.isDisabled}
          onChange={(on) => onChange(on ? (TOGGLE_DEFAULTS[field.dataType] ?? null) : null)}
        />
      );
      return laterModule ? (
        <InertToggleFrame laterModule={laterModule}>{toggle}</InertToggleFrame>
      ) : (
        toggle
      );
    }
    case "datetime":
      return (
        <DateTimeInput
          id={controlId}
          label={field.label}
          value={typeof value === "string" ? value : null}
          onChange={onChange}
          dateOnly={dateOnly}
          required={field.required}
          disabled={common.isDisabled}
          errorMessage={errorMessage}
        />
      );
    case "multireminder":
      return (
        <RecordChoice
          id={controlId}
          hideLabel={hideLabel}
          label={field.label}
          value={reminderOffsetOf(value)}
          onChange={(next) => onChange(reminderValue(next))}
          options={[
            { value: null, label: "-None-" },
            ...REMINDER_OFFSETS.map((offset) => ({ value: offset.id, label: offset.label })),
          ]}
          disabled={common.isDisabled}
          inline={inline}
        />
      );
    case "multi_module_lookup":
      return null;
  }
}
