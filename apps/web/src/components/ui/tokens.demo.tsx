"use client";

import { type ReactNode, useEffect, useState } from "react";

/**
 * Every token declared in `app/tokens.css`, grouped the same way. The gallery resolves the
 * authored value with `getComputedStyle` so no value is repeated as a literal here.
 */
const COLOUR_GROUPS = [
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
      "--color-surface-selected",
      "--color-surface-active",
      "--color-text-strong",
      "--color-text-disabled",
    ],
  },
] as const;

const TEXT_TOKENS = [
  "--text-2xs",
  "--text-xs",
  "--text-13",
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
  "--font-weight-medium",
  "--font-weight-semibold",
] as const;

const FONT_TOKENS = ["--font-sans", "--font-mono"] as const;

const RADIUS_TOKENS = [
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-full",
] as const;

const SHADOW_TOKENS = ["--shadow-sm", "--shadow-md", "--shadow-lg"] as const;

const SIZE_GROUPS = [
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
      "--size-list-filter-padding",
      "--size-list-filter-search-height",
      "--size-list-filter-row-height",
      "--size-list-filter-button-width",
      "--size-list-filter-button-height",
      "--size-list-header-height",
      "--size-list-header-border",
      "--size-list-row-height",
      "--size-list-row-pitch",
      "--size-list-leading-width",
      "--size-list-leading-pair-width",
      "--size-list-badge-width",
      "--size-list-column-width",
      "--size-list-cell-inset",
      "--size-list-settings-width",
      "--size-list-settings-row-width",
      "--size-list-footer-height",
      "--size-list-view-icon",
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
      "--size-checkbox",
      "--size-checkbox-border",
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
        <h3 className="text-lg font-semibold text-text">Colours</h3>
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
        <h3 className="text-lg font-semibold text-text">Type scale</h3>
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

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-text">Corner radii</h3>
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
        <h3 className="text-lg font-semibold text-text">Shadows</h3>
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
        <h3 className="text-lg font-semibold text-text">Layout dimensions</h3>
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
