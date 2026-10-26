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
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { fixtureEmailSettingsPort } from "./fixture-port";
import {
  configurationTabs,
  type EmailConfigurationTab,
  type EmailSettingsArea,
  type EmailSettingsPort,
  type EmailSettingsSnapshot,
} from "./port";
import { SignatureCreate } from "./signature-create";

const configurationTabLabels = {
  "email-compose-settings": "modules.emailSettings.composeTab",
  "email-settings": "modules.emailSettings.emailTab",
  "email-sharing": "modules.emailSettings.sharingTab",
  "organization-emails": "modules.emailSettings.orgTab",
  "custom-email-fields-preference": "modules.emailSettings.customTab",
} as const;

const areas = [
  { id: "email-configuration", messageKey: "modules.emailSettings.configuration" },
  { id: "email-parser", messageKey: "modules.emailSettings.parser" },
  { id: "bcc-dropbox", messageKey: "modules.emailSettings.bcc" },
  {
    id: "email-deliverability",
    messageKey: "modules.emailSettings.deliverability",
    disabled: true,
  },
  { id: "email-intelligence", messageKey: "modules.emailSettings.intelligence", disabled: true },
  { id: "unsubscribe-link", messageKey: "modules.emailSettings.unsubscribe", disabled: true },
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
  const t = useUiTranslations();
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
      aria-label={t("modules.emailSettings.settings")}
    >
      <Tabs selectedKey={selectedArea} onSelectionChange={(key) => navigateArea(String(key))}>
        <TabList aria-label={t("modules.emailSettings.areas")} className="overflow-x-auto px-4">
          {areas.map((item) => (
            <Tab
              key={item.id}
              id={item.id}
              isDisabled={"disabled" in item && item.disabled}
              className="whitespace-nowrap py-4 text-md"
            >
              {t(item.messageKey)}
            </Tab>
          ))}
        </TabList>
        <TabPanel id="email-configuration" className="p-6">
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => navigateTab(String(key))}>
            <TabList
              aria-label={t("modules.emailSettings.configuration")}
              className="mb-4 w-fit max-w-full overflow-x-auto rounded-full border p-1"
            >
              {configurationTabs.map((item) => (
                <Tab
                  key={item.id}
                  id={item.id}
                  isDisabled={"disabled" in item && item.disabled}
                  className="whitespace-nowrap rounded-full border-transparent px-5 text-md data-selected:border-primary data-selected:bg-primary-subtle"
                >
                  {t(configurationTabLabels[item.id])}
                </Tab>
              ))}
            </TabList>
            {configurationTabs
              .filter((item) => !("disabled" in item))
              .map((item) => (
                <TabPanel key={item.id} id={item.id}>
                  {load.error ? (
                    <p role="alert">{t("modules.emailSettings.loadError")}</p>
                  ) : !load.data ? (
                    <p role="status">{t("modules.emailSettings.loading")}</p>
                  ) : (
                    <ConfigurationContent tab={item.id} data={load.data} />
                  )}
                </TabPanel>
              ))}
          </Tabs>
        </TabPanel>
        <TabPanel id="email-parser" className="p-6">
          <Heading title={t("modules.emailSettings.parser")} />
          <p className="mt-4 text-md text-text-muted">
            {t("modules.emailSettings.parserUnavailable")}
          </p>
        </TabPanel>
        <TabPanel id="bcc-dropbox" className="p-6">
          <div className="mb-6 max-w-5xl rounded border border-accent-orange bg-accent-orange/5 p-4">
            {t("modules.emailSettings.verifyBcc")}
          </div>
          <Heading title={t("modules.emailSettings.bcc")} />
          <p className="mt-4 max-w-5xl">{t("modules.emailSettings.bccDescription")}</p>
          <h2 className="mt-8 font-semibold">{t("modules.emailSettings.howWorks")}</h2>
          <p className="mt-3 max-w-5xl">{t("modules.emailSettings.bccHow")}</p>
          <section className="mt-8 max-w-5xl rounded-lg border border-border bg-bg p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">{t("modules.emailSettings.bccAddress")}</h2>
              <div className="flex gap-3">
                <Button variant="ghost" isDisabled>
                  {t("modules.emailSettings.regenerate")}
                </Button>
                <Button variant="ghost" isDisabled>
                  {t("modules.emailSettings.downloadCard")}
                </Button>
              </div>
            </div>
            <p className="my-6 text-text-muted">{t("modules.emailSettings.bccUnavailable")}</p>
            <div className="max-w-xl">
              <TextField label={t("modules.emailSettings.excludedDomains")} isDisabled />
            </div>
          </section>
          <h2 className="mt-8 font-semibold">{t("modules.emailSettings.searchPattern")}</h2>
          <p className="mt-3 max-w-5xl">{t("modules.emailSettings.searchDescription")}</p>
          <Button variant="ghost" isDisabled>
            {t("modules.emailSettings.editSearch")}
          </Button>
          <h2 className="mt-6 font-semibold">{t("modules.emailSettings.note")}</h2>
          <p className="mt-3 max-w-5xl">{t("modules.emailSettings.bccNote")}</p>
        </TabPanel>
      </Tabs>
    </section>
  );
}

