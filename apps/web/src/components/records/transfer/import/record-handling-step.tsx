"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { useUiLanguage, useUiTranslations } from "@/i18n/client-provider";
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
  const t = useUiTranslations();
  const language = useUiLanguage();
  const noun = moduleLabel.toLocaleLowerCase(language === "tr" ? "tr-TR" : "en-US");
  return (
    <div className="flex flex-col gap-6">
      <RadioGroup
        name="import-mode"
        label={t("records.transfer.handlingQuestion")}
        value={mode}
        onChange={(value) => props.onModeChange(value as ImportMode)}
        options={[
          { value: "add", label: t("records.transfer.handlingAdd", { module: noun }) },
          { value: "update", label: t("records.transfer.handlingUpdate", { module: noun }) },
          { value: "both", label: t("records.transfer.handlingBoth") },
        ]}
      />
      {mode !== "add" ? (
        <>
          <Select
            label={t("records.transfer.findBy")}
            items={preview.matchFields.map((f) => ({ id: f.field, name: f.label }))}
            selectedKey={matchField}
            onSelectionChange={(key) => props.onMatchFieldChange(String(key))}
          >
            {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
          </Select>
          <Checkbox
            label={t("records.transfer.ignoreEmpty")}
            isSelected={ignoreEmptyOnUpdate}
            onChange={props.onIgnoreEmptyChange}
          />
        </>
      ) : null}
    </div>
  );
}
