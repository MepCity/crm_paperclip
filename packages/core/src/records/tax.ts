/** Organisation tax definitions (ADR 0016 §4). Fixture data, read-only. */
export interface TaxDefinition {
  name: string;
  percentage: number;
}

export const organisationTaxes: readonly TaxDefinition[] = [
  { name: "Sales Tax", percentage: 0 },
  { name: "Vat", percentage: 20 },
];

/** Display form used in pickers and popups: `Name - P %`. */
export function taxLabel(tax: TaxDefinition): string {
  return `${tax.name} - ${tax.percentage} %`;
}

/** Read method for the UI. */
export function listOrganisationTaxes(): readonly TaxDefinition[] {
  return organisationTaxes.map((tax) => ({ ...tax }));
}

export function findTax(name: string): TaxDefinition | undefined {
  return organisationTaxes.find((tax) => tax.name === name);
}
