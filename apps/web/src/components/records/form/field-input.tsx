"use client";

import type { FieldDefinition, FieldValue, PicklistOption } from "@crm/core/records";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { NumberField } from "@/components/ui/number-field";
import { RecordChoice } from "@/components/ui/record-choice";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
}
export interface FieldInputProps {
  field: FieldDefinition;
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
  textPrefix?: string;
  placeholder?: string;
  defaultOpen?: boolean;
}

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

export function FieldInput({
  field,
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
  textPrefix,
  placeholder,
  defaultOpen,
}: FieldInputProps) {
  const common = {
    label: field.label,
    name: field.apiName,
    isRequired: field.required,
    isDisabled: disabled || field.readOnly,
    isInvalid: Boolean(errorMessage),
    errorMessage,
    validationBehavior: "aria" as const,
  };
  const text = typeof value === "string" ? value : "";
  const number = typeof value === "number" ? value : Number.NaN;
  switch (field.dataType) {
    case "text":
    case "email":
    case "phone":
    case "website":
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
          prefix={textPrefix}
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
    case "integer":
    case "double":
    case "currency":
      return (
        <NumberField
          {...common}
          value={number}
          placeholder={placeholder}
          formatOptions={{
            useGrouping: false,
            maximumFractionDigits: field.dataType === "integer" ? 0 : 20,
          }}
          prefix={field.dataType === "currency" ? currencyPrefix : undefined}
          suffix={
            field.dataType === "currency" && currencyInformation ? (
              <Icons.recordInfo
                aria-label={currencyInformation}
                role="img"
                className="h-4 w-4 text-text-muted"
              />
            ) : undefined
          }
          onChange={(next) => onChange(Number.isFinite(next) ? next : null)}
        />
      );
    case "boolean":
      return <Checkbox {...common} isSelected={value === true} onChange={onChange} />;
    case "picklist":
      return (
        <RecordChoice
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
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <RecordChoice
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
            />
          </div>
          {onOpenPicker && (
            <Button
              variant="ghost"
              size="toolbar"
              aria-label={pickerLabel}
              isDisabled={common.isDisabled}
              className="self-end"
              onPress={onOpenPicker}
            >
              <Icons.recordUser aria-hidden className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }
    case "profileimage":
      return (
        <div
          role="img"
          aria-label={field.label}
          className="record-profile flex items-center justify-center rounded-full bg-surface text-(--color-form-profile)"
        >
          <Icons.recordUser aria-hidden className="h-8 w-8" />
        </div>
      );
    case "lookup":
    case "multi_module_lookup":
    case "datetime":
    case "bigint":
      return null;
  }
}
