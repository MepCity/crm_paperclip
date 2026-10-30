"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Opens the chevron menu when a press lands on it while another modal menu or popover is open.
 * That overlay blocks the page, so its own dismiss swallows the press and the chevron needed a
 * second click; here the same press closes the other overlay and opens this menu.
 */
function useOpenOnPressThroughOverlay(
  trigger: React.RefObject<HTMLButtonElement | null>,
  enabled: boolean,
  open: () => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: PointerEvent) => {
      const button = trigger.current;
      if (!button || event.button !== 0) return;
      if (event.target instanceof Node && button.contains(event.target)) return;
      if (!document.querySelector('[role="menu"], [role="dialog"]')) return;
      const box = button.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        return;
      // After the other overlay has handled this press and closed.
      window.setTimeout(open, 0);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [trigger, enabled, open]);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const arrowRef = useRef<HTMLButtonElement>(null);
  useOpenOnPressThroughOverlay(arrowRef, items.length > 0 && !moreLaterModule, () =>
    setMenuOpen(true),
  );
  const joined = items.length > 0 || Boolean(moreLaterModule);
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
          {items.length > 0 ? (
            <MenuTrigger isOpen={menuOpen} onOpenChange={setMenuOpen}>
              <Button
                ref={arrowRef}
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
                  <MenuItem
                    id={item.id}
                    isDisabled={item.isDisabled}
                    laterModule={item.laterModule}
                  >
                    {item.label}
                  </MenuItem>
                )}
              </Menu>
            </MenuTrigger>
          ) : (
            <Button
              aria-label="More"
              size="splitArrow"
              className="rounded-l-none"
              laterModule={moreLaterModule}
            >
              <Icons.chevronDown aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
