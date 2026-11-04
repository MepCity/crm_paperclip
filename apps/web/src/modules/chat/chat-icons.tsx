import type { SVGProps } from "react";

/** Small stroke icons for the chat message UI — original art, no reference assets. */
function base(props: SVGProps<SVGSVGElement>, children: React.ReactNode, fill = "none") {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SendIcon(props: SVGProps<SVGSVGElement>) {
  return base(props, <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />);
}

export function StarIcon({ filled, ...props }: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return base(
    props,
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    filled ? "currentColor" : "none",
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return base(props, <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />);
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return base(
    props,
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>,
  );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return base(
    props,
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>,
  );
}

export function ThreadsIcon(props: SVGProps<SVGSVGElement>) {
  return base(
    props,
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </>,
  );
}

export function HashIcon(props: SVGProps<SVGSVGElement>) {
  return base(
    props,
    <>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </>,
  );
}
