"use client";

import type { FieldDefinition, PicklistOption } from "@crm/core/records";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { NumberField } from "@/components/ui/number-field";
import { RecordChoice } from "@/components/ui/record-choice";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";
import { FieldGroup } from "./field-group";
import { picklistChoices } from "./field-input";
import { RECORD_FORM_COPY } from "./record-form-copy";

export interface PrefixInputProps extends Omit<TextFieldProps, "prefix"> {
  prefixLabel: string;
  prefixId?: string;
  prefixDisabled?: boolean;
  prefixErrorMessage?: string;
  prefixValue: string | null;
  onPrefixChange: (value: string | null) => void;
  options: readonly PicklistOption[];
}
export function PrefixInput({
  prefixLabel,
  prefixId,
  prefixDisabled,
  prefixErrorMessage,
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
            id={prefixId}
            label={prefixLabel}
            errorMessage={prefixErrorMessage}
            hideLabel
            prefix
            mutedEmpty
            value={prefixValue}
            onChange={onPrefixChange}
            options={picklistChoices(options, prefixValue)}
            disabled={prefixDisabled || props.isDisabled || props.isReadOnly}
          />
          <span className="record-prefix-divider" aria-hidden />
        </div>
      }
    />
  );
}

export function TextPrefixInput({ prefix, ...props }: TextFieldProps & { prefix: string }) {
  return (
    <TextField {...props} prefix={<span className="record-prefix pl-(--space-3)">{prefix}</span>} />
  );
}

export interface CoordinatesInputProps {
  id?: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (value: { latitude: number | null; longitude: number | null }) => void;
  disabled?: boolean;
  longitudeId?: string;
  longitudeErrorMessage?: string;
  latitudeLabel?: string;
  longitudeLabel?: string;
  clearLabel?: string;
  hideClearAction?: boolean;
  errorMessage?: string;
}
export function CoordinatesInput({
  id,
  label,
  latitude,
  longitude,
  onChange,
  disabled,
  longitudeId,
  longitudeErrorMessage,
  latitudeLabel = "Latitude",
  longitudeLabel = RECORD_FORM_COPY.longitudeFallback,
  clearLabel = RECORD_FORM_COPY.clearAll,
  hideClearAction = false,
  errorMessage,
}: CoordinatesInputProps) {
  return (
    <fieldset aria-label={label} className="record-form-coordinates flex items-start gap-2">
      <NumberField
        id={id}
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
        id={longitudeId}
        label={longitudeLabel}
        hideLabel
        placeholder={longitudeLabel}
        value={longitude ?? Number.NaN}
        isDisabled={disabled}
        isInvalid={Boolean(longitudeErrorMessage)}
        errorMessage={longitudeErrorMessage}
        validationBehavior="aria"
        formatOptions={{ useGrouping: false, maximumFractionDigits: 20 }}
        onChange={(next) => onChange({ latitude, longitude: Number.isFinite(next) ? next : null })}
      />
      {hideClearAction ? null : (
        <Button
          variant="ghost"
          isDisabled={disabled}
          onPress={() => onChange({ latitude: null, longitude: null })}
        >
          {clearLabel}
        </Button>
      )}
    </fieldset>
  );
}

export interface AddressFieldGroupModel {
  parent: FieldDefinition;
  subfieldApiNames: readonly string[];
}

export interface CopyAddressGroup {
  id: string;
  label: string;
  subfieldApiNames: readonly string[];
}

export interface CopyAddressMenuProps {
  groups: readonly CopyAddressGroup[];
  disabled?: boolean;
  onCopy: (fromId: string, toId: string) => void;
}

export function CopyAddressMenu({ groups, disabled, onCopy }: CopyAddressMenuProps) {
  const t = useUiTranslations();
  if (groups.length !== 2) return null;
  const items = groups.flatMap((from) =>
    groups
      .filter((to) => to.id !== from.id)
      .map((to) => ({
        id: `${from.id}->${to.id}`,
        label: `${from.label} → ${to.label}`,
        fromId: from.id,
        toId: to.id,
      })),
  );
  return (
    <MenuTrigger>
      <Button variant="recordSecondary" size="record" isDisabled={disabled}>
        {t("records.actions.copyAddress")}
      </Button>
      <Menu
        aria-label={t("records.actions.copyAddress")}
        onAction={(key) => {
          const item = items.find((entry) => entry.id === String(key));
          if (item) onCopy(item.fromId, item.toId);
        }}
      >
        {items.map((item) => (
          <MenuItem key={item.id} id={item.id}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}

export interface AddressFieldGroupsProps {
  groups: readonly AddressFieldGroupModel[];
  disabled?: boolean;
  clearLabel?: string;
  renderGroupFields: (parent: FieldDefinition) => ReactNode;
  onClearGroup: (subfieldApiNames: readonly string[]) => void;
}

export function AddressFieldGroups({
  groups,
  disabled,
  clearLabel = RECORD_FORM_COPY.clearAll,
  renderGroupFields,
  onClearGroup,
}: AddressFieldGroupsProps) {
  const dual = groups.length > 1;
  return (
    <div
      className={dual ? "record-form-address-groups record-form-address-groups--dual" : undefined}
      data-record-form-address-groups={dual ? "dual" : "single"}
    >
      {groups.map((group) => (
        <FieldGroup key={group.parent.apiName} name={group.parent.label}>
          {renderGroupFields(group.parent)}
          <button
            type="button"
            className="record-form-clear-address"
            disabled={disabled}
            onClick={() => onClearGroup(group.subfieldApiNames)}
          >
            <span>{clearLabel}</span>
          </button>
        </FieldGroup>
      ))}
    </div>
  );
}
