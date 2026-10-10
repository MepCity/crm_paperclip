"use client";

import { isAppError } from "@crm/core/errors";
import type { FieldDefinition, FieldValue, ModuleMetadata, RecordData } from "@crm/core/records";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import {
  useCreateRecord,
  useModule,
  useRecord,
  useUpdateRecord,
  useUsers,
} from "@/lib/api/client/hooks";
import { CoordinatesInput, PrefixInput } from "./composite-inputs";
import { FieldGroup } from "./field-group";
import { FieldInput, type OwnerOption } from "./field-input";
import { FormErrorBanner } from "./form-error-banner";
import { FormGrid } from "./form-grid";
import {
  addressLabel,
  buildFormModel,
  type FormMode,
  type FormRules,
  formFields,
  formPayload,
  initialFormValues,
  numberValue,
  textValue,
} from "./form-model";
import { FormRow, type FormRowColumn } from "./form-row";
import { formSaveBannerMessage, formSaveFieldErrors } from "./form-save-error";
import { FormSection } from "./form-section";
import { RecordFormShell } from "./record-form-shell";

export interface OwnerPickerProps {
  users: OwnerOption[];
  selectedId: string;
  onDone: (id: string) => void;
  onCancel: () => void;
}

export interface RecordFormConfig {
  module: string;
  rules: FormRules;
  paths: { detail: (id: string) => string; create: string; cancel: string };
  navigate: (path: string) => void;
  currencyPrefix?: string;
  renderOwnerPicker?: (props: OwnerPickerProps) => ReactNode;
}

export interface RecordFormScreenProps {
  config: RecordFormConfig;
  currentUserId: string;
  recordId?: string;
}

/** Page addresses and navigation come from the route layer; this screen has no URL rules. */
export function RecordFormScreen(props: RecordFormScreenProps) {
  const metadata = useModule(props.config.module);
  const record = useRecord(props.config.module, props.recordId ?? "");
  const users = useUsers();
  const error = metadata.error ?? users.error ?? (props.recordId ? record.error : null);
  if (error) return <Alert variant="danger">Unable to load the form.</Alert>;
  if (!metadata.data || !users.data || (props.recordId && !record.data))
    return <p role="status">Loading...</p>;
  return (
    <LoadedRecordForm
      key={props.recordId ?? "create"}
      {...props}
      metadata={metadata.data}
      record={props.recordId ? record.data : undefined}
      users={users.data.map((user) => ({ id: user.userId, name: user.name, email: user.email }))}
    />
  );
}

