"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, SubmitButton } from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import type { ActionState } from "@/lib/action";
import { signUp } from "@/lib/auth-client";
import { authFailureState, emailError, nameError, newPasswordError } from "./validation";

export function SignUpForm({ next }: { next: string }) {
  const router = useRouter();
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });

  async function submit(formData: FormData) {
    setActionState({ status: "idle" });
    const result = await signUp({
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });
    if (!result.ok) {
      setActionState(authFailureState(result));
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <Form
      action={submit}
      actionState={actionState}
      validationBehavior="native"
      aria-label="Sign up"
    >
      <TextField name="name" label="Name" isRequired autoComplete="name" validate={nameError} />
      <TextField
        name="email"
        label="Email"
        type="email"
        isRequired
        autoComplete="email"
        validate={emailError}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        isRequired
        autoComplete="new-password"
        description="At least 10 characters."
        validate={newPasswordError}
      />
      <SubmitButton>Sign up</SubmitButton>
    </Form>
  );
}
