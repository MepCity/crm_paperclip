"use client";

import type { ReactNode } from "react";
import type { TimelineSubtab } from "./types";
import "./timeline.css";

export interface TimelineSurfaceProps {
  subtabs: readonly TimelineSubtab[];
  activeSubtabId: string;
  onSubtabChange?: (id: string) => void;
  children: ReactNode;
}

export function TimelineSurface({
  subtabs,
  activeSubtabId,
  onSubtabChange,
  children,
}: TimelineSurfaceProps) {
  return (
    <section className="timeline-surface" data-timeline-surface aria-label="Timeline">
      <div className="timeline-subtab-list" role="tablist" aria-label="Timeline sections">
        {subtabs.map((subtab) => {
          const active = subtab.id === activeSubtabId;
          return (
            <button
              key={subtab.id}
              type="button"
              role="tab"
              className="timeline-subtab"
              data-active={active ? "true" : "false"}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSubtabChange?.(subtab.id)}
            >
              {subtab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{children}</div>
    </section>
  );
}
