"use client";

import { type ReactNode, useEffect, useState } from "react";

/**
 * Every token declared in `app/tokens.css`, grouped the same way. The gallery resolves the
 * authored value with `getComputedStyle` so no value is repeated as a literal here.
 */
const COLOUR_GROUPS = [
  {
    label: "Record forms",
    tokens: [
      "--color-form-required",
      "--color-form-portrait",
      "--color-form-caret",
      "--color-form-input-end",
      "--color-form-portrait-ring",
    ],
  },
  {
    label: "Record detail",
    tokens: [
      "--color-record-primary-end",
      "--color-record-secondary-start",
      "--color-record-secondary-end",
      "--color-record-arrow-disabled",
      "--color-record-tab-selected",
      "--color-record-tab-border",
    ],
  },
  {
    label: "Page, surfaces and ink",
    tokens: [
      "--color-bg",
      "--color-surface",
      "--color-text",
      "--color-text-muted",
      "--color-text-placeholder",
      "--color-border",
    ],
  },
  {
    label: "Primary",
    tokens: [
      "--color-primary",
      "--color-primary-text",
      "--color-primary-hover",
      "--color-primary-pressed",
      "--color-primary-subtle",
    ],
  },
  {
    label: "Status",
    tokens: [
      "--color-danger",
      "--color-danger-text",
      "--color-danger-hover",
      "--color-danger-pressed",
      "--color-success",
      "--color-success-text",
      "--color-success-hover",
      "--color-success-pressed",
      "--color-warning",
      "--color-warning-text",
      "--color-warning-hover",
      "--color-warning-pressed",
    ],
  },
  {
    label: "Interaction",
    tokens: [
      "--color-surface-hover",
      "--color-surface-pressed",
      "--color-focus-ring",
      "--color-overlay",
    ],
  },
  {
    label: "Navigation rail",
    tokens: [
      "--color-rail-surface",
      "--color-rail-surface-raised",
      "--color-rail-border",
      "--color-rail-text",
      "--color-rail-icon",
      "--color-rail-placeholder",
      "--color-rail-scrollbar",
      "--color-rail-item-active",
      "--color-rail-item-active-text",
    ],
  },
  {
    label: "Top bar, menu and utility strip",
    tokens: [
      "--color-topbar-surface",
      "--color-topbar-border",
      "--color-menu-surface",
      "--color-utility-border",
      "--color-utility-help",
    ],
  },
  {
    label: "Identity marks and accents",
    tokens: [
      "--color-monogram",
      "--color-avatar",
      "--color-accent-blue",
      "--color-accent-orange",
      "--color-accent-pink",
      "--color-accent-purple",
      "--color-accent-amber",
      "--color-accent-yellow",
    ],
  },
  {
    label: "Leads list",
    tokens: [
      "--color-panel-border",
      "--color-row-separator",
      "--color-control-border",
      "--color-button-border",
      "--color-button-gradient-start",
      "--color-button-gradient-end",
      "--color-primary-gradient-start",
      "--color-primary-gradient-end",
      "--color-primary-divider",
      "--color-primary-disabled",
      "--color-popover-sort-border",
      "--color-surface-selected",
      "--color-surface-active",
      "--color-text-strong",
      "--color-text-disabled",
      "--color-text-empty",
      "--color-detail-timeline-filter-surface",
      "--color-detail-timeline-muted-border",
      "--color-detail-timeline-badge-text",
      "--color-detail-timeline-caret-placeholder",
      "--color-detail-timeline-caret-value",
      "--color-form-portrait",
      "--color-form-field-group-border",
    ],
  },
] as const;

const TEXT_TOKENS = [
  "--text-2xs",
  "--text-xs",
  "--text-sm",
  "--text-md",
  "--text-base",
  "--text-lg",
  "--text-xl",
  "--text-2xl",
  "--text-3xl",
] as const;

const WEIGHT_TOKENS = [
  "--font-weight-normal",
  "--font-weight-semibold",
  "--font-weight-bold",
] as const;

