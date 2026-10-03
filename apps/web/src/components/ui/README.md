# UI Primitives

This directory contains the headless-first design system components, built on `react-aria-components` and Tailwind CSS.

## Rules for adding a new primitive

1. **One primitive, one file:** Use `kebab-case.tsx`. No barrel files (`index.ts`). Import components directly from their file (e.g., `import { Button } from "@/components/ui/button"`).
2. **Design strictly with tokens:** Do not use arbitrary colors (`bg-[#f00]`) or generic tailwind colors (`bg-red-500`). Use semantic tokens like `bg-primary`, `text-text-muted`, `border-border`.
3. **Headless first:** Use `react-aria-components` for interaction and accessibility. Define styles on the `className` directly using Tailwind and Aria data attributes (e.g., `isHovered`, `isDisabled`).
4. **Test thoroughly:** Every primitive must have a `*.test.tsx` file checking keyboard interaction, variants, and accessible roles/labels.
5. **Add a demo:** Create a `*.demo.tsx` file exhibiting all states and variants, and register it in `/dev/ui` (in `apps/web/src/app/dev/ui/demos.ts`).

## What NOT to do

- **No client-side dependencies that aren't strict UI utilities.**
- **Do not introduce heavy styling libraries** (e.g., styled-components, emotion). Tailwind + variables is enough.
- **Do not import from `@crm/core` in client components**, except for types or `@crm/core/errors`.
