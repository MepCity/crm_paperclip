"use client";

import type { SVGProps } from "react";

/**
 * Original inline illustrations for chat empty states.
 * We draw our own SVG art; no reference assets are used.
 * Refs: MEP-1419
 */

/** Generic chat-bubble empty-state illustration. */
export function ChatEmptyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden
      className="mx-auto mb-4 size-24 text-text-muted opacity-50"
      {...props}
    >
      {/* Two overlapping speech-bubble rectangles */}
      <rect x="10" y="15" width="72" height="48" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <rect
        x="38"
        y="37"
        width="72"
        height="48"
        rx="10"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* Lines representing text */}
      <line
        x1="24"
        y1="34"
        x2="62"
        y2="34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="44"
        x2="54"
        y2="44"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="52"
        y1="56"
        x2="92"
        y2="56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="52"
        y1="66"
        x2="84"
        y2="66"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Contact / person empty-state illustration. */
export function ContactEmptyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden
      className="mx-auto mb-4 size-24 text-text-muted opacity-50"
      {...props}
    >
      {/* Head */}
      <circle cx="60" cy="32" r="18" stroke="currentColor" strokeWidth="2.5" />
      {/* Body silhouette */}
      <path
        d="M20 90 C20 68 38 58 60 58 C82 58 100 68 100 90"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pin / star empty-state illustration. */
export function PinEmptyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden
      className="mx-auto mb-4 size-24 text-text-muted opacity-50"
      {...props}
    >
      {/* Pin shape */}
      <circle cx="60" cy="38" r="20" stroke="currentColor" strokeWidth="2.5" />
      <line
        x1="60"
        y1="58"
        x2="60"
        y2="82"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Small pin head indicator */}
      <circle cx="60" cy="38" r="6" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Unread messages illustration. */
export function UnreadEmptyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden
      className="mx-auto mb-4 size-24 text-text-muted opacity-50"
      {...props}
    >
      <rect x="14" y="20" width="76" height="56" rx="10" stroke="currentColor" strokeWidth="2.5" />
      {/* Envelope flap */}
      <path
        d="M14 30 L52 55 L90 30"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Unread dot */}
      <circle cx="90" cy="24" r="12" fill="var(--color-accent-blue)" />
      <line x1="90" y1="19" x2="90" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="90" cy="31" r="1.5" fill="white" />
    </svg>
  );
}
