"use client";

import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
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
  laterModule?: ModuleKey;
} & ({ href: string; onPress?: never } | { href?: never; onPress?: () => void });
export interface RecordMenuGroup {
  id: string;
  items: readonly (Omit<MenuAction, "onAction"> & { onAction?: () => void })[];
}
export interface RecordHeaderProps {
  title: string;
  subtitle?: string;
  subtitleLaterModule?: ModuleKey;
  subtitleHref?: string;
  portraitIcon?: import("react").ComponentType<import("react").SVGProps<SVGSVGElement>>;
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
  addTags?: { label: string; laterModule: ModuleKey };
}

export function RecordHeader({
  title,
  subtitle,
  subtitleLaterModule,
  subtitleHref,
  portraitIcon: PortraitIcon,
  back,
  commands = [],
  menuGroups = [],
  moreLabel,
  previousLabel,
  nextLabel,
  previousHref,
  nextHref,
  addTags,
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
        {PortraitIcon ? (
          <PortraitIcon className="h-full w-full" />
        ) : (
          <Icons.recordPortrait className="h-full w-full" />
        )}
      </div>
      <div className="min-w-0 flex-1 ml-(--size-record-title-gap) mr-3">
        <h1
          className="min-w-0 truncate text-text"
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
              {subtitleLaterModule ? (
                <Link href="#" laterModule={subtitleLaterModule} className="text-md font-normal">
                  {subtitle}
                </Link>
              ) : subtitleHref ? (
                <Link href={subtitleHref} className="text-md font-normal">
                  {subtitle}
                </Link>
              ) : (
                <span className="text-md font-normal">{subtitle}</span>
              )}
            </>
          ) : null}
        </h1>
        {addTags ? (
          <div className="mt-1 flex items-center gap-1.5">
            <Icons.recordTag aria-hidden className="size-3.5 text-text-muted shrink-0" />
            <Button variant="ghost" size="compact" laterModule={addTags.laterModule}>
              {addTags.label}
            </Button>
          </div>
        ) : null}
      </div>
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
              laterModule={command.laterModule}
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
              laterModule={command.laterModule}
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
                        laterModule={item.laterModule}
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
