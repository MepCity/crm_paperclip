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
      <div className="w-(--size-list-filter-width) space-y-3">
        <Disclosure variant="filter" label="Open section" defaultExpanded>
          <p className="text-sm">Sample content</p>
        </Disclosure>
        <Disclosure variant="filter" label="Closed section">
          <p className="text-sm">More sample content</p>
        </Disclosure>
        <Disclosure variant="filter" label="Disabled section" isDisabled>
          <p>Unavailable content</p>
        </Disclosure>
      </div>
    </div>
  );
}
