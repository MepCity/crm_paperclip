import { createTemplateDatabase, startTestPostgres } from "./testing";

declare module "vitest" {
  export interface ProvidedContext {
    crmAdminUrl: string;
  }
}

type GlobalSetupContext = { provide(key: "crmAdminUrl", value: string): void };

/** startTestPostgres uses the shared signal-shutdown helper. Starts one throwaway PostgreSQL for the whole run and prepares the template database. */
export default async function setup(project: GlobalSetupContext): Promise<() => Promise<void>> {
  const postgres = await startTestPostgres();
  try {
    await createTemplateDatabase(postgres.adminUrl);
  } catch (error) {
    await postgres.stop();
    throw error;
  }
  project.provide("crmAdminUrl", postgres.adminUrl);
  return () => postgres.stop();
}
