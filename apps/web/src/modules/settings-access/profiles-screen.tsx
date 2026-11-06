"use client";

import type { ProfileSummary } from "@crm/core/access";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { createAccessClient } from "./api";
import { errorText, HelpText, Screen, useLoad } from "./shared";

/** Clone dialog: new profiles are always copies of an existing one (spec Q3). */
export function CloneProfileDialog({
  orgSlug,
  profiles,
  defaultSourceId,
  label,
}: {
  orgSlug: string;
  profiles: readonly ProfileSummary[];
  defaultSourceId?: string;
  label: string;
}) {
  const router = useRouter();
  const [source, setSource] = useState(defaultSourceId ?? profiles[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);

  return (
    <DialogTrigger>
      <Button>{label}</Button>
      <Dialog title={label}>
        {() => (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const created = await api.cloneProfile({
                  sourceProfileId: source,
                  name,
                  description,
                });
                router.push(`/crm/${orgSlug}/settings/profiles/${created.id}`);
              } catch (e) {
                setError(errorText(e));
                setBusy(false);
              }
            }}
          >
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <TextField label="Profile name" value={name} onChange={setName} isRequired />
            <TextArea label="Description" value={description} onChange={setDescription} />
            <Select
              label="Clone from"
              items={profiles}
              selectedKey={source}
              onSelectionChange={(key) => setSource(String(key))}
            >
              {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
            </Select>
            <Button type="submit" isPending={busy}>
              Create profile
            </Button>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

const DESCRIPTION_LIMIT = 30;

/** Long descriptions are cut with an ellipsis and a "More" link that reveals the rest. */
function ProfileDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (text.length <= DESCRIPTION_LIMIT) return <>{text}</>;
  return (
    <span className="flex flex-col items-start">
      <span>{open ? text : `${text.slice(0, DESCRIPTION_LIMIT).trimEnd()}...`}</span>
      <button
        type="button"
        className="cursor-pointer text-primary hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Less" : "More"}
      </button>
    </span>
  );
}

export function ProfilesScreen({ orgSlug }: { orgSlug: string }) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const [state] = useLoad(api.listProfiles);
  const [search, setSearch] = useState("");

  return (
    <Screen state={state} title="Profiles">
      {(profiles) => {
        const shown = profiles.filter((p) =>
          p.name.toLowerCase().includes(search.trim().toLowerCase()),
        );
        return (
          <>
            <HelpText>
              A profile is a set of permissions that decides what a user can do. A new profile is a
              copy of an existing one that you then edit.
            </HelpText>
            {/* Reference layout: a visible search box on the left, New Profile on the right. */}
            <div className="flex items-center justify-between gap-4">
              <div className="w-60">
                <TextField
                  label="Search"
                  placeholder="Search"
                  hideLabel
                  variant="filter-search"
                  value={search}
                  onChange={setSearch}
                />
              </div>
              <CloneProfileDialog orgSlug={orgSlug} profiles={profiles} label="New Profile" />
            </div>
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile Name</TableHead>
                      <TableHead>Profile Description</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Modified By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody columnCount={4} emptyMessage="No profiles match your search.">
                    {shown.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <Link href={`/crm/${orgSlug}/settings/profiles/${profile.id}`}>
                            {profile.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ProfileDescription text={profile.description} />
                        </TableCell>
                        <TableCell>{profile.createdByName ?? ""}</TableCell>
                        <TableCell>{profile.modifiedByName ?? ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        );
      }}
    </Screen>
  );
}
