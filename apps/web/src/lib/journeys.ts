import { getAccessSnapshot } from "@crm/core/access";
import { createJourneysService, type JourneysService } from "@crm/core/journeys";

let service: JourneysService | undefined;

export function getJourneys(): JourneysService {
  if (!service) {
    service = createJourneysService({
      accessSnapshotProvider: (ctx, userId) =>
        getAccessSnapshot({ ...ctx, userId, accessVersion: undefined }),
    });
  }
  return service;
}
