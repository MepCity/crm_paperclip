import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
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

export type Icon = LucideIcon;

export const Icons = {
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
  chevronDown: ChevronDown,
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
