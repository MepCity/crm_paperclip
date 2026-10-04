"use client";

import { Button } from "./button";
import { Popover, PopoverTrigger } from "./popover";

export default function PopoverDemo() {
  return (
    <PopoverTrigger>
      <Button variant="secondary">Filters</Button>
      <Popover title="Filters">
        <p className="mb-3 text-sm text-text-muted">Choose which records to show.</p>
        <div className="flex justify-end">
          <Button size="sm">Apply</Button>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
