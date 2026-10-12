"use client";

import { isAppError, NotFoundError } from "@crm/core/errors";
import type { FieldDefinition, FieldValue, ModuleMetadata, RecordData } from "@crm/core/records";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
import {
  useCreateRecord,
  useModule,
  useRecord,
  useUpdateRecord,
  useUsers,
} from "@/lib/api/client/hooks";
import { buildCloneInput } from "./build-clone-input";
import { CoordinatesInput, PrefixInput } from "./composite-inputs";
import { FieldGroup } from "./field-group";
import { FieldInput, type OwnerOption } from "./field-input";
import { FormErrorBanner } from "./form-error-banner";
import { FormGrid } from "./form-grid";
import {
  type AddressGroupRule,
  addressLabel,
  applySectionColumnOverrides,
  buildFormModel,
  type FormMode,
  type FormRules,
  formFields,
  formPayload,
  formValuesEqual,
  initialFormValues,
  normalizeFormValue,
  numberValue,
  textValue,
} from "./form-model";
import { FormRow, type FormRowColumn } from "./form-row";
import { formSaveBannerMessage, formSaveFieldErrors } from "./form-save-error";
import { FormSection } from "./form-section";
import { validateRecordForm } from "./form-validation";
import { RECORD_FORM_COPY } from "./record-form-copy";
import {
  RecordFormClientScriptTab,
  RecordFormEditPageLayoutLink,
  RecordFormInventoryFooter,
} from "./record-form-inventory-chrome";
import { RecordFormShell } from "./record-form-shell";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

type FormIntent = "create" | "edit" | "clone";

function RecordNotFound() {
  return (
    <div className="p-6 text-md text-text">
      <p>The requested page could not be found.</p>
    </div>
  );
}

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
  sectionColumnOverrides?: Readonly<Record<string, readonly (readonly string[])[]>>;
  addressGroups?: readonly AddressGroupRule[];
  addressChildFieldOrder?: readonly string[];
  inventoryChrome?: boolean;
  profileImageLaterModule?: ModuleKey;
  renderOwnerPicker?: (props: OwnerPickerProps) => ReactNode;
}

export interface RecordFormScreenProps {
  config: RecordFormConfig;
  currentUserId: string;
  recordId?: string;
  cloneSourceId?: string;
}

/** Page addresses and navigation come from the route layer; this screen has no URL rules. */
export function RecordFormScreen(props: RecordFormScreenProps) {
  const metadata = useModule(props.config.module);
  const loadId = props.cloneSourceId ?? props.recordId ?? "";
  const needsRecord = Boolean(props.cloneSourceId || props.recordId);
  const record = useRecord(props.config.module, loadId);
  const users = useUsers();
  const recordError = needsRecord ? record.error : null;
  const error = metadata.error ?? users.error ?? recordError;
  if (recordError instanceof NotFoundError) return <RecordNotFound />;
  if (error) return <Alert variant="danger">Unable to load the form.</Alert>;
  if (!metadata.data || !users.data || (needsRecord && !record.data))
    return <p role="status">Loading...</p>;
  const intent: FormIntent = props.cloneSourceId ? "clone" : props.recordId ? "edit" : "create";
  return (
    <LoadedRecordForm
      key={props.cloneSourceId ?? props.recordId ?? "create"}
      {...props}
      intent={intent}
      metadata={metadata.data}
      sourceRecord={needsRecord ? record.data : undefined}
      users={users.data.map((user) => ({ id: user.userId, name: user.name, email: user.email }))}
    />
  );
}

