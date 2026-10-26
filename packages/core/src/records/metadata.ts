/** Stable module-local baseline identities, independent of tenant and export IDs. */
export const baselineFieldId = (apiName: string) => `field:${apiName}`;
export const baselineLayoutId = (module: string) => `${module}:layout:default`;
