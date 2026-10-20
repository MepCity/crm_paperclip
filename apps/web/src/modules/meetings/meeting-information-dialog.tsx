"use client";

import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { FieldInput } from "@/components/records/form/field-input";
import {
  buildFormModel,
  formPayload,
  initialFormValues,
} from "@/components/records/form/form-model";
import { FormRow } from "@/components/records/form/form-row";
import {
  formSaveBannerMessage,
  formSaveFieldErrors,
} from "@/components/records/form/form-save-error";
import { validateRanges, validateRecordForm } from "@/components/records/form/form-validation";
import { Button } from "@/components/ui/button";
import { useCreateRecord, useModule, useUsers } from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";
import {
  allDayClearedTime,
  dateTimePartsToIso,
  isoToDateTimeParts,
} from "@/lib/records/datetime-parts";
import { buildMeetingsFormDefaults, meetingsFormRules } from "./meetings-form-rules";

/** MF-01 – MF-11 in the reference order. */
export const MEETING_INFORMATION_FIELDS = [
  "Event_Title",
  "Meeting_Venue__s",
  "Venue",
  "All_day",
  "Start_DateTime",
  "End_DateTime",
  "Owner",
  "Participants",
] as const;

const MODULE = "Events";
const TAB = "Meetings";

export interface MeetingInformationDialogProps {
  orgSlug: string;
  currentUserId: string;
  onClose: () => void;
  /** Test seam: the clock used for the From default. */
  now?: Date;
}

/**
 * Meeting Information window (MF-01 – MF-15). Provisional rules: From/To default to the next full
 * hour and one hour later, Save opens the record, Add more details carries the values into the full
 * form, Cancel creates nothing.
 */
export function MeetingInformationDialog({
  orgSlug,
  currentUserId,
  onClose,
  now,
}: MeetingInformationDialogProps) {
  const router = useRouter();
  const metadata = useModule(MODULE);
  const users = useUsers();
  const create = useCreateRecord(MODULE);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => ({
    Owner: currentUserId,
    ...buildMeetingsFormDefaults(undefined, now),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(false);
  const windowFields = useMemo(() => {
    const byName = new Map((metadata.data?.fields ?? []).map((f) => [f.apiName, f]));
    return MEETING_INFORMATION_FIELDS.flatMap((name) => {
      const field = byName.get(name);
      return field ? [field] : [];
    });
  }, [metadata.data]);
  // Add more details: the rest of the full create form, in layout order, inside this same window.
  const extraFields = useMemo(() => {
    if (!metadata.data) return [];
    const shown = new Set<string>(MEETING_INFORMATION_FIELDS);
    const omitted = new Set<string>(meetingsFormRules.omitted ?? []);
    return buildFormModel(metadata.data, "create", meetingsFormRules)
      .flatMap((section) => section.columns.flat())
      .filter((f) => !shown.has(f.apiName) && !omitted.has(f.apiName));
  }, [metadata.data]);
  const fields = useMemo(
    () => (expanded ? [...windowFields, ...extraFields] : windowFields),
    [expanded, windowFields, extraFields],
  );

  function change(name: string, value: FieldValue) {
    const writes: Record<string, FieldValue> = { [name]: value };
    if (name === "All_day") {
      const dayOnly = value === true;
      (["Start_DateTime", "End_DateTime"] as const).forEach((apiName, index) => {
        const current = values[apiName];
        if (typeof current !== "string") return;
        const parts = isoToDateTimeParts(current, !dayOnly);
        const time = dayOnly ? "" : allDayClearedTime(index === 0 ? 0 : 1);
        writes[apiName] = dateTimePartsToIso({ date: parts.date, time }, dayOnly);
      });
    }
    setValues((previous) => ({ ...previous, ...writes }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(writes)) delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const label = (field: FieldDefinition) => field.label;
    const messages = validateRecordForm(fields, values, label);
    const checked = validateRanges(
      meetingsFormRules.ranges,
      values,
      messages,
      (apiName) => fields.find((f) => f.apiName === apiName)?.label ?? apiName,
    );
    setErrors(checked);
    return Object.keys(checked).length === 0;
  }

  async function save() {
    if (create.isPending || !validate()) return;
    setBanner(null);
    try {
      const saved = await create.mutateAsync({
        ...formPayload(fields, initialFormValues(fields, values)),
      });
      onClose();
      router.push(moduleRecordPath(orgSlug, TAB, saved.id));
    } catch (error) {
      const fieldMessages = formSaveFieldErrors(error);
      if (fieldMessages) setErrors(fieldMessages);
      else setBanner(formSaveBannerMessage(error));
    }
  }

  const bodyRef = useRef<HTMLDivElement>(null);
  function addMoreDetails() {
    setExpanded(true);
    requestAnimationFrame(() => {
      const first = bodyRef.current?.querySelector<HTMLElement>("[data-more-details-start]");
      first?.scrollIntoView({ block: "start" });
    });
  }

  const ready = Boolean(metadata.data && users.data);
  const formRef = useRef<HTMLFormElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (!ready || focused.current) return;
    focused.current = true;
    const title = formRef.current?.querySelector<HTMLInputElement>(
      `#meeting-information-${MEETING_INFORMATION_FIELDS[0]}`,
    );
    title?.focus();
    title?.select();
  }, [ready]);
  const ownerOptions = (users.data ?? []).map((u) => ({
    id: u.userId,
    name: u.name,
    email: u.email,
  }));
  const dayOnly = values.All_day === true;

  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/50 p-4 pt-[var(--size-meeting-window-top,48px)]"
    >
      <Modal className="flex max-h-[calc(100vh-96px)] w-full max-w-[var(--size-meeting-window-width)] flex-col rounded-lg bg-surface shadow-lg outline-none">
        <AriaDialog
          aria-label="Meeting Information"
          className="flex min-h-0 flex-col outline-none"
          data-meeting-information-dialog
        >
          <Heading slot="title" className="meeting-window__title">
            Meeting Information
          </Heading>
          <form
            ref={formRef}
            className="meeting-window__form flex min-h-0 flex-col"
            data-form-variant="activity"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div ref={bodyRef} className="meeting-window__body min-h-0 flex-1 overflow-y-auto">
              {banner ? <p role="alert">{banner}</p> : null}
              {ready ? (
                fields.map((field) => (
                  <div
                    key={field.apiName}
                    data-form-field={field.apiName}
                    data-more-details-start={
                      expanded && field.apiName === extraFields[0]?.apiName ? "" : undefined
                    }
                  >
                    <FormRow
                      label={field.label}
                      controlId={`meeting-information-${field.apiName}`}
                      column="full"
                      required={field.required}
                    >
                      <FieldInput
                        id={`meeting-information-${field.apiName}`}
                        hideLabel
                        variant="activity"
                        field={field}
                        value={values[field.apiName] ?? null}
                        onChange={(next) => change(field.apiName, next)}
                        errorMessage={errors[field.apiName]}
                        disabled={create.isPending}
                        users={ownerOptions}
                        dateOnly={
                          dayOnly &&
                          (field.apiName === "Start_DateTime" || field.apiName === "End_DateTime")
                        }
                        participantModules={meetingsFormRules.participantModules?.[field.apiName]}
                      />
                    </FormRow>
                  </div>
                ))
              ) : (
                <p role="status">Loading...</p>
              )}
            </div>
            <footer className="meeting-window__footer flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="meeting-window__more"
                onPress={addMoreDetails}
                isDisabled={!ready || expanded}
              >
                Add more details
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="md" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isDisabled={!ready || create.isPending}
                >
                  Save
                </Button>
              </div>
            </footer>
          </form>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
