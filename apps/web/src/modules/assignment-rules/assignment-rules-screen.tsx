"use client";

import type { ReadResult, RulePage } from "@crm/core/automation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";

export function AssignmentRulesScreen({ result }: { result: ReadResult<RulePage> }) {
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
            <p role="alert" className="text-md text-text-muted">
              Assignment rules could not be loaded.
            </p>
          ) : result.value.items.length === 0 ? (
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
          ) : null}
        </TabPanel>
      </Tabs>
    </section>
  );
}
