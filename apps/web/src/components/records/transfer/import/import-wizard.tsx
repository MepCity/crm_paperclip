"use client";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImportSummary } from "./import-summary";
import { ImportMappingStep } from "./mapping-step";
import { RecordHandlingStep } from "./record-handling-step";
import {
  type Charset,
  errorMessage,
  type FieldMapping,
  type ImportJob,
  type ImportMode,
  type ImportPreview,
  type ImportWizardProps,
} from "./types";
import { UploadStep } from "./upload-step";

const STEPS = ["Upload File", "Record Handling", "Field Mapping"];

export function ImportWizard({
  module,
  moduleLabel,
  client,
  onCancel,
  onDone,
  historyHref,
}: ImportWizardProps) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [charset, setCharset] = useState<Charset>("UTF-8");
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<ImportMode>("add");
  const [matchField, setMatchField] = useState("");
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  const [mapping, setMapping] = useState<FieldMapping[]>([]);
  const [defaults, setDefaults] = useState<{ field: string; value: string }[]>([]);
  const [mappingValid, setMappingValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const onValidity = useCallback((valid: boolean) => setMappingValid(valid), []);

  async function next() {
    if (step === 0 && file) {
      setBusy(true);
      setFileError(null);
      try {
        const result = await client.preview(file, charset);
        setPreview(result);
        setMapping(result.suggestedMapping);
        setMatchField(
          (result.matchFields.find((m) => m.field !== "id") ?? result.matchFields[0])?.field ?? "",
        );
        setStep(1);
      } catch (error) {
        setFileError(errorMessage(error));
      } finally {
        setBusy(false);
      }
    } else if (step === 1) {
      setStep(2);
    }
  }

  async function run() {
    if (!preview) return;
    setBusy(true);
    setRunError(null);
    try {
      const result = await client.run(preview.uploadId, {
        mode,
        matchField: mode === "add" ? undefined : matchField,
        ignoreEmptyOnUpdate: mode === "add" ? false : ignoreEmpty,
        mapping,
        defaults,
      });
      setJob(result);
    } catch (error) {
      setRunError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    if (file) setConfirmOpen(true);
    else onCancel();
  }

  if (job) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-xl font-semibold text-text">Import {moduleLabel}</h1>
        <ImportSummary job={job} historyHref={historyHref} onDone={onDone} />
      </div>
    );
  }

  const last = step === 2;
  const nextDisabled = busy || (step === 0 && !file);
  return (
    <div className="flex min-h-full flex-col" data-module={module}>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-xl font-semibold text-text">Import {moduleLabel}</h1>
        <ol className="flex gap-6 text-sm" aria-label="Import steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={i === step ? "font-semibold text-text" : "text-text-muted"}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
        {step === 0 ? (
          <UploadStep
            file={file}
            charset={charset}
            error={fileError}
            sampleCsvUrl={client.sampleCsvUrl}
            disabled={busy}
            onFileChange={setFile}
            onCharsetChange={setCharset}
            onError={setFileError}
          />
        ) : null}
        {step === 1 && preview ? (
          <RecordHandlingStep
            moduleLabel={moduleLabel}
            preview={preview}
            mode={mode}
            matchField={matchField}
            ignoreEmptyOnUpdate={ignoreEmpty}
            onModeChange={setMode}
            onMatchFieldChange={setMatchField}
            onIgnoreEmptyChange={setIgnoreEmpty}
          />
        ) : null}
        {step === 2 && preview ? (
          <ImportMappingStep
            headers={preview.headers}
            sampleRows={preview.sampleRows}
            fields={preview.fields}
            mapping={mapping}
            onMappingChange={setMapping}
            defaults={defaults}
            onDefaultsChange={setDefaults}
            requireAllRequired={mode !== "update"}
            onValidityChange={onValidity}
          />
        ) : null}
        {runError ? (
          <p role="alert" className="text-sm text-danger">
            {runError}
          </p>
        ) : null}
      </div>
      <footer className="sticky bottom-0 flex items-center justify-between border-t border-border bg-surface px-6 py-3">
        <Button variant="secondary" isDisabled={busy} onPress={cancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {busy && last ? <span className="text-sm text-text-muted">Importing…</span> : null}
          {step > 0 ? (
            <Button variant="secondary" isDisabled={busy} onPress={() => setStep(step - 1)}>
              Back
            </Button>
          ) : null}
          {last ? (
            <Button isDisabled={busy || !mappingValid} onPress={run}>
              Import
            </Button>
          ) : (
            <Button isDisabled={nextDisabled} isPending={busy} onPress={next}>
              Next
            </Button>
          )}
        </div>
      </footer>
      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Discard this import?"
        message="The selected file and your choices will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          onCancel();
        }}
      />
    </div>
  );
}
