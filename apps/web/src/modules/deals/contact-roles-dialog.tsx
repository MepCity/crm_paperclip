"use client";

import type { ModuleRecordReference, RecordData } from "@crm/core/records";
import { useId, useState } from "react";
import { Heading } from "react-aria-components";
import { contactRolesOfDeal } from "@/components/records/detail/contact-roles-card-body";
import { RelatedListCard } from "@/components/records/detail/related-list-card";
import { Button } from "@/components/ui/button";
import { RecordChoice } from "@/components/ui/record-choice";
import { Select, SelectItem } from "@/components/ui/select";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import {
  useAllRecordPages,
  useCreateRecord,
  useModule,
  useUpdateRecord,
  useViews,
} from "@/lib/api/client/hooks";
import type { RelatedListBodyContext, RelatedListDefinition } from "../types";

function reference(value: unknown): ModuleRecordReference | null {
  return typeof value === "object" && value !== null && "id" in value && "module" in value
    ? (value as ModuleRecordReference)
    : null;
}

/** Interim dialog layouts authorized by the CTO; reference overlays remain unobserved. */
export function DealsContactRolesCard({
  context,
  definition,
}: {
  context: RelatedListBodyContext & { record: RecordData };
  definition: RelatedListDefinition;
}) {
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  return (
    <>
      <RelatedListCard
        context={context}
        definition={{
          ...definition,
          renderCard: undefined,
          upperControls: definition.upperControls?.map((control) => ({
            ...control,
            onAction:
              control.id === "add-contact-roles"
                ? () => setMode("add")
                : control.id === "edit-all-contact-roles"
                  ? () => setMode("edit")
                  : control.onAction,
          })),
        }}
      />
      {mode && (
        <ContactRolesDialog mode={mode} deal={context.record} onClose={() => setMode(null)} />
      )}
    </>
  );
}

