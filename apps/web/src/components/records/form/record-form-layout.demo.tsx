"use client";

import { useState } from "react";
import { FieldGroup } from "./field-group";
import { FormGrid } from "./form-grid";
import { FormRow } from "./form-row";
import { FormSection } from "./form-section";
import { RecordFormShell } from "./record-form-shell";

function DemoControl({ id, multiline = false }: { id: string; multiline?: boolean }) {
  if (multiline) {
    return (
      <textarea
        id={id}
        className="record-form-control record-form-control--textarea"
        defaultValue=""
      />
    );
  }
  return <input id={id} className="record-form-control" type="text" defaultValue="" />;
}

export default function RecordFormLayoutDemo() {
  const [message, setMessage] = useState("");
  const actionLabels = {
    cancel: "Cancel",
    saveAndNew: "Save and New",
    save: "Save",
  };
  return (
    <div className="space-y-8">
      <div data-record-form-demo="scroll" className="max-h-112 overflow-y-auto bg-bg">
        <RecordFormShell
          title="Create Lead"
          formAriaLabel="Create lead layout demo"
          actionLabels={actionLabels}
          onCancel={() => setMessage("cancel")}
          onSaveAndNew={() => setMessage("save-and-new")}
          onSave={() => setMessage("save")}
        >
          <FormSection title="Lead Image" layout="single">
            <div className="record-form-portrait" data-record-form-portrait aria-hidden="true" />
          </FormSection>
          <FormSection title="Lead Information" layout="two-column">
            <FormGrid
              left={
                <>
                  <FormRow label="Lead Owner" controlId="demo-owner" column="left">
                    <DemoControl id="demo-owner" />
                  </FormRow>
                  <FormRow label="First Name" controlId="demo-first" column="left">
                    <DemoControl id="demo-first" />
                  </FormRow>
                  <FormRow label="Title" controlId="demo-title" column="left">
                    <DemoControl id="demo-title" />
                  </FormRow>
                  <FormRow
                    label="Very long synthetic field label for overflow"
                    controlId="demo-long-label"
                    column="left"
                  >
                    <DemoControl id="demo-long-label" />
                  </FormRow>
                  <FieldGroup name="Address">
                    <FormRow label="Street" controlId="demo-street" column="left">
                      <DemoControl id="demo-street" />
                    </FormRow>
                    <FormRow label="City" controlId="demo-city" column="left">
                      <DemoControl id="demo-city" />
                    </FormRow>
                  </FieldGroup>
                </>
              }
              right={
                <>
                  <FormRow label="Company" controlId="demo-company" column="right">
                    <DemoControl id="demo-company" />
                  </FormRow>
                  <FormRow label="Last Name" controlId="demo-last" column="right">
                    <DemoControl id="demo-last" />
                  </FormRow>
                  <FormRow label="Email" controlId="demo-email" column="right">
                    <DemoControl id="demo-email" />
                  </FormRow>
                  {["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"].map((name) => (
                    <FormRow
                      key={name}
                      label={`Synthetic field ${name}`}
                      controlId={`demo-filler-${name}`}
                      column="right"
                    >
                      <DemoControl id={`demo-filler-${name}`} />
                    </FormRow>
                  ))}
                </>
              }
            />
          </FormSection>
          <FormSection title="Description" layout="single">
            <FormRow label="Description" controlId="demo-description" column="full">
              <DemoControl id="demo-description" multiline />
            </FormRow>
          </FormSection>
        </RecordFormShell>
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
