"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { PicklistMenu } from "@/components/ui/picklist-menu";
import type { StageBarLabels, StageBarStage, StageKind } from "./types";
import "./stage-bar.css";

export interface StageBarProps {
  stages: readonly StageBarStage[];
  currentStageValue: string;
  startDate: string;
  closingDate: string;
  labels: StageBarLabels;
  onSelectStage: (value: string) => void;
  isDisabled?: boolean;
  defaultOpenMenu?: "won" | "lost";
}

function TerminalThumb({ kind }: { kind: "won" | "lost" }) {
  const up = "M2 7h3v7H2zM6 7l3-6c1 0 2 1 2 2v3h3c1 0 2 1 1.7 2l-1 4c-.2.7-.8 1-1.5 1H6z";
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="stage-bar-thumb">
      <path d={up} transform={kind === "lost" ? "rotate(180 8 8)" : undefined} />
    </svg>
  );
}

function stageByValue(stages: readonly StageBarStage[], value: string) {
  return stages.find((stage) => stage.value === value);
}

function openStages(stages: readonly StageBarStage[]) {
  return stages.filter((stage) => stage.kind === "open");
}

function terminalStages(stages: readonly StageBarStage[], kind: StageKind) {
  return stages.filter((stage) => stage.kind === kind);
}

export function StageBar({
  stages,
  currentStageValue,
  startDate,
  closingDate,
  labels,
  onSelectStage,
  isDisabled = false,
  defaultOpenMenu,
}: StageBarProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [scroll, setScroll] = useState({ start: true, end: false });

  const current = stageByValue(stages, currentStageValue);
  const open = useMemo(() => openStages(stages), [stages]);
  const wonStages = useMemo(() => terminalStages(stages, "won"), [stages]);
  const lostStages = useMemo(() => terminalStages(stages, "lost"), [stages]);
  const currentOpenIndex = open.findIndex((stage) => stage.value === currentStageValue);
  const isClosed = current?.kind === "won" || current?.kind === "lost";

  useEffect(() => {
    const measure = () => {
      const element = viewport.current;
      if (!element) return;
      setOverflow(element.scrollWidth > element.clientWidth + 1);
      setScroll({
        start: element.scrollLeft <= 1,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
      });
    };
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (track.current) observer.observe(track.current);
    measure();
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, []);

  function move(direction: number) {
    viewport.current?.scrollBy({
      left: (direction * viewport.current.clientWidth) / 2,
      behavior: "smooth",
    });
  }

  const menuProps = {
    searchLabel: labels.search,
    searchPlaceholder: labels.searchPlaceholder,
    emptyLabel: labels.empty,
    value: currentStageValue,
    onSelect: (value: string | null) => {
      if (value !== null) onSelectStage(value);
    },
  };

  function stepState(index: number): "passed" | "current" | "future" {
    if (isClosed) return "passed";
    if (currentOpenIndex < 0) return "future";
    if (index < currentOpenIndex) return "passed";
    if (index === currentOpenIndex) return "current";
    return "future";
  }

  return (
    <section
      aria-label={labels.bar}
      className="stage-bar"
      data-stage-bar
      data-disabled={isDisabled ? "" : undefined}
      aria-busy={isDisabled || undefined}
    >
      <div className="stage-bar-dates">
        <span className="stage-bar-date">
          {labels.startPrefix}
          <span className="stage-bar-date-value">{startDate}</span>
        </span>
        <span className="stage-bar-date stage-bar-date-closing">
          {labels.closingPrefix}
          <span className="stage-bar-date-value">
            <Icons.stopwatch aria-hidden className="stage-bar-stopwatch" />
            {closingDate}
          </span>
        </span>
      </div>
      <div className="stage-bar-lane">
        <div className="stage-bar-track-wrap">
          {overflow && (
            <Button
              variant="ghost"
              className="stage-bar-scroll stage-bar-scroll-previous"
              aria-label={labels.scrollPrevious}
              isDisabled={isDisabled || scroll.start}
              onPress={() => move(-1)}
            >
              <Icons.chevronLeft aria-hidden />
            </Button>
          )}
          <div
            ref={viewport}
            className="stage-bar-viewport"
            onScroll={(event) => {
              const element = event.currentTarget;
              setScroll({
                start: element.scrollLeft <= 1,
                end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
              });
            }}
          >
            <ol ref={track} className="stage-bar-track">
              {open.map((stage, index) => {
                const state = stepState(index);
                const isCurrent = state === "current";
                return (
                  <li
                    key={stage.value}
                    className="stage-bar-step"
                    data-state={state}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <span className="stage-bar-chevron" aria-hidden />
                    {isCurrent ? (
                      <div className="stage-bar-current">
                        {stage.label}
                        <Icons.filterChevronDown aria-hidden className="stage-bar-current-caret" />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="stage-bar-step-button"
                        isDisabled={isDisabled}
                        onPress={() => onSelectStage(stage.value)}
                      >
                        {stage.label}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          {overflow && (
            <Button
              variant="ghost"
              className="stage-bar-scroll stage-bar-scroll-next"
              aria-label={labels.scrollNext}
              isDisabled={isDisabled || scroll.end}
              onPress={() => move(1)}
            >
              <Icons.chevronRight aria-hidden />
            </Button>
          )}
        </div>
        {wonStages.length > 0 && (
          <PicklistMenu
            {...menuProps}
            label={labels.wonMenu}
            appearance="terminal"
            options={wonStages.map((stage) => ({ value: stage.value, label: stage.label }))}
            defaultOpen={defaultOpenMenu === "won"}
            isDisabled={isDisabled}
            trigger={
              <Button
                variant="ghost"
                className="stage-bar-terminal"
                data-kind="won"
                data-active={current?.kind === "won" ? "" : undefined}
                aria-label={labels.wonMenu}
                isDisabled={isDisabled}
              >
                <TerminalThumb kind="won" />
                <Icons.filterChevronDown aria-hidden className="stage-bar-terminal-caret" />
              </Button>
            }
          />
        )}
        {lostStages.length > 0 && (
          <PicklistMenu
            {...menuProps}
            label={labels.lostMenu}
            appearance="terminal"
            options={lostStages.map((stage) => ({ value: stage.value, label: stage.label }))}
            defaultOpen={defaultOpenMenu === "lost"}
            isDisabled={isDisabled}
            trigger={
              <Button
                variant="ghost"
                className="stage-bar-terminal"
                data-kind="lost"
                data-active={current?.kind === "lost" ? "" : undefined}
                aria-label={labels.lostMenu}
                isDisabled={isDisabled}
              >
                <TerminalThumb kind="lost" />
                <Icons.filterChevronDown aria-hidden className="stage-bar-terminal-caret" />
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}