export function ContactRolesDialog({
  mode,
  deal,
  onClose,
}: {
  mode: "add" | "edit";
  deal: RecordData;
  onClose: () => void;
}) {
  const titleId = useId();
  const metadata = useModule("Contact_Roles");
  const roles = useAllRecordPages("Contact_Roles", {
    viewId: "all-contact-roles",
    perPage: 100,
    filters: contactRolesOfDeal(deal.id),
  });
  const views = useViews("Contacts");
  const viewId = views.data?.find((view) => view.isDefault)?.id;
  const account = reference(deal.fields.Account_Name);
  const contacts = useAllRecordPages(
    "Contacts",
    {
      viewId: viewId ?? "pending",
      perPage: 100,
      filters:
        mode === "add"
          ? { field: "Account_Name", comparator: "equal", value: account?.id ?? "" }
          : {
              groupOperator: "or",
              group: (roles.data ?? []).flatMap((row) => {
                const contact = reference(row.fields.Contact);
                return contact
                  ? [{ field: "id", comparator: "equal" as const, value: contact.id }]
                  : [];
              }),
            },
    },
    { enabled: !!viewId && (mode === "add" ? !!account : (roles.data?.length ?? 0) > 0) },
  );
  const create = useCreateRecord("Contact_Roles");
  const update = useUpdateRecord("Contact_Roles");
  const [contactId, setContactId] = useState<string | null>(null);
  const [role, setRole] = useState("-None-");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = roles.data ?? [];
  const options =
    metadata.data?.fields.find((field) => field.apiName === "Contact_Role")?.picklist ?? [];
  const loading =
    metadata.isLoading ||
    roles.isLoading ||
    (mode === "edit" &&
      (views.isLoading || (!!viewId && (roles.data?.length ?? 0) > 0 && contacts.isLoading))) ||
    (mode === "add" && (views.isLoading || (!!account && !!viewId && contacts.isLoading)));
  const failed =
    metadata.isError ||
    roles.isError ||
    (mode === "edit" && (views.isError || contacts.isError)) ||
    (mode === "add" && (views.isError || (!!account && contacts.isError)));
  const linked = new Set(rows.map((row) => reference(row.fields.Contact)?.id));
  const candidates = (contacts.data ?? []).filter((contact) => !linked.has(contact.id));
  const selected = candidates.find((contact) => contact.id === contactId);
  const roleOf = (row: RecordData) =>
    typeof row.fields.Contact_Role === "string" ? row.fields.Contact_Role : "-None-";
  const changed = rows.filter(
    (row) => drafts[row.id] !== undefined && drafts[row.id] !== roleOf(row),
  );
  const ready =
    !loading && !failed && options.length > 0 && (mode === "add" ? !!selected : changed.length > 0);

  function roleSelect(label: string, value: string, onChange: (value: string) => void) {
    // Preserve existing blank/legacy values without inventing metadata options for new records.
    const items = options.some((option) => option.storedValue === value)
      ? options
      : [{ storedValue: value, displayValue: value || "-None-" }, ...options];
    return (
      <Select
        label={label}
        value={value}
        onChange={(key) => onChange(String(key))}
        isDisabled={saving}
        items={items}
      >
        {(option) => <SelectItem id={option.storedValue}>{option.displayValue}</SelectItem>}
      </Select>
    );
  }

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === "add" && selected) {
        await create.mutateAsync({
          Deal: { module: "Deals", id: deal.id },
          Contact: { module: "Contacts", id: selected.id },
          Contact_Role: role,
        });
      } else {
        for (const row of changed) {
          await update.mutateAsync({
            id: row.id,
            input: { Contact_Role: drafts[row.id] ?? roleOf(row) },
          });
        }
      }
      onClose();
    } catch {
      setError("Unable to save contact roles. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TopAlignedModal
      isOpen
      aria-labelledby={titleId}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
      panelClassName="w-full max-w-2xl bg-surface p-6"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Heading id={titleId} slot="title" className="mb-6 text-xl font-semibold text-text-strong">
          {mode === "add" ? "Add Contacts Roles" : "Edit All"}
        </Heading>
        {loading ? (
          <p role="status">Loading...</p>
        ) : failed ? (
          <p role="alert">Unable to load contact roles.</p>
        ) : (
          <>
            {mode === "add" ? (
              <div className="space-y-4">
                <RecordChoice
                  label="Contact Name"
                  value={contactId}
                  onChange={setContactId}
                  searchable
                  required
                  disabled={saving}
                  options={candidates.map((contact) => ({
                    value: contact.id,
                    label: String(
                      contact.fields.Full_Name ?? contact.fields.Last_Name ?? contact.id,
                    ),
                  }))}
                />
                {candidates.length === 0 && <p>No contacts available for this deal's account.</p>}
                {roleSelect("Role Name", role, setRole)}
              </div>
            ) : (
              <div className="max-h-96 overflow-auto">
                {rows.length === 0 ? (
                  <p>No records found</p>
                ) : (
                  <table className="w-full text-left text-md">
                    <thead>
                      <tr>
                        <th className="p-2">Contact Name</th>
                        <th className="p-2">Role Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const contact = reference(row.fields.Contact);
                        const person = contacts.data?.find((person) => person.id === contact?.id);
                        const name = String(
                          person?.fields.Full_Name ?? contact?.name ?? contact?.id ?? row.id,
                        );
                        return (
                          <tr key={row.id}>
                            <td className="p-2">{name}</td>
                            <td className="p-2">
                              {roleSelect(
                                `Role Name for ${name}`,
                                drafts[row.id] ?? roleOf(row),
                                (value) =>
                                  setDrafts((current) => ({ ...current, [row.id]: value })),
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {options.length === 0 && <p role="alert">No contact role options available.</p>}
          </>
        )}
        {error && (
          <p role="alert" className="mt-4 text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" type="button" isDisabled={saving} onPress={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isDisabled={!ready || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </TopAlignedModal>
  );
}
