"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";
import { codeMessage, type Translate } from "../import/types";
import type { ExportDialogProps, ExportRequest } from "./types";

type FieldMode = "all" | "include" | "exclude";

export const MAX_INCLUDED_FIELDS = 200;
export const MAX_EXCLUDED_FIELDS = 20;

function errorMessage(error: unknown, t: Translate): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return (
    (code === "export_too_large" || code === "field_not_allowed" ? codeMessage(code, t) : null) ??
    t("records.transfer.errors.export_generic")
  );
}

export function ExportDialog(props: ExportDialogProps) {
  const t = useUiTranslations();
  const title = t("records.transfer.exportTitle", { module: props.moduleLabel });
  return (
    <DialogTrigger isOpen={props.open} onOpenChange={props.onOpenChange}>
      <Dialog title={title} aria-label={title}>
        {({ close }) => <ExportForm {...props} close={close} />}
      </Dialog>
    </DialogTrigger>
  );
}

function ExportForm({
  module,
  moduleLabel,
  views,
  defaultViewId,
  selectedIds,
  fields,
  onExport,
  historyHref,
  onCompleted,
  close,
}: ExportDialogProps & { close: () => void }) {
  const t = useUiTranslations();
  const modeOptions = [
    { value: "all", label: t("records.transfer.fieldsAll") },
    { value: "include", label: t("records.transfer.fieldsInclude") },
    { value: "exclude", label: t("records.transfer.fieldsExclude") },
  ];
  const hasSelection = (selectedIds?.length ?? 0) > 0;
  const [viewId, setViewId] = useState(defaultViewId ?? views[0]?.id ?? "");
  const [mode, setMode] = useState<FieldMode>("all");
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const picked = mode === "include" ? included : excluded;
  const setPicked = mode === "include" ? setIncluded : setExcluded;
  const limit = mode === "include" ? MAX_INCLUDED_FIELDS : MAX_EXCLUDED_FIELDS;
  const visible = fields.filter((field) =>
    field.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const canExport = mode !== "include" || included.length > 0;

  function toggle(apiName: string, on: boolean) {
    setPicked(on ? [...picked, apiName] : picked.filter((name) => name !== apiName));
  }

  async function submit() {
    const request: ExportRequest = {
      module,
      fields:
        mode === "all" ? "all" : mode === "include" ? { include: included } : { exclude: excluded },
      ...(hasSelection ? { ids: selectedIds } : { viewId }),
    };
    setPending(true);
    setError(null);
    try {
      const job = await onExport(request);
      if (onCompleted) onCompleted(job);
      else
        toast({
          variant: "success",
          title: t("records.transfer.exportCompleted"),
          message: t("records.transfer.exportDone", { count: job.rowCount, file: job.fileName }),
          actions: [{ label: t("records.transfer.viewExportHistory"), href: historyHref }],
        });
      close();
    } catch (caught) {
      setError(errorMessage(caught, t));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-md font-normal text-text">{t("records.transfer.moduleLabel")}</span>
        <span className="text-sm text-text">{moduleLabel}</span>
      </div>
      {hasSelection ? (
        <div className="flex flex-col gap-1">
          <span className="text-md font-normal text-text">{t("records.transfer.scope")}</span>
          <span className="text-sm text-text">
            {t("records.transfer.selectedRecords", { count: selectedIds?.length ?? 0 })}
          </span>
        </div>
      ) : (
        <Select
          label={t("records.transfer.selectView")}
          items={views}
          selectedKey={viewId}
          onSelectionChange={(key) => setViewId(String(key))}
        >
          {(view) => <SelectItem id={view.id}>{view.name}</SelectItem>}
        </Select>
      )}
      <RadioGroup
        label={t("records.transfer.fields")}
        value={mode}
        onChange={(value) => {
          setMode(value as FieldMode);
          setQuery("");
        }}
        options={modeOptions}
      />
      {mode !== "all" && (
        <div className="flex flex-col gap-2">
          <TextField
            label={t("records.transfer.searchFields")}
            hideLabel
            placeholder={t("records.transfer.searchFields")}
            value={query}
            onChange={setQuery}
          />
          <span className="text-sm text-text-muted">
            {t("records.transfer.pickedCount", { count: picked.length, limit })}
          </span>
          <fieldset className="m-0 flex max-h-48 min-w-0 flex-col gap-1 overflow-auto border-0 p-0">
            <legend className="sr-only">{t("records.transfer.fields")}</legend>
            {visible.map((field) => {
              const isSelected = picked.includes(field.apiName);
              return (
                <Checkbox
                  key={field.apiName}
                  label={field.label}
                  isSelected={isSelected}
                  isDisabled={!isSelected && picked.length >= limit}
                  onChange={(on) => toggle(field.apiName, on)}
                />
              );
            })}
          </fieldset>
        </div>
      )}
      <div className="flex gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-md font-normal text-text">{t("records.transfer.format")}</span>
          <div className="flex gap-4 text-sm">
            <span>CSV</span>
            <span aria-disabled="true" className="opacity-50">
              XLSX
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-md font-normal text-text">{t("records.transfer.charset")}</span>
          <span className="text-sm text-text">UTF-8</span>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onPress={close}>
          {t("records.transfer.cancel")}
        </Button>
        <Button isDisabled={!canExport} isPending={pending} onPress={submit}>
          {t("records.transfer.exportButton")}
        </Button>
      </div>
    </div>
  );
}
