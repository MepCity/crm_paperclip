"use client";
import { TextField } from "./text-field";
export default function TextFieldDemo() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <TextField name="demo" label="Default Text Field" />
      <TextField name="demo-desc" label="With Description" description="This is a helper text" />
      <TextField
        name="demo-error"
        label="With Error"
        isInvalid
        errorMessage="This field is required"
      />
      <TextField name="demo-disabled" label="Disabled" isDisabled />
    </div>
  );
}
