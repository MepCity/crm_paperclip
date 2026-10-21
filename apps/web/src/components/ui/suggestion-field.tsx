"use client";

import "./record-input.css";
import { useContext } from "react";
import {
  ComboBox,
  ComboBoxStateContext,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import type { TextFieldProps } from "./text-field";

/** Suggestions supplement free text; choosing one never makes the field a picklist. */
export function SuggestionField({
  label,
  hideLabel,
  value,
  onChange,
  suggestions,
  errorMessage,
  maxLength,
  ...props
}: Omit<TextFieldProps, "errorMessage"> & {
  suggestions: readonly string[];
  errorMessage?: string;
}) {
  return (
    <ComboBox
      {...props}
      allowsCustomValue
      menuTrigger="focus"
      selectedKey={null}
      inputValue={value ?? ""}
      onInputChange={onChange}
      onSelectionChange={(key) => {
        if (key !== null) onChange?.(String(key));
      }}
      defaultItems={suggestions.map((label) => ({ id: label, label }))}
      className="flex flex-col gap-1"
    >
      <Label className={hideLabel ? "sr-only" : "record-label text-md"}>{label}</Label>
      <SuggestionInput maxLength={maxLength} />
      <FieldError className="record-form-validation-error">{errorMessage}</FieldError>
      <Popover
        className="record-choice-panel"
        style={{ width: "var(--trigger-width)" }}
        placement="bottom start"
      >
        <ListBox className="record-choice-list">
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label} className="record-choice-row">
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

function SuggestionInput({ maxLength }: { maxLength?: number }) {
  const state = useContext(ComboBoxStateContext);
  return (
    <Input
      className="record-control"
      maxLength={maxLength}
      onClick={() => state?.open(null, "manual")}
    />
  );
}
