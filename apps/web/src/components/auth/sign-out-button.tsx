"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/action";
import { signOut } from "@/lib/auth-client";
import { authFailureState } from "./validation";

export function SignOutButton() {
  const router = useRouter();
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });

  async function submit() {
    setActionState({ status: "idle" });
    const result = await signOut();
    if (!result.ok) {
      setActionState(authFailureState(result));
      return;
    }
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Form action={submit} actionState={actionState} aria-label="Sign out">
      <SubmitButton variant="secondary">Sign out</SubmitButton>
    </Form>
  );
}
