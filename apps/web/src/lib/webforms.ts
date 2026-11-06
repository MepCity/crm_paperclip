import { createWebformService, type WebformService } from "@crm/core/webforms";

let service: WebformService | undefined;

export function getWebforms(): WebformService {
  if (!service) {
    service = createWebformService();
  }
  return service;
}
