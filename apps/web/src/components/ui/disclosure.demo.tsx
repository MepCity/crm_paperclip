"use client";

import { Disclosure } from "./disclosure";
import { Icons } from "./icon";

export default function DisclosureDemo() {
  return (
    <div className="space-y-4">
      <Disclosure label="Details">
        <p>Collapsed initially. Open with Enter or Space.</p>
      </Disclosure>
      <div className="w-(--size-rail-width) bg-rail-surface p-(--size-rail-inset) text-rail-text">
        <Disclosure label="Sales" icon={Icons.folder} variant="rail" defaultExpanded>
          <p className="p-3">Expanded initially.</p>
        </Disclosure>
      </div>
    </div>
  );
}
