export type {
  CreateJourneyInput,
  JourneyAction,
  JourneyActionTiming,
  JourneyCallAction,
  JourneyDeadline,
  JourneyDetail,
  JourneyEmailAction,
  JourneyFieldUpdateAction,
  JourneyInstanceFilterOptions,
  JourneyInstanceStatus,
  JourneyInstanceSummary,
  JourneyModule,
  JourneyNotifyUserAction,
  JourneyReportData,
  JourneyReportSummary,
  JourneyState,
  JourneyStateReportMetric,
  JourneyStatus,
  JourneySummary,
  JourneyTaskAction,
  JourneyTransition,
  JourneyTransitionReportMetric,
  JourneyTransitionRunSummary,
  JourneyTrigger,
  JourneyVersionState,
  JourneyVersionSummary,
  RecordJourneyInstanceItem,
  UpdateJourneyDraftInput,
} from "@crm/core/journeys";

export interface JourneyFilters {
  search?: string;
  module?: string;
  status?: string;
}
