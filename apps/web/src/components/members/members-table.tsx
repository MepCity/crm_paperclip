"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ActionState, initialActionState } from "@/lib/action";
import { MemberAccessCells } from "./member-access-cells";
import { RemoveMemberButton } from "./remove-member-button";
import { type ChangeRoleAction, RoleControl } from "./role-control";
import { type MemberRole, roleLabel } from "./roles";

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
};

export type MemberAccessInfo = {
  orgSlug: string;
  profiles: readonly { id: string; name: string }[];
  roles: readonly { id: string; name: string }[];
  byUser: Readonly<Record<string, { profileId: string; roleId: string; isOwner: boolean }>>;
};

export type RemoveMemberAction = (
  userId: string,
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function MembersTable({
  members,
  currentUserId,
  canManage,
  onChangeRole,
  onRemove,
  access,
}: {
  members: readonly MemberRow[];
  currentUserId: string;
  canManage: boolean;
  onChangeRole?: ChangeRoleAction;
  onRemove?: RemoveMemberAction;
  access?: MemberAccessInfo;
}) {
  const [error, setError] = useState<string | null>(null);
  const columnCount = (canManage ? 5 : 4) + (access ? 2 : 0);

  return (
    <Card>
      <CardContent>
        {error ? (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {access ? <TableHead>Profile</TableHead> : null}
              {access ? <TableHead>Access role</TableHead> : null}
              <TableHead>Joined</TableHead>
              {canManage ? <TableHead>Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody columnCount={columnCount} emptyMessage="No members to display.">
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    {member.name}
                    {member.userId === currentUserId ? <Badge>You</Badge> : null}
                  </span>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Badge>{roleLabel(member.role)}</Badge>
                </TableCell>
                {access ? (
                  <MemberAccessCells
                    access={access}
                    userId={member.userId}
                    name={member.name}
                    report={setError}
                  />
                ) : null}
                <TableCell>{member.joinedAt}</TableCell>
                {canManage && onChangeRole && onRemove ? (
                  <TableCell>
                    <div className="flex flex-wrap items-start gap-2">
                      <RoleControl
                        userId={member.userId}
                        name={member.name}
                        role={member.role}
                        onChangeRole={onChangeRole}
                        report={setError}
                      />
                      <RemoveMemberButton
                        name={member.name}
                        report={setError}
                        onRemove={() => onRemove(member.userId, initialActionState, new FormData())}
                      />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
