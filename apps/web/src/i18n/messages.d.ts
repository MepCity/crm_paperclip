import type { Messages } from "./catalogs";
import type { UiLanguage } from "./resolve-language";

declare module "next-intl" {
  interface AppConfig {
    Locale: UiLanguage;
    Messages: Messages;
  }
}
