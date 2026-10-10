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
      viewBox="3 4 20 17"
      preserveAspectRatio="none"
      overflow="hidden"
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
      <circle cx="5.75" cy="5.75" r="5" strokeWidth="1.5" />
      <path d="M9.3 9.3 12.75 12.75" strokeWidth="1.5" strokeLinecap="round" />
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
function RecordUser({ "aria-hidden": ariaHidden, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : props["aria-label"]}
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

/** Filled portrait silhouette clipped inside the Lead Image ring.
 * record-detail.md › Portrait icon, form and header: 16 × 15.5 px head, body joined at
 * 31 px and 16 px wide there, 34 px wide at 37.5 px, merging with the ring below it. */
function RecordPortraitSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      aria-label={props["aria-label"]}
      viewBox="0 0 48 48"
      fill="currentColor"
      {...props}
    >
      <ellipse cx="24" cy="22.75" rx="8" ry="7.75" />
      <path d="M16 31h16l9 6.5L57 49H-9L7 37.5Z" />
    </svg>
  );
}

/** Filled downward caret for form picklists (8 × 5 px measured). */
function RecordFormCaret({ "aria-hidden": ariaHidden, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 8 5"
      fill="currentColor"
      {...props}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : props["aria-label"]}
    >
      <path d="M0 0h8L4 5Z" />
    </svg>
  );
}

/** Left arrow with shaft for record header Back (ink about 16 × 13.5 px). */
function ArrowLeft(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg
      viewBox="0 0 16 13.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...filterIconRoleProps(props)}
      {...rest}
    >
      <path d="M15.25 6.75H0.75M0.75 6.75 4.5 0.75M0.75 6.75 4.5 12.75" />
    </svg>
  );
}

/** Record header previous/next chevron ink target 7 × 13 px in a 24 × 24 box. */
function RecordHeaderChevronLeft(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...filterIconRoleProps(props)}
      {...rest}
    >
      <path d="M14 6.25 8.5 12 14 17.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecordHeaderChevronRight(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...filterIconRoleProps(props)}
      {...rest}
    >
      <path d="M10 6.25 15.5 12 10 17.75" strokeLinecap="round" strokeLinejoin="round" />
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

/** Dropdown panel row checkmark; record-detail.md › Dropdown panel geometry. */
function RecordPanelCheck(props: SVGProps<SVGSVGElement>) {
  const { "aria-label": _label, ...rest } = props;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative unless aria-label is provided
    <svg
      viewBox="0 0 11.5 8.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      {...filterIconRoleProps(props)}
      {...rest}
    >
      <path d="m0.6 4.2 2.9 2.6 7.5-7.2" strokeLinecap="round" strokeLinejoin="round" />
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
  recordPanelCheck: RecordPanelCheck,
  recordPanelSearch: FilterSearch,
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
  arrowLeft: ArrowLeft,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  recordHeaderChevronLeft: RecordHeaderChevronLeft,
  recordHeaderChevronRight: RecordHeaderChevronRight,
  close: X,
  filter: FilterIcon,
  filterToggle: FilterToggleIcon,
  sort: SortIcon,
  list: ListIcon,
  viewTypeList: ViewTypeListIcon,
  viewTypeSplit: ViewTypeSplitIcon,
  viewTypeGrid: ViewTypeGridIcon,
  viewTypeChart: ViewTypeChartIcon,
  viewTypeConnected: ViewTypeConnectedIcon,
  viewTypeCards: ViewTypeCardsIcon,
  viewTypeArrow: ViewTypeArrowIcon,
  settingsSliders: SettingsSlidersIcon,
  eye: EyeIcon,
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

/** View Settings: sliders inside a rounded frame, drawn in the inherited text colour. */
function SettingsSlidersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="3.75" />
      <path d="M6.75 9.5h10.5M6.75 14.5h10.5" />
      <circle cx="10.25" cy="9.5" r="2" fill="currentColor" stroke="none" />
      <circle cx="13.75" cy="14.5" r="2" fill="currentColor" stroke="none" />
    </ListGlyph>
  );
}

/** View Mode: an eye with a pupil, same 24 box and stroke as the other list glyphs. */
function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ListGlyph {...props}>
      <path d="M2.75 12.5C5.5 8.75 8.5 7 12 7s6.5 1.75 9.25 5.5C18.5 16.25 15.5 18 12 18s-6.5-1.75-9.25-5.5Z" />
      <circle cx="12" cy="12.4" r="2.6" />
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

/**
 * Filled glyphs whose viewBox is the ink box itself, so the painted area is the element box.
 * The measured size is applied by the call site. Original drawings; no reference assets.
 */
function InkGlyph({ viewBox, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative; the element box is the measured ink box
    <svg viewBox={viewBox} fill="currentColor" {...props}>
      {children}
    </svg>
  );
}

/** Advanced-filter toggle funnel: ink box 15 × 16 px. */
function FilterToggleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 15 16" {...props}>
      <path d="M0 0h15v2.4L8.9 10v4L6.1 16v-6L0 2.4Z" />
    </InkGlyph>
  );
}

/** View type, bulleted list: ink box 15.5 × 15.5 px. */
function ViewTypeListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 15.5 15.5" {...props}>
      <path d="M0 0h2v2H0Zm0 6.75h2v2H0Zm0 6.75h2v2H0Z" />
      <path d="M4.5 0h11v2h-11Zm0 6.75h11v2h-11Zm0 6.75h11v2h-11Z" />
    </InkGlyph>
  );
}

/** View type, two columns split vertically: ink box 16 × 16 px. */
function ViewTypeSplitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 16 16" {...props}>
      <path d="M0 0h7v16H0Zm9 0h7v16H9Z" />
    </InkGlyph>
  );
}

/** View type, grid of four cells: ink box 16 × 16 px. */
function ViewTypeGridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 16 16" {...props}>
      <path d="M0 0h7v7H0Zm9 0h7v7H9ZM0 9h7v7H0Zm9 0h7v7H9Z" />
    </InkGlyph>
  );
}

/** View type, pie chart with one slice cut: ink box 15 × 15 px. */
function ViewTypeChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 15 15" {...props}>
      <path
        fillRule="evenodd"
        d="M7.5 0a7.5 7.5 0 1 1 0 15 7.5 7.5 0 1 1 0-15ZM8.5 1.6a6.5 6.5 0 0 1 4.9 4.9H8.5Z"
      />
    </InkGlyph>
  );
}

/** View type, connected blocks: ink box 17 × 13 px. */
function ViewTypeConnectedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 17 13" {...props}>
      <path d="M6 0h5v4H6ZM0 9h5v4H0Zm12 0h5v4h-5Z" />
      <path d="M8 4h1v2.5H8Zm-5.5 2.5h12v1h-12ZM2.5 7.5h1V9h-1Zm11 0h1V9h-1Z" />
    </InkGlyph>
  );
}

/** View type, stacked cards: ink box 16 × 15.5 px. */
function ViewTypeCardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 16 15.5" {...props}>
      <path d="M0 0h16v4.5H0Zm0 5.5h16v4.5H0Zm0 5.5h16v4.5H0Z" />
    </InkGlyph>
  );
}

/** View type switcher overflow arrow: ink box 11 × 6.5 px. */
function ViewTypeArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <InkGlyph viewBox="0 0 11 6.5" {...props}>
      <path d="M5.5 6.5 0 0h11Z" />
    </InkGlyph>
  );
}
