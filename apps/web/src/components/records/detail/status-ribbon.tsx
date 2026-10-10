"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import {
  type PicklistGroup,
  PicklistMenu,
  type PicklistOption,
} from "@/components/ui/picklist-menu";
import "./status-ribbon.css";

export interface StatusRibbonProps {
  stages: readonly PicklistOption[];
  value: string | null;
  terminalGroups: readonly PicklistGroup[];
  onSelect: (value: string | null) => void;
  labels: {
    ribbon: string;
    stageMenu: string;
    terminalMenu: string;
    search: string;
    searchPlaceholder: string;
    empty: string;
    scrollPrevious: string;
    scrollNext: string;
  };
  defaultOpenMenu?: "stage" | "terminal";
  isDisabled?: boolean;
}

export function StatusRibbon({
  stages,
  value,
  terminalGroups,
  onSelect,
  labels,
  defaultOpenMenu,
  isDisabled = false,
}: StatusRibbonProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [scroll, setScroll] = useState({ start: true, end: false });
  const terminal = new Set(
    terminalGroups.flatMap((group) => group.options.map((option) => option.value)),
  );
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
    value,
    onSelect,
    searchLabel: labels.search,
    searchPlaceholder: labels.searchPlaceholder,
    emptyLabel: labels.empty,
  };
  return (
    <section
      aria-label={labels.ribbon}
      className="status-ribbon"
      data-status-ribbon
      data-disabled={isDisabled ? "" : undefined}
      aria-busy={isDisabled || undefined}
    >
      <div className="status-ribbon-lane">
        {overflow && (
          <Button
            variant="ghost"
            className="status-scroll status-scroll-previous"
            aria-label={labels.scrollPrevious}
            isDisabled={isDisabled || scroll.start}
            onPress={() => move(-1)}
          >
            <Icons.chevronLeft aria-hidden />
          </Button>
        )}
        <div
          ref={viewport}
          className="status-viewport"
          onScroll={(event) => {
            const element = event.currentTarget;
            setScroll({
              start: element.scrollLeft <= 1,
              end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
            });
          }}
        >
          <ol ref={track} className="status-track">
            {stages
              .filter((stage) => stage.value !== null)
              .map((stage) => (
                <li
                  key={stage.value}
                  className="status-stage"
                  aria-current={stage.value === value ? "step" : undefined}
                >
                  <span className="status-chevron" aria-hidden />
                  {stage.value === value ? (
                    <PicklistMenu
                      {...menuProps}
                      label={labels.stageMenu}
                      appearance="stage"
                      options={stages}
                      defaultOpen={defaultOpenMenu === "stage"}
                      isDisabled={isDisabled}
                      trigger={
                        <Button
                          variant="ghost"
                          className="status-current"
                          aria-label={labels.stageMenu}
                          isDisabled={isDisabled}
                        >
                          {terminal.has(stage.value) && (
                            <Icons.thumbDown aria-hidden className="status-stage-thumb" />
                          )}
                          {stage.label}
                          <Icons.filterChevronDown aria-hidden className="status-caret" />
                        </Button>
                      }
                    />
                  ) : (
                    <span className="status-label">
                      {terminal.has(stage.value) && (
                        <Icons.thumbDown aria-hidden className="status-stage-thumb" />
                      )}
                      {stage.label}
                    </span>
                  )}
                </li>
              ))}
          </ol>
        </div>
        {overflow && (
          <Button
            variant="ghost"
            className="status-scroll status-scroll-next"
            aria-label={labels.scrollNext}
            isDisabled={isDisabled || scroll.end}
            onPress={() => move(1)}
          >
            <Icons.chevronRight aria-hidden />
          </Button>
        )}
      </div>
      <PicklistMenu
        {...menuProps}
        label={labels.terminalMenu}
        appearance="terminal"
        groups={terminalGroups}
        defaultOpen={defaultOpenMenu === "terminal"}
        isDisabled={isDisabled}
        trigger={
          <Button
            variant="ghost"
            className="status-terminal"
            aria-label={labels.terminalMenu}
            isDisabled={isDisabled}
          >
            <Icons.thumbDown aria-hidden />
          </Button>
        }
      />
    </section>
  );
}
