"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import type { ImportMode, ImportPreview } from "./types";

export interface RecordHandlingStepProps {
  moduleLabel: string;
  preview: ImportPreview;
  mode: ImportMode;
  matchField: string;
  ignoreEmptyOnUpdate: boolean;
  onModeChange(mode: ImportMode): void;
  onMatchFieldChange(field: string): void;
  onIgnoreEmptyChange(value: boolean): void;
}

export function RecordHandlingStep(props: RecordHandlingStepProps) {
  const { moduleLabel, preview, mode, matchField, ignoreEmptyOnUpdate } = props;
  const noun = moduleLabel.toLowerCase();
  return (
    <div className="flex flex-col gap-6">
      <RadioGroup
        name="import-mode"
        label="How should records be handled?"
        value={mode}
        onChange={(value) => props.onModeChange(value as ImportMode)}
        options={[
          { value: "add", label: `Add as new ${noun}` },
          { value: "update", label: `Update existing ${noun} only` },
          { value: "both", label: "Both" },
        ]}
      />
      {mode !== "add" ? (
        <>
          <Select
            label="Find existing records by"
            items={preview.matchFields.map((f) => ({ id: f.field, name: f.label }))}
            selectedKey={matchField}
            onSelectionChange={(key) => props.onMatchFieldChange(String(key))}
          >
            {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
          </Select>
          <Checkbox
            label="Don't update empty values for existing records"
            isSelected={ignoreEmptyOnUpdate}
            onChange={props.onIgnoreEmptyChange}
          />
        </>
      ) : null}
    </div>
  );
}
