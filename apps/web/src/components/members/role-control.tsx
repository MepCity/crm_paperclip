"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Select, SelectItem } from "@/components/ui/select";
import { type ActionState, initialActionState } from "@/lib/action";
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
}: {
  userId: string;
  name: string;
  role: MemberRole;
  onChangeRole: ChangeRoleAction;
}) {
  const router = useRouter();
  const [state, submit, pending] = useActionState(
    async (previous: ActionState, next: MemberRole) => {
      const formData = new FormData();
      formData.set("role", next);
      const result = await onChangeRole(userId, previous, formData);
      if (result.status === "success") router.refresh();
      return result;
    },
    initialActionState,
  );

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      <Select
        label={`Role for ${name}`}
        hideLabel
        items={MEMBER_ROLES}
        selectedKey={role}
        isDisabled={pending}
        onSelectionChange={(key) => {
          if ((key === "admin" || key === "member") && key !== role) submit(key);
        }}
      >
        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
      </Select>
    </div>
  );
}
