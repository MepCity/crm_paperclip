"use client";

import type { RecordData } from "@crm/core/records";
import { useState } from "react";
import { SelectRecordDialog } from "@/components/records/form/select-record-dialog";
import { Button } from "@/components/ui/button";
import { RecordChoice } from "@/components/ui/record-choice";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUpdateRecord } from "@/lib/api/client/hooks";
import {
  addParticipant,
  MEETING_PARTICIPANT_MODULES,
  participantEntries,
} from "@/lib/records/meeting-participants";
import { resolveModuleScreenByApiName } from "../registry";
import { meetingParticipants } from "./meeting-participants";
import { MeetingsParticipantsCard } from "./meetings-participants-card";

/**
 * Participants card with a working Add (MD-47). Provisional: Add asks for Contacts or Leads,
 * opens the record picker, and writes the extended list to the record; no invitation is sent.
 */
export function MeetingParticipantsSlot({ record }: { record: RecordData }) {
  const update = useUpdateRecord("Events");
  const [step, setStep] = useState<"closed" | "module" | "record">("closed");
  const [module, setModule] = useState<string>(MEETING_PARTICIPANT_MODULES[0]);
  return (
    <>
      <MeetingsParticipantsCard
        participants={meetingParticipants(record.fields.Participants)}
        onAdd={() => setStep("module")}
      />
      {step === "module" ? (
        <TopAlignedModal isOpen onOpenChange={(open) => !open && setStep("closed")}>
          <div className="p-6" data-participants-module-step>
            <h2 className="mb-3 text-xl font-semibold">Add Participants</h2>
            <RecordChoice
              label="Participant type"
              value={module}
              onChange={(next) => setModule(next ?? MEETING_PARTICIPANT_MODULES[0])}
              options={MEETING_PARTICIPANT_MODULES.map((m) => ({
                value: m,
                label: resolveModuleScreenByApiName(m)?.pluralLabel ?? m,
              }))}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="md" onPress={() => setStep("closed")}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onPress={() => setStep("record")}>
                Next
              </Button>
            </div>
          </div>
        </TopAlignedModal>
      ) : null}
      {step === "record" ? (
        <SelectRecordDialog
          module={module}
          onCancel={() => setStep("closed")}
          onDone={(selected) => {
            const next = addParticipant(participantEntries(record.fields.Participants), selected);
            setStep("closed");
            update.mutate({ id: record.id, input: { Participants: next as never } });
          }}
        />
      ) : null}
    </>
  );
}