/** Adopted roles from typography.md, Recommendation. Values come only from tokens. */
const TYPE_ROLES = [
  {
    role: "Product selector",
    labels: ["Workqueue"],
    size: "--text-base",
    weight: "--font-weight-semibold",
  },
  { role: "Page title", labels: ["Home"], size: "--text-xl", weight: "--font-weight-semibold" },
  {
    role: "Rail fixed link",
    labels: ["Workqueue", "Reports"],
    size: "--text-md",
    weight: "--font-weight-normal",
  },
  {
    role: "Rail active link",
    labels: ["Home"],
    size: "--text-md",
    weight: "--font-weight-semibold",
  },
  {
    role: "Teamspace selector",
    labels: ["Workqueue"],
    size: "--text-base",
    weight: "--font-weight-semibold",
  },
  {
    role: "Group heading",
    labels: ["Integrations"],
    size: "--text-md",
    weight: "--font-weight-semibold",
  },
  {
    role: "Rail child link",
    labels: ["Documents"],
    size: "--text-md",
    weight: "--font-weight-normal",
  },
  {
    role: "Rail Search placeholder",
    labels: ["Search records"],
    size: "--text-md",
    weight: "--font-weight-normal",
  },
  {
    role: "Top-bar search placeholder",
    labels: ["Search records"],
    size: "--text-sm",
    weight: "--font-weight-normal",
  },
  { role: "Menu item", labels: ["Reports"], size: "--text-md", weight: "--font-weight-normal" },
  {
    role: "Utility label",
    labels: ["My Pins"],
    size: "--text-2xs",
    weight: "--font-weight-normal",
  },
  {
    role: "Help utility label",
    labels: ["Help"],
    size: "--text-xs",
    weight: "--font-weight-semibold",
  },
] as const;

const FONT_TOKENS = ["--font-sans", "--font-mono"] as const;

const RADIUS_TOKENS = [
  "--radius-record-menu",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-full",
  "--radius-form-control",
] as const;

const SHADOW_TOKENS = ["--shadow-sm", "--shadow-md", "--shadow-lg"] as const;

