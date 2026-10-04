import AlertDemo from "@/components/ui/alert.demo";
import BadgeDemo from "@/components/ui/badge.demo";
import BreadcrumbsDemo from "@/components/ui/breadcrumbs.demo";
import ButtonDemo from "@/components/ui/button.demo";
import CardDemo from "@/components/ui/card.demo";
import DialogDemo from "@/components/ui/dialog.demo";
import EmptyStateDemo from "@/components/ui/empty-state.demo";
import FormDemo from "@/components/ui/form.demo";
import IconDemo from "@/components/ui/icon.demo";
import LinkDemo from "@/components/ui/link.demo";
import MenuDemo from "@/components/ui/menu.demo";
import PaginationDemo from "@/components/ui/pagination.demo";
import PopoverDemo from "@/components/ui/popover.demo";
import SelectDemo from "@/components/ui/select.demo";
import SkeletonDemo from "@/components/ui/skeleton.demo";
import SpinnerDemo from "@/components/ui/spinner.demo";
import TableDemo from "@/components/ui/table.demo";
import TabsDemo from "@/components/ui/tabs.demo";
import TextFieldDemo from "@/components/ui/text-field.demo";
import ToastDemo from "@/components/ui/toast.demo";
import TooltipDemo from "@/components/ui/tooltip.demo";

export const demos: Record<string, React.ComponentType> = {
  icon: IconDemo,
  button: ButtonDemo,
  link: LinkDemo,
  badge: BadgeDemo,
  alert: AlertDemo,
  card: CardDemo,
  "text-field": TextFieldDemo,
  select: SelectDemo,
  form: FormDemo,
  dialog: DialogDemo,
  menu: MenuDemo,
  table: TableDemo,
  spinner: SpinnerDemo,
  tabs: TabsDemo,
  tooltip: TooltipDemo,
  popover: PopoverDemo,
  toast: ToastDemo,
  pagination: PaginationDemo,
  breadcrumbs: BreadcrumbsDemo,
  "empty-state": EmptyStateDemo,
  skeleton: SkeletonDemo,
};
