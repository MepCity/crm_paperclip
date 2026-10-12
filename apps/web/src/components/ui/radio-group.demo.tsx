"use client";
import { RadioGroup, type RadioOption } from "./radio-group";

const ratings: RadioOption[] = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

export default function RadioGroupDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <RadioGroup name="demo-radio" label="Empty" options={ratings} />
      <RadioGroup name="demo-radio-filled" label="Filled" options={ratings} defaultValue="warm" />
      <RadioGroup
        name="demo-radio-horizontal"
        label="Horizontal"
        options={ratings}
        orientation="horizontal"
      />
      <RadioGroup
        name="demo-radio-description"
        label="With description"
        options={ratings}
        description="Decides which queue the lead lands in"
      />
      <RadioGroup
        name="demo-radio-error"
        label="With error"
        options={ratings}
        isInvalid
        errorMessage="Pick a rating"
      />
      <RadioGroup
        name="demo-radio-disabled"
        label="Disabled"
        options={ratings}
        isDisabled
        defaultValue="hot"
      />
      <RadioGroup name="demo-radio-required" label="Required" options={ratings} isRequired />
    </div>
  );
}