const SIZE_GROUPS = [
  {
    label: "Record detail",
    tokens: [
      "--size-record-header-height",
      "--size-record-portrait",
      "--size-record-back-region",
      "--size-record-title-gap",
      "--size-record-rail-width",
      "--size-record-rail-heading-height",
      "--size-record-rail-text-inset",
      "--size-record-tab-row-height",
      "--size-record-tab-top",
      "--size-record-toggle-slot",
      "--size-record-tab-width",
      "--size-record-tab-height",
      "--size-record-tab-inset",
      "--size-record-tab-slice-width",
      "--size-record-tab-slice-height",
      "--size-record-menu-width",
      "--size-record-menu-inset",
      "--size-record-menu-inset-inline",
      "--size-record-menu-text-inset",
      "--size-record-scroll-top",
      "--size-record-scroll-offset",
      "--size-record-demo-height",
    ],
  },
  {
    label: "Shell positions",
    tokens: [
      "--size-topbar-control-gap",
      "--size-rail-nested-row-gap",
      "--size-rail-nested-icon-offset",
      "--size-rail-nested-label-gap",
      "--size-rail-header-top",
      "--size-rail-nav-start",
      "--size-rail-product-gap",
      "--size-rail-pinned-region",
      "--size-rail-teamspace-top",
      "--size-rail-teamspace-group-gap",
    ],
  },
  {
    label: "Shell regions",
    tokens: [
      "--size-rail-width",
      "--size-topbar-height",
      "--size-utility-strip-height",
      "--size-topbar-title-inset",
    ],
  },
  {
    label: "Rail rows",
    tokens: [
      "--size-rail-row-width",
      "--size-rail-row-height",
      "--size-rail-row-gap",
      "--size-rail-row-pitch",
      "--size-rail-nested-row-pitch",
      "--size-rail-inset",
      "--size-rail-nested-indent",
      "--size-rail-label-gap",
      "--size-rail-icon",
      "--size-rail-group-icon",
      "--size-rail-search-icon",
      "--size-rail-scrollbar-width",
      "--size-rail-group-gap",
    ],
  },
  {
    label: "Rail header and selectors",
    tokens: [
      "--size-rail-header-inset",
      "--size-rail-product-selector-height",
      "--size-rail-product-mark",
      "--size-rail-selector-height",
      "--size-rail-selector-inset",
      "--size-rail-monogram",
      "--size-rail-overflow-trigger",
    ],
  },
  {
    label: "Top bar controls",
    tokens: [
      "--size-topbar-icon",
      "--size-topbar-control-pitch",
      "--size-topbar-quick-create",
      "--size-topbar-avatar",
      "--size-topbar-search-width",
      "--size-topbar-search-height",
      "--size-topbar-search-icon",
    ],
  },
  {
    label: "Menus and popovers",
    tokens: [
      "--size-menu-width",
      "--size-menu-offset",
      "--size-menu-inset",
      "--size-menu-item-height",
      "--size-menu-icon",
      "--size-menu-label-gap",
    ],
  },
  {
    label: "Leads list",
    tokens: [
      "--size-list-inset",
      "--size-list-tab-height",
      "--size-list-pill-width",
      "--size-list-pill-height",
      "--size-list-toolbar-height",
      "--size-list-filter-width",
      "--size-list-filter-gap",
      "--size-filter-editor-inset",
      "--size-filter-editor-top-gap",
      "--size-filter-editor-value-gap",
      "--size-filter-control-height",
      "--size-filter-contains-width",
      "--size-filter-control-min-width",
      "--radius-filter-control",
      "--size-filter-operator-list-width",
      "--size-filter-operator-list-height",
      "--size-filter-operator-row-height",
      "--size-filter-operator-list-offset",
      "--size-list-filter-padding",
      "--size-list-filter-search-height",
      "--size-list-filter-search-icon",
      "--size-list-filter-search-icon-inset",
      "--size-list-filter-search-padding",
      "--size-list-filter-search-width",
      "--size-list-filter-search-end-inset",
      "--size-list-filter-title-inset-top",
      "--size-list-filter-title-line",
      "--size-list-filter-group-heading-line",
      "--size-list-filter-heading-to-search",
      "--size-list-filter-search-to-group",
      "--size-list-filter-group-to-row",
      "--size-list-filter-group-gap",
      "--size-list-filter-row-height",
      "--size-list-filter-row-padding",
      "--size-list-filter-chevron-width",
      "--size-list-filter-chevron-height",
      "--size-list-filter-chevron-offset",
      "--size-list-filter-heading-inset",
      "--size-list-filter-button-width",
      "--size-list-filter-button-height",
      "--size-list-header-height",
      "--size-list-header-border",
      "--size-list-header-rule",
      "--size-list-header-rule-offset",
      "--size-list-row-height",
      "--size-list-row-pitch",
      "--size-list-row-pad",
      "--size-list-line-height",
      "--size-list-leading-width",
      "--size-list-leading-pair-width",
      "--size-list-badge-width",
      "--size-list-checkbox-inset",
      "--size-list-checkbox-offset",
      "--size-list-column-width",
      "--size-list-cell-inset",
      "--size-list-settings-width",
      "--size-list-settings-row-width",
      "--size-list-empty-offset",
      "--size-list-footer-height",
      "--size-list-footer-gap-before",
      "--size-list-footer-gap-after",
      "--size-list-footer-end",
      "--size-list-chevron-width",
      "--size-list-chevron-height",
      "--size-list-view-icon",
      "--color-detail-divider",
      "--size-detail-card-width",
      "--size-detail-card-padding",
      "--size-detail-business-label-width",
      "--size-detail-business-label-value-gap",
      "--size-detail-business-row-pitch",
      "--size-detail-details-label-width",
      "--size-detail-details-label-value-gap",
      "--size-detail-details-row-pitch",
      "--size-detail-column-width",
      "--size-detail-business-min-height",
      "--size-detail-business-padding-block-start",
      "--size-detail-business-padding-block-end",
      "--size-detail-details-toggle-padding-block",
      "--size-detail-details-sections-margin-top",
      "--size-detail-section-title-margin-block",
      "--size-list-view-name-width",
      "--size-list-column-lane-width",
    ],
  },
  {
    label: "Buttons, checkbox and dialog",
    tokens: [
      "--size-button-split-width",
      "--size-button-split-height",
      "--size-button-split-primary",
      "--size-button-split-arrow",
      "--size-button-gap",
      "--size-button-ellipsis-width",
      "--size-button-ellipsis-height",
      "--size-form-input-height",
      "--size-form-required-bar",
      "--size-form-option-height",
      "--size-form-list-padding",
      "--size-form-country-height",
      "--size-form-owner-height",
      "--size-form-prefix-width",
      "--size-form-prefix-divider-offset",
      "--size-form-prefix-caret-gap",
      "--size-form-caret-width",
      "--size-form-caret-height",
      "--size-form-caret-inset-end",
      "--size-form-input-end",
      "--size-form-input-end-icon",
      "--size-form-currency-prefix-inset",
      "--size-form-currency-divider-gap",
      "--size-form-currency-divider-height",
      "--size-form-currency-divider-top",
      "--size-form-owner-caret-gap",
      "--size-checkbox",
      "--size-checkbox-border",
      "--size-checkbox-label-gap",
      "--size-checkbox-label-line",
      "--size-dialog-width",
      "--size-dialog-height",
      "--size-dialog-padding",
    ],
  },
  {
    label: "List popovers",
    tokens: [
      "--size-popover-view-width",
      "--size-popover-import-width",
      "--size-popover-actions-width",
      "--size-popover-settings-width",
      "--size-popover-sort-width",
      "--size-popover-sort-height",
      "--size-popover-sort-field-width",
      "--size-popover-sort-field-height",
      "--size-popover-sort-field-top",
      "--size-popover-sort-inset-inline",
      "--size-popover-sort-inset-end",
      "--size-popover-sort-field-gap",
      "--size-popover-sort-label-gap",
      "--size-popover-sort-actions-offset",
      "--size-popover-sort-button-height",
      "--size-popover-sort-cancel-width",
      "--size-popover-sort-apply-width",
      "--size-popover-sort-button-gap",
    ],
  },
  {
    label: "Record detail timeline",
    tokens: [
      "--size-detail-timeline-width",
      "--size-detail-timeline-subtab-row-height",
      "--size-detail-timeline-subtab-inset",
      "--size-detail-timeline-subtab-padding-inline",
      "--size-detail-timeline-subtab-underline-height",
      "--size-detail-timeline-history-padding-top",
      "--size-detail-timeline-history-padding-inline",
      "--size-detail-timeline-filter-button-width",
      "--size-detail-timeline-filter-button-height",
      "--size-detail-timeline-filter-button-gap",
      "--size-detail-timeline-filter-panel-gap",
      "--size-detail-timeline-filter-panel-padding-block-start",
      "--size-detail-timeline-filter-panel-padding-inline",
      "--size-detail-timeline-filter-panel-padding-bottom",
      "--size-detail-timeline-filter-field-gap",
      "--size-detail-timeline-filter-selector-row-gap",
      "--size-detail-timeline-filter-row2-margin-top",
      "--size-detail-timeline-filter-selector-width",
      "--size-detail-timeline-filter-selector-height",
      "--size-detail-timeline-filter-selector-padding-inline",
      "--size-detail-timeline-filter-caret-width",
      "--size-detail-timeline-filter-caret-height",
      "--size-detail-timeline-filter-caret-inset",
      "--size-detail-timeline-apply-height",
      "--size-detail-timeline-apply-padding-inline",
      "--size-detail-timeline-track-offset",
      "--size-detail-timeline-date-badge-width",
      "--size-detail-timeline-date-badge-height",
      "--size-detail-timeline-date-badge-offset-inline",
      "--size-detail-timeline-connector-height",
      "--size-detail-timeline-track-center",
      "--size-detail-timeline-time-column-end",
      "--size-detail-timeline-event-icon",
      "--size-detail-timeline-event-icon-offset-inline",
      "--size-detail-timeline-event-column-gap",
      "--size-detail-timeline-event-line-height",
      "--size-detail-timeline-event-body-padding-top",
      "--size-detail-timeline-event-row-padding-bottom",
      "--size-detail-timeline-day-gap",
    ],
  },
  {
    label: "Create/edit form",
    tokens: [
      "--size-form-strip-height",
      "--size-form-strip-padding-end",
      "--size-form-card-inset",
      "--size-form-first-title-center",
      "--size-form-first-content-top",
      "--size-form-section-gap",
      "--size-form-section-title-gap",
      "--size-form-section-title-box-trim",
      "--size-form-portrait",
      "--size-form-label-column-left",
      "--size-form-label-column-right",
      "--size-form-label-gap",
      "--size-form-label-line-height",
      "--size-form-label-padding-top",
      "--size-form-input-left-width",
      "--size-form-input-right-width",
      "--size-form-input-group-width",
      "--size-form-column-gap",
      "--size-form-input-height",
      "--size-form-row-pitch",
      "--size-form-control-padding-inline",
      "--size-form-control-padding-block",
      "--size-form-action-height",
      "--size-form-action-gap",
      "--size-form-action-padding-inline",
      "--size-form-field-group-padding-end",
      "--size-form-field-group-body-top",
      "--size-form-field-group-legend-inset",
      "--size-form-field-group-legend-padding",
      "--size-form-description-height",
    ],
  },
  {
    label: "Generic spacing",
    tokens: ["--space-1", "--space-2", "--space-3", "--space-4", "--space-6", "--space-8"],
  },
] as const;

