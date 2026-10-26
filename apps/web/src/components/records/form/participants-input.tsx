"use client";

import type { FieldValue, ModuleRecordReference } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  addParticipant,
  MEETING_PARTICIPANTS_MAX,
  participantEntries,
  participantValue,
} from "@/lib/records/meeting-participants";
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
  const t = useUiTranslations();
  const entries = participantEntries(value);
  const [pickerOpen, setPickerOpen] = useState(false);
  const full = entries.length >= MEETING_PARTICIPANTS_MAX;
  const write = (next: readonly ModuleRecordReference[]) => onChange(participantValue(next));
  return (
    <div className="record-form-participants" data-record-form-participants>
      <div className="record-form-participants__bar">
        <span id={id} className="record-form-participants__value">
          {entries.length === 0
            ? t("records.participants.none")
            : t("common.selected", { count: entries.length })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="md"
          isDisabled={disabled || full}
          aria-label={t("common.actions.add")}
          onPress={() => setPickerOpen(true)}
        >
          {t("records.participants.add")}
        </Button>
      </div>
      {entries.length > 0 ? (
        <ul
          className="record-form-participants__list"
          aria-label={t("records.participants.list", { label })}
        >
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
                aria-label={t("records.participants.removePerson", {
                  name: entry.name ?? entry.id,
                })}
                onPress={() =>
                  write(entries.filter((p) => !(p.module === entry.module && p.id === entry.id)))
                }
              >
                {t("records.participants.remove")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {pickerOpen ? (
        <SelectRecordDialog
          module={modules[0] ?? ""}
          modules={modules}
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
