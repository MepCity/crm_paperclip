"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectUserDialog, type SelectUserRecord } from "./select-user-dialog";

const users: SelectUserRecord[] = [
  {
    id: "u1",
    name: "Alex Morgan",
    email: "alex.morgan@example.test",
    role: "CEO",
    profile: "Administrator",
  },
  {
    id: "u2",
    name: "Bella Chen",
    email: "bella.chen@example.test",
    role: "Sales Manager",
  },
  {
    id: "u3",
    name: "Carlos Diaz",
    email: "carlos.diaz@example.test",
    profile: "Standard",
  },
  { id: "u4", name: "Dana Ellis", email: "dana.ellis@example.test", role: "Support" },
  { id: "u5", name: "Evan Fox", email: "evan.fox@example.test" },
];

const labels = {
  title: "Select User",
  searchLabel: "Search Users",
  searchPlaceholder: "Search Users",
  selectedUserLabel: "Selected User",
  columnUserName: "User Name",
  columnRole: "Role",
  columnEmail: "Email",
  columnProfile: "Profile",
  cancelLabel: "Cancel",
  doneLabel: "Done",
};

export default function SelectUserDialogDemo() {
  const [session, setSession] = useState<null | { selectedId: string }>(null);
  const [lastDone, setLastDone] = useState<string | null>(null);

  return (
    <section className="space-y-3" aria-label="select user dialog">
      <p className="text-sm text-text-muted">
        Synthetic five-user list. Open with the default owner or with another user pre-selected.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onPress={() => setSession({ selectedId: "u1" })}>Open (owner u1)</Button>
        <Button onPress={() => setSession({ selectedId: "u3" })}>Open (owner u3)</Button>
      </div>
      <p role="status" className="text-sm text-text">
        Last Done: {lastDone ?? "None"}
      </p>
      {session && (
        <SelectUserDialog
          {...labels}
          users={users}
          selectedId={session.selectedId}
          onCancel={() => setSession(null)}
          onDone={(id) => {
            setLastDone(id);
            setSession(null);
          }}
        />
      )}
    </section>
  );
}
