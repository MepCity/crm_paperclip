"use client";

import type {
  DefaultAccess,
  GroupDetail,
  RoleNode,
  SharingLevel,
  SharingRuleDetail,
  SubjectKind,
} from "@crm/core/access";
import { OWNED_MODULES } from "@crm/core/access/catalogue";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { createAccessClient } from "./api";
import {
  errorText,
  HelpText,
  LEVEL_LABELS,
  Screen,
  SHARING_LEVEL_LABELS,
  SUBJECT_KIND_LABELS,
  useLoad,
} from "./shared";

type Data = {
  defaults: { module: string; level: DefaultAccess }[];
  rules: SharingRuleDetail[];
  roles: RoleNode[];
  groups: GroupDetail[];
};

const LEVEL_ITEMS = Object.entries(LEVEL_LABELS).map(([id, label]) => ({ id, label }));
const RULE_LEVEL_ITEMS = Object.entries(SHARING_LEVEL_LABELS).map(([id, label]) => ({ id, label }));
const KIND_ITEMS = Object.entries(SUBJECT_KIND_LABELS).map(([id, label]) => ({ id, label }));

function subjectOptions(kind: SubjectKind, data: Data): { id: string; name: string }[] {
  return kind === "group" ? data.groups : data.roles;
}

function subjectName(kind: SubjectKind, id: string, data: Data): string {
  return subjectOptions(kind, data).find((o) => o.id === id)?.name ?? "Unknown";
}

function SubjectFields({
  prefix,
  typeLabel,
  kind,
  id,
  data,
  onKind,
  onId,
}: {
  prefix: string;
  typeLabel: string;
  kind: SubjectKind;
  id: string;
  data: Data;
  onKind: (k: SubjectKind) => void;
  onId: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select
        label={typeLabel}
        items={KIND_ITEMS}
        selectedKey={kind}
        onSelectionChange={(key) => {
          onKind(String(key) as SubjectKind);
          onId("");
        }}
      >
        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
      </Select>
      <Select
        label={prefix}
        items={subjectOptions(kind, data)}
        selectedKey={id || null}
        onSelectionChange={(key) => onId(String(key))}
        isRequired
      >
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
    </div>
  );
}

