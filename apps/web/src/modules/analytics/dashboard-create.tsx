"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import type { EmptyDashboard } from "./port";

const types = [
  { label: "Chart", icon: Icons.barChart },
  { label: "KPI", icon: Icons.activity },
  { label: "Comparator", icon: Icons.users },
  { label: "Anomaly Detector", icon: Icons.sparkles },
  { label: "Target Meter", icon: Icons.target },
  { label: "Funnel", icon: Icons.filter },
  { label: "Cohort", icon: Icons.calendar },
  { label: "Quadrant", icon: Icons.columns },
  { label: "Zone", icon: Icons.target },
  { label: "Stage", icon: Icons.columns },
  { label: "Waterfall", icon: Icons.barChart },
];
const gridCells = Array.from({ length: 60 }, (_, i) => `cell-${i}`);

const modules = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Tasks",
  "Meetings",
  "Calls",
  "Campaigns",
  "Cases",
  "Solutions",
  "Notes",
  "Email",
];

export function DashboardCreate({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (dashboard: EmptyDashboard) => Promise<void>;
}) {
  const [name, setName] = useState("Untitled Dashboard");
  const [description, setDescription] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section aria-label="Create dashboard" className="flex min-h-screen bg-bg">
      <aside aria-label="Components" className="w-64 shrink-0 border-r border-border p-5">
        <h2 className="text-xl font-semibold mb-5">Components</h2>
        <div className="space-y-4">
          {types.map((type) => (
            <Button
              key={type.label}
              variant="secondary"
              className="w-full justify-start gap-3 py-4"
              laterModule={type.label === "Chart" ? undefined : "M13"}
              onPress={() => setSourceOpen(true)}
            >
              <type.icon className="size-5 text-text-muted" aria-hidden />
              {type.label}
            </Button>
          ))}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="flex flex-wrap items-start gap-5 border-b border-border bg-surface p-5">
          <div className="w-96 space-y-3">
            <TextField label="Dashboard name" hideLabel value={name} onChange={setName} autoFocus />
            <TextField
              label="Dashboard description"
              hideLabel
              placeholder="Enter description"
              value={description}
              onChange={setDescription}
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded border border-border px-3 py-1">
            <Icons.userRound className="size-4" aria-hidden />
            Only me
          </span>
          <div className="ml-auto flex gap-3">
            <Button variant="secondary" onPress={onCancel} isDisabled={saving}>
              Cancel
            </Button>
            <Button
              isDisabled={!name.trim() || saving}
              isPending={saving}
              onPress={async () => {
                setSaving(true);
                setError(false);
                try {
                  await onSave({
                    name: name.trim(),
                    description,
                    access: "private",
                    components: [],
                  });
                } catch {
                  setError(true);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </header>
        {error && (
          <p role="alert" className="p-4 text-danger">
            Dashboard could not be saved.
          </p>
        )}
        <div className="relative min-h-[70vh] p-12">
          <div aria-hidden className="absolute inset-4 grid grid-cols-12 gap-3">
            {gridCells.map((cell) => (
              <div key={cell} className="min-h-24 bg-border/15" />
            ))}
          </div>
          <div className="relative max-w-lg rounded bg-surface p-12 text-center">
            <Icons.plus className="mx-auto mb-5 size-12 text-text-muted" aria-hidden />
            <h2 className="text-xl">Select a Component.</h2>
            <p className="mt-3">Build your dashboard by adding components.</p>
          </div>
        </div>
      </div>
      {sourceOpen && <DashboardComponentChooser onCancel={() => setSourceOpen(false)} />}
    </section>
  );
}

function QuickChart({ onCancel }: { onCancel: () => void }) {
  const titleId = useId();
  const [module, setModule] = useState("");
  const [criteria, setCriteria] = useState(false);
  const emptyItem = (item: { id: string }) => <SelectItem id={item.id}>{item.id}</SelectItem>;
  return (
    <TopAlignedModal
      isOpen
      aria-labelledby={titleId}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      panelStyle={{ width: "min(1200px, 95vw)", maxHeight: "95dvh", overflow: "auto" }}
    >
      <div className="p-8">
        <div className="mb-6 flex justify-between">
          <h2 id={titleId} className="text-xl font-semibold">
            Add Chart
          </h2>
          <Button variant="ghost" isDisabled>
            Help
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="grid grid-cols-[12rem_1fr] items-center gap-x-5 gap-y-4 lg:col-span-3">
            <span aria-hidden className="text-right text-text-muted">
              Component Name
            </span>
            <TextField label="Component Name" hideLabel autoFocus />
            <span aria-hidden className="text-right text-text-muted">
              Modules
            </span>
            <Select
              label="Modules"
              hideLabel
              placeholder="Select Module"
              items={modules.map((id) => ({ id }))}
              value={module || null}
              onChange={(key) => {
                setModule(String(key));
                setCriteria(false);
              }}
            >
              {emptyItem}
            </Select>
            {module && (
              <>
                <span />
                <Select
                  label="Related Module"
                  hideLabel
                  placeholder="Select Related Module"
                  items={[]}
                  isDisabled
                >
                  {emptyItem}
                </Select>
              </>
            )}
            <span aria-hidden className="text-right text-text-muted">
              Measure (y axis)
            </span>
            <Select
              label="Measure (y axis)"
              hideLabel
              placeholder="Select Measure"
              items={module ? [{ id: `Count of ${module}` }] : []}
              value={module ? `Count of ${module}` : null}
              isDisabled
            >
              {emptyItem}
            </Select>
            <span aria-hidden className="text-right text-text-muted">
              Grouping
            </span>
            <Select label="Grouping" hideLabel placeholder="Select Grouping" items={[]} isDisabled>
              {emptyItem}
            </Select>
            <div className="col-span-2">
              {criteria ? (
                <section
                  aria-label="Criteria filter"
                  className="rounded border border-border bg-bg p-5 space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">Criteria filter</h3>
                    <Button
                      variant="ghost"
                      className="text-danger"
                      onPress={() => setCriteria(false)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-[auto_1fr_1fr_2fr_auto] items-center gap-2">
                    <span className="rounded-full border border-border p-3">1</span>
                    <Select
                      label="Criterion field"
                      hideLabel
                      placeholder="Select"
                      items={[]}
                      isDisabled
                    >
                      {emptyItem}
                    </Select>
                    <Select
                      label="Criterion operator"
                      hideLabel
                      placeholder="Select"
                      items={[]}
                      isDisabled
                    >
                      {emptyItem}
                    </Select>
                    <TextField label="Criterion value" hideLabel isDisabled />
                    <Button
                      variant="ghost"
                      aria-label="Add criterion"
                      isDisabled
                      className="text-accent-green"
                    >
                      <Icons.plus className="size-5 rounded-full border border-current" />
                    </Button>
                  </div>
                </section>
              ) : (
                <Button variant="ghost" isDisabled={!module} onPress={() => setCriteria(true)}>
                  + Criteria filter
                </Button>
              )}
            </div>
            <p className="text-right text-text-muted">
              Combine related grouping values into categories.
            </p>
            <Button variant="ghost" className="justify-start text-primary" isDisabled>
              Create Category Field
            </Button>
            <h3 className="col-span-2 pt-3 text-primary">Other options</h3>
            <Checkbox label="Display Component Filters" isDisabled />
            <Select label="Filter field" hideLabel placeholder="Select Field" items={[]} isDisabled>
              {emptyItem}
            </Select>
          </div>
          <div className="lg:col-span-2">
            <div className="ml-auto w-48">
              <Select
                label="Chart type"
                hideLabel
                items={[{ id: "Column chart" }]}
                value="Column chart"
                isDisabled
              >
                {emptyItem}
              </Select>
            </div>
            <section
              aria-label="Chart preview"
              className="mt-4 min-h-56 rounded border border-border p-6"
            >
              {module ? (
                <>
                  <div
                    aria-hidden
                    className="flex h-36 items-end justify-center gap-8 border-b border-border"
                  >
                    <div className="h-16 w-24 bg-accent-orange" />
                    <div className="h-32 w-24 bg-accent-yellow" />
                  </div>
                  <p className="mt-4 text-center text-text-muted">Record count</p>
                </>
              ) : (
                <p className="py-12 text-center text-text-muted">
                  Select a module to display a visual preview.
                </p>
              )}
            </section>
          </div>
        </div>
        <footer className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onPress={onCancel}>
            Cancel
          </Button>
          <Button isDisabled>Done</Button>
        </footer>
      </div>
    </TopAlignedModal>
  );
}

export function DashboardComponentChooser({ onCancel }: { onCancel: () => void }) {
  const sourceTitle = useId();
  const [chartOpen, setChartOpen] = useState(false);
  return (
    <>
      <TopAlignedModal
        isOpen={!chartOpen}
        onOpenChange={(open) => {
          if (!open) onCancel();
        }}
        aria-labelledby={sourceTitle}
        panelStyle={{ width: "min(600px, 95vw)" }}
      >
        <div className="p-8 space-y-6">
          <h2 id={sourceTitle} className="text-xl font-semibold">
            Chart
          </h2>
          <Button
            onPress={() => {
              setChartOpen(true);
            }}
          >
            Quick chart
          </Button>
          <Button variant="secondary" isDisabled>
            From Reports
          </Button>
          <Button variant="secondary" onPress={onCancel}>
            Cancel
          </Button>
        </div>
      </TopAlignedModal>
      {chartOpen && <QuickChart onCancel={onCancel} />}
    </>
  );
}
