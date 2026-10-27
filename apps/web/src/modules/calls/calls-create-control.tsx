"use client";

import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { FieldInput } from "@/components/records/form/field-input";
import { formPayload } from "@/components/records/form/form-model";
import { FormRow } from "@/components/records/form/form-row";
import { validateRecordForm } from "@/components/records/form/form-validation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";
import { useCreateRecord, useModule, useUsers } from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";
import { nextFullHour } from "@/lib/records/datetime-parts";
import { buildCallsFormDefaults, CALLS_FORM_FALLBACK_COLUMNS } from "./calls-form-rules";

export function renderCallsCreateControl(props: {
  orgSlug: string;
  currentUserId: string;
  items?: readonly MenuAction[];
}) {
  return <CallsCreateControl {...props} />;
}

export function CallsCreateControl(props: {
  orgSlug: string;
  currentUserId: string;
  items?: readonly MenuAction[];
}) {
  const t = useUiTranslations();
  const [mode, setMode] = useState<"schedule" | "log" | null>(null);
  return (
    <>
      <div className="inline-flex shrink-0 items-center" data-split-button>
        <MenuTrigger>
          <Button
            size="splitPrimary"
            className={props.items?.length ? "rounded-r-none" : undefined}
          >
            {t("records.actions.create", { module: t("metadata.modules.Calls.singular") })}
          </Button>
          <Menu>
            <MenuItem id="schedule" onAction={() => setMode("schedule")}>
              {t("records.calls.schedule")}
            </MenuItem>
            <MenuItem id="log" onAction={() => setMode("log")}>
              {t("records.calls.log")}
            </MenuItem>
          </Menu>
        </MenuTrigger>
        {props.items?.length ? (
          <MenuTrigger>
            <Button
              size="splitArrow"
              className="rounded-l-none"
              aria-label={t("records.chrome.more")}
            >
              <Icons.chevronDown aria-hidden className="size-4" />
            </Button>
            <Menu
              width="create"
              items={props.items}
              onAction={(id) =>
                props.items?.find((item) => item.id === id && !item.laterModule)?.onAction()
              }
            >
              {(item) => (
                <MenuItem id={item.id} isDisabled={item.isDisabled} laterModule={item.laterModule}>
                  {item.label}
                </MenuItem>
              )}
            </Menu>
          </MenuTrigger>
        ) : null}
      </div>
      {mode ? <CallCreateDialog {...props} mode={mode} onClose={() => setMode(null)} /> : null}
    </>
  );
}

function CallCreateDialog({
  orgSlug,
  currentUserId,
  mode,
  onClose,
}: {
  orgSlug: string;
  currentUserId: string;
  mode: "schedule" | "log";
  onClose: () => void;
}) {
  const t = useUiTranslations();
  const adapter = useMetadataDisplayAdapter();
  const router = useRouter();
  const metadata = useModule("Calls");
  const users = useUsers();
  const create = useCreateRecord("Calls");
  const scheduled = mode === "schedule";
  const autoSubject = t("records.calls.defaultSubject", {
    person: t("records.calls.unknownPerson"),
  });
  const [values, setValues] = useState<Record<string, FieldValue>>(() => ({
    ...buildCallsFormDefaults(),
    Owner: currentUserId,
    Call_Start_Time: nextFullHour().toISOString(),
    Subject: autoSubject,
    ...(scheduled ? {} : { Outgoing_Call_Status: "Completed" }),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const sections = Object.entries(CALLS_FORM_FALLBACK_COLUMNS)
    .filter(([title]) => (scheduled ? title !== "Outcome Of Outgoing Call" : true))
    .map(([title, columns]) => ({
      title,
      fields: columns.flat().flatMap((name) => {
        if ((scheduled && name === "Call_Duration") || (!scheduled && name === "Reminder"))
          return [];
        const field = metadata.data?.fields.find((candidate) => candidate.apiName === name);
        return field ? [field] : [];
      }),
    }));
  const fields = sections.flatMap((section) => section.fields);
  const ownerOptions = (users.data ?? []).map((user) => ({
    id: user.userId,
    name: user.name,
    email: user.email,
  }));
  const ready = Boolean(metadata.data && users.data);
  function label(field: FieldDefinition) {
    return field.apiName === "Who_Id"
      ? t("metadata.fields.Call_For")
      : adapter.getFieldLabel("Calls", field);
  }
  async function save() {
    if (!ready || create.isPending) return;
    const requiredFields = fields.map((field) => ({
      ...field,
      required:
        field.required ||
        field.apiName === "Who_Id" ||
        field.apiName === "Call_Start_Time" ||
        (!scheduled && field.apiName === "Call_Duration"),
    }));
    const messages = validateRecordForm(requiredFields, values, label);
    setErrors(messages);
    if (Object.keys(messages).length) return;
    setError(null);
    try {
      const record = await create.mutateAsync(formPayload(fields, values));
      onClose();
      router.push(moduleRecordPath(orgSlug, "Calls", record.id));
    } catch {
      setError(t("common.error"));
    }
  }
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open && !create.isPending) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/50 px-4"
    >
      <Modal className="flex max-h-[calc(100dvh-32px)] w-full max-w-[660px] flex-col rounded-b-lg bg-surface p-7 shadow-lg outline-none">
        <Dialog
          aria-label={t(scheduled ? "records.calls.schedule" : "records.calls.log")}
          className="flex min-h-0 flex-col outline-none"
        >
          <Heading slot="title" className="mb-5 text-2xl font-bold">
            {t(scheduled ? "records.calls.schedule" : "records.calls.log")}
          </Heading>
          <form
            noValidate
            data-form-variant="activity"
            className="flex min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="min-h-0 overflow-y-auto">
              {error ? <p role="alert">{error}</p> : null}
              {!ready ? (
                <p role="status">{t("common.loading")}</p>
              ) : (
                sections.map((section) => (
                  <section key={section.title} className="mb-7">
                    <h3 className="mb-5 text-lg font-semibold">
                      {adapter.getLayoutSectionLabel("Calls", section.title)}
                    </h3>
                    {section.fields.map((field) => (
                      <div key={field.apiName} data-form-field={field.apiName} className="mb-4">
                        <FormRow
                          label={label(field)}
                          controlId={`call-create-${field.apiName}`}
                          column="full"
                          required={field.required || field.apiName === "Who_Id"}
                        >
                          <FieldInput
                            id={`call-create-${field.apiName}`}
                            hideLabel
                            variant="activity"
                            field={{ ...adapter.adaptField("Calls", field), label: label(field) }}
                            value={values[field.apiName] ?? null}
                            users={ownerOptions}
                            disabled={
                              create.isPending ||
                              (scheduled &&
                                ["Call_Type", "Outgoing_Call_Status"].includes(field.apiName))
                            }
                            errorMessage={errors[field.apiName]}
                            onChange={(value) => {
                              setValues((previous) => ({ ...previous, [field.apiName]: value }));
                              setErrors((previous) => {
                                const next = { ...previous };
                                delete next[field.apiName];
                                return next;
                              });
                            }}
                          />
                        </FormRow>
                      </div>
                    ))}
                  </section>
                ))
              )}
            </div>
            <footer className="flex shrink-0 justify-end gap-2 border-t border-border pt-5">
              <Button variant="secondary" onPress={onClose} isDisabled={create.isPending}>
                {t("common.actions.cancel")}
              </Button>
              <Button type="submit" isDisabled={!ready || create.isPending}>
                {t(scheduled ? "records.calls.scheduleAction" : "common.actions.save")}
              </Button>
            </footer>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
