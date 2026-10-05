"use client";

import type { FieldDataType, FieldDefinition, FieldValue } from "@crm/core/records";
import { useState } from "react";
import { CoordinatesInput, PrefixInput, TextPrefixInput } from "./composite-inputs";
import { FieldInput } from "./field-input";

const options = [
  { storedValue: "alpha", displayValue: "Alpha" },
  { storedValue: "beta", displayValue: "Beta" },
];
const users = [
  { id: "demo-owner-a", name: "Alex Example", email: "alex@example.test" },
  { id: "demo-owner-b", name: "Robin Example", email: "robin@example.test" },
];
const types: FieldDataType[] = [
  "text",
  "email",
  "phone",
  "website",
  "textarea",
  "integer",
  "double",
  "currency",
  "boolean",
  "picklist",
  "ownerlookup",
  "profileimage",
];

const formFieldViews = { view: true, create: true, edit: true, quickCreate: false } as const;

function example(type: FieldDataType): FieldValue {
  switch (type) {
    case "integer":
      return 12;
    case "double":
    case "currency":
      return 12.5;
    case "boolean":
      return true;
    case "picklist":
      return "alpha";
    case "ownerlookup":
      return "demo-owner-a";
    case "email":
      return "demo@example.test";
    case "website":
      return "https://example.test";
    case "phone":
      return "+1 555 0100";
    default:
      return "Example";
  }
}
function Sample({
  type,
  state,
}: {
  type: FieldDataType;
  state: "empty" | "filled" | "required" | "disabled";
}) {
  const [value, setValue] = useState<FieldValue>(
    state === "filled" || state === "disabled" ? example(type) : null,
  );
  const field: FieldDefinition = {
    apiName: `${type}_${state}`,
    label: `${type} ${state}`,
    dataType: type,
    required: state === "required",
    readOnly: false,
    unique: false,
    picklist: options,
    views: formFieldViews,
  };
  return (
    <FieldInput
      field={field}
      value={value}
      onChange={setValue}
      disabled={state === "disabled"}
      users={users}
      currencyPrefix="$"
      currencyInformation="Currency amount"
      onOpenPicker={type === "ownerlookup" ? () => setValue("demo-owner-b") : undefined}
    />
  );
}
function SearchableSample({ state }: { state: "empty" | "filled" | "required" | "disabled" }) {
  const [value, setValue] = useState<FieldValue>(state === "filled" ? "Saved location" : null);
  return (
    <FieldInput
      field={{
        apiName: `Country_${state}`,
        label: `Country ${state}`,
        dataType: "picklist",
        required: state === "required",
        readOnly: false,
        unique: false,
        views: formFieldViews,
      }}
      value={value}
      onChange={setValue}
      searchable
      options={options}
      disabled={state === "disabled"}
    />
  );
}
export default function FieldInputDemo() {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState<string | null>(null);
  const [handle, setHandle] = useState("example");
  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: 12.5, longitude: 24.5 });
  return (
    <div className="space-y-6">
      <p className="text-md text-text">
        Open list fields to inspect their panels. All examples use synthetic values.
      </p>
      {types.map((type) => (
        <div key={type} className="grid grid-cols-2 gap-4">
          {(["empty", "filled", "required", "disabled"] as const).map((state) => (
            <Sample key={state} type={type} state={state} />
          ))}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        {(["empty", "filled", "required", "disabled"] as const).map((state) => (
          <SearchableSample key={state} state={state} />
        ))}
      </div>
      <FieldInput
        field={{
          apiName: "State",
          label: "State empty inventory",
          dataType: "picklist",
          required: false,
          readOnly: false,
          unique: false,
          views: formFieldViews,
        }}
        value={null}
        onChange={() => {}}
        searchable
      />
      <PrefixInput
        label="First Name"
        value={name}
        onChange={setName}
        prefixLabel="Salutation"
        prefixValue={prefix}
        onPrefixChange={setPrefix}
        options={options}
      />
      <TextPrefixInput label="Social handle" prefix="@" value={handle} onChange={setHandle} />
      <CoordinatesInput label="Coordinates" {...coordinates} onChange={setCoordinates} />
      <FieldInput
        field={{
          apiName: "Error",
          label: "Invalid value",
          dataType: "text",
          required: true,
          readOnly: false,
          unique: false,
          views: formFieldViews,
        }}
        value={null}
        onChange={() => {}}
        errorMessage="This value cannot be empty."
      />
    </div>
  );
}
