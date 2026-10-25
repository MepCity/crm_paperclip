"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Select, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { fixtureEmailSettingsPort } from "./fixture-port";
import {
  configurationTabs,
  type EmailConfigurationTab,
  type EmailSettingsArea,
  type EmailSettingsPort,
  type EmailSettingsSnapshot,
} from "./port";
import { SignatureCreate } from "./signature-create";

const areas = [
  { id: "email-configuration", label: "Email Configuration" },
  { id: "email-parser", label: "Email Parser" },
  { id: "bcc-dropbox", label: "BCC Dropbox" },
  { id: "email-deliverability", label: "Email Deliverability", disabled: true },
  { id: "email-intelligence", label: "Email Intelligence", disabled: true },
  { id: "unsubscribe-link", label: "Unsubscribe Link", disabled: true },
] as const;

export function EmailSettingsScreen({
  orgSlug,
  area = "email-configuration",
  initialTab = "email-compose-settings",
  port = fixtureEmailSettingsPort,
}: {
  orgSlug: string;
  area?: EmailSettingsArea;
  initialTab?: EmailConfigurationTab;
  port?: EmailSettingsPort;
}) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState<string>(area);
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);
  const [load, setLoad] = useState<{ data: EmailSettingsSnapshot | null; error: boolean }>({
    data: null,
    error: false,
  });
  useEffect(() => {
    setSelectedArea(area);
    setSelectedTab(initialTab);
  }, [area, initialTab]);
  useEffect(() => {
    let active = true;
    setLoad({ data: null, error: false });
    port.readSettings().then(
      (data) => {
        if (active) setLoad({ data, error: false });
      },
      () => {
        if (active) setLoad({ data: null, error: true });
      },
    );
    return () => {
      active = false;
    };
  }, [port]);

  const navigateArea = (key: string) => {
    setSelectedArea(key);
    router.push(
      `/crm/${orgSlug}/settings/${key}${key === "email-configuration" ? `/${selectedTab}` : ""}`,
    );
  };
  const navigateTab = (key: string) => {
    setSelectedTab(key);
    router.push(`/crm/${orgSlug}/settings/email-configuration/${key}`);
  };

  return (
    <section
      className="min-h-full rounded-xl border border-border bg-surface"
      aria-label="Email settings"
    >
      <Tabs selectedKey={selectedArea} onSelectionChange={(key) => navigateArea(String(key))}>
        <TabList aria-label="Email areas" className="overflow-x-auto px-4">
          {areas.map((item) => (
            <Tab
              key={item.id}
              id={item.id}
              isDisabled={"disabled" in item && item.disabled}
              className="whitespace-nowrap py-4 text-md"
            >
              {item.label}
            </Tab>
          ))}
        </TabList>
        <TabPanel id="email-configuration" className="p-6">
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => navigateTab(String(key))}>
            <TabList
              aria-label="Email configuration"
              className="mb-4 w-fit max-w-full overflow-x-auto rounded-full border p-1"
            >
              {configurationTabs.map((item) => (
                <Tab
                  key={item.id}
                  id={item.id}
                  isDisabled={"disabled" in item && item.disabled}
                  className="whitespace-nowrap rounded-full border-transparent px-5 text-md data-selected:border-primary data-selected:bg-primary-subtle"
                >
                  {item.label}
                </Tab>
              ))}
            </TabList>
            {configurationTabs
              .filter((item) => !("disabled" in item))
              .map((item) => (
                <TabPanel key={item.id} id={item.id}>
                  {load.error ? (
                    <p role="alert">Email settings could not be loaded.</p>
                  ) : !load.data ? (
                    <p role="status">Loading email settings…</p>
                  ) : (
                    <ConfigurationContent tab={item.id} data={load.data} />
                  )}
                </TabPanel>
              ))}
          </Tabs>
        </TabPanel>
        <TabPanel id="email-parser" className="p-6">
          <Heading title="Email Parser" />
          <p className="mt-4 text-md text-text-muted">
            Email Parser data is unavailable. Configuration is not available on this page.
          </p>
        </TabPanel>
        <TabPanel id="bcc-dropbox" className="p-6">
          <Heading title="BCC Dropbox" />
          <p className="mt-4 text-md text-text-muted">
            BCC Dropbox settings are unavailable. No address has been generated.
          </p>
        </TabPanel>
      </Tabs>
    </section>
  );
}

function Heading({ title, toggle }: { title: string; toggle?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <h1 className="text-xl font-semibold text-text">{title}</h1>
      {toggle !== undefined && (
        <Switch label="Custom email preferences" hideLabel isSelected={toggle} isDisabled />
      )}
      <Button variant="icon" size="compact" isDisabled className="ml-auto">
        Help
      </Button>
    </div>
  );
}

