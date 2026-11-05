"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, SelectItem } from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { createAccessClient } from "@/modules/settings-access/api";
import { errorText } from "@/modules/settings-access/shared";
import type { MemberAccessInfo } from "./members-table";

/** Profile and access-role pickers of one member row (ADR 0017 §9); admin only. */
export function MemberAccessCells({
  access,
  userId,
  name,
  report,
}: {
  access: MemberAccessInfo;
  userId: string;
  name: string;
  report: (message: string | null) => void;
}) {
  const router = useRouter();
  const current = access.byUser[userId];
  const [profileId, setProfileId] = useState(current?.profileId ?? "");
  const [roleId, setRoleId] = useState(current?.roleId ?? "");
  const locked = current?.isOwner ?? false;

  async function change(next: { profileId?: string; roleId?: string }) {
    report(null);
    try {
      await createAccessClient(access.orgSlug).setMemberAccess(userId, next);
      router.refresh();
    } catch (error) {
      report(errorText(error));
      setProfileId(current?.profileId ?? "");
      setRoleId(current?.roleId ?? "");
    }
  }

  return (
    <>
      <TableCell>
        <Select
          label={`Profile of ${name}`}
          hideLabel
          items={access.profiles}
          selectedKey={profileId || null}
          isDisabled={locked}
          onSelectionChange={(key) => {
            setProfileId(String(key));
            void change({ profileId: String(key) });
          }}
        >
          {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
        </Select>
      </TableCell>
      <TableCell>
        <Select
          label={`Access role of ${name}`}
          hideLabel
          items={access.roles}
          selectedKey={roleId || null}
          isDisabled={locked}
          onSelectionChange={(key) => {
            setRoleId(String(key));
            void change({ roleId: String(key) });
          }}
        >
          {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
        </Select>
      </TableCell>
    </>
  );
}
