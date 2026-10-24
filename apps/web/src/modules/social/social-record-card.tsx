"use client";

import { useState } from "react";

const NETWORKS = [
  { id: "twitter", label: "Associate Twitter" },
  { id: "facebook", label: "Associate Facebook" },
] as const;

const GUIDANCE =
  "Profiles are linked from the Social tab. Open it to search for a profile and associate it with this record.";

/** Neutral line-art of two linked profile bubbles. */
function SocialIllustration() {
  return (
    <svg
      width="96"
      height="72"
      viewBox="0 0 96 72"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-text-muted"
    >
      <circle cx="30" cy="30" r="14" stroke="currentColor" strokeWidth="2" />
      <circle cx="66" cy="30" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M44 30h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M14 62c2-8 9-12 16-12s14 4 16 12M50 62c2-8 9-12 16-12s14 4 16 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Unassociated Social card body for record detail; static, issues no request. */
export function SocialRecordCardBody() {
  const [explained, setExplained] = useState<string | null>(null);
  return (
    <div className="flex divide-x divide-panel-border py-4">
      <div className="flex min-w-[200px] flex-col gap-2.5 pr-8">
        {NETWORKS.map((network) => (
          <button
            key={network.id}
            type="button"
            onClick={() => setExplained(network.id)}
            className="w-fit cursor-pointer text-left text-md font-normal text-primary hover:underline"
          >
            {network.label}
          </button>
        ))}
      </div>
      <div className="flex max-w-lg items-center gap-6 pl-8">
        <SocialIllustration />
        <p className="text-sm leading-relaxed text-text-muted">
          {explained ? GUIDANCE : "No social profile is associated with this record yet."}
        </p>
      </div>
    </div>
  );
}
