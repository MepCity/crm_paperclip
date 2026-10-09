"use client";

import { isAppError, ValidationError } from "@crm/core/errors";
import type { FieldDefinition, ModuleApiName, RecordId } from "@crm/core/records";
import { useEffect, useId, useRef, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { FieldInput, type OwnerOption } from "@/components/records/form/field-input";
import {
  SelectUserDialog,
  type SelectUserRecord,
} from "@/components/records/form/select-user-dialog";
import { Button } from "@/components/ui/button";
import { useChangeOwner } from "@/lib/api/client/hooks";

export interface ChangeOwnerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleApiName;
  recordIds: readonly RecordId[];
  ownerField: FieldDefinition;
  users: readonly OwnerOption[];
  onSuccess: () => void;
}

function toSelectUserRecords(users: readonly OwnerOption[]): SelectUserRecord[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

export function ChangeOwnerDialog({
  isOpen,
  onOpenChange,
  module,
  recordIds,
  ownerField,
  users,
  onSuccess,
}: ChangeOwnerDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const changeOwner = useChangeOwner(module);

  useEffect(() => {
    if (!isOpen) return;
    setOwnerId(null);
    setPickerOpen(false);
    setGeneralError(null);
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const busy = changeOwner.isPending;
  const keyboardLocked = busy;

  function close() {
    if (busy) return;
    onOpenChange(false);
  }

  async function submit() {
    if (!ownerId || busy) return;
    setGeneralError(null);
    try {
      await changeOwner.mutateAsync({ ids: recordIds, ownerId });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error instanceof ValidationError) {
        const ownerMessages = error.fieldErrors[ownerField.apiName];
        if (ownerMessages?.length) {
          setGeneralError(ownerMessages.join(" "));
          return;
        }
        const first = Object.values(error.fieldErrors).flat()[0];
        setGeneralError(first ?? error.message);
        return;
      }
      setGeneralError(
        isAppError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "Change owner failed.",
      );
    }
  }

  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        isKeyboardDismissDisabled={keyboardLocked}
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
          <AriaDialog aria-labelledby={titleId} className="outline-none" data-change-owner-dialog>
            <Heading
              slot="title"
              id={titleId}
              className="mb-(--size-confirm-dialog-title-gap) text-2xl font-bold text-text-strong"
            >
              Change Owner
            </Heading>
            <div className="mb-(--size-confirm-dialog-message-actions-gap)">
              <FieldInput
                field={ownerField}
                value={ownerId}
                onChange={(next) => setOwnerId(typeof next === "string" ? next : null)}
                users={users}
                hideLabel={false}
                disabled={busy}
                onOpenPicker={() => setPickerOpen(true)}
                pickerLabel="Open owner picker"
                searchLabel="Search Users"
              />
            </div>
            {generalError ? (
              <p className="mb-3 text-sm text-danger" role="alert">
                {generalError}
              </p>
            ) : null}
            <div className="flex justify-end gap-(--size-confirm-dialog-actions-gap)">
              <Button
                ref={cancelRef}
                variant="secondary"
                size="record"
                isDisabled={busy}
                onPress={close}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="record"
                isDisabled={!ownerId || busy}
                isPending={busy}
                onPress={() => void submit()}
              >
                Change Owner
              </Button>
            </div>
          </AriaDialog>
        </Modal>
      </ModalOverlay>
      {pickerOpen ? (
        <SelectUserDialog
          title="Select User"
          searchLabel="Search Users"
          searchPlaceholder="Search Users"
          selectedUserLabel="Selected User:"
          selectColumnLabel="Select"
          columnUserName="User Name"
          columnAvatarLabel="Avatar"
          columnRole="Role"
          columnEmail="Email"
          columnProfile="Profile"
          cancelLabel="Cancel"
          doneLabel="Done"
          users={toSelectUserRecords(users)}
          selectedId={ownerId ?? users[0]?.id ?? ""}
          onCancel={() => setPickerOpen(false)}
          onDone={(id) => {
            setOwnerId(id);
            setPickerOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
