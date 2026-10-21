"use client";

import { isAppError, NotFoundError } from "@crm/core/errors";
import type { FieldDefinition, FieldValue, ModuleMetadata, RecordData } from "@crm/core/records";
import { lookupTargetModules } from "@crm/core/records";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
import { RecordChoice } from "@/components/ui/record-choice";
import {
  useCreateRecord,
  useModule,
  useRecord,
  useUpdateRecord,
  useUsers,
} from "@/lib/api/client/hooks";
import { addressSubfieldApiNames } from "@/lib/records/composite-address";
import {
  allDayClearedTime,
  dateTimePartsToIso,
  isoToDateTimeParts,
} from "@/lib/records/datetime-parts";
import { buildCloneInput } from "./build-clone-input";
import {
  AddressFieldGroups,
  CoordinatesInput,
  CopyAddressMenu,
  PrefixInput,
} from "./composite-inputs";
import { DurationInput } from "./duration-input";
import { FieldInput, moduleSingularLabel, type OwnerOption } from "./field-input";
import { FormErrorBanner } from "./form-error-banner";
import { FormGrid } from "./form-grid";
import {
  type AddressFormRule,
  addressLabel,
  addressRulesList,
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
  resolveFormRules,
  stageProbabilityWrite,
  textValue,
} from "./form-model";
import { FormRow, type FormRowColumn } from "./form-row";
import { formSaveBannerMessage, formSaveFieldErrors } from "./form-save-error";
import { FormSection } from "./form-section";
import { validateRanges, validateRecordForm } from "./form-validation";
import { RECORD_FORM_COPY } from "./record-form-copy";
import {
  RecordFormClientScriptTab,
  RecordFormEditPageLayoutLink,
  RecordFormInventoryFooter,
} from "./record-form-inventory-chrome";
import { RecordFormShell } from "./record-form-shell";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

type FormIntent = "create" | "edit" | "clone";

function orderedAddressSubfieldApiNames(
  parentApiName: string,
  rule: AddressFormRule,
  sectionFieldNames: ReadonlySet<string>,
): string[] {
  const ordered =
    rule.subfields ??
    addressSubfieldApiNames(parentApiName).filter((apiName) => apiName !== rule.coordinates);
  return ordered.filter((apiName) => sectionFieldNames.has(apiName));
}

