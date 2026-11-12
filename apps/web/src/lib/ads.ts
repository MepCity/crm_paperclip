import {
  type AdsService,
  type AttributionService,
  createAdsService,
  createAttributionService,
} from "@crm/core/ads";

let service: AdsService | undefined;
let attribution: AttributionService | undefined;

export function getAds(): AdsService {
  if (!service) {
    service = createAdsService();
  }
  return service;
}

export function getAttribution(): AttributionService {
  if (!attribution) {
    attribution = createAttributionService();
  }
  return attribution;
}