function LoadedRecordForm({
  config,
  currentUserId,
  metadata,
  record,
  users,
}: RecordFormScreenProps & {
  metadata: ModuleMetadata;
  record?: RecordData;
  users: OwnerOption[];
}) {
  const mode: FormMode = record ? "edit" : "create";
  const sections = buildFormModel(metadata, mode);
  const fields = formFields(metadata, sections, mode, config.rules);
  const byName = new Map(fields.map((field) => [field.apiName, field]));
  const emptyValues = () => initialFormValues(fields, { [config.rules.owner]: currentUserId });
  const [baseline] = useState(() => initialFormValues(fields, record?.fields));
  const [values, setValues] = useState(() => (record ? baseline : emptyValues()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerTrigger = useRef<HTMLElement | null>(null);
  const writeInFlight = useRef(false);
  const errorFocusPending = useRef(false);
  const create = useCreateRecord(config.module);
  const update = useUpdateRecord(config.module);
  const saving = create.isPending || update.isPending;
  const title = `${record ? "Edit" : "Create"} ${metadata.singularLabel}`;

  useEffect(() => {
    if (saving || !errorFocusPending.current || Object.keys(errors).length === 0) return;
    const frame = requestAnimationFrame(() => {
      errorFocusPending.current = false;
      const rows = rootRef.current?.querySelectorAll<HTMLElement>("[data-form-field]");
      for (const row of rows ?? []) {
        const fieldName = row.dataset.formField ?? "";
        const prefixName =
          config.rules.prefix?.field === fieldName ? config.rules.prefix.prefix : undefined;
        const longitudeName =
          config.rules.address?.latitude === fieldName ? config.rules.address.longitude : undefined;
        const compositeError =
          prefixName && errors[prefixName]
            ? prefixName
            : longitudeName && errors[longitudeName]
              ? longitudeName
              : undefined;
        if (compositeError) {
          const controlId = `record-form-${compositeError}`;
          const controls = rootRef.current?.querySelectorAll<HTMLElement>("input,textarea,button");
          const control = Array.from(controls ?? []).find(
            (item) =>
              item.id === controlId ||
              item.getAttribute("aria-labelledby") === `${controlId}-label`,
          );
          control?.focus();
          break;
        }
        if (!errors[fieldName]) continue;
        row
          .querySelector<HTMLElement>(
            "input:not(:disabled),textarea:not(:disabled),button:not(:disabled)",
          )
          ?.focus();
        break;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [errors, saving, config.rules]);

  function change(name: string, value: FieldValue) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }

  function closePicker() {
    setPickerOpen(false);
    requestAnimationFrame(() => pickerTrigger.current?.focus());
  }

  async function save(andNew: boolean) {
    if (writeInFlight.current) return;
    writeInFlight.current = true;
    setErrors({});
    setBannerMessage(null);
    try {
      const input = formPayload(fields, values, record ? baseline : undefined);
      const saved = record
        ? await update.mutateAsync({ id: record.id, input })
        : await create.mutateAsync(input);
      if (andNew) {
        setValues(emptyValues());
        config.navigate(config.paths.create);
      } else config.navigate(config.paths.detail(saved.id));
    } catch (error) {
      if (isAppError(error) && error.code === "unauthenticated") return;
      const fieldMessages = formSaveFieldErrors(error);
      if (fieldMessages) {
        errorFocusPending.current = true;
        setErrors(fieldMessages);
        return;
      }
      const message = formSaveBannerMessage(error);
      if (message) setBannerMessage(message);
    } finally {
      writeInFlight.current = false;
    }
  }

  function row(field: FieldDefinition, column: FormRowColumn, parent?: FieldDefinition): ReactNode {
    const rules = config.rules;
    if (rules.omitted?.includes(field.apiName) || field.apiName === rules.prefix?.prefix)
      return null;
    const label = parent ? addressLabel(field, parent) : field.label;
    const id = `record-form-${field.apiName}`;
    if (field.dataType === "profileimage")
      return <FieldInput key={field.apiName} field={field} value={null} onChange={() => {}} />;
    if (field.apiName === rules.address?.longitude) return null;
    let input: ReactNode;
    if (field.apiName === rules.address?.latitude) {
      const address = rules.address;
      const longitude = byName.get(address.longitude);
      const coordinates = metadata.fields.find((item) => item.apiName === address.coordinates);
      input = (
        <CoordinatesInput
          hideClearAction
          id={id}
          label={coordinates && parent ? addressLabel(coordinates, parent) : "Coordinates"}
          latitudeLabel={label}
          longitudeLabel={longitude && parent ? addressLabel(longitude, parent) : "Longitude"}
          latitude={numberValue(values[field.apiName])}
          longitude={numberValue(values[address.longitude])}
          disabled={saving || field.readOnly || longitude?.readOnly}
          longitudeId={`record-form-${address.longitude}`}
          longitudeErrorMessage={errors[address.longitude]}
          errorMessage={errors[field.apiName]}
          onChange={(next) => {
            change(field.apiName, next.latitude);
            change(address.longitude, next.longitude);
          }}
        />
      );
      return (
        <div key={field.apiName} data-form-field={field.apiName}>
          <FormRow
            label={coordinates && parent ? addressLabel(coordinates, parent) : "Coordinates"}
            controlId={id}
            column={column}
          >
            {input}
          </FormRow>
        </div>
      );
    }
    const prefix =
      rules.prefix?.field === field.apiName ? byName.get(rules.prefix.prefix) : undefined;
    if (prefix) {
      input = (
        <PrefixInput
          id={id}
          hideLabel
          label={label}
          name={field.apiName}
          value={textValue(values[field.apiName])}
          isRequired={field.required}
          isDisabled={saving || field.readOnly}
          maxLength={field.maxLength}
          validationBehavior="aria"
          isInvalid={Boolean(errors[field.apiName])}
          errorMessage={errors[field.apiName]}
          onChange={(next) => change(field.apiName, next || null)}
          prefixId={`record-form-${prefix.apiName}`}
          prefixDisabled={saving || prefix.readOnly}
          prefixErrorMessage={errors[prefix.apiName]}
          prefixLabel={prefix.label}
          prefixValue={textValue(values[prefix.apiName]) || null}
          options={prefix.picklist ?? []}
          onPrefixChange={(next) => {
            if (!prefix.readOnly) change(prefix.apiName, next);
          }}
        />
      );
    } else {
      const emptyCountry = rules.country && !values[rules.country.field];
      const isState = field.apiName === rules.country?.state;
      input = (
        <FieldInput
          id={id}
          hideLabel
          field={{ ...field, label }}
          value={isState && emptyCountry ? null : (values[field.apiName] ?? null)}
          onChange={(next) => change(field.apiName, next)}
          errorMessage={errors[field.apiName]}
          disabled={saving}
          users={users}
          onOpenPicker={
            field.apiName === rules.owner && config.renderOwnerPicker
              ? () => {
                  pickerTrigger.current = document.activeElement as HTMLElement;
                  setPickerOpen(true);
                }
              : undefined
          }
          searchable={field.apiName === rules.country?.field || isState}
          options={isState && emptyCountry ? [] : undefined}
          textPrefix={rules.textPrefixes?.[field.apiName]}
          currencyPrefix={field.apiName === rules.currency ? config.currencyPrefix : undefined}
          currencyInformation={
            field.apiName === rules.currency ? "Currency information" : undefined
          }
        />
      );
    }
    return (
      <div key={field.apiName} data-form-field={field.apiName} data-form-type={field.dataType}>
        <FormRow
          label={
            rules.labelLines?.[field.apiName]
              ? rules.labelLines[field.apiName]?.map((line) => (
                  <span className="record-form-label-line" key={line}>
                    {line}
                  </span>
                ))
              : label
          }
          controlId={id}
          column={column}
        >
          {input}
        </FormRow>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <RecordFormShell
        title={title}
        formAriaLabel={title}
        actionLabels={{ cancel: "Cancel", saveAndNew: "Save and New", save: "Save" }}
        errorBanner={bannerMessage ? <FormErrorBanner>{bannerMessage}</FormErrorBanner> : null}
        disabled={saving}
        onCancel={() => config.navigate(config.paths.cancel)}
        onSave={() => {
          void save(false);
        }}
        onSaveAndNew={() => {
          void save(true);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          void save(false);
        }}
      >
        {sections.map((section) => {
          const address =
            config.rules.address &&
            section.columns.flat().find((field) => field.apiName === config.rules.address?.field);
          const columns = section.columns.map((column) =>
            column.filter((field) => byName.has(field.apiName)),
          );
          return (
            <FormSection
              key={section.label}
              title={section.label}
              layout={columns.length === 1 ? "single" : "two-column"}
            >
              {address ? (
                <FieldGroup name={address.label}>
                  {columns
                    .flat()
                    .filter((field) => field.apiName !== address.apiName)
                    .map((field) => row(field, "left", address))}
                  <button
                    type="button"
                    className="record-form-clear-address"
                    disabled={saving}
                    onClick={() => {
                      for (const field of columns.flat()) {
                        if (field.apiName !== address.apiName && !field.readOnly)
                          change(field.apiName, null);
                      }
                    }}
                  >
                    <span>Clear All</span>
                  </button>
                </FieldGroup>
              ) : columns.length === 1 ? (
                columns[0]?.map((field) => row(field, "full"))
              ) : (
                <FormGrid
                  left={columns[0]?.map((field) => row(field, "left"))}
                  right={columns[1]?.map((field) => row(field, "right"))}
                />
              )}
            </FormSection>
          );
        })}
      </RecordFormShell>
      {pickerOpen
        ? config.renderOwnerPicker?.({
            users,
            selectedId: textValue(values[config.rules.owner]),
            onCancel: closePicker,
            onDone: (id) => {
              change(config.rules.owner, id);
              closePicker();
            },
          })
        : null}
    </div>
  );
}
