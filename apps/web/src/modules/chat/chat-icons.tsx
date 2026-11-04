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
