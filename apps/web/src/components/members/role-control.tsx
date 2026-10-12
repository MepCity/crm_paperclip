"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState } from "react";
import { Select, SelectItem } from "@/components/ui/select";
import { type ActionState, initialActionState, type ReportError } from "@/lib/action";
import { MEMBER_ROLES, type MemberRole } from "./roles";

export type ChangeRoleAction = (
  userId: string,
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function RoleControl({
  userId,
  name,
  role,
  onChangeRole,
  report,
}: {
  userId: string;
  name: string;
  role: MemberRole;
  onChangeRole: ChangeRoleAction;
  report: ReportError;
}) {
  const router = useRouter();
  const [, submit, pending] = useActionState(async (previous: ActionState, next: MemberRole) => {
    const formData = new FormData();
    formData.set("role", next);
    const result = await onChangeRole(userId, previous, formData);
    if (result.status === "error") report(result.message);
    else router.refresh();
    return result;
  }, initialActionState);

  return (
    <div className="min-w-0">
      <Select
        label={`Role for ${name}`}
        hideLabel
        items={MEMBER_ROLES}
        selectedKey={role}
        isDisabled={pending}
        onSelectionChange={(key) => {
          if (key !== "admin" && key !== "member") return;
          if (key === role) return;
          report(null);
          // React Aria resolves the selection after the press handler returned, so
          // the async action has to open a transition itself or React warns and
          // never reports it as pending.
          startTransition(() => {
            submit(key);
          });
        }}
      >
        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
      </Select>
    </div>
  );
}
