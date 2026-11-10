import { type CadenceService, createCadenceService } from "@crm/core/cadences";

let service: CadenceService | undefined;

export function getCadences(): CadenceService {
  if (!service) {
    service = createCadenceService();
  }
  return service;
}
