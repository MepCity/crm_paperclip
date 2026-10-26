import { createElement } from "react";
import { NotesCardBody } from "@/components/records/notes/notes-card-body";
import type { RelatedListDefinition } from "./types";

/** Body renderer for the Notes card of a parent record's detail page. */
export function notesCardBody(
  parentModule: "Leads" | "Contacts" | "Accounts" | "Deals" | "Campaigns" | "Cases" | "Solutions",
): NonNullable<RelatedListDefinition["renderBody"]> {
  return ({ record, recordPath }) =>
    record
      ? createElement(NotesCardBody, { parentModule, parentRecord: record, recordPath })
      : undefined;
}

/** Window event the Notes rail "Add" control fires to open the Notes composer. */
export const NOTES_COMPOSE_EVENT = "crm:notes-compose";

export function openNotesComposer(): void {
  window.dispatchEvent(new CustomEvent(NOTES_COMPOSE_EVENT));
}
