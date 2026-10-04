"use client";
import { Button } from "./button";
export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
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
