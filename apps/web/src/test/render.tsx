import { type RenderOptions, render as testingLibraryRender } from "@testing-library/react";
import type { ReactElement } from "react";
import { UiProvider } from "@/components/ui/ui-provider";

/**
 * Renders the way the app does: inside `UiProvider`, so React Aria primitives format with the
 * app locale instead of jsdom's. Component tests that exercise a primitive import this `render`.
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  return testingLibraryRender(ui, {
    ...options,
    wrapper: ({ children }) => <UiProvider>{children}</UiProvider>,
  });
}
