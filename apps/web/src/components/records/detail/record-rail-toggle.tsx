"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";

export interface RecordRailToggleProps {
  railVisible: boolean;
  onRailVisibleChange: (visible: boolean) => void;
}

export function RecordRailToggle({ railVisible, onRailVisibleChange }: RecordRailToggleProps) {
  return (
    <Button
      variant="icon"
      size="compact"
      aria-pressed={railVisible}
      aria-controls="record-related-rail"
      aria-expanded={railVisible}
      aria-label={railVisible ? "Hide Related List" : "Show Related List"}
      onPress={() => onRailVisibleChange(!railVisible)}
      className={`size-(--size-record-toggle-slot) rounded-full! ${
        railVisible
          ? "border-0 bg-(--color-record-rail-toggle-shown)! text-text"
          : "border border-(--color-record-rail-toggle-hidden-border) bg-surface! text-text"
      }`}
    >
      {railVisible ? (
        <Icons.hideMenu className="size-(--size-topbar-icon)" aria-hidden />
      ) : (
        <Icons.showMenu className="size-(--size-topbar-icon)" aria-hidden />
      )}
    </Button>
  );
}
