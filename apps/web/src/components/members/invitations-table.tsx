"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ActionState, initialActionState } from "@/lib/action";
import { type MemberRole, roleLabel } from "./roles";

export type InvitationRow = {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: string;
};

export type RevokeInvitationAction = (
  invitationId: string,
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function InvitationsTable({
  invitations,
  onRevoke,
}: {
  invitations: readonly InvitationRow[];
  onRevoke: RevokeInvitationAction;
}) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Pending invitations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody columnCount={4} emptyMessage="No pending invitations.">
            {invitations.map((invitation) => (
              <InvitationRowView key={invitation.id} invitation={invitation} onRevoke={onRevoke} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InvitationRowView({
  invitation,
  onRevoke,
}: {
  invitation: InvitationRow;
  onRevoke: RevokeInvitationAction;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <TableRow>
      <TableCell>{invitation.email}</TableCell>
      <TableCell>
        <Badge>{roleLabel(invitation.role)}</Badge>
      </TableCell>
      <TableCell>{invitation.expiresAt}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          {message ? <Alert variant="danger">{message}</Alert> : null}
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Revoke ${invitation.email}`}
            isPending={pending}
            onPress={() => {
              setPending(true);
              void onRevoke(invitation.id, initialActionState, new FormData()).then(
                (result) => {
                  setPending(false);
                  if (result.status === "error") {
                    setMessage(result.message);
                    return;
                  }
                  setMessage(null);
                  router.refresh();
                },
                () => setPending(false),
              );
            }}
          >
            Revoke
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
