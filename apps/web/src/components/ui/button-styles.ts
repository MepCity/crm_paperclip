export const buttonStyles = {
  recordPrimary:
    "font-semibold rounded-md bg-primary bg-linear-to-b from-(--color-primary-gradient-start) to-(--color-record-primary-end) text-primary-text data-disabled:opacity-50",
  recordSecondary:
    "font-normal rounded-md bg-surface bg-linear-to-b from-(--color-record-secondary-start) to-(--color-record-secondary-end) text-text border border-(--color-button-border)",
  recordNavigation:
    "rounded-md bg-transparent text-text data-disabled:text-(--color-record-arrow-disabled) data-disabled:opacity-100!",
  rail: "rounded-md bg-transparent text-rail-text font-semibold data-hovered:bg-rail-surface-raised data-pressed:bg-rail-item-active",
  icon: "rounded-md bg-transparent text-text-muted data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  railIcon:
    "rounded-md bg-transparent text-rail-text data-hovered:bg-rail-surface-raised data-pressed:bg-rail-item-active",
  avatar: "rounded-full bg-avatar text-text font-semibold data-hovered:bg-surface-hover",
  primary:
    "font-semibold rounded-md bg-primary bg-linear-to-b from-(--color-primary-gradient-start) to-(--color-primary-gradient-end) text-primary-text data-hovered:bg-none data-hovered:bg-primary-hover data-pressed:bg-none data-pressed:bg-primary-pressed data-disabled:bg-none! data-disabled:bg-(--color-primary-disabled)! data-disabled:opacity-100!",
  secondary:
    "font-semibold rounded-md bg-surface bg-linear-to-b from-(--color-button-gradient-start) to-(--color-button-gradient-end) text-text border border-(--color-button-border) shadow-sm data-hovered:bg-none data-hovered:bg-surface-hover data-pressed:bg-none data-pressed:bg-surface-pressed",
  ghost:
    "font-semibold rounded-md bg-transparent text-text data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  danger:
    "font-semibold rounded-md bg-danger text-danger-text data-hovered:bg-danger-hover data-pressed:bg-danger-pressed",
  unsavedDialogStay:
    "font-normal rounded-(--radius-create-menu) bg-surface bg-linear-to-b from-(--color-unsaved-dialog-stay-start) to-(--color-unsaved-dialog-stay-end) text-(--color-unsaved-dialog-stay-text) border border-(--color-unsaved-dialog-stay-border) shadow-none data-hovered:bg-none data-hovered:from-(--color-unsaved-dialog-stay-start) data-hovered:to-(--color-unsaved-dialog-stay-end) data-hovered:bg-surface-hover data-pressed:bg-none data-pressed:from-(--color-unsaved-dialog-stay-start) data-pressed:to-(--color-unsaved-dialog-stay-end) data-pressed:bg-surface-pressed",
  unsavedDialogLeave:
    "font-semibold rounded-(--radius-create-menu) bg-linear-to-b from-(--color-unsaved-dialog-leave-start) to-(--color-unsaved-dialog-leave-end) text-(--color-unsaved-dialog-leave-text) data-hovered:bg-none data-hovered:from-(--color-unsaved-dialog-leave-start) data-hovered:to-(--color-unsaved-dialog-leave-end) data-pressed:bg-none data-pressed:from-(--color-unsaved-dialog-leave-start) data-pressed:to-(--color-unsaved-dialog-leave-end)",
};

export const buttonSizes = {
  record: "h-(--size-button-ellipsis-height) text-md px-3 py-0",
  compact: "p-0 text-md",
  selector: "p-0 text-base",
  avatar: "p-0 text-xs",
  listFilter:
    "h-(--size-list-filter-button-height) w-(--size-list-filter-button-width) text-md p-0",
  listIcon: "h-(--size-list-view-icon) w-(--size-list-view-icon) text-sm p-0",
  listToolbar: "h-(--size-button-split-height) text-md px-3 py-0",
  toolbar: "h-(--size-button-split-height) text-sm px-3 py-0",
  splitPrimary:
    "h-(--size-button-split-height) min-w-(--size-button-split-primary) text-md px-2 py-0",
  splitArrow: "h-(--size-button-split-height) w-(--size-button-split-arrow) text-sm p-0",
  actions: "h-(--size-button-ellipsis-height) w-(--size-button-ellipsis-width) text-sm p-0",
  formAction: "h-(--size-form-action-height) text-md px-(--size-form-action-padding-inline) py-0",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
};
