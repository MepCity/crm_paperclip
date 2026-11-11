"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { enrollRecord, enrollRecords, fetchCadences } from "./api";
import type { CadenceModule, CadenceSummary } from "./types";

export interface EnrollCadenceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  module: CadenceModule;
  recordIds: readonly string[];
  onSuccess?: (result: { enrolledCount: number }) => void;
}

export function EnrollCadenceDialog({
  isOpen,
  onOpenChange,
  orgSlug,
  module,
  recordIds,
  onSuccess,
}: EnrollCadenceDialogProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const [cadences, setCadences] = useState<CadenceSummary[]>([]);
  const [selectedCadenceId, setSelectedCadenceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCadenceId("");
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchCadences(orgSlug, { module, status: "active" })
      .then((items) => {
        setCadences(items);
        if (items.length > 0 && items[0]) {
          setSelectedCadenceId(items[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load cadences");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, orgSlug, module]);

  const handleEnroll = async () => {
    if (!selectedCadenceId || busy) return;
    setBusy(true);
    setError(null);

    try {
      if (recordIds.length === 1 && recordIds[0]) {
        await enrollRecord(orgSlug, selectedCadenceId, {
          recordModule: module,
          recordId: recordIds[0],
        });
        queryClient.invalidateQueries({
          queryKey: ["record-cadences"],
        });
        onOpenChange(false);
        onSuccess?.({ enrolledCount: 1 });
      } else {
        const res = await enrollRecords(orgSlug, selectedCadenceId, {
          recordModule: module,
          recordIds: [...recordIds],
        });
        queryClient.invalidateQueries({
          queryKey: ["record-cadences"],
        });
        onOpenChange(false);
        onSuccess?.({ enrolledCount: res.enrolled.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setBusy(false);
    }
  };

  const selectedCadence = cadences.find((c) => c.id === selectedCadenceId);

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onOpenChange(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal
        className={[
          "w-(--size-dialog-width) max-w-full outline-none",
          "rounded-(--radius-create-menu) bg-surface shadow-lg",
          "pt-(--size-confirm-dialog-padding-block-start)",
          "px-(--size-confirm-dialog-padding-inline)",
          "pb-(--size-confirm-dialog-padding-block-end)",
        ].join(" ")}
      >
        <AriaDialog aria-labelledby={titleId} className="outline-none" data-enroll-cadence-dialog>
          <Heading
            slot="title"
            id={titleId}
            className="mb-(--size-confirm-dialog-title-gap) text-2xl font-bold text-text-strong"
          >
            Enroll to Cadence
          </Heading>

          <div className="mb-4 text-sm text-text-muted">
            {recordIds.length === 1
              ? `Enroll 1 ${module.slice(0, -1)} into an active cadence.`
              : `Enroll ${recordIds.length} ${module} into an active cadence.`}
          </div>

          {error && (
            <div
              className="mb-4 rounded border border-danger/30 bg-danger/10 p-2 text-sm text-danger"
              data-part="error-banner"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-sm text-text-muted">Loading cadences...</div>
          ) : cadences.length === 0 ? (
            <div className="py-6 text-center text-sm text-text-muted">
              No active cadences available for {module}.
            </div>
          ) : (
            <div className="mb-6 space-y-4">
              <div>
                <label
                  htmlFor="cadence-select"
                  className="mb-1 block text-sm font-semibold text-text"
                >
                  Select Cadence
                </label>
                <select
                  id="cadence-select"
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  value={selectedCadenceId}
                  onChange={(e) => setSelectedCadenceId(e.target.value)}
                  disabled={busy}
                >
                  {cadences.map((cad) => (
                    <option key={cad.id} value={cad.id}>
                      {cad.name} ({cad.module})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCadence && (
                <div className="rounded border border-border/50 bg-surface-muted/50 p-3 text-xs text-text-muted">
                  <div className="font-semibold text-text">{selectedCadence.name}</div>
                  {selectedCadence.description ? (
                    <div className="mt-1">{selectedCadence.description}</div>
                  ) : null}
                  <div className="mt-2 text-text-muted">
                    Active enrollments: {selectedCadence.recordCount}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="compact"
              onPress={() => onOpenChange(false)}
              isDisabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="compact"
              onPress={handleEnroll}
              isDisabled={busy || loading || cadences.length === 0 || !selectedCadenceId}
            >
              {busy ? "Enrolling..." : "Enroll"}
            </Button>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
