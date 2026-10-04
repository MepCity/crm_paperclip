"use client";
import { Checkbox } from "./checkbox";

export default function CheckboxDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Checkbox name="demo-checkbox" label="Empty" />
      <Checkbox name="demo-checkbox-filled" label="Checked" defaultSelected />
      <Checkbox
        name="demo-checkbox-description"
        label="With description"
        description="Sends a summary every Monday"
      />
      <Checkbox
        name="demo-checkbox-error"
        label="With error"
        isInvalid
        errorMessage="You have to accept the terms"
      />
      <Checkbox name="demo-checkbox-disabled" label="Disabled" isDisabled defaultSelected />
      <Checkbox name="demo-checkbox-required" label="Required" isRequired />
    </div>
  );
}
