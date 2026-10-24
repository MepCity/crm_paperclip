"use client";

import type { ModuleApiName, RecordData } from "@crm/core/records";
import { ActivityCategoriesCardBody } from "@/components/records/detail/activity-categories-card-body";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { useParentActivities } from "@/lib/records/use-parent-activities";

export interface ParentActivitiesCardBodyProps {
  parentModule: ModuleApiName;
  parentRecord: RecordData;
  variant: "open" | "closed";
  recordPath: (module: ModuleApiName, id: string) => string;
}

export function ParentActivitiesCardBody({
  parentModule,
  parentRecord,
  variant,
  recordPath,
}: ParentActivitiesCardBodyProps) {
  const activities = useParentActivities(parentModule, parentRecord.id, recordPath);
  if (activities.isLoading) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }
  if (activities.isError) return <RelatedRecordsListError />;
  return (
    <ActivityCategoriesCardBody
      variant={variant}
      categories={variant === "open" ? activities.open : activities.closed}
    />
  );
}
