"use client";

import { Disclosure } from "./disclosure";

export default function DisclosureDemo() {
  return (
    <div className="w-(--size-list-filter-width) space-y-3">
      <Disclosure label="Open section" defaultExpanded>
        <p className="text-sm">Sample content</p>
      </Disclosure>
      <Disclosure label="Closed section">
        <p className="text-sm">More sample content</p>
      </Disclosure>
      <Disclosure label="Disabled section" isDisabled>
        <p>Unavailable content</p>
      </Disclosure>
    </div>
  );
}