function addressParentForField(
  field: FieldDefinition,
  rules: readonly AddressFormRule[],
  parents: readonly FieldDefinition[],
): FieldDefinition | undefined {
  for (const parent of parents) {
    const rule = rules.find((item) => item.field === parent.apiName);
    if (!rule || field.apiName === parent.apiName || field.apiName === rule.coordinates) continue;
    const subfields = rule.subfields ?? addressSubfieldApiNames(parent.apiName);
    if (
      subfields.includes(field.apiName) ||
      field.apiName === rule.latitude ||
      field.apiName === rule.longitude
    ) {
      return parent;
    }
  }
  return undefined;
}

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
  variant?: "activity";
  rules: FormRules;
  paths: {
    detail: (id: string, module?: string) => string;
    record?: (module: string, id: string) => string;
    create: string;
    /** Create route of another module with prefill query parameters (follow-up actions). */
    createIn?: (module: string, params: Readonly<Record<string, string>>) => string;
    cancel: string;
  };
  navigate: (path: string) => void;
  currencyPrefix?: string;
  sectionColumnOverrides?: Readonly<Record<string, readonly (readonly string[])[]>>;
  inventoryChrome?: boolean;
  inventoryFooterEnd?: boolean;
  /** Pins the inventory footer to the bottom edge of the form view instead of below the last field. */
  inventoryFooterPinned?: boolean;
  profileImageLaterModule?: ModuleKey;
  profileImageIcon?: import("react").ComponentType<import("react").SVGProps<SVGSVGElement>>;
  renderOwnerPicker?: (props: OwnerPickerProps) => ReactNode;
  createPrefill?: Readonly<Record<string, FieldValue>>;
  /** Edit opened from a record action: values set on top of the record, and the field focused. */
  editIntent?: { set?: Readonly<Record<string, FieldValue>>; focus?: string };
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
  const formKey =
    intent !== "create"
      ? (props.cloneSourceId ?? props.recordId ?? "edit")
      : `create:${JSON.stringify(
          Object.entries(props.config.createPrefill ?? {}).sort(([a], [b]) => a.localeCompare(b)),
        )}`;

  return (
    <LoadedRecordForm
      key={formKey}
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
  const rules = useMemo(
    () => resolveFormRules(config.rules, { mode, metadata, record: sourceRecord }),
    [config.rules, mode, metadata, sourceRecord],
  );
  const formMetadata = useMemo(() => {
    const shown = rules.editShownFields;
    if (mode !== "edit" || !shown?.length) return metadata;
    return {
      ...metadata,
      fields: metadata.fields.map((field) =>
        shown.includes(field.apiName) ? { ...field, views: { ...field.views, edit: true } } : field,
      ),
    };
  }, [metadata, mode, rules.editShownFields]);
  const baseSections = useMemo(
    () =>
      applySectionColumnOverrides(
        buildFormModel(formMetadata, mode, rules, rules.readOnlyFields),
        config.sectionColumnOverrides ?? rules.fallbackColumns,
        formMetadata,
        mode,
        rules,
        rules.readOnlyFields,
      ),
    [formMetadata, mode, config.sectionColumnOverrides, rules],
  );
  const sections = useMemo(() => {
    if (!rules.requiredFields?.length) return baseSections;
    const requiredSet = new Set(rules.requiredFields);
    return baseSections.map((section) => ({
      ...section,
      columns: section.columns.map((col) =>
        col.map((field) => (requiredSet.has(field.apiName) ? { ...field, required: true } : field)),
      ),
    }));
  }, [baseSections, rules.requiredFields]);
  const fields = useMemo(() => {
    const list = formFields(formMetadata, sections, mode, rules);
    if (!rules.requiredFields?.length) return list;
    const requiredSet = new Set(rules.requiredFields);
    return list.map((field) =>
      requiredSet.has(field.apiName) ? { ...field, required: true } : field,
    );
  }, [formMetadata, sections, mode, rules]);

  const byName = new Map(fields.map((field) => [field.apiName, field]));
  const ruleDefaults =
    typeof rules.defaultValues === "function" ? rules.defaultValues(metadata) : rules.defaultValues;
  const emptyValues = () => {
    const started = initialFormValues(fields, {
      [rules.owner]: currentUserId,
      ...ruleDefaults,
      ...config.createPrefill,
    });
    const rule = rules.stageProbability;
    // A prefilled stage is a stage choice as much as a click is: its probability follows, unless
    // the caller named the probability itself.
    if (!rule || config.createPrefill?.[rule.probability] !== undefined) return started;
    const write = stageProbabilityWrite(rules, metadata, rule.stage, started[rule.stage] ?? null);
    return write ? { ...started, [write.field]: write.value } : started;
  };
  const cloneSeed =
    intent === "clone" && sourceRecord ? buildCloneInput(metadata, sourceRecord.fields) : undefined;
  const [baseline] = useState(() =>
    intent === "edit"
      ? initialFormValues(fields, sourceRecord?.fields)
      : initialFormValues(fields, cloneSeed ?? config.createPrefill),
  );
  const [values, setValues] = useState(() =>
    intent === "create" && !cloneSeed
      ? emptyValues()
      : intent === "edit" && config.editIntent?.set
        ? { ...baseline, ...config.editIntent.set }
        : baseline,
  );
  const dynamic = rules.dynamic?.(values);
  const isHidden = (apiName: string) => dynamic?.hidden?.includes(apiName) ?? false;
  const isRequired = (field: FieldDefinition) =>
    dynamic?.required?.[field.apiName] ?? field.required;
  const [lookupModules, setLookupModules] = useState<Record<string, string>>({});
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
  const ownerNames = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.name])),
    [users],
  );
  const labelsByField = useMemo(() => {
    const labels = new Map<string, string>();
    const fieldByName = new Map(fields.map((field) => [field.apiName, field]));
    const addressRules = addressRulesList(rules);
    for (const section of sections) {
      const sectionFields = section.columns.flat();
      const parents = addressRules
        .map((rule) => fieldByName.get(rule.field))
        .filter((parent): parent is FieldDefinition => {
          if (!parent) return false;
          return sectionFields.some((field) => field.apiName === parent.apiName);
        });
      for (const field of sectionFields) {
        const parent = addressParentForField(field, addressRules, parents);
        labels.set(
          field.apiName,
          rules.labelOverrides?.[field.apiName] ??
            (parent ? addressLabel(field, parent) : field.label),
        );
      }
    }
    return labels;
  }, [sections, rules, fields]);

  useEffect(() => {
    if (saving || !errorFocusPending.current || Object.keys(errors).length === 0) return;
    const frame = requestAnimationFrame(() => {
      errorFocusPending.current = false;
      const rows = rootRef.current?.querySelectorAll<HTMLElement>("[data-form-field]");
      for (const row of rows ?? []) {
        const fieldName = row.dataset.formField ?? "";
        const prefixName = rules.prefix?.field === fieldName ? rules.prefix.prefix : undefined;
        const longitudeName = addressRulesList(rules).find(
          (rule) => rule.latitude === fieldName,
        )?.longitude;
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
  }, [errors, saving, rules]);

  useEffect(() => {
    if (intent !== "create") return;
    const focusTarget = rules.initialFocus ?? rules.owner;
    if (!focusTarget) return;
    const frame = requestAnimationFrame(() => {
      const row = rootRef.current?.querySelector<HTMLElement>(`[data-form-field="${focusTarget}"]`);
      row
        ?.querySelector<HTMLElement>(
          "[data-record-form-control-slot] input:not(:disabled),[data-record-form-control-slot] button:not(:disabled),[data-record-form-control-slot] textarea:not(:disabled)",
        )
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [intent, rules.initialFocus, rules.owner]);

  /** Fields a rule owner resets to null in the same change once its own value becomes empty. */
  const dependentClears: Readonly<Record<string, readonly string[]>> = useMemo(() => {
    const map: Record<string, readonly string[]> = {};
    for (const rule of addressRulesList(rules)) {
      map[rule.country] = [rule.state];
    }
    return map;
  }, [rules]);

  function change(name: string, value: FieldValue) {
    const field = byName.get(name);
    const clears =
      field && normalizeFormValue(field, value) === null ? (dependentClears[name] ?? []) : [];
    const writes: Record<string, FieldValue> = { [name]: value };
    for (const dependent of clears) writes[dependent] = null;
    const probability = stageProbabilityWrite(rules, metadata, name, value);
    if (probability) writes[probability.field] = probability.value;
    const allDay = rules.allDay;
    if (allDay && name === allDay.flag) {
      const dayOnly = value === true;
      allDay.fields.forEach((apiName, index) => {
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

  const focusField = config.editIntent?.focus;
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus once when the form first paints
  useEffect(() => {
    if (!focusField) return;
    const frame = requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-form-field="${focusField}"] input`)
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function closePicker() {
    setPickerOpen(false);
    requestAnimationFrame(() => pickerTrigger.current?.focus());
  }

  function runClientValidation(): boolean {
    const messages = validateRecordForm(
      fields
        .filter((field) => !isHidden(field.apiName))
        .map((field) => ({ ...field, required: isRequired(field) })),
      values,
      (field) => labelsByField.get(field.apiName) ?? field.label,
    );
    const checked = validateRanges(
      rules.ranges,
      values,
      messages,
      (apiName) => labelsByField.get(apiName) ?? apiName,
    );
    if (Object.keys(checked).length === 0) return true;
    errorFocusPending.current = true;
    setErrors(checked);
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
      const payload = formPayload(
        fields.filter((field) => !isHidden(field.apiName)),
        values,
        editing ? baseline : undefined,
      );
      const input = payload;
      const saved = editing
        ? await update.mutateAsync({ id: editing.id, input })
        : await create.mutateAsync(input);
      if (andNew && rules.followUp && config.paths.createIn) {
        config.navigate(
          config.paths.createIn(rules.followUp.module, rules.followUp.params(values)),
        );
      } else if (andNew) {
        const next = emptyValues();
        setValues(next);
        setLookupModules({});
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
    const addressRules = addressRulesList(rules);
    if (
      rules.omitted?.includes(field.apiName) ||
      field.apiName === rules.prefix?.prefix ||
      isHidden(field.apiName)
    )
      return null;
    const label =
      rules.labelOverrides?.[field.apiName] ?? (parent ? addressLabel(field, parent) : field.label);
    const id = `record-form-${field.apiName}`;
    if (field.dataType === "profileimage") {
      if (!config.profileImageLaterModule) {
        return (
          <div key={field.apiName} data-form-field={field.apiName} data-form-type={field.dataType}>
            <FieldInput field={field} value={null} onChange={() => {}} />
          </div>
        );
      }
      const ModuleIcon = config.profileImageIcon;
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
            {ModuleIcon ? (
              <ModuleIcon aria-hidden className="record-form-profile-image__glyph" />
            ) : (
              <span className="record-profile">
                <Icons.recordPortraitSilhouette
                  aria-hidden
                  className="record-profile-silhouette h-full w-full"
                />
              </span>
            )}
          </Button>
        </div>
      );
    }
    if (addressRules.some((rule) => rule.longitude === field.apiName)) return null;
    const lookupTargets = lookupTargetModules(field);
    const labelLookup =
      config.variant === "activity" &&
      field.dataType === "lookup" &&
      rules.lookupLabelFields?.includes(field.apiName);
    const value = values[field.apiName];
    const referenceModule =
      typeof value === "object" && value !== null && "module" in value
        ? String(value.module)
        : undefined;
    const lookupModule = labelLookup
      ? (referenceModule ?? lookupModules[field.apiName] ?? lookupTargets[0])
      : undefined;
    let input: ReactNode;
    const latitudeRule = addressRules.find((rule) => rule.latitude === field.apiName);
    if (latitudeRule) {
      const address = latitudeRule;
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
    } else if (rules.durationFields?.includes(field.apiName)) {
      input = (
        <DurationInput
          id={id}
          field={{ ...field, label }}
          value={values[field.apiName] ?? null}
          onChange={(next) => change(field.apiName, next)}
          errorMessage={errors[field.apiName]}
          disabled={saving || field.readOnly}
        />
      );
    } else {
      const stateRule = addressRules.find((rule) => rule.state === field.apiName);
      const countryRule = addressRules.find((rule) => rule.country === field.apiName);
      const emptyCountry = stateRule && !values[stateRule.country];
      const isState = Boolean(stateRule);
      input = (
        <FieldInput
          id={id}
          hideLabel
          variant={config.variant}
          lookupModule={lookupModule}
          suppressPolymorphicPrefix={rules.suppressLookupPrefix?.includes(field.apiName)}
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
          searchable={
            Boolean(countryRule && field.apiName === countryRule.country) ||
            isState ||
            Boolean(rules.searchablePicklists?.includes(field.apiName))
          }
          options={isState && emptyCountry ? [] : undefined}
          textPrefix={rules.textPrefixes?.[field.apiName]}
          suggestions={rules.textSuggestions?.[field.apiName]}
          numberLimits={rules.numberLimits?.[field.apiName]}
          lookupPicker={rules.lookupPickers?.[field.apiName]}
          lookupRecordHref={
            field.dataType === "lookup"
              ? (id: string, targetMod?: string) => {
                  const targetModule = targetMod ?? field.lookup?.module ?? config.module;
                  if (config.paths.record) {
                    return config.paths.record(targetModule, id);
                  }
                  return config.paths.detail(id, targetModule);
                }
              : undefined
          }
          lookupOwnerNames={ownerNames}
          dateOnly={Boolean(
            rules.allDay?.fields.includes(field.apiName) && values[rules.allDay.flag] === true,
          )}
          participantModules={rules.participantModules?.[field.apiName]}
          laterModule={rules.laterModuleFields?.[field.apiName]}
          currencyPrefix={
            field.apiName === rules.currency || rules.currencies?.includes(field.apiName)
              ? config.currencyPrefix
              : undefined
          }
          currencyHelp={rules.currencyHelp?.[field.apiName]}
          currencyInformation={
            field.apiName === rules.currency || rules.currencies?.includes(field.apiName)
              ? RECORD_FORM_COPY.currencyInformation
              : undefined
          }
        />
      );
    }
    return (
      <div
        key={field.apiName}
        data-form-field={field.apiName}
        data-form-type={field.dataType}
        data-form-toggle-subdued={rules.subduedToggles?.includes(field.apiName) || undefined}
      >
        <FormRow
          labelControl={
            labelLookup ? (
              <>
                {rules.labelOverrides?.[field.apiName] ? (
                  <span className="record-form-row__label-text">{label}</span>
                ) : null}
                <RecordChoice
                  id={`${id}-module`}
                  label={`${label} module`}
                  hideLabel
                  value={lookupModule ?? null}
                  options={lookupTargets.map((module) => ({
                    value: module,
                    label: moduleSingularLabel(module),
                  }))}
                  searchable={lookupTargets.length > 2}
                  disabled={saving || field.readOnly}
                  onChange={(next) => {
                    if (!next || next === lookupModule) return;
                    setLookupModules((current) => ({ ...current, [field.apiName]: next }));
                    change(field.apiName, null);
                  }}
                />
              </>
            ) : undefined
          }
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
          required={isRequired(field)}
        >
          {input}
        </FormRow>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      {config.inventoryChrome && config.variant !== "activity" ? (
        <RecordFormClientScriptTab />
      ) : null}
      <RecordFormShell
        variant={config.variant}
        layout={
          config.variant === "activity" && config.module === "Calls"
            ? "call"
            : config.module === "Solutions"
              ? "solutions"
              : undefined
        }
        title={title}
        formAriaLabel={title}
        titleAccessory={config.inventoryChrome ? <RecordFormEditPageLayoutLink /> : undefined}
        actionLabels={{
          cancel: "Cancel",
          saveAndNew: rules.followUp?.label ?? "Save and New",
          save: "Save",
        }}
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
          if (rules.omittedSections?.includes(section.label)) return null;
          if (dynamic?.hiddenSections?.includes(section.label)) return null;
          const columns = section.columns.map((column) =>
            column.filter((field) => byName.has(field.apiName)),
          );
          const sectionFields = columns.flat();
          const sectionFieldNames = new Set(sectionFields.map((field) => field.apiName));
          const addressRules = addressRulesList(rules);
          const groupsInSection = addressRules.flatMap((rule) => {
            const parent = byName.get(rule.field);
            if (!parent || !sectionFieldNames.has(parent.apiName)) return [];
            const subfieldApiNames = orderedAddressSubfieldApiNames(
              parent.apiName,
              rule,
              sectionFieldNames,
            );
            return [{ parent, rule, subfieldApiNames }];
          });
          if (sectionFields.length === 0 && groupsInSection.length === 0) return null;
          if (groupsInSection.length > 0) {
            const copyGroups = groupsInSection.map((group) => ({
              id: group.parent.apiName,
              label: group.parent.label,
              subfieldApiNames: group.subfieldApiNames,
            }));
            return (
              <FormSection
                key={section.label}
                title={section.label}
                layout="single"
                headerEnd={
                  groupsInSection.length === 2 ? (
                    <CopyAddressMenu
                      groups={copyGroups}
                      disabled={saving}
                      onCopy={(fromId, toId) => {
                        const from = copyGroups.find((group) => group.id === fromId);
                        const to = copyGroups.find((group) => group.id === toId);
                        if (!from || !to) return;
                        const writes: Record<string, FieldValue> = {};
                        for (let index = 0; index < from.subfieldApiNames.length; index++) {
                          const source = from.subfieldApiNames[index];
                          const target = to.subfieldApiNames[index];
                          if (!source || !target) continue;
                          const targetField = byName.get(target);
                          if (targetField?.readOnly) continue;
                          writes[target] = values[source] ?? null;
                        }
                        if (Object.keys(writes).length === 0) return;
                        setValues((previous) => ({ ...previous, ...writes }));
                        setErrors((previous) => {
                          const next = { ...previous };
                          for (const key of Object.keys(writes)) delete next[key];
                          return next;
                        });
                      }}
                    />
                  ) : undefined
                }
              >
                <AddressFieldGroups
                  groups={groupsInSection.map((group) => ({
                    parent: group.parent,
                    subfieldApiNames: group.subfieldApiNames,
                  }))}
                  disabled={saving}
                  renderGroupFields={(parent) => {
                    const group = groupsInSection.find(
                      (item) => item.parent.apiName === parent.apiName,
                    );
                    if (!group) return null;
                    const fieldsByApiName = new Map(
                      sectionFields.map((field) => [field.apiName, field]),
                    );
                    return group.subfieldApiNames.map((apiName) => {
                      const field = fieldsByApiName.get(apiName);
                      return field ? row(field, "left", parent) : null;
                    });
                  }}
                  onClearGroup={(apiNames) => {
                    for (const apiName of apiNames) {
                      const field = byName.get(apiName);
                      if (field && !field.readOnly) change(apiName, null);
                    }
                  }}
                />
              </FormSection>
            );
          }
          return (
            <FormSection
              key={section.label}
              title={section.label}
              layout={columns.length === 1 ? "single" : "two-column"}
            >
              {columns.length === 1 ? (
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
        {config.inventoryChrome && config.variant !== "activity" ? (
          <RecordFormInventoryFooter
            alignEnd={config.inventoryFooterEnd}
            pinBottom={config.inventoryFooterPinned}
          />
        ) : null}
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
            selectedId: textValue(values[rules.owner]),
            onCancel: closePicker,
            onDone: (id) => {
              change(rules.owner, id);
              closePicker();
            },
          })
        : null}
    </div>
  );
}
