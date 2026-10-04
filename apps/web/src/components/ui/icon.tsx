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

/** Original disclosure strokes; no reference icon assets are used. */
function FilterChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <title>Downward chevron</title>
      <path d="m2.5 4.5 3.5 3 3.5-3" />
    </svg>
  );
}

function FilterChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <title>Rightward chevron</title>
      <path d="m4.5 2.5 3 3.5-3 3.5" />
    </svg>
  );
}

export type Icon = LucideIcon;

export const Icons = {
  filterChevronDown: FilterChevronDown,
  filterChevronRight: FilterChevronRight,
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
};
