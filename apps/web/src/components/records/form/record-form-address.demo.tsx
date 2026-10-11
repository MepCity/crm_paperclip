"use client";

import type { FieldDefinition } from "@crm/core/records";
import { useState } from "react";
import { TextField } from "@/components/ui/text-field";
import { AddressFieldGroups, CopyAddressMenu } from "./composite-inputs";
import { FormSection } from "./form-section";
import { RecordFormShell } from "./record-form-shell";

function addressParent(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "textarea",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };
}

const mailing = addressParent("Mailing_Address", "Mailing Address");
const other = addressParent("Other_Address", "Other Address");
const mailingFields = ["Mailing_Country", "Mailing_City", "Mailing_Street"] as const;
const otherFields = ["Other_Country", "Other_City", "Other_Street"] as const;

export default function RecordFormAddressDemo() {
  const [values, setValues] = useState<Record<string, string>>({});
  const copyGroups = [
    { id: mailing.apiName, label: mailing.label, subfieldApiNames: mailingFields },
    { id: other.apiName, label: other.label, subfieldApiNames: otherFields },
  ];
  return (
    <RecordFormShell
      title="Create Contact"
      formAriaLabel="Dual address form demo"
      actionLabels={{ cancel: "Cancel", saveAndNew: "Save and New", save: "Save" }}
      onCancel={() => undefined}
      onSave={() => undefined}
      onSaveAndNew={() => undefined}
    >
      <FormSection
        title="Address Information"
        layout="single"
        headerEnd={
          <CopyAddressMenu
            groups={copyGroups}
            onCopy={(fromId, toId) => {
              const from = copyGroups.find((group) => group.id === fromId);
              const to = copyGroups.find((group) => group.id === toId);
              if (!from || !to) return;
              setValues((previous) => {
                const next = { ...previous };
                for (let index = 0; index < from.subfieldApiNames.length; index++) {
                  const source = from.subfieldApiNames[index];
                  const target = to.subfieldApiNames[index];
                  if (source && target) next[target] = previous[source] ?? "";
                }
                return next;
              });
            }}
          />
        }
      >
        <AddressFieldGroups
          groups={[
            { parent: mailing, subfieldApiNames: mailingFields },
            { parent: other, subfieldApiNames: otherFields },
          ]}
          renderGroupFields={(parent) =>
            (parent.apiName === mailing.apiName ? mailingFields : otherFields).map((apiName) => (
              <TextField
                key={apiName}
                label={apiName.replace(/_/g, " ")}
                hideLabel
                placeholder={apiName.replace(/_/g, " ")}
                value={values[apiName] ?? ""}
                onChange={(next) => setValues((previous) => ({ ...previous, [apiName]: next }))}
              />
            ))
          }
          onClearGroup={(apiNames) => {
            setValues((previous) => {
              const next = { ...previous };
              for (const apiName of apiNames) next[apiName] = "";
              return next;
            });
          }}
        />
      </FormSection>
    </RecordFormShell>
  );
}
