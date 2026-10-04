"use client";

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
}: {
  members: readonly MemberRow[];
  currentUserId: string;
  canManage: boolean;
  onChangeRole?: ChangeRoleAction;
  onRemove?: RemoveMemberAction;
}) {
  const columnCount = canManage ? 5 : 4;

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
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
                <TableCell>{member.joinedAt}</TableCell>
                {canManage && onChangeRole && onRemove ? (
                  <TableCell>
                    <div className="flex flex-wrap items-start gap-2">
                      <RoleControl
                        userId={member.userId}
                        name={member.name}
                        role={member.role}
                        onChangeRole={onChangeRole}
                      />
                      <RemoveMemberButton
                        name={member.name}
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
