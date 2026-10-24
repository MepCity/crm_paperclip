"use client";

import type { ReadResult, RulePage } from "@crm/core/automation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";

const MODULE_OPTIONS = ["Leads", "Contacts", "Accounts", "Deals"] as const;

// AL5/AD7 (U12): loading comes from the shell boundary app/crm/[orgSlug]/loading.tsx;
// a failed list read is a ReadResult (not a throw), so this screen renders its own
// read-only "Try again" link that re-requests the same list URL (a fresh server read).
export function AssignmentRulesScreen({
  result,
  orgSlug = "",
  module,
}: {
  result: ReadResult<RulePage>;
  orgSlug?: string;
  /** Active module filter (AL3); undefined when unfiltered. */
  module?: string;
}) {
  const base = `/crm/${orgSlug}/settings/assignment-rules`;
  const filterQuery = module ? `module=${encodeURIComponent(module)}&` : "";
  return (
    <section
      aria-label="Assignment Rules"
      className="relative min-h-screen rounded-lg border border-border bg-surface shadow-xs"
    >
      <Tabs selectedKey="rules">
        <TabList aria-label="Assignment settings" className="gap-4 px-6">
          <Tab id="rules" className="py-4 text-md">
            Rules
          </Tab>
          <Tab id="thresholds" laterModule="M12" className="py-4 text-md">
            Thresholds
          </Tab>
          <Tab id="assistant" laterModule="M12" className="py-4 text-md">
            Assistant
          </Tab>
        </TabList>
        <TabPanel id="rules" className="relative p-6">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-text">Assignment Rules</h2>
            <Button variant="icon" size="sm" aria-label="Assignment Rules help" laterModule="M12">
              <Icons.info className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Contextual help"
            laterModule="M12"
            className="absolute top-6 right-0 rounded-r-none bg-accent-orange text-primary-text"
          >
            ?
          </Button>
          {!result.ok ? (
            <>
              <p
                role="alert"
                data-testid={`assignment-list-${result.error.code}`}
                className="text-md text-text-muted"
              >
                {result.error.code === "forbidden"
                  ? "Assignment rules could not be loaded: you do not have permission to view them."
                  : "Assignment rules could not be loaded."}
              </p>
              {result.error.code !== "forbidden" ? (
                <a
                  href={`${base}${module ? `?module=${encodeURIComponent(module)}` : ""}`}
                  className="mt-2 inline-block text-md text-link hover:underline"
                >
                  Try again
                </a>
              ) : null}
            </>
          ) : result.value.items.length === 0 && !module ? (
            <div data-testid="assignment-introduction">
              <p className="mb-6 text-md text-text-muted">
                Assignment Rules helps you automatically assign records to users based on specified
                criteria.
              </p>
              <Button laterModule="M12">
                <Icons.plus className="mr-1 size-4" aria-hidden="true" />
                Create Assignment Rule
              </Button>
            </div>
          ) : (
            <div data-testid="assignment-rule-list">
              <form method="get" action={base} className="mb-4 flex items-center gap-2">
                <label htmlFor="assignment-module-filter" className="text-md text-text-muted">
                  Module
                </label>
                <select
                  id="assignment-module-filter"
                  name="module"
                  defaultValue={module ?? ""}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-md"
                >
                  <option value="">All modules</option>
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border border-border px-3 py-1 text-md">
                  Apply filter
                </button>
              </form>
              {result.value.items.length === 0 ? (
                <p data-testid="assignment-no-matches" className="text-md text-text-muted">
                  No assignment rules match the selected module.
                </p>
              ) : (
                <table aria-label="Assignment rules" className="w-full text-left text-md">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th scope="col" className="py-2 pr-4">
                        Order
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Name
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Module
                      </th>
                      <th scope="col" className="py-2">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.value.items.map((rule) => (
                      <tr key={rule.id} className="border-b border-border">
                        <td className="py-2 pr-4">{rule.position}</td>
                        <td className="py-2 pr-4">
                          <Link
                            href={`${base}/${encodeURIComponent(rule.id)}`}
                            className="text-link hover:underline"
                          >
                            {rule.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{rule.module}</td>
                        <td className="py-2">{rule.enabled ? "Active" : "Inactive"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {result.value.nextCursor ? (
                <Link
                  href={`${base}?${filterQuery}cursor=${encodeURIComponent(result.value.nextCursor)}`}
                  className="mt-4 inline-block text-md text-link hover:underline"
                >
                  Next page
                </Link>
              ) : null}
            </div>
          )}
        </TabPanel>
      </Tabs>
    </section>
  );
}
