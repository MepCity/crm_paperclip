import type { Metadata } from "next";
import { getModuleScreens } from "@/modules/registry";

/** Toolbar titles shared by PageTitle and route metadata. */
export const shellPageTitle = {
  home: "Home",
  settings: "Settings",
  ...Object.fromEntries(
    getModuleScreens().map((definition) => [definition.navigation.id, definition.pageTitle]),
  ),
  loading: "Loading",
  pageNotFound: "Page not found",
  somethingWentWrong: "Something went wrong",
} as const;

export type ShellPageTitle = (typeof shellPageTitle)[keyof typeof shellPageTitle];

export function shellPageMetadata(title: ShellPageTitle): Metadata {
  return { title };
}
