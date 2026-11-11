import { createJourneysService, type JourneysService } from "@crm/core/journeys";

let service: JourneysService | undefined;

export function getJourneys(): JourneysService {
  if (!service) {
    service = createJourneysService();
  }
  return service;
}
