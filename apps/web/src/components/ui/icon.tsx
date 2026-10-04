import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  type LucideIcon,
  X,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  spinner: Loader2,
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  chevronDown: ChevronDown,
  close: X,
};
