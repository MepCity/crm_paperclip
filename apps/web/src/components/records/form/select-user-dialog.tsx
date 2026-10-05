"use client";

import { type CSSProperties, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableRadio, TableRadioGroup } from "@/components/ui/table-radio";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { UserAvatarPlaceholder } from "@/components/ui/user-avatar-placeholder";
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
  selectColumnLabel: string;
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
  selectColumnLabel,
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

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesSearch(user, search)),
    [users, search],
  );

  const summaryUser =
    users.find((user) => user.id === draftId) ?? users.find((user) => user.id === selectedId);

  const selectionChanged = draftId !== selectedId;
  const rowCount = filteredUsers.length;

  const panelStyle = {
    "--select-user-row-count": String(rowCount),
  } as CSSProperties;

  return (
    <TopAlignedModal
      isOpen
      isDismissable={false}
      aria-labelledby={titleId}
      panelClassName="select-user-modal-panel"
      panelStyle={panelStyle}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <h2 id={titleId} className="select-user-title">
        {title}
      </h2>

      <div className="select-user-search-row">
        <div className="select-user-search-field">
          <TextField
            variant="filter-search"
            label={searchLabel}
            placeholder={searchPlaceholder}
            value={search}
            onChange={setSearch}
            autoFocus
          />
        </div>
        <div className="select-user-summary" aria-live="polite">
          <span className="select-user-summary-label">{selectedUserLabel}</span>
          <span className="select-user-summary-name-wrap">
            <UserAvatarPlaceholder />
            <span className="select-user-summary-name">{summaryUser?.name ?? ""}</span>
          </span>
        </div>
      </div>

      <div className="select-user-table-wrap">
        <div className="select-user-table-frame">
          <TableRadioGroup
            aria-label={title}
            value={draftId}
            onChange={setDraftId}
            className="select-user-table-group"
          >
            <table className="select-user-table">
              <colgroup>
                <col className="select-user-col-radio" />
                <col className="select-user-col-avatar" />
                <col className="select-user-col-name" />
                <col className="select-user-col-role" />
                <col className="select-user-col-email" />
                <col className="select-user-col-profile" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="select-user-th-radio">
                    <span className="sr-only">{selectColumnLabel}</span>
                  </th>
                  <th scope="col" colSpan={2} className="select-user-th-name">
                    {columnUserName}
                  </th>
                  <th scope="col">{columnRole}</th>
                  <th scope="col">{columnEmail}</th>
                  <th scope="col">{columnProfile}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="select-user-td-radio">
                      <TableRadio value={user.id} aria-label={user.name} />
                    </td>
                    <td className="select-user-td-avatar">
                      <UserAvatarPlaceholder />
                    </td>
                    <td className="select-user-td-name">{user.name}</td>
                    <td className="select-user-td-role">{user.role ?? ""}</td>
                    <td className="select-user-td-email">{user.email}</td>
                    <td className="select-user-td-profile">{user.profile ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRadioGroup>
        </div>
      </div>

      <div className="select-user-footer">
        <Button variant="secondary" size="toolbar" onPress={onCancel}>
          {cancelLabel}
        </Button>
        <Button size="toolbar" isDisabled={!selectionChanged} onPress={() => onDone(draftId)}>
          {doneLabel}
        </Button>
      </div>
    </TopAlignedModal>
  );
}
