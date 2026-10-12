"use client";
import { NumberField } from "./number-field";

export default function NumberFieldDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <NumberField name="demo-number" label="Empty" />
      <NumberField
        name="demo-number-filled"
        label="Filled"
        defaultValue={1234.5}
        minValue={0}
        maxValue={10000}
        step={0.5}
      />
      <NumberField
        name="demo-number-decimals"
        label="Two decimal places"
        decimalPlaces={2}
        defaultValue={99.5}
      />
      <NumberField
        name="demo-number-locale"
        label="German locale"
        locale="de-DE"
        description="Type 1234,5 — the form submits 1234.5"
      />
      <NumberField
        name="demo-number-description"
        label="With description"
        description="Use the arrow keys to step"
      />
      <NumberField
        name="demo-number-error"
        label="With error"
        isInvalid
        errorMessage="Enter a number between 1 and 10"
      />
      <NumberField name="demo-number-disabled" label="Disabled" isDisabled defaultValue={42} />
      <NumberField name="demo-number-required" label="Required" isRequired />
    </div>
  );
}
