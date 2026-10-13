import { Icons } from "@/components/ui/icon";
import "./detail-cards.css";

export interface LastUpdateLabelProps {
  text: string;
  /**
   * AD-35 / D-35: drawn in the tab row the indicator carries the clock glyph that sits in front of
   * the text there. In the overview flow (Module 1) it stays plain text.
   */
  inTabRow?: boolean;
}

export function LastUpdateLabel({ text, inTabRow = false }: LastUpdateLabelProps) {
  return (
    <p className={`detail-last-update${inTabRow ? " detail-last-update--tab-row" : ""}`}>
      {inTabRow ? <Icons.clock aria-hidden className="size-4 shrink-0" /> : null}
      {text}
    </p>
  );
}
