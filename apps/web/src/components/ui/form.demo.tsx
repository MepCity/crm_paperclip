"use client";

import { useActionState } from "react";
import { Form, SubmitButton } from "./form";
import { submitFormAction } from "./form-demo-action";
import { TextField } from "./text-field";

export default function FormDemo() {
  const [state, formAction] = useActionState(submitFormAction, { status: "idle" });

  return (
    <div className="max-w-sm">
      <Form action={formAction} actionState={state} validationBehavior="aria">
        <TextField name="email" label="Email" type="email" />
        <TextField name="password" label="Password" type="password" />
        <SubmitButton>Sign In</SubmitButton>
      </Form>
    </div>
  );
}
