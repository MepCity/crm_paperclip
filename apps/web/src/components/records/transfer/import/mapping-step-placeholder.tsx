"use client";
import { useEffect } from "react";
import type { ImportMappingStepProps } from "./types";

/** Stand-in for `ImportMappingStep` (MEP-607) with the same props; swapped in when it merges. */
export function ImportMappingStep({ preview, onValidityChange }: ImportMappingStepProps) {
  useEffect(() => onValidityChange(true), [onValidityChange]);
  return (
    <p className="text-sm text-text-muted">
      {preview.headers.length} columns, {preview.rowCount} rows ready to map.
    </p>
  );
}
