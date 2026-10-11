import type {
  FieldDefinition,
  FieldValue,
  ModuleRecordReference,
  PicklistOption,
  RecordService,
} from "@crm/core/records";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { laterModuleProps, useLaterModule } from "@/components/ui/later-module";
import { NumberField } from "@/components/ui/number-field";
import { RecordChoice } from "@/components/ui/record-choice";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import type { ClientRecordService } from "@/lib/api/client/provider";
import { isModuleRegistered, resolveModuleLaterKey } from "@/modules/registry";
import { SelectRecordDialog } from "./select-record-dialog";

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
  id?: string;
  hideLabel?: boolean;
  inline?: boolean;
  recordService?: RecordService | ClientRecordService;
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
  id,
  hideLabel,
  inline,
  recordService,
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
  const targetModule = field.lookup?.module ?? "";
  const isTargetRegistered = isLookup && isModuleRegistered(targetModule);
  const targetLaterModule =
    isLookup && !isTargetRegistered ? resolveModuleLaterKey(targetModule) : undefined;
  const lookupButtonRef = useLaterModule<HTMLButtonElement>(targetLaterModule);
  const [lookupOpen, setLookupOpen] = useState(false);
  const reference =
    isLookup && typeof value === "object" && value !== null && "id" in value
      ? (value as ModuleRecordReference)
      : undefined;

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
          prefix={
            textPrefix ? (
              <span className="record-prefix pl-(--space-3)">{textPrefix}</span>
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
    case "integer":
    case "double":
    case "currency":
      return (
        <NumberField
          {...common}
          value={number}
          placeholder={placeholder}
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
            field.dataType === "currency" && currencyInformation ? (
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
            onChange={(next) => {
              if (next === "") {
                onChange(null);
              } else if (reference) {
                onChange({ ...reference, name: next });
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
                <Icons.recordLookup
                  module={targetModule}
                  className="record-input-end-icon"
                  aria-hidden
                />
              </button>
            }
          />
          {lookupOpen && isTargetRegistered && (
            <SelectRecordDialog
              module={targetModule}
              selectedId={reference?.id}
              recordService={recordService}
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
    case "multi_module_lookup":
    case "date":
    case "datetime":
    case "bigint":
      return null;
  }
}
