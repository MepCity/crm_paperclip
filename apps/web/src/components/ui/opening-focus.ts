"use client";

/**
 * Claims the focus a dialog gives its secondary button when it opens, unless focus already
 * moved out on its own in the frame between the mount and this callback.
 *
 * Field choice lists render in their own overlay portal, outside the dialog subtree, and
 * React Aria closes such an overlay when focus leaves it. A dialog that opens focus on the
 * secondary button one frame late therefore dismisses a choice list the user just opened,
 * so the frame is only spent on the button while focus is still on the dialog or inside it
 * (ui/README.md: a dialog opens with focus on its secondary button).
 */
export function claimOpeningFocus(button: HTMLElement | null): void {
  if (!button) return;
  const dialog = button.closest("[role=dialog]");
  if (!dialog) {
    button.focus();
    return;
  }
  const active = document.activeElement;
  const movedElsewhere =
    Boolean(active) &&
    active !== document.body &&
    active !== dialog &&
    !dialog.contains(active as Node);
  if (movedElsewhere) return;
  button.focus();
}