function ClosedSetting({ label, value }: { label: string; value: string }) {
  return (
    <Select
      label={label}
      hideLabel
      items={[{ id: "current", label: value }]}
      value="current"
      isDisabled
    >
      {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
    </Select>
  );
}

function ConfigurationContent({
  tab,
  data,
}: {
  tab: EmailConfigurationTab;
  data: EmailSettingsSnapshot;
}) {
  const [signatureOpen, setSignatureOpen] = useState(false);
  if (tab === "email-sharing") return <Sharing data={data} />;
  if (tab === "organization-emails")
    return (
      <>
        <Heading title="Organization Email Addresses" />
        <p className="mt-3 max-w-5xl text-md leading-relaxed">
          Add department email addresses to use as From and Reply-To addresses. Each address must be
          verified before it can be used.
        </p>
        <Button isDisabled className="mt-8">
          Add Email Address
        </Button>
      </>
    );
  if (tab === "custom-email-fields-preference")
    return (
      <>
        <Heading title="Custom Email Fields Preferences" toggle={data.customEmailFieldsEnabled} />
        <p className="mt-5 max-w-4xl text-md">
          Choose whether to sync conversations with addresses stored in custom email fields across
          CRM records.
        </p>
        <p className="mt-5 font-semibold text-md">
          Enabling custom email preferences allows users to:
        </p>
        <ul className="mt-3 list-disc space-y-4 pl-5 text-md">
          <li>
            View conversations with custom email addresses in the record’s email related list.
          </li>
          <li>
            Get address suggestions from custom email fields when composing email from a record.
          </li>
          <li>Include conversations with custom email addresses in email reports.</li>
          <li>Filter records by the latest email status for custom email addresses.</li>
        </ul>
        <p className="mt-6 max-w-4xl rounded-md border border-border bg-accent-yellow/10 p-4 text-md">
          Note: Custom email conversations use the same sharing permissions as the record’s primary
          and secondary email addresses.
        </p>
      </>
    );
  return (
    <>
      <Heading title="Compose Settings" />
      <p className="mt-3 text-md">
        Configure basic default email compose settings to personalize your composing experience.
      </p>
      <div className="mt-8 grid max-w-3xl grid-cols-1 items-center gap-x-5 gap-y-5 sm:grid-cols-4">
        <span className="text-md text-text-muted sm:text-right">Default Font Family</span>
        <div className="sm:col-span-3 flex items-center gap-3">
          <div className="w-80 max-w-full">
            <ClosedSetting label="Default Font Family" value={data.compose.fontFamily} />
          </div>
          <Icons.info
            className="size-4 text-text-muted"
            role="img"
            aria-label="Font family information"
          />
        </div>
        <span className="text-md text-text-muted sm:text-right">Default Font Size</span>
        <div className="sm:col-span-3 w-36">
          <ClosedSetting label="Default Font Size" value={data.compose.fontSize} />
        </div>
        <div className="sm:col-start-2 sm:col-span-3 rounded-md border border-control-border p-3">
          <p className="border-b border-border pb-2 text-md">Preview</p>
          <p className="py-7 text-center text-sm">Sample email text</p>
        </div>
        <span className="text-md text-text-muted sm:text-right">Default From Address</span>
        <div className="sm:col-span-3">
          <ClosedSetting label="Default From Address" value={data.compose.fromAddress} />
        </div>
        <span className="text-md text-text-muted sm:text-right">Default Reply-To Address</span>
        <div className="sm:col-span-3">
          <ClosedSetting label="Default Reply-To Address" value={data.compose.replyToAddress} />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <span className="pt-3 text-md text-text-muted sm:text-right">Email Signature</span>
        <div className="sm:col-span-3">
          {signatureOpen ? (
            <SignatureCreate onCancel={() => setSignatureOpen(false)} />
          ) : (
            <Button
              variant="ghost"
              size="compact"
              className="text-primary"
              onPress={() => setSignatureOpen(true)}
            >
              Add New Signature
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Sharing({ data }: { data: EmailSettingsSnapshot }) {
  const [query, setQuery] = useState("");
  const users = data.sharingUsers.filter((user) =>
    `${user.name} ${user.profile}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <Heading title="Email Sharing Permissions" />
      <p className="mt-3 text-md">
        Manage the email sharing permissions of your organization’s users.
      </p>
      <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-96 max-w-full">
          <TextField
            label="Search User, Profile"
            hideLabel
            placeholder="Search User, Profile"
            type="search"
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button isDisabled>Mass Update</Button>
          <Button isDisabled variant="ghost" className="text-primary">
            Preferences ›
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-md">
          <thead className="border-b border-border">
            <tr>
              <th className="p-4">
                <Checkbox label="Select all users" hideLabel isDisabled />
              </th>
              <th className="p-3 font-semibold">Users</th>
              <th className="p-3 font-semibold">Configuration Type</th>
              <th className="p-3 font-semibold">Sharing</th>
              <th className="p-3 font-semibold">Domains Excluded</th>
              <th className="p-3 font-semibold">
                <span className="flex items-center gap-2">
                  Emails Shared With
                  <Icons.info className="size-4" role="img" aria-label="Shared-with information" />
                </span>
              </th>
              <th className="p-3">
                <Button variant="icon" size="compact" isDisabled aria-label="Filter columns">
                  <Icons.filter className="size-4" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td />
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-avatar">
                        <Icons.userRound className="size-5" aria-hidden />
                      </span>
                      <div>
                        {user.name}
                        <p className="mt-1 text-sm text-text-muted">
                          {user.role} · {user.profile} · {user.status}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{user.configuration}</td>
                  <td className="min-w-40 p-3">
                    <ClosedSetting label={`Sharing for ${user.name}`} value={user.sharing} />
                  </td>
                  <td className="p-3">{user.domainsExcluded.join(", ")}</td>
                  <td className="p-3">
                    {user.sharedWith && (
                      <Button
                        variant="ghost"
                        size="compact"
                        isDisabled
                        aria-label={`Shared with for ${user.name}`}
                      >
                        {user.sharedWith}
                      </Button>
                    )}
                  </td>
                  <td />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
