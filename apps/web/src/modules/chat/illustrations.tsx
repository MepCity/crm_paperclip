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
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden
      className="mx-auto h-[80px] w-[80px]"
      {...props}
    >
      <circle cx="40" cy="40" r="38" fill="#eceef1" />
      <circle cx="40" cy="40" r="38" stroke="#f4f5f7" strokeWidth="2" />
      <g fill="#dfe2e7">
        <circle cx="24" cy="26" r="5" />
        <circle cx="24" cy="40" r="5" />
        <circle cx="24" cy="54" r="5" />
      </g>
      <g stroke="#dfe2e7" strokeWidth="4" strokeLinecap="round">
        <line x1="35" y1="26" x2="58" y2="26" />
        <line x1="35" y1="40" x2="58" y2="40" />
        <line x1="35" y1="54" x2="50" y2="54" />
      </g>
    </svg>
  );
}

/** Contact / person empty-state illustration. */
export function ContactEmptyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden
      className="mx-auto h-[80px] w-[80px]"
      {...props}
    >
      <circle cx="40" cy="40" r="38" fill="#eceef1" />
      <circle cx="40" cy="40" r="38" stroke="#f4f5f7" strokeWidth="2" />
      <g fill="#dfe2e7">
        <circle cx="24" cy="26" r="5" />
        <circle cx="24" cy="40" r="5" />
        <circle cx="24" cy="54" r="5" />
      </g>
      <g stroke="#dfe2e7" strokeWidth="4" strokeLinecap="round">
        <line x1="35" y1="26" x2="58" y2="26" />
        <line x1="35" y1="40" x2="58" y2="40" />
        <line x1="35" y1="54" x2="50" y2="54" />
      </g>
    </svg>
  );
}

/** Pin / star empty-state illustration. */
export function PinEmptyIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="38 16 44 68"
      fill="none"
      aria-hidden
      className="mx-auto h-[60px] w-auto text-text-muted opacity-40"
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
      viewBox="0 0 110 70"
      fill="none"
      aria-hidden
      className="mx-auto h-[46px] w-auto"
      {...props}
    >
      <ellipse cx="55" cy="63" rx="46" ry="3" fill="#eef0f3" />
      <path
        d="M10 14 Q10 6 18 6 H50 Q58 6 58 14 V32 Q58 40 50 40 H30 L20 48 L22 40 H18 Q10 40 10 32 Z"
        fill="#f1f2f5"
        stroke="#c9ccd3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="23" r="3" fill="#d5d8de" />
      <circle cx="35" cy="23" r="3" fill="#d5d8de" />
      <path
        d="M52 26 Q52 18 60 18 H92 Q100 18 100 26 V44 Q100 52 92 52 H88 L90 60 L78 52 H60 Q52 52 52 44 Z"
        fill="#fff"
        stroke="#c9ccd3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line
        x1="64"
        y1="30"
        x2="88"
        y2="30"
        stroke="#3b8be8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="64"
        y1="40"
        x2="82"
        y2="40"
        stroke="#3b8be8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
