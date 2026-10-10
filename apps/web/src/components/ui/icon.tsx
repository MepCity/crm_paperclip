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
  Triangle,
  Users,
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

/** Rail/product selector caret; app-shell.md › Rail/product selector (10 × 5 ink). */
function ProductCaretDown(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, style, ...rest } = props;
  return (
    <Triangle
      fill="currentColor"
      strokeWidth={0}
      style={{ transform: "rotate(180deg)", ...style }}
      {...filterIconRoleProps(props)}
      {...rest}
    />
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
      viewBox="0 0 11.5 11.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        transform="translate(-0.5 0.5) scale(1.38 1.23) translate(-1.38 0.11)"
        d="M1.38 9.66h1.1l6.07-6.07-1.1-1.1-6.07 6.07v1.1zM9.11 3.04l1.1-1.1c.28-.28.28-.74 0-1.01l-.83-.83c-.28-.28-.74-.28-1.01 0l-1.1 1.1 1.1 1.1z"
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

/** Original user silhouette for form placeholders and picker action. */
function RecordUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3M2 22h20" />
    </svg>
  );
}

/** White person silhouette for avatar placeholders; original drawing. */
function AvatarPerson(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
    >
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5H3Z" />
    </svg>
  );
}

/** Filled portrait silhouette clipped inside the Lead Image ring. */
function RecordPortraitSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 48 48"
      fill="currentColor"
      {...props}
    >
      <circle cx="24" cy="23" r="8" />
      <path d="M19.75 29h8.5v1.5C31.5 31 34.5 31.8 36 33c1.8 1.5 3.05 2.5 3.75 3L44 48H4l4.25-12C9 35.5 10.2 34.5 12 33c1.5-1.2 4.5-2 7.75-2.5Z" />
    </svg>
  );
}

/** Filled downward caret for form picklists (8 × 5 px measured). */
function RecordFormCaret(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 8 5"
      fill="currentColor"
      {...props}
    >
      <path d="M0 0h8L4 5Z" />
    </svg>
  );
}

function RecordChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
function RecordCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <path d="m3 8 3 3 7-7" />
    </svg>
  );
}
function RecordInfo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v4M8 4v1" />
    </svg>
  );
}

/**
 * Create-menu row glyph. record-detail.md › Global create menu › Module list: every row starts
 * with the same plus, 7 × 7 px with about 1 px strokes, so the ink fills its whole box.
 */
function CreateRecordPlus(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg
      viewBox="0 0 7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...filterIconRoleProps(props)}
      {...rest}
    >
      <path d="M0 3.5h7M3.5 0v7" />
    </svg>
  );
}

export type Icon = LucideIcon;

export const Icons = {
  recordUser: RecordUser,
  avatarPerson: AvatarPerson,
  recordPortraitSilhouette: RecordPortraitSilhouette,
  recordFormCaret: RecordFormCaret,
  recordChevron: RecordChevron,
  recordCheck: RecordCheck,
  recordInfo: RecordInfo,
  recordPortrait: RecordPortrait,
  thumbDown: ThumbDown,
  statusCheck: StatusCheck,
  filterChevronDown: FilterChevronDown,
  productCaretDown: ProductCaretDown,
  filterChevronRight: FilterChevronRight,
  filterSearch: FilterSearch,
  createRecordPlus: CreateRecordPlus,
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
  users: Users,
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
  timelinePencil: TimelinePencilIcon,
  timelineGeneric: TimelineGenericIcon,
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

function TimelinePencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="m14.5 5.5-2 2 4 4 2-2-4-4Z" />
      <path d="M7 13 5 19l6-2 7.5-7.5-4-4L7 13Z" />
    </ListGlyph>
  );
}

function TimelineGenericIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <circle cx="12" cy="12" r="4" />
    </ListGlyph>
  );
}
