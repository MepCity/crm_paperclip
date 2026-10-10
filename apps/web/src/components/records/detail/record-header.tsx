"use client";

import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import {
  Menu,
  type MenuAction,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/menu";

export type RecordCommand = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
  isDisabled?: boolean;
} & ({ href: string; onPress?: never } | { href?: never; onPress: () => void });
export interface RecordMenuGroup {
  id: string;
  items: readonly MenuAction[];
}
export interface RecordHeaderProps {
  title: string;
  subtitle?: string;
  back: { label: string } & (
    | { href: string; onPress?: never }
    | { href?: never; onPress: () => void }
  );
  commands?: readonly RecordCommand[];
  menuGroups?: readonly RecordMenuGroup[];
  moreLabel: string;
  previousLabel: string;
  nextLabel: string;
  previousHref?: string;
  nextHref?: string;
}

export function RecordHeader({
  title,
  subtitle,
  back,
  commands = [],
  menuGroups = [],
  moreLabel,
  previousLabel,
  nextLabel,
  previousHref,
  nextHref,
}: RecordHeaderProps) {
  const groups = menuGroups.filter((group) => group.items.length > 0);
  const backIcon = <Icons.arrowLeft aria-hidden className="w-4 h-auto" />;
  const accessibleTitle = subtitle ? `${title} - ${subtitle}` : title;
  return (
    <header
      data-record-header
      className="flex shrink-0 items-center h-(--size-record-header-height) border-b border-panel-border bg-surface pr-(--size-record-header-end)"
    >
      <div className="flex shrink-0 items-center justify-center w-(--size-record-back-region)">
        {back.href ? (
          <Link href={back.href} variant="recordNavigation" size="compact" aria-label={back.label}>
            {backIcon}
          </Link>
        ) : (
          <Button
            variant="recordNavigation"
            size="compact"
            aria-label={back.label}
            onPress={back.onPress}
          >
            {backIcon}
          </Button>
        )}
      </div>
      <div
        data-record-portrait
        aria-hidden
        className="shrink-0 size-(--size-record-portrait) overflow-hidden rounded-md bg-bg text-avatar"
      >
        <Icons.recordPortrait className="h-full w-full" />
      </div>
      <h1
        className="min-w-0 flex-1 truncate ml-(--size-record-title-gap) mr-3 text-text"
        title={accessibleTitle}
        aria-label={accessibleTitle}
      >
        <span className="text-2xl font-bold">{title}</span>
        {subtitle ? (
          <>
            <span
              className="text-md font-normal mx-(--size-record-title-separator-gap)"
              aria-hidden
            >
              -
            </span>
            <span className="text-md font-normal">{subtitle}</span>
          </>
        ) : null}
      </h1>
      <div data-record-commands className="flex shrink-0 items-center gap-(--size-button-gap)">
        {commands.map((command) => {
          const variant = command.variant === "primary" ? "recordPrimary" : "recordSecondary";
          return command.href ? (
            <Link
              key={command.id}
              href={command.href}
              variant={variant}
              size="record"
              isDisabled={command.isDisabled}
            >
              {command.label}
            </Link>
          ) : (
            <Button
              key={command.id}
              variant={variant}
              size="record"
              onPress={command.onPress}
              isDisabled={command.isDisabled}
            >
              {command.label}
            </Button>
          );
        })}
        {groups.length > 0 && (
          <MenuTrigger>
            <Button variant="recordSecondary" size="actions" aria-label={moreLabel}>
              <Icons.ellipsis aria-hidden className="h-4 w-4" />
            </Button>
            <Menu appearance="record" aria-label={moreLabel}>
              {groups.map((group, index) => (
                <Fragment key={group.id}>
                  {index > 0 && <MenuDivider />}
                  <MenuGroup>
                    {group.items.map((item) => (
                      <MenuItem
                        key={item.id}
                        id={item.id}
                        appearance="record"
                        onAction={item.onAction}
                        isDisabled={item.isDisabled}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                  </MenuGroup>
                </Fragment>
              ))}
            </Menu>
          </MenuTrigger>
        )}
        <RecordArrow href={previousHref} label={previousLabel} direction="previous" />
        <RecordArrow href={nextHref} label={nextLabel} direction="next" />
      </div>
    </header>
  );
}

function RecordArrow({
  href,
  label,
  direction,
}: {
  href?: string;
  label: string;
  direction: "previous" | "next";
}) {
  const Icon =
    direction === "previous" ? Icons.recordHeaderChevronLeft : Icons.recordHeaderChevronRight;
  const icon = <Icon aria-hidden className="h-6 w-6" />;
  return href ? (
    <Link
      href={href}
      variant="recordNavigation"
      size="compact"
      aria-label={label}
      className="h-6 w-6"
    >
      {icon}
    </Link>
  ) : (
    <Button
      variant="recordNavigation"
      size="compact"
      aria-label={label}
      isDisabled
      className="h-6 w-6"
    >
      {icon}
    </Button>
  );
}