function Heading({ title, toggle }: { title: string; toggle?: boolean }) {
  const t = useUiTranslations();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <h1 className="text-xl font-semibold text-text">{title}</h1>
      {toggle !== undefined && (
        <Switch
          label={t("modules.emailSettings.custom")}
          hideLabel
          isSelected={toggle}
          isDisabled
        />
      )}
      <Button variant="icon" size="compact" isDisabled className="ml-auto">
        {t("modules.emailSettings.help")}
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
  const t = useUiTranslations();
  const [addressOpen, setAddressOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  if (tab === "email-sharing") return <Sharing data={data} />;
  if (tab === "organization-emails")
    return (
      <>
        {addressOpen && (
          <TopAlignedModal
            isOpen
            aria-labelledby="org-address-title"
            onOpenChange={(open) => {
              if (!open) setAddressOpen(false);
            }}
            panelStyle={{ width: "min(600px,95vw)" }}
          >
            <div className="p-8 space-y-5">
              <h2 id="org-address-title" className="text-xl font-semibold">
                {t("modules.emailSettings.addAddress")}
              </h2>
              <TextField label={t("modules.emailSettings.displayName")} />
              <TextField label={t("modules.emailSettings.emailAddress")} type="email" />
              <p className="text-text-muted">{t("modules.emailSettings.addressUnavailable")}</p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onPress={() => setAddressOpen(false)}>
                  {t("common.actions.cancel")}
                </Button>
                <Button isDisabled>{t("common.actions.save")}</Button>
              </div>
            </div>
          </TopAlignedModal>
        )}
        <Heading title={t("modules.emailSettings.orgTitle")} />
        <p className="mt-3 max-w-5xl text-md leading-relaxed">
          {t("modules.emailSettings.orgDescription")}
        </p>
        <Button onPress={() => setAddressOpen(true)} className="mt-8">
          {t("modules.emailSettings.addAddress")}
        </Button>
      </>
    );
  if (tab === "custom-email-fields-preference")
    return (
      <>
        <Heading
          title={t("modules.emailSettings.customTitle")}
          toggle={data.customEmailFieldsEnabled}
        />
        <p className="mt-5 max-w-4xl text-md">{t("modules.emailSettings.customDescription")}</p>
        <p className="mt-5 font-semibold text-md">{t("modules.emailSettings.customAllows")}</p>
        <ul className="mt-3 list-disc space-y-4 pl-5 text-md">
          <li>{t("modules.emailSettings.customView")}</li>
          <li>{t("modules.emailSettings.customSuggest")}</li>
          <li>{t("modules.emailSettings.customReports")}</li>
          <li>{t("modules.emailSettings.customFilter")}</li>
        </ul>
        <p className="mt-6 max-w-4xl rounded-md border border-border bg-accent-yellow/10 p-4 text-md">
          {t("modules.emailSettings.customNote")}
        </p>
      </>
    );
  return (
    <>
      <Heading title={t("modules.emailSettings.composeTitle")} />
      <p className="mt-3 text-md">{t("modules.emailSettings.composeDescription")}</p>
      <div className="mt-8 grid max-w-3xl grid-cols-1 items-center gap-x-5 gap-y-5 sm:grid-cols-4">
        <span className="text-md text-text-muted sm:text-right">
          {t("modules.emailSettings.fontFamily")}
        </span>
        <div className="sm:col-span-3 flex items-center gap-3">
          <div className="w-80 max-w-full">
            <ClosedSetting
              label={t("modules.emailSettings.fontFamily")}
              value={data.compose.fontFamily}
            />
          </div>
          <Icons.info
            className="size-4 text-text-muted"
            role="img"
            aria-label={t("modules.emailSettings.fontInfo")}
          />
        </div>
        <span className="text-md text-text-muted sm:text-right">
          {t("modules.emailSettings.fontSize")}
        </span>
        <div className="sm:col-span-3 w-36">
          <ClosedSetting
            label={t("modules.emailSettings.fontSize")}
            value={data.compose.fontSize}
          />
        </div>
        <div className="sm:col-start-2 sm:col-span-3 rounded-md border border-control-border p-3">
          <p className="border-b border-border pb-2 text-md">
            {t("modules.emailSettings.preview")}
          </p>
          <p className="py-7 text-center text-sm">{t("modules.emailSettings.previewText")}</p>
        </div>
        <span className="text-md text-text-muted sm:text-right">
          {t("modules.emailSettings.from")}
        </span>
        <div className="sm:col-span-3">
          <ClosedSetting label={t("modules.emailSettings.from")} value={data.compose.fromAddress} />
        </div>
        <span className="text-md text-text-muted sm:text-right">
          {t("modules.emailSettings.replyTo")}
        </span>
        <div className="sm:col-span-3">
          <ClosedSetting
            label={t("modules.emailSettings.replyTo")}
            value={data.compose.replyToAddress}
          />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <span className="pt-3 text-md text-text-muted sm:text-right">
          {t("modules.emailSettings.signature")}
        </span>
        <div className="min-w-0">
          {signatureOpen ? (
            <SignatureCreate onCancel={() => setSignatureOpen(false)} />
          ) : (
            <Button
              variant="ghost"
              size="compact"
              className="text-primary"
              onPress={() => setSignatureOpen(true)}
            >
              {t("modules.emailSettings.newSignature")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Sharing({ data }: { data: EmailSettingsSnapshot }) {
  const t = useUiTranslations();
  const systemLabels = {
    "Not Configured": "modules.emailSettings.notConfigured",
    "User's Choice": "modules.emailSettings.userChoice",
    Private: "modules.emailSettings.private",
    All: "modules.emailSettings.all",
    Active: "modules.emailSettings.active",
    Inactive: "modules.emailSettings.inactive",
  } as const;
  const systemLabel = (value: string) =>
    value in systemLabels ? t(systemLabels[value as keyof typeof systemLabels]) : value;
  const [query, setQuery] = useState("");
  const users = data.sharingUsers.filter((user) =>
    `${user.name} ${user.profile}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <Heading title={t("modules.emailSettings.sharingTitle")} />
      <p className="mt-3 text-md">{t("modules.emailSettings.sharingDescription")}</p>
      <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-96 max-w-full">
          <TextField
            label={t("modules.emailSettings.searchUsers")}
            hideLabel
            placeholder={t("modules.emailSettings.searchUsers")}
            type="search"
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button isDisabled>{t("modules.emailSettings.massUpdate")}</Button>
          <Button isDisabled variant="ghost" className="text-primary">
            {t("modules.emailSettings.preferences")}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-md">
          <thead className="border-b border-border">
            <tr>
              <th className="p-4">
                <Checkbox label={t("modules.emailSettings.selectAllUsers")} hideLabel isDisabled />
              </th>
              <th className="p-3 font-semibold">{t("modules.emailSettings.users")}</th>
              <th className="p-3 font-semibold">{t("modules.emailSettings.configurationType")}</th>
              <th className="p-3 font-semibold">{t("modules.emailSettings.sharing")}</th>
              <th className="p-3 font-semibold">{t("modules.emailSettings.excluded")}</th>
              <th className="p-3 font-semibold">
                <span className="flex items-center gap-2">
                  {t("modules.emailSettings.sharedWith")}
                  <Icons.info
                    className="size-4"
                    role="img"
                    aria-label={t("modules.emailSettings.sharedInfo")}
                  />
                </span>
              </th>
              <th className="p-3">
                <Button
                  variant="icon"
                  size="compact"
                  isDisabled
                  aria-label={t("modules.emailSettings.filterColumns")}
                >
                  <Icons.filter className="size-4" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  {t("modules.emailSettings.noUsers")}
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
                          <span className="mr-2 rounded border border-border px-2 py-0.5">
                            {user.role}
                          </span>
                          <span className="mr-2 rounded border border-border px-2 py-0.5">
                            {user.profile}
                          </span>
                          <span className="rounded bg-accent-green/10 px-2 py-0.5 text-accent-green">
                            {systemLabel(user.status)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{systemLabel(user.configuration)}</td>
                  <td className="min-w-40 p-3">
                    <ClosedSetting
                      label={`Sharing for ${user.name}`}
                      value={systemLabel(user.sharing)}
                    />
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
                        {systemLabel(user.sharedWith)}
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
