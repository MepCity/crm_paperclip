"use client";

import { Form as AriaForm, type FormProps as AriaFormProps } from "react-aria-components";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action";
import { Alert } from "./alert";
import { Button, type ButtonProps } from "./button";

export interface FormProps extends AriaFormProps {
  actionState?: ActionState;
}

export function Form({ actionState, children, className = "", ...props }: FormProps) {
  const validationErrors = actionState?.status === "error" ? actionState.fieldErrors : undefined;

  return (
    <AriaForm
      {...props}
      validationErrors={validationErrors}
      className={`flex flex-col gap-4 ${className}`}
    >
      {actionState?.status === "error" && actionState.message && (
        <Alert variant="danger">{actionState.message}</Alert>
      )}
      {actionState?.status === "success" && actionState.message && (
        <Alert variant="success">{actionState.message}</Alert>
      )}
      {children}
    </AriaForm>
  );
}

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" isPending={pending}>
      {children}
    </Button>
  );
}
