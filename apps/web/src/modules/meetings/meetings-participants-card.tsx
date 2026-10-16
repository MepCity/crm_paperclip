"use client";

import { Button } from "@/components/ui/button";

export interface MeetingsParticipant {
  id: string;
  name: string;
}

export interface MeetingsParticipantsCardProps {
  participants: readonly MeetingsParticipant[];
  onAdd?: () => void;
}

/**
 * Participants card for the Meetings record detail screen.
 * Inventory: MD-47 (Add button, card heading right).
 * Empty state: "No participant found" (centred body text).
 * Filled state (provisional rule — not observed in reference): one row per
 * participant showing name only; attendance status, invitation and row-removal
 * controls are not rendered.
 * Add behaviour (provisional rule — not observed in reference): calls onAdd
 * when provided; renders a handler-less button when omitted.
 */
export function MeetingsParticipantsCard({ participants, onAdd }: MeetingsParticipantsCardProps) {
  return (
    <section
      aria-label="Participants card"
      data-meetings-participants-card
      className="detail-card border border-panel-border"
    >
      {/* Card header — MD-47 */}
      <div className="flex items-center justify-between min-h-(--size-list-header-height) py-2 border-b border-panel-border">
        <h3 className="text-md font-bold text-text-strong">Participants</h3>
        <Button
          variant="secondary"
          size="compact"
          data-control="MD-47"
          className="border-primary text-primary"
          onPress={onAdd}
        >
          Add
        </Button>
      </div>

      {/* Card body */}
      {participants.length === 0 ? (
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          No participant found
        </div>
      ) : (
        <ul data-part="participants" className="py-2">
          {participants.map((participant) => (
            <li
              key={participant.id}
              data-participant-id={participant.id}
              className="px-2 py-1 text-md text-text"
            >
              {participant.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
