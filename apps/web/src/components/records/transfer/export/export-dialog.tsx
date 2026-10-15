"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import type { ExportDialogProps, ExportRequest } from "./types";

type FieldMode = "all" | "include" | "exclude";

export const MAX_INCLUDED_FIELDS = 200;
export const MAX_EXCLUDED_FIELDS = 20;

const ERROR_MESSAGES: Record<string, string> = {
  export_too_large: "Too many records to export (limit 30,000). Narrow the view.",
  field_not_allowed: "One or more selected fields are not available for export.",
};
const GENERIC_ERROR = "The export could not be completed. Try again.";

function errorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return ERROR_MESSAGES[code] ?? GENERIC_ERROR;
}

const MODE_OPTIONS = [
  { value: "all", label: "All fields" },
  { value: "include", label: "Choose fields" },
  { value: "exclude", label: "Exclude fields" },
];

export function ExportDialog(props: ExportDialogProps) {
  return (
    <DialogTrigger isOpen={props.open} onOpenChange={props.onOpenChange}>
      <Dialog title={`Export ${props.moduleLabel}`} aria-label={`Export ${props.moduleLabel}`}>
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
  const hasSelection = (selectedIds?.length ?? 0) > 0;
  const [viewId, setViewId] = useState(defaultViewId ?? views[0]?.id ?? "");
  const [mode, setMode] = useState<FieldMode>("all");
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, []);

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
          title: "Export completed",
          message: `${job.rowCount} records exported to ${job.fileName}. Open ${historyHref} to download it again.`,
        });
      close();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-md font-normal text-text">Module</span>
        <span className="text-sm text-text">{moduleLabel}</span>
      </div>
      {hasSelection ? (
        <div className="flex flex-col gap-1">
          <span className="text-md font-normal text-text">Scope</span>
          <span className="text-sm text-text">{`Selected records (${selectedIds?.length})`}</span>
        </div>
      ) : (
        <Select
          label="Select view"
          items={views}
          selectedKey={viewId}
          onSelectionChange={(key) => setViewId(String(key))}
        >
          {(view) => <SelectItem id={view.id}>{view.name}</SelectItem>}
        </Select>
      )}
      <RadioGroup
        label="Fields"
        value={mode}
        onChange={(value) => {
          setMode(value as FieldMode);
          setQuery("");
        }}
        options={MODE_OPTIONS}
      />
      {mode !== "all" && (
        <div className="flex flex-col gap-2">
          <TextField
            label="Search fields"
            hideLabel
            placeholder="Search fields"
            value={query}
            onChange={setQuery}
          />
          <span className="text-sm text-text-muted">{`${picked.length} of ${limit}`}</span>
          <fieldset className="m-0 flex max-h-48 min-w-0 flex-col gap-1 overflow-auto border-0 p-0">
            <legend className="sr-only">Fields</legend>
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
          <span className="text-md font-normal text-text">Format</span>
          <div className="flex gap-4 text-sm">
            <span>CSV</span>
            <span aria-disabled="true" className="opacity-50">
              XLSX
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-md font-normal text-text">Character encoding</span>
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
          Cancel
        </Button>
        <Button isDisabled={!canExport} isPending={pending} onPress={submit}>
          Export
        </Button>
      </div>
    </div>
  );
}