function RuleDialog({
  orgSlug,
  data,
  module,
  rule,
  label,
  onDone,
}: {
  orgSlug: string;
  data: Data;
  module: string;
  rule?: SharingRuleDetail;
  label: string;
  onDone: () => void;
}) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const [name, setName] = useState(rule?.name ?? "");
  const [sourceKind, setSourceKind] = useState<SubjectKind>(rule?.sourceKind ?? "role");
  const [sourceId, setSourceId] = useState(rule?.sourceId ?? "");
  const [targetKind, setTargetKind] = useState<SubjectKind>(rule?.targetKind ?? "role");
  const [targetId, setTargetId] = useState(rule?.targetId ?? "");
  const [level, setLevel] = useState<SharingLevel>(rule?.level ?? "read");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <DialogTrigger>
      <Button variant={rule ? "secondary" : "primary"}>{label}</Button>
      <Dialog title={rule ? "Edit sharing rule" : `New sharing rule: ${module}`}>
        {({ close }) => (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              try {
                await api.saveSharingRule(rule?.id ?? null, {
                  module,
                  name,
                  sourceKind,
                  sourceId,
                  targetKind,
                  targetId,
                  level,
                });
                close();
                onDone();
              } catch (e) {
                setError(errorText(e));
                setBusy(false);
              }
            }}
          >
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <TextField label="Rule name" value={name} onChange={setName} isRequired />
            <SubjectFields
              prefix="Records owned by"
              typeLabel="Owner type"
              kind={sourceKind}
              id={sourceId}
              data={data}
              onKind={setSourceKind}
              onId={setSourceId}
            />
            <SubjectFields
              prefix="Share with"
              typeLabel="Target type"
              kind={targetKind}
              id={targetId}
              data={data}
              onKind={setTargetKind}
              onId={setTargetId}
            />
            <Select
              label="Access level"
              items={RULE_LEVEL_ITEMS}
              selectedKey={level}
              onSelectionChange={(key) => setLevel(String(key) as SharingLevel)}
            >
              {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
            </Select>
            <Button type="submit" isPending={busy}>
              Save rule
            </Button>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

export function DataSharingScreen({ orgSlug }: { orgSlug: string }) {
  const api = useMemo(() => createAccessClient(orgSlug), [orgSlug]);
  const load = useCallback(
    async (): Promise<Data> => ({
      defaults: await api.getModuleDefaults(),
      rules: await api.listSharingRules(),
      roles: await api.listRoles(),
      groups: await api.listGroups(),
    }),
    [api],
  );
  const [state, reload] = useLoad(load);
  const [tab, setTab] = useState<"defaults" | "rules">("defaults");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, DefaultAccess>>({});
  const [ruleModule, setRuleModule] = useState<string>(OWNED_MODULES[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Screen state={state} title="Data Sharing Settings">
      {(data) => {
        const levelOf = (module: string): DefaultAccess =>
          draft[module] ?? data.defaults.find((d) => d.module === module)?.level ?? "private";
        const moduleRules = data.rules.filter((r) => r.module === ruleModule);
        return (
          <>
            <div role="tablist" className="flex gap-2">
              {(
                [
                  ["defaults", "Organization Default Permissions"],
                  ["rules", "Sharing Rules"],
                ] as const
              ).map(([id, text]) => (
                <Button
                  key={id}
                  variant={tab === id ? "primary" : "secondary"}
                  onPress={() => setTab(id)}
                  aria-pressed={tab === id}
                >
                  {text}
                </Button>
              ))}
            </div>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            {tab === "defaults" ? (
              <>
                <HelpText>
                  The default access of a module applies to every user who does not already get
                  access through the owner, the role hierarchy or a sharing rule.
                </HelpText>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button
                        isPending={busy}
                        onPress={async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await api.putModuleDefaults(
                              OWNED_MODULES.map((module) => ({ module, level: levelOf(module) })),
                            );
                            setEditing(false);
                            setDraft({});
                            reload();
                          } catch (e) {
                            setError(errorText(e));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onPress={() => {
                          setEditing(false);
                          setDraft({});
                          setError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onPress={() => setEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          <TableHead>Default Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody columnCount={2}>
                        {OWNED_MODULES.map((module) => (
                          <TableRow key={module}>
                            <TableCell>{module}</TableCell>
                            <TableCell>
                              {editing ? (
                                <Select
                                  label={`${module} default access`}
                                  hideLabel
                                  items={LEVEL_ITEMS}
                                  selectedKey={levelOf(module)}
                                  onSelectionChange={(key) =>
                                    setDraft({ ...draft, [module]: String(key) as DefaultAccess })
                                  }
                                >
                                  {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                                </Select>
                              ) : (
                                LEVEL_LABELS[levelOf(module)]
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <Select
                    label="Module"
                    items={OWNED_MODULES.map((m) => ({ id: m }))}
                    selectedKey={ruleModule}
                    onSelectionChange={(key) => setRuleModule(String(key))}
                  >
                    {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
                  </Select>
                  <RuleDialog
                    key={`new-${ruleModule}`}
                    orgSlug={orgSlug}
                    data={data}
                    module={ruleModule}
                    label="New Rule"
                    onDone={reload}
                  />
                </div>
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule Name</TableHead>
                          <TableHead>Records owned by</TableHead>
                          <TableHead>Shared with</TableHead>
                          <TableHead>Access</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody columnCount={5} emptyMessage="No sharing rules for this module.">
                        {moduleRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.name}</TableCell>
                            <TableCell>
                              {SUBJECT_KIND_LABELS[rule.sourceKind]}:{" "}
                              {subjectName(rule.sourceKind, rule.sourceId, data)}
                            </TableCell>
                            <TableCell>
                              {SUBJECT_KIND_LABELS[rule.targetKind]}:{" "}
                              {subjectName(rule.targetKind, rule.targetId, data)}
                            </TableCell>
                            <TableCell>{SHARING_LEVEL_LABELS[rule.level]}</TableCell>
                            <TableCell>
                              <span className="inline-flex gap-2">
                                <RuleDialog
                                  orgSlug={orgSlug}
                                  data={data}
                                  module={rule.module}
                                  rule={rule}
                                  label="Edit"
                                  onDone={reload}
                                />
                                <Button
                                  variant="danger"
                                  aria-label={`Delete ${rule.name}`}
                                  onPress={async () => {
                                    try {
                                      await api.deleteSharingRule(rule.id);
                                      reload();
                                    } catch (e) {
                                      setError(errorText(e));
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        );
      }}
    </Screen>
  );
}
