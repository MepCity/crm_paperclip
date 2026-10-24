"use client";

import {
  Building2,
  Copy,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { fixtureCompanyDetailsPort } from "./fixture-port";
import type { CompanyDetails, CompanyDetailsPort } from "./port";

const tabs = [
  "Company Details",
  "Fiscal Year",
  "Domain Mapping",
  "Business hours",
  "Holidays",
  "Currencies",
  "Hierarchy Preference",
];

export function CompanyDetailsScreen({
  orgSlug,
  port = fixtureCompanyDetailsPort,
}: {
  orgSlug: string;
  port?: CompanyDetailsPort;
}) {
  const [details, setDetails] = useState<CompanyDetails | null>(null);
  const [error, setError] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    let live = true;
    setDetails(null);
    setError(false);
    setCopyStatus("");
    port
      .readCompanyDetails()
      .then((value) => {
        if (live) setDetails(value);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [port]);

  async function copyAccessUrl() {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.accessUrl);
      setCopyStatus("Access URL copied.");
    } catch {
      setCopyStatus("Access URL could not be copied.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface shadow-xs">
      <nav
        aria-label="Company settings"
        className="flex flex-wrap gap-4 border-b border-border px-6"
      >
        {tabs.map((tab) =>
          tab === "Company Details" || tab === "Currencies" ? (
            <Link
              key={tab}
              href={`/crm/${orgSlug}/settings/${tab === "Currencies" ? "currencies" : "company-details"}`}
              aria-current={tab === "Company Details" ? "page" : undefined}
              className={`py-4 text-md ${tab === "Company Details" ? "border-b-2 border-primary font-semibold text-text" : "text-text-muted"}`}
            >
              {tab}
            </Link>
          ) : (
            <Button key={tab} variant="ghost" isDisabled className="my-2">
              {tab}
            </Button>
          ),
        )}
      </nav>
      {error ? (
        <p role="alert" className="p-8">
          Company details could not be loaded.
        </p>
      ) : !details ? (
        <p role="status" className="p-8">
          Loading company details…
        </p>
      ) : (
        <div className="space-y-10 p-8 text-md">
          <section aria-label="Organization identity" className="flex gap-8">
            <div
              aria-hidden="true"
              className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted"
            >
              <Building2 className="size-14" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="break-words text-lg font-semibold">{details.name}</h2>
                <EditButton label="Edit organization details" />
              </div>
              <p className="mt-1 text-text-muted">
                Org ID: <span className="text-text">{details.displayId}</span>
              </p>
              <dl className="mt-6 space-y-4">
                {(
                  [
                    ["Email", Mail, details.email],
                    ["Phone", Phone, details.phone],
                    ["Mobile", Smartphone, details.mobile],
                    ["Fax", Printer, details.fax],
                    ["Website", Globe, details.website],
                    ["Address", MapPin, details.address],
                  ] as const
                ).map(([label, Icon, value]) => (
                  <div key={label} className="flex min-h-5 items-center gap-3">
                    <dt>
                      <span className="sr-only">{label}</span>
                      <Icon aria-hidden="true" className="size-4 text-text-muted" />
                    </dt>
                    <dd className="break-words">
                      {value ?? <span className="sr-only">Not provided</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
          <section aria-labelledby="company-access-heading">
            <div className="mb-5 flex items-center gap-3">
              <h2 id="company-access-heading" className="font-semibold">
                Access URL
              </h2>
              <EditButton label="Edit access URL" />
            </div>
            <dl>
              <div className="flex flex-wrap items-center gap-4 md:pl-24">
                <dt className="text-text-muted">URL</dt>
                <dd className="flex min-w-0 items-center gap-3">
                  <span className="break-all">{details.accessUrl}</span>
                  <Button variant="icon" aria-label="Copy access URL" onPress={copyAccessUrl}>
                    <Copy aria-hidden="true" className="size-4" />
                  </Button>
                </dd>
              </div>
            </dl>
            <p role="status" className="text-sm text-text-muted">
              {copyStatus}
            </p>
          </section>
          <section aria-labelledby="company-locale-heading">
            <h2 id="company-locale-heading" className="mb-5 font-semibold">
              Locale Information
            </h2>
            <dl>
              <div className="flex flex-wrap items-center gap-4 md:pl-24">
                <dt className="text-text-muted">Time Zone</dt>
                <dd className="flex items-center gap-3">
                  <span>
                    ({details.timeZone.offset}) {details.timeZone.name} (
                    {details.timeZone.identifier})
                  </span>
                  <EditButton label="Edit time zone" />
                </dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="company-license-heading">
            <h2 id="company-license-heading" className="font-semibold">
              Team Licenses
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-text-muted">
                Team users can access team modules with limited access to organization modules.
              </p>
              <Button variant="ghost" isDisabled>
                Learn More
              </Button>
            </div>
            <div title="Team licensing management is not available in this edition.">
              <Button variant="relatedAction" isDisabled className="mt-5">
                Get Team User License
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EditButton({ label }: { label: string }) {
  return (
    <Button variant="icon" aria-label={label} isDisabled>
      <Pencil aria-hidden="true" className="size-4" />
    </Button>
  );
}
