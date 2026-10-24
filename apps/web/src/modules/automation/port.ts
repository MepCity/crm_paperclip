import {
  type AutomationPort,
  createMemoryAutomationPort,
  type MemoryAutomationOptions,
} from "@crm/core/automation";

/**
 * Server-side factory for the read-only automation port (workflow and assignment).
 * Default fixture is empty and fully synthetic; no reference data, no write capability.
 */
export function createAutomationPort(options?: MemoryAutomationOptions): AutomationPort {
  return createMemoryAutomationPort(options);
}
