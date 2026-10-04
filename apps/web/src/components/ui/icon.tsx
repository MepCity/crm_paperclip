import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  type LucideIcon,
  X,
} from "lucide-react";
import type { SVGProps } from "react";

/** Original filled triangles and magnifier; no reference icon assets or titles. */
function FilterChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 8 4.5"
      fill="currentColor"
      {...props}
    >
      <path d="M0 0h8L4 4.5Z" />
    </svg>
  );
}

function FilterChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 4.5 8"
      fill="currentColor"
      {...props}
    >
      <path d="M0 0v8l4.5-4Z" />
    </svg>
  );
}

function FilterSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 13.5 13.5"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <circle cx="5.5" cy="5.5" r="3.85" strokeWidth="1.5" />
      <path d="M8.8 8.8 12.4 12.4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export type Icon = LucideIcon;

export const Icons = {
  filterChevronDown: FilterChevronDown,
  filterChevronRight: FilterChevronRight,
  filterSearch: FilterSearch,
  spinner: Loader2,
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  check: Check,
  calendar: Calendar,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
  filter: FilterIcon,
  sort: SortIcon,
  list: ListIcon,
  refresh: RefreshIcon,
  ellipsis: EllipsisIcon,
};

// Original line drawings for the list chrome; no reference icon assets are used.
function ListGlyph({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}
function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="M3 5h18l-7 8v5l-4 2v-7Z" />
    </ListGlyph>
  );
}
function SortIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="M6 4v16m-3-3 3 3 3-3M18 20V4m-3 3 3-3 3 3" />
    </ListGlyph>
  );
}
function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="M3 6h1M3 12h1M3 18h1" strokeWidth="3" />
    </ListGlyph>
  );
}
function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" />
    </ListGlyph>
  );
}
function EllipsisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="M5 12h.1M12 12h.1M19 12h.1" strokeWidth="3" />
    </ListGlyph>
  );
}
