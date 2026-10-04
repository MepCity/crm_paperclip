"use client";
import { Switch } from "./switch";

export default function SwitchDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Switch name="demo-switch" label="Off" />
      <Switch name="demo-switch-filled" label="On" defaultSelected />
      <Switch
        name="demo-switch-description"
        label="With description"
        description="Applies to every member of the organization"
      />
      <Switch
        name="demo-switch-error"
        label="With error"
        isInvalid
        errorMessage="Turn notifications on to continue"
      />
      <Switch name="demo-switch-disabled" label="Disabled" isDisabled defaultSelected />
      <Switch name="demo-switch-required" label="Required" isRequired />
    </div>
  );
}
