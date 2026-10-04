import AlertDemo from "@/components/ui/alert.demo";
import BadgeDemo from "@/components/ui/badge.demo";
import ButtonDemo from "@/components/ui/button.demo";
import CardDemo from "@/components/ui/card.demo";
import DialogDemo from "@/components/ui/dialog.demo";
import FormDemo from "@/components/ui/form.demo";
import IconDemo from "@/components/ui/icon.demo";
import LinkDemo from "@/components/ui/link.demo";
import MenuDemo from "@/components/ui/menu.demo";
import SelectDemo from "@/components/ui/select.demo";
import SpinnerDemo from "@/components/ui/spinner.demo";
import TableDemo from "@/components/ui/table.demo";
import TextFieldDemo from "@/components/ui/text-field.demo";
import TokensDemo from "@/components/ui/tokens.demo";

export const demos: Record<string, React.ComponentType> = {
  tokens: TokensDemo,
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
};
