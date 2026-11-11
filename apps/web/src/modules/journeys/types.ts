export type {
  CreateJourneyInput,
  JourneyAction,
  JourneyActionTiming,
  JourneyCallAction,
  JourneyDeadline,
  JourneyDetail,
  JourneyEmailAction,
  JourneyFieldUpdateAction,
  JourneyModule,
  JourneyNotifyUserAction,
  JourneyState,
  JourneyStatus,
  JourneySummary,
  JourneyTaskAction,
  JourneyTransition,
  JourneyTrigger,
  JourneyVersionState,
  JourneyVersionSummary,
  UpdateJourneyDraftInput,
} from "@crm/core/journeys";

export interface JourneyFilters {
  search?: string;
  module?: string;
  status?: string;
}
