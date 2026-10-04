"use client";
import { Button } from "./button";
import { Icons } from "./icon";
export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex gap-2 bg-rail-surface p-3">
        <Button variant="rail" size="compact">
          Rail
        </Button>
        <Button variant="railIcon" size="compact" aria-label="Hide menu">
          <Icons.hideMenu className="size-(--size-topbar-icon)" aria-hidden />
        </Button>
      </div>
      <Button variant="icon" size="compact" aria-label="Settings">
        <Icons.settings className="size-(--size-topbar-icon)" aria-hidden />
      </Button>
      <Button
        variant="avatar"
        size="avatar"
        className="size-(--size-topbar-avatar)"
        aria-label="User menu"
      >
        EU
      </Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="primary" isPending>
        Pending
      </Button>
      <Button variant="primary" isDisabled>
        Disabled
      </Button>
    </div>
  );
}
