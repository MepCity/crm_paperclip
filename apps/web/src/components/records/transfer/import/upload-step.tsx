"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { useUiTranslations } from "@/i18n/client-provider";
import { type Charset, codeMessage, MAX_FILE_BYTES } from "./types";

const CHARSETS = [{ id: "UTF-8" }, { id: "ISO-8859-1" }];

export interface UploadStepProps {
  file: File | null;
  charset: Charset;
  error: string | null;
  sampleCsvUrl: string;
  disabled?: boolean;
  onFileChange(file: File | null): void;
  onCharsetChange(charset: Charset): void;
  onError(message: string | null): void;
}

export function UploadStep(props: UploadStepProps) {
  const { file, charset, error, sampleCsvUrl, disabled, onFileChange, onCharsetChange, onError } =
    props;
  const t = useUiTranslations();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".csv")) {
      onFileChange(null);
      onError(t("records.transfer.onlyCsv"));
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      onFileChange(null);
      onError(codeMessage("file_too_large", t) ?? null);
      return;
    }
    onError(null);
    onFileChange(candidate);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        {/* biome-ignore lint/a11y/useSemanticElements: drop zone wraps a real Browse button */}
        <div
          role="group"
          aria-label={t("records.transfer.uploadGroup")}
          data-dragging={dragging || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) accept(e.dataTransfer.files[0]);
          }}
          className={`flex flex-col items-center gap-3 rounded-md border border-dashed p-8 ${
            dragging ? "border-primary bg-surface-hover" : "border-control-border"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-3 text-sm">
              <span>{file.name}</span>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={disabled}
                aria-label={t("records.transfer.removeFile")}
                onPress={() => {
                  onFileChange(null);
                  onError(null);
                }}
              >
                {t("records.transfer.remove")}
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-muted">{t("records.transfer.dragDrop")}</p>
              <Button
                variant="secondary"
                isDisabled={disabled}
                onPress={() => input.current?.click()}
              >
                {t("records.transfer.browse")}
              </Button>
            </>
          )}
          <input
            ref={input}
            type="file"
            accept=".csv"
            hidden
            data-testid="csv-input"
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Link href={sampleCsvUrl} variant="text" download prefetch={false}>
          {t("records.transfer.sampleCsv")}
        </Link>
      </section>
      <Select
        label={t("records.transfer.charset")}
        items={CHARSETS}
        selectedKey={charset}
        isDisabled={disabled}
        onSelectionChange={(key) => onCharsetChange(String(key) as Charset)}
      >
        {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
      </Select>
      <Checkbox label={t("records.transfer.notifyEmail")} laterModule="M10" isSelected={false} />
    </div>
  );
}
