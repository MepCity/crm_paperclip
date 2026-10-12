"use client";

import type { FieldDefinition } from "@crm/core/records";
import { useId, useMemo, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { MAX_SELECTED_COLUMNS } from "./constants";

export interface ManageColumnsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  moduleLabel: string;
  allFields: readonly FieldDefinition[];
  selectedColumns: readonly string[];
  onSave: (columns: string[]) => void;
}

export function ManageColumnsDialog({
  isOpen,
  onClose,
  moduleLabel,
  allFields,
  selectedColumns,
  onSave,
}: ManageColumnsDialogProps) {
  const titleId = useId();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<string[]>(() => [...selectedColumns]);

  // Synchronize when opening
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setDraft([...selectedColumns]);
      setSearch("");
    }
  }

  const filteredFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allFields;
    return allFields.filter(
      (f) => f.label.toLowerCase().includes(q) || f.apiName.toLowerCase().includes(q),
    );
  }, [allFields, search]);

  const atLimit = draft.length >= MAX_SELECTED_COLUMNS;

  function toggleField(apiName: string, isChecked: boolean) {
    if (isChecked) {
      if (draft.length < MAX_SELECTED_COLUMNS) {
        setDraft([...draft, apiName]);
      }
    } else {
      setDraft(draft.filter((col) => col !== apiName));
    }
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl outline-none">
        <AriaDialog aria-labelledby={titleId} className="flex flex-col gap-4 outline-none">
          <Heading id={titleId} className="text-lg font-semibold text-text">
            Manage Columns {moduleLabel}
          </Heading>

          <div>
            <TextField
              label="Search fields"
              hideLabel
              placeholder="Search"
              value={search}
              onChange={setSearch}
              className="w-full"
            />
          </div>

          <fieldset
            className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1 py-1"
            aria-label="Available columns"
          >
            {filteredFields.map((field) => {
              const isChecked = draft.includes(field.apiName);
              const isDisabled = !isChecked && atLimit;
              return (
                <div key={field.apiName} className="flex items-center">
                  <Checkbox
                    label={field.label}
                    isSelected={isChecked}
                    isDisabled={isDisabled}
                    onChange={(checked) => toggleField(field.apiName, checked)}
                  />
                </div>
              );
            })}
            {filteredFields.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No fields found.</p>
            )}
          </fieldset>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave}>
              Save
            </Button>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
