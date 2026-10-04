"use client";

import { Button } from "./button";
import { Icons } from "./icon";
import { Link } from "./link";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "./menu";

export interface SplitButtonProps {
  label: string;
  onPress?: () => void;
  href?: string;
  items?: readonly MenuAction[];
}

export function SplitButton({ label, onPress, href, items = [] }: SplitButtonProps) {
  const joined = items.length > 0;
  const primaryClass = joined ? "rounded-r-none" : undefined;
  return (
    <div className="inline-flex shrink-0 items-center" data-split-button>
      {href ? (
        <Link href={href} variant="primary" size="splitPrimary" className={primaryClass}>
          {label}
        </Link>
      ) : (
        <Button size="splitPrimary" onPress={onPress} className={primaryClass}>
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
            <Button aria-label="More" size="splitArrow" className="rounded-l-none">
              <Icons.chevronDown aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Menu
              width="create"
              items={items}
              onAction={(key) => items.find((item) => item.id === key)?.onAction()}
            >
              {(item) => (
                <MenuItem id={item.id} isDisabled={item.isDisabled}>
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
