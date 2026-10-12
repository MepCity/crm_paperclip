"use client";

import { useActionState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Form, SubmitButton } from "@/components/ui/form";
import { Link } from "@/components/ui/link";
import { type ActionState, initialActionState } from "@/lib/action";

type AcceptAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

export type InvitationCardState =
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "revoked" }
  | { kind: "accepted" }
  | {
      kind: "signed-out";
      organizationName: string;
      email: string;
      signUpHref: string;
      signInHref: string;
    }
  | { kind: "match"; organizationName: string; action: AcceptAction }
  | { kind: "mismatch"; email: string };

const CLOSED_COPY = {
  expired: "This invitation has expired.",
  revoked: "This invitation has been revoked.",
  accepted: "This invitation has already been used.",
} as const;

export function InvitationCard({ state }: { state: InvitationCardState }) {
  if (state.kind === "invalid") {
    return <p className="text-sm text-text">This invitation link is not valid.</p>;
  }

  if (state.kind === "expired" || state.kind === "revoked" || state.kind === "accepted") {
    return <p className="text-sm text-text">{CLOSED_COPY[state.kind]}</p>;
  }

  if (state.kind === "signed-out") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">{state.organizationName}</p>
        <p className="text-sm text-text-muted">{state.email}</p>
        <div className="flex gap-4">
          <Link href={state.signUpHref}>Sign up</Link>
          <Link href={state.signInHref}>Sign in</Link>
        </div>
      </div>
    );
  }

  if (state.kind === "match") {
    return <JoinOrganizationForm organizationName={state.organizationName} action={state.action} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text">This invitation was sent to {state.email}.</p>
      <SignOutButton />
    </div>
  );
}

function JoinOrganizationForm({
  organizationName,
  action,
}: {
  organizationName: string;
  action: AcceptAction;
}) {
  const [actionState, formAction] = useActionState(action, initialActionState);
  return (
    <Form action={formAction} actionState={actionState} aria-label={`Join ${organizationName}`}>
      <SubmitButton>Join {organizationName}</SubmitButton>
    </Form>
  );
}