const ALL_TOKENS = [
  ...COLOUR_GROUPS.flatMap((group) => group.tokens),
  ...TEXT_TOKENS,
  ...WEIGHT_TOKENS,
  ...FONT_TOKENS,
  ...RADIUS_TOKENS,
  ...SHADOW_TOKENS,
  ...SIZE_GROUPS.flatMap((group) => group.tokens),
];

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-text-muted">{label}</h4>
      {children}
    </section>
  );
}

export default function TokensDemo() {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setValues(
      Object.fromEntries(ALL_TOKENS.map((token) => [token, style.getPropertyValue(token).trim()])),
    );
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-text">Colours</h3>
        {COLOUR_GROUPS.map((group) => (
          <Group key={group.label} label={group.label}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tokens.map((token) => (
                <li key={token} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    data-token={token}
                    style={{ backgroundColor: `var(${token})` }}
                    className="h-10 w-10 shrink-0 rounded-md border border-border"
                  />
                  <span className="min-w-0">
                    <code className="block truncate text-sm text-text">{token}</code>
                    <code className="block truncate text-xs text-text-muted">
                      {values[token] ?? "\u00a0"}
                    </code>
                  </span>
                </li>
              ))}
            </ul>
          </Group>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-text">Type scale</h3>
        <ul className="space-y-2">
          {TEXT_TOKENS.map((token) => (
            <li key={token} className="flex flex-wrap items-baseline gap-x-4">
              <span data-token={token} style={{ fontSize: `var(${token})` }} className="text-text">
                Deals closed this quarter
              </span>
              <code className="text-xs text-text-muted">
                {token} · {values[token] ?? ""}
              </code>
            </li>
          ))}
        </ul>
        <Group label="Weights">
          <ul className="space-y-2">
            {WEIGHT_TOKENS.map((token) => (
              <li key={token} className="flex flex-wrap items-baseline gap-x-4">
                <span
                  data-token={token}
                  style={{ fontWeight: `var(${token})` }}
                  className="text-md text-text"
                >
                  Sales pipeline
                </span>
                <code className="text-xs text-text-muted">
                  {token} · {values[token] ?? ""}
                </code>
              </li>
            ))}
          </ul>
        </Group>
        <Group label="Font stacks">
          <ul className="space-y-2">
            {FONT_TOKENS.map((token) => (
              <li key={token} className="space-y-1">
                <span
                  data-token={token}
                  style={{ fontFamily: `var(${token})` }}
                  className="block text-md text-text"
                >
                  Deals closed 0123456789
                </span>
                <code className="block truncate text-xs text-text-muted">
                  {token} · {values[token] ?? ""}
                </code>
              </li>
            ))}
          </ul>
        </Group>
      </section>

      <section className="space-y-4" aria-label="Type roles">
        <h3 className="text-xl font-semibold text-text">Type roles</h3>
        <ul className="space-y-2">
          {TYPE_ROLES.flatMap(({ role, labels, size, weight }) =>
            labels.map((label) => (
              <li key={`${role}-${label}`} className="flex flex-wrap items-baseline gap-x-4">
                <span
                  data-type-role={role}
                  style={{ fontSize: `var(${size})`, fontWeight: `var(${weight})` }}
                  className="inline-block text-text"
                >
                  {label}
                </span>
                <code className="text-xs text-text-muted">{role}</code>
              </li>
            )),
          )}
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-text">Corner radii</h3>
        <ul className="flex flex-wrap gap-6">
          {RADIUS_TOKENS.map((token) => (
            <li key={token} className="space-y-1">
              <span
                aria-hidden="true"
                data-token={token}
                style={{ borderRadius: `var(${token})` }}
                className="block h-16 w-16 border-2 border-primary bg-surface"
              />
              <code className="block text-xs text-text-muted">
                {token} · {values[token] ?? ""}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-text">Shadows</h3>
        <ul className="flex flex-wrap gap-6">
          {SHADOW_TOKENS.map((token) => (
            <li key={token} className="space-y-1">
              <span
                aria-hidden="true"
                data-token={token}
                style={{ boxShadow: `var(${token})` }}
                className="block h-16 w-16 bg-surface"
              />
              <code className="block text-xs text-text-muted">
                {token} · {values[token] ?? ""}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-text">Layout dimensions</h3>
        {SIZE_GROUPS.map((group) => (
          <Group key={group.label} label={group.label}>
            <ul className="space-y-2">
              {group.tokens.map((token) => (
                <li key={token} className="space-y-1">
                  <span
                    aria-hidden="true"
                    data-token={token}
                    style={{ width: `var(${token})` }}
                    className="block h-3 rounded-sm bg-primary"
                  />
                  <code className="block text-xs text-text-muted">
                    {token} · {values[token] ?? ""}
                  </code>
                </li>
              ))}
            </ul>
          </Group>
        ))}
      </section>
    </div>
  );
}
