"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
  Radio,
  RadioGroup,
} from "react-aria-components";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import "./select-user-dialog.css";

export interface SelectUserRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  profile?: string;
}

export interface SelectUserDialogProps {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  selectedUserLabel: string;
  columnUserName: string;
  columnRole: string;
  columnEmail: string;
  columnProfile: string;
  cancelLabel: string;
  doneLabel: string;
  users: SelectUserRecord[];
  selectedId: string;
  onDone: (id: string) => void;
  onCancel: () => void;
}

function matchesSearch(user: SelectUserRecord, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle);
}

export function SelectUserDialog({
  title,
  searchLabel,
  searchPlaceholder,
  selectedUserLabel,
  columnUserName,
  columnRole,
  columnEmail,
  columnProfile,
  cancelLabel,
  doneLabel,
  users,
  selectedId,
  onDone,
  onCancel,
}: SelectUserDialogProps) {
  const titleId = useId();
  const [draftId, setDraftId] = useState(selectedId);
  const [search, setSearch] = useState("");
  const previouslyFocused = useRef<HTMLElement | null>(null);
  if (previouslyFocused.current === null) {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
  }

  useEffect(() => {
    return () => {
      previouslyFocused.current?.focus();
    };
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesSearch(user, search)),
    [users, search],
  );

  const summaryUser =
    users.find((user) => user.id === draftId) ?? users.find((u) => u.id === selectedId);

  const selectionChanged = draftId !== selectedId;

  return (
    <ModalOverlay
      isOpen
      isDismissable
      className="select-user-overlay fixed inset-0 z-50 outline-none"
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Modal className="select-user-modal outline-none">
        <AriaDialog aria-labelledby={titleId} className="select-user-dialog">
          <Heading id={titleId} slot="title" className="select-user-title">
            {title}
          </Heading>

          <div className="select-user-search-row">
            <div className="select-user-search-field">
              <TextField
                variant="filter-search"
                label={searchLabel}
                placeholder={searchPlaceholder}
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="select-user-summary" aria-live="polite">
              <span className="select-user-summary-label">{selectedUserLabel}</span>
              <span className="select-user-summary-avatar" aria-hidden="true" />
              <span className="select-user-summary-name">{summaryUser?.name ?? ""}</span>
            </div>
          </div>

          <div className="select-user-table-wrap">
            <RadioGroup
              aria-label={title}
              value={draftId}
              onChange={setDraftId}
              className="select-user-table-group"
            >
              <table className="select-user-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Select</span>
                    </th>
                    <th scope="col">{columnUserName}</th>
                    <th scope="col">{columnRole}</th>
                    <th scope="col">{columnEmail}</th>
                    <th scope="col">{columnProfile}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <Radio value={user.id} aria-label={user.name} className="select-user-radio">
                          {({ isSelected }) => (
                            <span aria-hidden="true" className="select-user-radio-circle">
                              {isSelected && <span className="select-user-radio-dot" />}
                            </span>
                          )}
                        </Radio>
                      </td>
                      <td>{user.name}</td>
                      <td>{user.role ?? ""}</td>
                      <td>{user.email}</td>
                      <td>{user.profile ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </RadioGroup>
          </div>

          <div className="select-user-footer">
            <Button variant="secondary" size="toolbar" onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button size="toolbar" isDisabled={!selectionChanged} onPress={() => onDone(draftId)}>
              {doneLabel}
            </Button>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
