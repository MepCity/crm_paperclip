/**
 * Address state and province fields hold free text in the reference CRM. Their option list only
 * suggests values, so writes and imports accept any text and never drop a value.
 */
export const OPEN_PICKLIST_FIELDS: ReadonlySet<string> = new Set([
  "Billing_State",
  "Shipping_State",
  "Mailing_State",
  "Other_State",
]);
