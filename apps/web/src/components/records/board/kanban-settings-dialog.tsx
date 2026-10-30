"use client";

import { ValidationError } from "@crm/core/errors";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";
import "./kanban-settings-dialog.css";

/** Matches the Kanban service input until the service contract reaches main. */
export interface KanbanViewInput {
  name: string;
  categorizeBy: string;
  aggregateBy: string | null;
  headerStyle: string;
  fields: readonly string[];
  sharedTo?: string;
}
export interface KanbanOption {
  value: string;
  label: string;
}
export interface KanbanFieldOption {
  apiName: string;
  label: string;
  required?: boolean;
}
export interface KanbanSettingsDialogProps {
  open: boolean;
  mode: "edit" | "create";
  initial: KanbanViewInput;
  categorizeOptions: readonly KanbanOption[];
  aggregateOptions: readonly KanbanOption[];
  headerStyleOptions: readonly KanbanOption[];
  fieldOptions: readonly KanbanFieldOption[];
  onSave(input: KanbanViewInput): Promise<void>;
  onCancel(): void;
}

export function KanbanSettingsDialog(props: KanbanSettingsDialogProps) {
  return props.open ? <SettingsContent {...props} /> : null;
}

function SettingsContent({
  initial,
  categorizeOptions,
  aggregateOptions,
  headerStyleOptions,
  fieldOptions,
  onSave,
  onCancel,
  mode,
}: KanbanSettingsDialogProps) {
  const t = useUiTranslations();
  const adapter = useMetadataDisplayAdapter();
  const titleId = useId();
  const [input, setInput] = useState<KanbanViewInput>(() => ({
    ...initial,
    fields: [
      ...new Set([
        ...initial.fields,
        ...fieldOptions.filter((field) => field.required).map((field) => field.apiName),
      ]),
    ],
  }));
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  function change<K extends keyof KanbanViewInput>(key: K, value: KanbanViewInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: [] }));
  }
  async function save() {
    if (saving.current) return;
    const nextErrors: Record<string, string[]> = {};
    if (!input.name.trim()) nextErrors.name = [t("records.kanban.nameRequired")];
    if (!input.categorizeBy) nextErrors.categorizeBy = [t("records.kanban.fieldRequired")];
    if (!input.headerStyle) nextErrors.headerStyle = [t("records.kanban.styleRequired")];
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;
    saving.current = true;
    setPending(true);
    try {
      await onSave({ ...input, name: input.name.trim(), fields: [...input.fields] });
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      } else {
        setMessage(t("records.kanban.saveFailed"));
      }
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  const available = fieldOptions.filter(
    (field) =>
      !input.fields.includes(field.apiName) &&
      adapter.getNamedLabel(field.label).toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selected = input.fields.flatMap((apiName) => {
    const field = fieldOptions.find((option) => option.apiName === apiName);
    return field ? [field] : [];
  });
  const selects = [
    {
      key: "categorizeBy",
      label: t("records.kanban.categorize"),
      options: categorizeOptions,
      required: true,
      info: t("records.kanban.groupInfo"),
    },
    {
      key: "aggregateBy",
      label: t("records.kanban.aggregate"),
      options: [{ value: "", label: t("records.kanban.none") }, ...aggregateOptions],
      required: false,
      info: t("records.kanban.sumInfo"),
    },
    {
      key: "headerStyle",
      label: t("records.kanban.headerStyle"),
      options: headerStyleOptions,
      required: true,
    },
  ] as const;
  return (
    <TopAlignedModal
      isOpen
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      aria-labelledby={titleId}
      panelClassName="kanban-settings-panel"
    >
      <div className="kanban-settings-content" data-mode={mode}>
        <header className="flex items-center justify-between gap-4 px-6 py-6">
          <h2 id={titleId} className="text-xl font-semibold">
            {t("records.kanban.settingsTitle")}
          </h2>
          <Link href="#" isDisabled aria-label={t("shell.help")}>
            {t("shell.help")}
          </Link>
        </header>
        <div className="kanban-settings-body">
          <div className="kanban-settings-row">
            <span className="text-right text-text-muted">{t("records.kanban.viewName")}</span>
            <TextField
              label={t("records.kanban.viewName")}
              hideLabel
              autoFocus
              isRequired
              validationBehavior="aria"
              value={input.name}
              onChange={(value) => change("name", value)}
              isDisabled={pending}
              isInvalid={Boolean(errors.name?.length)}
              errorMessage={errors.name?.join(" ")}
            />
          </div>
          {selects.map(({ key, label, options, required, ...rest }) => (
            <div key={key} className="kanban-settings-row">
              <span className="flex items-center justify-end gap-2 text-text-muted">
                {label}
                {"info" in rest && (
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t("records.kanban.information", { label })}
                    >
                      <Icons.info aria-hidden className="h-4 w-4" />
                    </Button>
                    <Tooltip>{rest.info}</Tooltip>
                  </TooltipTrigger>
                )}
              </span>
              <Select
                label={label}
                hideLabel
                items={options}
                placeholder={t("records.kanban.selectField")}
                isRequired={required}
                validationBehavior="aria"
                isDisabled={pending}
                value={key === "aggregateBy" ? (input.aggregateBy ?? "") : input[key] || null}
                onChange={(value) =>
                  change(
                    key,
                    key === "aggregateBy" ? (value ? String(value) : null) : String(value ?? ""),
                  )
                }
                isInvalid={Boolean(errors[key]?.length)}
                errorMessage={errors[key]?.join(" ")}
              >
                {(option) => (
                  <SelectItem id={option.value}>{adapter.getNamedLabel(option.label)}</SelectItem>
                )}
              </Select>
            </div>
          ))}
          {mode === "create" && (
            <div className="kanban-settings-row">
              <span className="text-right text-text-muted">{t("records.kanban.share")}</span>
              <RadioGroup
                label={t("records.kanban.share")}
                orientation="horizontal"
                value={input.sharedTo ?? "only_me"}
                onChange={(value) => change("sharedTo", value)}
                isDisabled={pending}
                options={[
                  { value: "only_me", label: t("records.kanban.onlyMe") },
                  { value: "everyone", label: t("records.kanban.everyone") },
                  // The user picker was not observed; the choice is shown but unavailable.
                  {
                    value: "selected_users",
                    label: t("records.kanban.selectedUsers"),
                    isDisabled: true,
                  },
                ]}
              />
            </div>
          )}
          <h3 className="mt-6 mb-4 font-semibold">{t("records.kanban.selectFields")}</h3>
          <div className="grid grid-cols-2 gap-6">
            <section aria-label={t("records.kanban.availableFields")}>
              <h4 className="mb-2 text-text-muted">{t("records.kanban.available")}</h4>
              <div className="kanban-settings-fields">
                <TextField
                  label={t("records.kanban.searchFields")}
                  hideLabel
                  variant="filter-search"
                  size="fill"
                  value={search}
                  onChange={setSearch}
                />
                <ul aria-label={t("records.kanban.available")} className="kanban-settings-list">
                  {available.map((field) => (
                    <li key={field.apiName}>
                      <Button
                        variant="ghost"
                        isDisabled={pending}
                        className="kanban-settings-field"
                        aria-label={t("records.kanban.add", {
                          field: adapter.getNamedLabel(field.label),
                        })}
                        onPress={() => change("fields", [...input.fields, field.apiName])}
                      >
                        {adapter.getNamedLabel(field.label)}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <section aria-label={t("records.kanban.selectedFields")}>
              <h4 className="mb-2 text-text-muted">{t("records.kanban.selected")}</h4>
              <div className="kanban-settings-fields">
                <ul aria-label={t("records.kanban.selected")} className="kanban-settings-list">
                  {selected.map((field) => (
                    <li key={field.apiName}>
                      <Button
                        variant="ghost"
                        isDisabled={pending || field.required}
                        className="kanban-settings-field"
                        aria-label={t(
                          field.required ? "records.kanban.required" : "records.kanban.remove",
                          { field: adapter.getNamedLabel(field.label) },
                        )}
                        onPress={() =>
                          change(
                            "fields",
                            input.fields.filter((apiName) => apiName !== field.apiName),
                          )
                        }
                      >
                        {adapter.getNamedLabel(field.label)}
                        {field.required && <span className="ml-1 text-danger">*</span>}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
          {errors.fields?.length ? (
            <p role="alert" className="text-danger">
              {errors.fields.join(" ")}
            </p>
          ) : null}
          {message && (
            <p role="alert" className="mt-3 text-danger">
              {message}
            </p>
          )}
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-6">
          <Button variant="secondary" onPress={onCancel}>
            {t("common.actions.cancel")}
          </Button>
          <Button isDisabled={pending} isPending={pending} onPress={save}>
            {t("common.actions.save")}
          </Button>
        </footer>
      </div>
    </TopAlignedModal>
  );
}
