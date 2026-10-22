"use client";

import type { RecordData } from "@crm/core/records";
import { useId, useMemo, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { useRecordList, useUpdateRecord, useViews } from "@/lib/api/client/hooks";
import "@/components/records/detail/contact-hierarchy-modal.css";

export interface AccountDealsAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: { id: string; name: string };
}

function lookupId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = (value as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

/** Assign existing deals to this account (layout not verified against the reference). */
export function AccountDealsAssignDialog({
  isOpen,
  onClose,
  account,
}: AccountDealsAssignDialogProps) {
  const titleId = useId();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);
  const views = useViews("Deals", { enabled: isOpen });
  const viewId = views.data?.find((v) => v.isDefault)?.id ?? "all-deals";
  const list = useRecordList(
    "Deals",
    { viewId, page: 1, perPage: 100, fields: ["Deal_Name", "Account_Name"] },
    { enabled: isOpen },
  );
  const update = useUpdateRecord("Deals");
  const candidates = useMemo<RecordData[]>(
    () => (list.data?.records ?? []).filter((r) => lookupId(r.fields.Account_Name) !== account.id),
    [list.data, account.id],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const assign = async () => {
    setFailed(false);
    try {
      for (const id of selected) {
        await update.mutateAsync({
          id,
          input: { Account_Name: { id: account.id, name: account.name } },
        });
      }
      setSelected(new Set());
      onClose();
    } catch {
      setFailed(true);
    }
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="contact-hierarchy-overlay fixed inset-0 z-50 outline-none"
    >
      <Modal className="contact-hierarchy-panel outline-none">
        <AriaDialog aria-labelledby={titleId} className="outline-none">
          <Heading slot="title" id={titleId} className="pb-3 text-lg font-bold text-text-strong">
            Assign Deals
          </Heading>
          {list.isLoading ? (
            <div className="py-8 text-center text-md text-text-empty">Loading...</div>
          ) : list.isError ? (
            <div role="alert" className="py-8 text-center text-md text-text-empty">
              Unable to load deals.
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-8 text-center text-md text-text-empty">No deals available.</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto text-md">
              {candidates.map((deal) => (
                <li key={deal.id} className="py-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(deal.id)}
                      onChange={() => toggle(deal.id)}
                    />
                    <span>{String(deal.fields.Deal_Name ?? deal.id)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {failed ? (
            <p role="alert" className="pt-2 text-md text-danger">
              Could not assign the selected deals.
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button isDisabled={selected.size === 0 || update.isPending} onPress={assign}>
              Assign
            </Button>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
