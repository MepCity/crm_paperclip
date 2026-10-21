"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import "./form.css";

/** Contacts form inventory chrome (F-55–F-57, M11): visible, inert until customization ships. */
export function RecordFormClientScriptTab() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      laterModule="M11"
      className="record-form-client-script-tab"
      aria-label="Client Script"
    >
      <Icons.chevronLeft className="record-form-client-script-tab__icon" aria-hidden />
      <span className="record-form-client-script-tab__label">Client Script</span>
    </Button>
  );
}

export function RecordFormInventoryFooter({
  alignEnd = false,
  pinBottom = false,
}: {
  alignEnd?: boolean;
  pinBottom?: boolean;
}) {
  return (
    <footer
      className="record-form-inventory-footer"
      data-align-end={alignEnd || undefined}
      data-pin-bottom={pinBottom || undefined}
      data-record-form-inventory-footer
    >
      <span className="record-form-inventory-footer__label">Create Form Views :</span>
      <Button
        type="button"
        variant="ghost"
        size="md"
        laterModule="M11"
        className="record-form-standard-view"
      >
        Standard View
        <Icons.chevronDown className="record-form-standard-view__icon" aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="md" laterModule="M11">
        Create a custom form page
      </Button>
    </footer>
  );
}

export function RecordFormEditPageLayoutLink() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      laterModule="M11"
      className="record-form-edit-page-layout"
    >
      Edit Page Layout
    </Button>
  );
}