function LoadedRecordForm({
  config,
  currentUserId,
  intent,
  metadata,
  sourceRecord,
  users,
}: RecordFormScreenProps & {
  intent: FormIntent;
  metadata: ModuleMetadata;
  sourceRecord?: RecordData;
  users: OwnerOption[];
}) {
  const mode: FormMode = intent === "edit" ? "edit" : "create";
  const sections = applySectionColumnOverrides(
    buildFormModel(metadata, mode),
    config.sectionColumnOverrides,
    metadata,
    mode,
  );
  const fields = formFields(metadata, sections, mode, config.rules, config.addressGroups);
  const byName = new Map(fields.map((field) => [field.apiName, field]));
  const countryRules = useMemo(() => {
    const list = [...(config.rules.countries ?? [])];
    if (config.rules.country) list.unshift(config.rules.country);
    return list;
  }, [config.rules]);
  const coordinatesRuleFor = useCallback(
    (apiName: string) => {
      if (
        config.rules.address &&
        (config.rules.address.latitude === apiName || config.rules.address.longitude === apiName)
      ) {
        return config.rules.address;
      }
      return config.addressGroups?.find(
        (group) => group.latitude === apiName || group.longitude === apiName,
      );
    },
    [config.addressGroups, config.rules.address],
  );
  const countryRuleFor = (apiName: string) =>
    countryRules.find((item) => item.field === apiName || item.state === apiName);
  const emptyValues = () => initialFormValues(fields, { [config.rules.owner]: currentUserId });
  const cloneSeed =
    intent === "clone" && sourceRecord ? buildCloneInput(metadata, sourceRecord.fields) : undefined;
  const [baseline] = useState(() =>
    intent === "edit"
      ? initialFormValues(fields, sourceRecord?.fields)
      : initialFormValues(fields, cloneSeed),
  );
  const [values, setValues] = useState(() =>
    intent === "create" && !cloneSeed ? emptyValues() : baseline,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [dirtyBaseline, setDirtyBaseline] = useState(() => ({ ...values }));
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerTrigger = useRef<HTMLElement | null>(null);
  const writeInFlight = useRef(false);
  const errorFocusPending = useRef(false);
  const create = useCreateRecord(config.module);
  const update = useUpdateRecord(config.module);
  const saving = create.isPending || update.isPending;
  const editing = intent === "edit" ? sourceRecord : undefined;
  const title =
    intent === "clone"
      ? `Clone ${metadata.singularLabel}`
      : intent === "edit"
        ? `Edit ${metadata.singularLabel}`
        : `Create ${metadata.singularLabel}`;
  const labelsByField = useMemo(() => {
    const labels = new Map<string, string>();
    for (const section of sections) {
      const addressParent =
        config.rules.address &&
        section.columns.flat().find((field) => field.apiName === config.rules.address?.field);
      for (const field of section.columns.flat()) {
        labels.set(
          field.apiName,
          addressParent && field.apiName !== addressParent.apiName
            ? addressLabel(field, addressParent)
            : field.label,
        );
      }
    }
    return labels;
  }, [sections, config.rules]);

  useEffect(() => {
    if (saving || !errorFocusPending.current || Object.keys(errors).length === 0) return;
    const frame = requestAnimationFrame(() => {
      errorFocusPending.current = false;
      const rows = rootRef.current?.querySelectorAll<HTMLElement>("[data-form-field]");
      for (const row of rows ?? []) {
        const fieldName = row.dataset.formField ?? "";
        const prefixName =
          config.rules.prefix?.field === fieldName ? config.rules.prefix.prefix : undefined;
        const coordRule = coordinatesRuleFor(fieldName);
        const longitudeName = coordRule?.latitude === fieldName ? coordRule.longitude : undefined;
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
  }, [errors, saving, config.rules, coordinatesRuleFor]);

  /** Fields a rule owner resets to null in the same change once its own value becomes empty. */
  const dependentClears: Readonly<Record<string, readonly string[]>> = useMemo(
    () => Object.fromEntries(countryRules.map((item) => [item.field, [item.state] as const])),
    [countryRules],
  );

  function change(name: string, value: FieldValue) {
    const field = byName.get(name);
    const clears =
      field && normalizeFormValue(field, value) === null ? (dependentClears[name] ?? []) : [];
    const writes: Record<string, FieldValue> = { [name]: value };
    for (const dependent of clears) writes[dependent] = null;
    setValues((previous) => ({ ...previous, ...writes }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(writes)) delete next[key];
      return next;
    });
  }

  function closePicker() {
    setPickerOpen(false);
    requestAnimationFrame(() => pickerTrigger.current?.focus());
  }

  function runClientValidation(): boolean {
    const messages = validateRecordForm(
      fields,
      values,
      (field) => labelsByField.get(field.apiName) ?? field.label,
    );
    if (Object.keys(messages).length === 0) return true;
    errorFocusPending.current = true;
    setErrors(messages);
    return false;
  }

  function isDirty(): boolean {
    return !formValuesEqual(fields, values, dirtyBaseline);
  }

  function requestCancel() {
    if (!isDirty()) {
      config.navigate(config.paths.cancel);
      return;
    }
    setUnsavedOpen(true);
  }

  async function save(andNew: boolean) {
    if (writeInFlight.current) return;
    if (!runClientValidation()) return;
    writeInFlight.current = true;
    setErrors({});
    setBannerMessage(null);
    try {
      const input = formPayload(fields, values, editing ? baseline : undefined);
      const saved = editing
        ? await update.mutateAsync({ id: editing.id, input })
        : await create.mutateAsync(input);
      if (andNew) {
        const next = emptyValues();
        setValues(next);
        setDirtyBaseline({ ...next });
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
    if (config.addressGroups?.some((group) => group.coordinates === field.apiName)) return null;
    if (field.dataType === "profileimage") {
      if (!config.profileImageLaterModule) {
        return (
          <div key={field.apiName} data-form-field={field.apiName} data-form-type={field.dataType}>
            <FieldInput field={field} value={null} onChange={() => {}} />
          </div>
        );
      }
      return (
        <div key={field.apiName} data-form-field={field.apiName} data-form-type={field.dataType}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            laterModule={config.profileImageLaterModule}
            className="record-form-profile-image"
            aria-label={field.label}
          >
            <Icons.recordPortraitSilhouette
              aria-hidden
              className="record-profile-silhouette h-full w-full"
            />
          </Button>
        </div>
      );
    }
    const coordBinding = coordinatesRuleFor(field.apiName);
    if (coordBinding?.longitude === field.apiName) return null;
    let input: ReactNode;
    if (coordBinding?.latitude === field.apiName) {
      const address = coordBinding;
      const longitude = byName.get(address.longitude);
      const coordinates = metadata.fields.find((item) => item.apiName === address.coordinates);
      input = (
        <CoordinatesInput
          hideClearAction
          id={id}
          label={
            coordinates && parent
              ? addressLabel(coordinates, parent)
              : RECORD_FORM_COPY.coordinatesFallback
          }
          latitudeLabel={label}
          longitudeLabel={
            longitude && parent
              ? addressLabel(longitude, parent)
              : RECORD_FORM_COPY.longitudeFallback
          }
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
            label={
              coordinates && parent
                ? addressLabel(coordinates, parent)
                : RECORD_FORM_COPY.coordinatesFallback
            }
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
      const countryRule = countryRuleFor(field.apiName);
      const emptyCountry = countryRule && !values[countryRule.field];
      const isState = countryRule?.state === field.apiName;
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
          searchable={countryRule?.field === field.apiName || isState}
          options={isState && emptyCountry ? [] : undefined}
          textPrefix={rules.textPrefixes?.[field.apiName]}
          currencyPrefix={field.apiName === rules.currency ? config.currencyPrefix : undefined}
          currencyInformation={
            field.apiName === rules.currency ? RECORD_FORM_COPY.currencyInformation : undefined
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

  function orderAddressChildren(
    addressParent: FieldDefinition,
    columnFields: readonly FieldDefinition[],
  ): FieldDefinition[] {
    const order = config.addressChildFieldOrder;
    if (!order?.length) {
      return columnFields.filter((field) => field.apiName !== addressParent.apiName);
    }
    const prefix = addressParent.apiName.replace(/_Address$/, "_");
    const rank = (apiName: string) => {
      if (apiName === addressParent.apiName) return -1;
      const suffix = apiName.startsWith(prefix) ? apiName.slice(prefix.length) : apiName;
      const index = order.indexOf(suffix);
      return index === -1 ? order.length : index;
    };
    return [...columnFields]
      .filter((field) => field.apiName !== addressParent.apiName)
      .sort((left, right) => rank(left.apiName) - rank(right.apiName));
  }

  function renderAddressGroup(
    addressParent: FieldDefinition,
    columnFields: readonly FieldDefinition[],
  ) {
    return (
      <FieldGroup name={addressParent.label}>
        {orderAddressChildren(addressParent, columnFields).map((field) =>
          row(field, "left", addressParent),
        )}
        <button
          type="button"
          className="record-form-clear-address"
          disabled={saving}
          onClick={() => {
            for (const field of columnFields) {
              if (field.apiName !== addressParent.apiName && !field.readOnly)
                change(field.apiName, null);
            }
          }}
        >
          <span>{RECORD_FORM_COPY.clearAll}</span>
        </button>
      </FieldGroup>
    );
  }

  function copyMailingToOther() {
    const groups = config.addressGroups;
    const mailingGroup = groups?.[0];
    const otherGroup = groups?.[1];
    if (!mailingGroup || !otherGroup) return;
    const sourcePrefix = mailingGroup.field.replace(/_Address$/, "_");
    const targetPrefix = otherGroup.field.replace(/_Address$/, "_");
    const writes: Record<string, FieldValue> = {};
    for (const field of fields) {
      if (!field.apiName.startsWith(sourcePrefix) || field.readOnly) continue;
      const targetName = field.apiName.replace(sourcePrefix, targetPrefix);
      const target = byName.get(targetName);
      if (!target || target.readOnly) continue;
      writes[targetName] = values[field.apiName] ?? null;
    }
    if (Object.keys(writes).length === 0) return;
    setValues((previous) => ({ ...previous, ...writes }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(writes)) delete next[key];
      return next;
    });
  }

  const dualAddressGroups =
    config.addressGroups &&
    config.addressGroups.length >= 2 &&
    config.addressGroups.every((group) => byName.has(group.field))
      ? config.addressGroups
      : undefined;

  return (
    <div ref={rootRef}>
      {config.inventoryChrome ? <RecordFormClientScriptTab /> : null}
      <RecordFormShell
        title={title}
        formAriaLabel={title}
        titleAccessory={config.inventoryChrome ? <RecordFormEditPageLayoutLink /> : undefined}
        actionLabels={{ cancel: "Cancel", saveAndNew: "Save and New", save: "Save" }}
        errorBanner={bannerMessage ? <FormErrorBanner>{bannerMessage}</FormErrorBanner> : null}
        disabled={saving}
        onCancel={requestCancel}
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
            !dualAddressGroups &&
            config.rules.address &&
            section.columns.flat().find((field) => field.apiName === config.rules.address?.field);
          const columns = section.columns.map((column) =>
            column.filter((field) => byName.has(field.apiName)),
          );
          const mailingGroup = dualAddressGroups?.[0];
          const otherGroup = dualAddressGroups?.[1];
          const isDualAddressSection =
            mailingGroup &&
            otherGroup &&
            section.columns.some((column) =>
              column.some((field) => field.apiName === mailingGroup.field),
            ) &&
            section.columns.some((column) =>
              column.some((field) => field.apiName === otherGroup.field),
            );
          if (isDualAddressSection) {
            const leftParent = byName.get(mailingGroup.field);
            const rightParent = byName.get(otherGroup.field);
            if (!leftParent || !rightParent) return null;
            return (
              <FormSection
                key={section.label}
                title={section.label}
                layout="single"
                headerActions={
                  <button
                    type="button"
                    className="record-form-copy-address"
                    disabled={saving}
                    onClick={copyMailingToOther}
                  >
                    Copy Address
                  </button>
                }
              >
                <div className="record-form-dual-address" data-record-form-dual-address>
                  {renderAddressGroup(leftParent, columns[0] ?? [])}
                  {renderAddressGroup(rightParent, columns[1] ?? [])}
                </div>
              </FormSection>
            );
          }
          return (
            <FormSection
              key={section.label}
              title={section.label}
              layout={columns.length === 1 ? "single" : "two-column"}
            >
              {address ? (
                renderAddressGroup(address, columns.flat())
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
        {config.inventoryChrome ? <RecordFormInventoryFooter /> : null}
      </RecordFormShell>
      <UnsavedChangesDialog
        isOpen={unsavedOpen}
        onOpenChange={setUnsavedOpen}
        onLeave={() => {
          setUnsavedOpen(false);
          config.navigate(config.paths.cancel);
        }}
      />
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
