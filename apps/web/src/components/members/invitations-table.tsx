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
import { type ActionState, initialActionState, type ReportError } from "@/lib/action";
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
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Pending invitations</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        ) : null}
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
              <InvitationRowView
                key={invitation.id}
                invitation={invitation}
                onRevoke={onRevoke}
                report={setError}
              />
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
  report,
}: {
  invitation: InvitationRow;
  onRevoke: RevokeInvitationAction;
  report: ReportError;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <TableRow>
      <TableCell>{invitation.email}</TableCell>
      <TableCell>
        <Badge>{roleLabel(invitation.role)}</Badge>
      </TableCell>
      <TableCell>{invitation.expiresAt}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Revoke ${invitation.email}`}
          isPending={pending}
          onPress={() => {
            setPending(true);
            report(null);
            void onRevoke(invitation.id, initialActionState, new FormData()).then(
              (result) => {
                setPending(false);
                if (result.status === "error") {
                  report(result.message);
                  return;
                }
                router.refresh();
              },
              () => setPending(false),
            );
          }}
        >
          Revoke
        </Button>
      </TableCell>
    </TableRow>
  );
}
