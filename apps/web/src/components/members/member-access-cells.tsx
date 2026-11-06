"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, SelectItem } from "@/components/ui/select";
import { createAccessClient } from "@/modules/settings-access/api";
import { errorText } from "@/modules/settings-access/shared";

export type MemberAccessInfo = {
  orgSlug: string;
  profiles: readonly { id: string; name: string }[];
  roles: readonly { id: string; name: string }[];
  byUser: Readonly<Record<string, { profileId: string; roleId: string; isOwner: boolean }>>;
};

/** Profile and access-role pickers of one member (ADR 0017 §9); admin only. */
export function MemberAccessPickers({
  access,
  userId,
  name,
  report,
  showLabels = false,
}: {
  access: MemberAccessInfo;
  userId: string;
  name: string;
  report: (message: string | null) => void;
  showLabels?: boolean;
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
      <div className="flex flex-col gap-1">
        {showLabels ? (
          <span aria-hidden="true" className="text-sm text-text-muted">
            Profile
          </span>
        ) : null}
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
      </div>
      <div className="flex flex-col gap-1">
        {showLabels ? (
          <span aria-hidden="true" className="text-sm text-text-muted">
            Role
          </span>
        ) : null}
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
      </div>
    </>
  );
}
