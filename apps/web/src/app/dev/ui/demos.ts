import RecordDetailDemo from "@/components/records/detail/record-detail.demo";
import RecordDetailCardsDemo from "@/components/records/detail/record-detail-cards.demo";
import FieldInputDemo from "@/components/records/form/field-input.demo";
import RecordFormLayoutDemo from "@/components/records/form/record-form-layout.demo";
import FilterPanelDemo from "@/components/records/list/filter-panel.demo";
import ListChromeDemo from "@/components/records/list/list-chrome.demo";
import RecordTableDemo from "@/components/records/list/record-table.demo";
import AlertDemo from "@/components/ui/alert.demo";
import BadgeDemo from "@/components/ui/badge.demo";
import BreadcrumbsDemo from "@/components/ui/breadcrumbs.demo";
import ButtonDemo from "@/components/ui/button.demo";
import CardDemo from "@/components/ui/card.demo";
import CheckboxDemo from "@/components/ui/checkbox.demo";
import ComboBoxDemo from "@/components/ui/combo-box.demo";
import DatePickerDemo from "@/components/ui/date-picker.demo";
import DialogDemo from "@/components/ui/dialog.demo";
import DisclosureDemo from "@/components/ui/disclosure.demo";
import EmptyStateDemo from "@/components/ui/empty-state.demo";
import FormDemo from "@/components/ui/form.demo";
import IconDemo from "@/components/ui/icon.demo";
import LinkDemo from "@/components/ui/link.demo";
import MenuDemo from "@/components/ui/menu.demo";
import NumberFieldDemo from "@/components/ui/number-field.demo";
import PaginationDemo from "@/components/ui/pagination.demo";
import PopoverDemo from "@/components/ui/popover.demo";
import RadioGroupDemo from "@/components/ui/radio-group.demo";
import SelectDemo from "@/components/ui/select.demo";
import SkeletonDemo from "@/components/ui/skeleton.demo";
import SpinnerDemo from "@/components/ui/spinner.demo";
import SplitButtonDemo from "@/components/ui/split-button.demo";
import SwitchDemo from "@/components/ui/switch.demo";
import TableDemo from "@/components/ui/table.demo";
import TabsDemo from "@/components/ui/tabs.demo";
import TextAreaDemo from "@/components/ui/text-area.demo";
import TextFieldDemo from "@/components/ui/text-field.demo";
import ToastDemo from "@/components/ui/toast.demo";
import TokensDemo from "@/components/ui/tokens.demo";
import TooltipDemo from "@/components/ui/tooltip.demo";

export const demos: Record<string, React.ComponentType> = {
  "field-input": FieldInputDemo,
  "record-detail": RecordDetailDemo,
  "filter-panel": FilterPanelDemo,
  tokens: TokensDemo,
  icon: IconDemo,
  button: ButtonDemo,
  link: LinkDemo,
  badge: BadgeDemo,
  alert: AlertDemo,
  card: CardDemo,
  "text-field": TextFieldDemo,
  "text-area": TextAreaDemo,
  "number-field": NumberFieldDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  "radio-group": RadioGroupDemo,
  "date-picker": DatePickerDemo,
  "combo-box": ComboBoxDemo,
  select: SelectDemo,
  form: FormDemo,
  dialog: DialogDemo,
  disclosure: DisclosureDemo,
  menu: MenuDemo,
  table: TableDemo,
  "record-table": RecordTableDemo,
  "record-detail-cards": RecordDetailCardsDemo,
  spinner: SpinnerDemo,
  tabs: TabsDemo,
  tooltip: TooltipDemo,
  popover: PopoverDemo,
  toast: ToastDemo,
  pagination: PaginationDemo,
  breadcrumbs: BreadcrumbsDemo,
  "empty-state": EmptyStateDemo,
  skeleton: SkeletonDemo,
  "list-chrome": ListChromeDemo,
  "record-form-layout": RecordFormLayoutDemo,
  "split-button": SplitButtonDemo,
};
