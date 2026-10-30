"use client";

import { ComboBox, Input, ListBox, ListBoxItem, Popover } from "react-aria-components";
import { useUtilityLabel } from "@/i18n/utility-labels";

/** Free-form tag input; catalogue selection and delimiter entry share one pending list. */
export function TagEntry({
  value,
  onChange,
  onAdd,
  suggestions,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: (value: string) => void;
  suggestions: readonly { id: string; name: string }[];
  disabled: boolean;
}) {
  const copy = useUtilityLabel();
  const matches = value.trim()
    ? suggestions.filter((tag) => tag.name.toLowerCase().includes(value.toLowerCase()))
    : [];
  return (
    <ComboBox
      aria-label={copy("Enter Tags")}
      allowsCustomValue
      inputValue={value}
      selectedKey={null}
      onInputChange={onChange}
      onSelectionChange={(key) => {
        const tag = suggestions.find((item) => item.id === key);
        if (tag) onAdd(tag.name);
      }}
      items={matches}
      isDisabled={disabled}
      className="min-w-0 flex-1"
    >
      <Input
        autoFocus
        placeholder={copy("Enter Tags")}
        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-md text-text outline-none focus:border-primary focus:ring-1 focus:ring-focus-ring"
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (
            event.key === "," ||
            (event.key === "Enter" && !event.currentTarget.getAttribute("aria-activedescendant"))
          ) {
            event.preventDefault();
            if (value.trim()) onAdd(value);
          }
        }}
      />
      <Popover className="max-h-60 overflow-auto rounded-md border border-border bg-surface shadow-lg">
        <ListBox items={matches} className="p-1 outline-none">
          {(tag) => (
            <ListBoxItem
              id={tag.id}
              textValue={tag.name}
              className="rounded px-3 py-2 text-sm outline-none data-focused:bg-surface-hover"
            >
              {tag.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
