"use client";

import type { PicklistOption } from "@crm/core/records";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { RecordChoice } from "@/components/ui/record-choice";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";
import { picklistChoices } from "./field-input";

export interface PrefixInputProps extends Omit<TextFieldProps, "prefix"> {
  prefixLabel: string;
  prefixValue: string | null;
  onPrefixChange: (value: string | null) => void;
  options: readonly PicklistOption[];
}
export function PrefixInput({
  prefixLabel,
  prefixValue,
  onPrefixChange,
  options,
  ...props
}: PrefixInputProps) {
  return (
    <TextField
      {...props}
      prefix={
        <div className="record-prefix-select">
          <RecordChoice
            label={prefixLabel}
            hideLabel
            mutedEmpty
            value={prefixValue}
            onChange={onPrefixChange}
            options={picklistChoices(options, prefixValue)}
            disabled={props.isDisabled || props.isReadOnly}
          />
        </div>
      }
    />
  );
}

export function TextPrefixInput({ prefix, ...props }: TextFieldProps & { prefix: string }) {
  return <TextField {...props} prefix={prefix} />;
}

export interface CoordinatesInputProps {
  label: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (value: { latitude: number | null; longitude: number | null }) => void;
  disabled?: boolean;
  latitudeLabel?: string;
  longitudeLabel?: string;
  clearLabel?: string;
  errorMessage?: string;
}
export function CoordinatesInput({
  label,
  latitude,
  longitude,
  onChange,
  disabled,
  latitudeLabel = "Latitude",
  longitudeLabel = "Longitude",
  clearLabel = "Clear All",
  errorMessage,
}: CoordinatesInputProps) {
  return (
    <fieldset aria-label={label} className="flex items-start gap-2">
      <NumberField
        label={latitudeLabel}
        hideLabel
        placeholder={latitudeLabel}
        value={latitude ?? Number.NaN}
        isDisabled={disabled}
        isInvalid={Boolean(errorMessage)}
        errorMessage={errorMessage}
        validationBehavior="aria"
        formatOptions={{ useGrouping: false, maximumFractionDigits: 20 }}
        onChange={(next) => onChange({ latitude: Number.isFinite(next) ? next : null, longitude })}
      />
      <NumberField
        label={longitudeLabel}
        hideLabel
        placeholder={longitudeLabel}
        value={longitude ?? Number.NaN}
        isDisabled={disabled}
        isInvalid={Boolean(errorMessage)}
        errorMessage={errorMessage}
        validationBehavior="aria"
        formatOptions={{ useGrouping: false, maximumFractionDigits: 20 }}
        onChange={(next) => onChange({ latitude, longitude: Number.isFinite(next) ? next : null })}
      />
      <Button
        variant="ghost"
        isDisabled={disabled}
        onPress={() => onChange({ latitude: null, longitude: null })}
      >
        {clearLabel}
      </Button>
    </fieldset>
  );
}
