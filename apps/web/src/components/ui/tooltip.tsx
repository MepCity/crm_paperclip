"use client";

import {
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  composeRenderProps,
  type TooltipProps,
  type TooltipTriggerComponentProps,
} from "react-aria-components";

const tooltipClass = "rounded-md bg-text px-2 py-1 text-sm text-surface shadow-md outline-none";

export function TooltipTrigger({
  delay = 0,
  closeDelay = 0,
  ...props
}: TooltipTriggerComponentProps) {
  return <AriaTooltipTrigger delay={delay} closeDelay={closeDelay} {...props} />;
}

export function Tooltip({ className, ...props }: TooltipProps) {
  return (
    <AriaTooltip
      {...props}
      className={composeRenderProps(className, (extra) => `${tooltipClass} ${extra ?? ""}`)}
    />
  );
}
