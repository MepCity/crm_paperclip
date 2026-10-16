"use client";

import { useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { Tab, TabList, Tabs } from "@/components/ui/tabs";

export interface ActivityRelationPerson {
  id: string;
  name: string;
  /** Module label shown in the badge next to the name, e.g. "Contact". */
  moduleLabel: string;
  accountId?: string | null;
  accountName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
}

export interface ActivityRelationDeal {
  id: string;
  name: string;
  /** Ready-formatted amount / stage / closing date text. */
  summaryText: string;
}

export type ActivityRelationKind = "tasks" | "meetings" | "calls";

export interface ActivityRelationItem {
  id: string;
  label: string;
  path: string;
}

export interface ActivityRelationGroup {
  count: number;
  items?: ActivityRelationItem[];
}

export interface ActivityRelationPanelProps {
  persons: ActivityRelationPerson[];
  selectedPersonId: string | null;
  onSelectPerson: (personId: string) => void;
  deals: ActivityRelationDeal[];
  openActivities: Record<ActivityRelationKind, ActivityRelationGroup>;
  contactRecordPath: (contactId: string) => string;
  accountRecordPath: (accountId: string) => string;
  dealRecordPath: (dealId: string) => string;
  onCall?: (phone: string) => void;
  onNewDeal?: () => void;
  onNewActivity?: () => void;
}

const ACTIVITY_ROWS: { kind: ActivityRelationKind; label: string }[] = [
  { kind: "tasks", label: "Tasks" },
  { kind: "meetings", label: "Meetings" },
  { kind: "calls", label: "Calls" },
];

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-md font-semibold text-text-strong">{title}</h3>
      <Button variant="ghost" size="sm" className="text-primary" onPress={onAction}>
        <Icons.plus className="size-3" aria-hidden />
        {actionLabel}
      </Button>
    </div>
  );
}

function CallButton({
  phone,
  label,
  onCall,
}: {
  phone: string;
  label: string;
  onCall?: (phone: string) => void;
}) {
  return (
    <Button
      variant="icon"
      size="compact"
      aria-label={label}
      className="size-5"
      onPress={onCall ? () => onCall(phone) : undefined}
    >
      <Icons.phone className="size-3.5" aria-hidden />
    </Button>
  );
}

/**
 * Right-hand relation panel of an activity record (TD-50 – TD-70): related person picker,
 * Info / Conversations tabs, person summary, Deal Summary and Open Activities. Module
 * independent; it only renders what its props carry and never loads data.
 */
export function ActivityRelationPanel({
  persons,
  selectedPersonId,
  onSelectPerson,
  deals,
  openActivities,
  contactRecordPath,
  accountRecordPath,
  dealRecordPath,
  onCall,
  onNewDeal,
  onNewActivity,
}: ActivityRelationPanelProps) {
  const [expanded, setExpanded] = useState<Set<ActivityRelationKind>>(new Set());
  const person = persons.find((p) => p.id === selectedPersonId) ?? null;

  const toggle = (kind: ActivityRelationKind) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  return (
    <aside
      aria-label="Related information"
      data-activity-relation-panel
      className="flex flex-col gap-4 bg-surface px-2.5 pb-4 pt-[15px]"
    >
      <Select
        label="Related person"
        hideLabel
        items={persons}
        selectedKey={selectedPersonId}
        onSelectionChange={(key) => {
          if (key != null) onSelectPerson(String(key));
        }}
      >
        {(p) => (
          <SelectItem id={p.id} textValue={p.name}>
            {p.name}
          </SelectItem>
        )}
      </Select>

      <Tabs selectedKey="info">
        <TabList aria-label="Panel tabs">
          <Tab id="info">Info</Tab>
          <Tab id="conversations" laterModule="M10">
            Conversations
          </Tab>
        </TabList>
      </Tabs>

      {person ? (
        <>
          <section aria-label="Person summary" className="flex flex-col gap-2 text-md">
            <div className="flex gap-3">
              <div
                data-contact-portrait
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-md bg-bg text-avatar"
              >
                <Icons.recordPortrait className="size-full" />
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={contactRecordPath(person.id)}
                    variant="text"
                    className="font-semibold"
                  >
                    {person.name}
                  </Link>
                  <span className="rounded bg-bg px-1.5 text-xs text-text-muted">
                    {person.moduleLabel}
                  </span>
                </div>
                <Button variant="primary" size="sm" laterModule="M10">
                  Send Email
                </Button>
              </div>
            </div>
            {person.accountId && person.accountName ? (
              <div className="flex items-center gap-2">
                <Icons.building className="size-3.5 text-text-muted" aria-hidden />
                <Link
                  href={accountRecordPath(person.accountId)}
                  variant="body"
                  className="text-primary hover:underline"
                >
                  {person.accountName}
                </Link>
              </div>
            ) : null}
            {person.email ? (
              <div className="flex items-center gap-2">
                <Icons.envelope className="size-3.5 text-text-muted" aria-hidden />
                <Link
                  href={`mailto:${person.email}`}
                  variant="body"
                  laterModule="M10"
                  className="text-primary hover:underline"
                >
                  {person.email}
                </Link>
              </div>
            ) : null}
            {person.phone ? (
              <p className="flex items-center gap-2 text-text">
                <Icons.phone className="size-3.5 text-text-muted" aria-hidden />
                <span>{person.phone}</span>
                <CallButton phone={person.phone} label="Call phone" onCall={onCall} />
              </p>
            ) : null}
            {person.mobile ? (
              <p className="flex items-center gap-2 text-text">
                <Icons.phone className="size-3.5 text-text-muted" aria-hidden />
                <span>{person.mobile}</span>
                <CallButton phone={person.mobile} label="Call mobile" onCall={onCall} />
              </p>
            ) : null}
            <div className="flex justify-end">
              <Link
                href={contactRecordPath(person.id)}
                variant="body"
                className="text-primary hover:underline"
              >
                More Info
              </Link>
            </div>
          </section>

          <section aria-label="Deal Summary" className="flex flex-col gap-2">
            <SectionHeader title="Deal Summary" actionLabel="New" onAction={onNewDeal} />
            {deals.length === 0 ? (
              <p className="text-md text-text">No Deals found</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {deals.map((deal) => (
                  <li key={deal.id} className="flex flex-col text-md">
                    <Link
                      href={dealRecordPath(deal.id)}
                      variant="body"
                      className="text-primary hover:underline"
                    >
                      {deal.name}
                    </Link>
                    <span className="text-text-muted">{deal.summaryText}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <section aria-label="Open Activities" className="flex flex-col gap-2">
        <SectionHeader title="Open Activities" actionLabel="New" onAction={onNewActivity} />
        <ul className="flex flex-col gap-2">
          {ACTIVITY_ROWS.map(({ kind, label }) => {
            const group = openActivities[kind];
            const isOpen = expanded.has(kind);
            const items = group.items ?? [];
            return (
              <li key={kind} className="flex flex-col">
                <AriaButton
                  aria-expanded={isOpen}
                  onPress={() => toggle(kind)}
                  className="flex items-center gap-2 rounded-md border border-panel-border px-3 py-1.5 text-md text-text outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <span>{label}</span>
                  <span
                    data-count-badge
                    className="rounded-full bg-bg px-2 text-xs text-text-muted"
                  >
                    {group.count}
                  </span>
                  <Icons.chevronDown
                    className={`ml-auto size-4 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </AriaButton>
                {isOpen && items.length > 0 ? (
                  <ul className="flex flex-col gap-1 pb-2 pl-3">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.path}
                          variant="body"
                          className="text-md text-primary hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
