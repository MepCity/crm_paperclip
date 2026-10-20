"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, SubmitButton } from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import type { ActionState } from "@/lib/action";
import { signIn } from "@/lib/auth-client";
import { authFailureState, currentPasswordError, signInEmailError } from "./validation";

export function SignInForm({ next, devLogin = false }: { next: string; devLogin?: boolean }) {
  const router = useRouter();
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });

  async function submit(formData: FormData) {
    setActionState({ status: "idle" });
    const result = await signIn({
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
      aria-label="Sign in"
    >
      <TextField
        name="email"
        label={devLogin ? "Email or username" : "Email"}
        type={devLogin ? "text" : "email"}
        isRequired
        autoComplete="username"
        validate={(value) => signInEmailError(value, devLogin)}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        isRequired
        autoComplete="current-password"
        validate={currentPasswordError}
      />
      <SubmitButton>Sign in</SubmitButton>
    </Form>
  );
}
