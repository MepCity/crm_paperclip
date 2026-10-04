"use client";

import { Button } from "./button";
import { Tooltip, TooltipTrigger } from "./tooltip";

export default function TooltipDemo() {
  return (
    <TooltipTrigger>
      <Button variant="secondary">Account owner</Button>
      <Tooltip>The person who owns this record</Tooltip>
    </TooltipTrigger>
  );
}
