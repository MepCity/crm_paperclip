import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Folder,
  Home,
  Info,
  Loader2,
  LogOut,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  X,
} from "lucide-react";
import type { SVGProps } from "react";

/** Named filter glyphs only expose `role="img"` when given an accessible name. */
function filterIconRoleProps(props: SVGProps<SVGSVGElement>) {
  const label = props["aria-label"];
  return label ? { role: "img" as const, "aria-label": label } : {};
}

/** Original filled triangles and magnifier; no reference icon assets or titles. */
function FilterChevronDown(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg viewBox="0 0 8 4.5" fill="currentColor" {...filterIconRoleProps(props)} {...rest}>
      <path d="M0 0h8L4 4.5Z" />
    </svg>
  );
}

function FilterChevronRight(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg viewBox="0 0 4.5 8" fill="currentColor" {...filterIconRoleProps(props)} {...rest}>
      <path d="M0 0v8l4.5-4Z" />
    </svg>
  );
}

function FieldEdit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 12.5 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.5 10.5h1.2l6.6-6.6-1.2-1.2-6.6 6.6v1.2zM9.9 3.3l1.2-1.2c.3-.3.3-.8 0-1.1l-.9-.9c-.3-.3-.8-.3-1.1 0l-1.2 1.2 1.2 1.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function FilterSearch(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg
      viewBox="0 0 13.5 13.5"
      fill="none"
      stroke="currentColor"
      {...filterIconRoleProps(props)}
      {...rest}
    >
      <circle cx="5.5" cy="5.5" r="3.85" strokeWidth="1.5" />
      <path d="M8.8 8.8 12.4 12.4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Original outlined thumb, with no copied icon asset. */
function ThumbDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 28.5 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      {...props}
    >
      <path
        d="M22 1h5v8h-5zM22 2h-8L5 1C3 1 2 2 2 4l1 4c0 1 1 2 3 2h7l-1 3h3l5-5h2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Original checkmark sized to the status menu's measured ink box. */
function StatusCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 10 6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      {...props}
    >
      <path d="m0.6 3.3 2.9 2.6L9.4 0.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type Icon = LucideIcon;

export const Icons = {
  recordPortrait: RecordPortrait,
  thumbDown: ThumbDown,
  statusCheck: StatusCheck,
  filterChevronDown: FilterChevronDown,
  filterChevronRight: FilterChevronRight,
  filterSearch: FilterSearch,
  fieldEdit: FieldEdit,
  building: Building2,
  check: Check,
  chevronUp: ChevronUp,
  folder: Folder,
  home: Home,
  signOut: LogOut,
  hideMenu: PanelLeftClose,
  showMenu: PanelLeftOpen,
  plus: Plus,
  settings: Settings,
  spinner: Loader2,
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
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

/** Original silhouette, kept inline rather than adding an image asset. */
function RecordPortrait(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 48 48"
      fill="currentColor"
      {...props}
    >
      <circle cx="24" cy="17" r="9" />
      <path d="M7 46v-7c0-9 7-15 17-15s17 6 17 15v7Z" />
    </svg>
  );
}

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
