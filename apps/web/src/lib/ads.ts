import { type AdsService, createAdsService } from "@crm/core/ads";

let service: AdsService | undefined;

export function getAds(): AdsService {
  if (!service) {
    service = createAdsService();
  }
  return service;
}
