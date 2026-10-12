"use client";
import { TextArea } from "./text-area";

export default function TextAreaDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <TextArea name="demo-text-area" label="Empty" />
      <TextArea
        name="demo-text-area-filled"
        label="Filled"
        rows={2}
        defaultValue="Call back after the trade show."
      />
      <TextArea
        name="demo-text-area-description"
        label="With description"
        description="Visible to everyone on the record"
      />
      <TextArea
        name="demo-text-area-error"
        label="With error"
        isInvalid
        errorMessage="This field is required"
      />
      <TextArea
        name="demo-text-area-disabled"
        label="Disabled"
        isDisabled
        defaultValue="Archived"
      />
      <TextArea name="demo-text-area-required" label="Required" isRequired />
    </div>
  );
}
