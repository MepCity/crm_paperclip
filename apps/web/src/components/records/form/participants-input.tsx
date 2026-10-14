"use client";

import type { FieldValue, ModuleRecordReference } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecordChoice } from "@/components/ui/record-choice";
import {
  addParticipant,
  MEETING_PARTICIPANTS_MAX,
  participantEntries,
} from "@/lib/records/meeting-participants";
import { resolveModuleScreenByApiName } from "@/modules/registry";
import { SelectRecordDialog } from "./select-record-dialog";

export interface ParticipantsInputProps {
  id: string;
  label: string;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  modules: readonly string[];
  disabled?: boolean;
}

/**
 * Participants value + Add (MF-10, MF-11). Provisional: Add opens the existing record picker for
 * Contacts or Leads; chosen records are listed and can be removed; no invitation is sent.
 */
export function ParticipantsInput({
  id,
  label,
  value,
  onChange,
  modules,
  disabled,
}: ParticipantsInputProps) {
  const entries = participantEntries(value);
  const [module, setModule] = useState(modules[0] ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const full = entries.length >= MEETING_PARTICIPANTS_MAX;
  const write = (next: readonly ModuleRecordReference[]) =>
    onChange(next.length === 0 ? null : (next as unknown as FieldValue));
  return (
    <div className="record-form-participants" data-record-form-participants>
      <div className="record-form-participants__bar">
        <span id={id} className="record-form-participants__value">
          {entries.length === 0 ? "None" : `${entries.length} selected`}
        </span>
        {modules.length > 1 ? (
          <RecordChoice
            label={`${label} module`}
            hideLabel
            value={module}
            onChange={(next) => setModule(next ?? modules[0] ?? "")}
            options={modules.map((m) => ({
              value: m,
              label: resolveModuleScreenByApiName(m)?.pluralLabel ?? m,
            }))}
            disabled={disabled}
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="md"
          isDisabled={disabled || full}
          onPress={() => setPickerOpen(true)}
        >
          Add
        </Button>
      </div>
      {entries.length > 0 ? (
        <ul className="record-form-participants__list" aria-label={`${label} list`}>
          {entries.map((entry) => (
            <li
              key={`${entry.module}:${entry.id}`}
              className="record-form-participants__row"
              data-participant-id={entry.id}
            >
              <span>{entry.name ?? entry.id}</span>
              <Button
                type="button"
                variant="ghost"
                size="md"
                isDisabled={disabled}
                aria-label={`Remove ${entry.name ?? entry.id}`}
                onPress={() =>
                  write(entries.filter((p) => !(p.module === entry.module && p.id === entry.id)))
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {pickerOpen ? (
        <SelectRecordDialog
          module={module}
          onCancel={() => setPickerOpen(false)}
          onDone={(selected) => {
            write(addParticipant(entries, selected));
            setPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
