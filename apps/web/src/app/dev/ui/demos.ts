import AlertDemo from "@/components/ui/alert.demo";
import BadgeDemo from "@/components/ui/badge.demo";
import ButtonDemo from "@/components/ui/button.demo";
import CardDemo from "@/components/ui/card.demo";
import CheckboxDemo from "@/components/ui/checkbox.demo";
import ComboBoxDemo from "@/components/ui/combo-box.demo";
import DatePickerDemo from "@/components/ui/date-picker.demo";
import DialogDemo from "@/components/ui/dialog.demo";
import FormDemo from "@/components/ui/form.demo";
import IconDemo from "@/components/ui/icon.demo";
import LinkDemo from "@/components/ui/link.demo";
import MenuDemo from "@/components/ui/menu.demo";
import NumberFieldDemo from "@/components/ui/number-field.demo";
import RadioGroupDemo from "@/components/ui/radio-group.demo";
import SelectDemo from "@/components/ui/select.demo";
import SpinnerDemo from "@/components/ui/spinner.demo";
import SwitchDemo from "@/components/ui/switch.demo";
import TableDemo from "@/components/ui/table.demo";
import TextAreaDemo from "@/components/ui/text-area.demo";
import TextFieldDemo from "@/components/ui/text-field.demo";

export const demos: Record<string, React.ComponentType> = {
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
  menu: MenuDemo,
  table: TableDemo,
  spinner: SpinnerDemo,
};
