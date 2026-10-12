"use client";

import { Button } from "./button";
import { Icons } from "./icon";
import type { ModuleKey } from "./later-module";
import { Link } from "./link";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "./menu";

export interface SplitButtonProps {
  label: string;
  onPress?: () => void;
  href?: string;
  items?: readonly MenuAction[];
  laterModule?: ModuleKey;
  primaryLaterModule?: ModuleKey;
  moreLaterModule?: ModuleKey;
}

export function SplitButton({
  label,
  onPress,
  href,
  items = [],
  laterModule,
  primaryLaterModule,
  moreLaterModule,
}: SplitButtonProps) {
  const primaryLater = primaryLaterModule ?? laterModule;
  const joined = items.length > 0;
  const primaryClass = joined ? "rounded-r-none" : undefined;
  return (
    <div className="inline-flex shrink-0 items-center" data-split-button>
      {href ? (
        <Link
          href={href}
          variant="primary"
          size="splitPrimary"
          className={primaryClass}
          laterModule={primaryLater}
        >
          {label}
        </Link>
      ) : (
        <Button
          size="splitPrimary"
          onPress={onPress}
          className={primaryClass}
          laterModule={primaryLater}
        >
          {label}
        </Button>
      )}
      {joined && (
        <>
          <span
            aria-hidden="true"
            className="h-(--size-button-split-height) w-px bg-(--color-primary-divider)"
            data-split-divider
          />
          <MenuTrigger>
            <Button
              aria-label="More"
              size="splitArrow"
              className="rounded-l-none"
              laterModule={moreLaterModule}
            >
              <Icons.chevronDown aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Menu
              width="create"
              items={items}
              onAction={(key) =>
                items.find((item) => item.id === key && !item.laterModule)?.onAction()
              }
            >
              {(item) => (
                <MenuItem id={item.id} isDisabled={item.isDisabled} laterModule={item.laterModule}>
                  {item.label}
                </MenuItem>
              )}
            </Menu>
          </MenuTrigger>
        </>
      )}
    </div>
  );
}
