## Problem
The "Optional simulated parent test" selector on the welcome page uses cards (`rounded-xl border bg-background p-4`) that visually match the three `InfoCard` boxes directly above them. As a result, the selector cards read as informational content rather than interactive options a user should click.

## Goal
Make the simulated parent selector immediately recognizable as a set of selectable options, visually distinct from the static info cards above.

## Proposed Changes

### 1. Restyle `SimulatedParentSelector` as a true option group
- Wrap the selector section in its own card that uses a subtle tinted background (`bg-accent/10` or similar) to set it apart from the white info cards.
- Add a clear "Choose a simulated parent type" heading and a sub-line explaining "You may select one."
- Convert each option from a flat card into a selectable row/card with a radio-style indicator on the left.

### 2. Add explicit selection affordances
- Each option gets a circular radio indicator (empty when unselected, filled/checkmark when selected) on the left side.
- Selected option: `border-primary bg-primary/10 ring-1 ring-primary` and filled radio indicator.
- Unselected option: `border-border bg-card hover:border-primary/40` and empty radio indicator.
- Show a cursor pointer and focus ring so it is obviously clickable.

### 3. Increase visual separation from info cards
- Info cards above remain compact, static informational boxes.
- Selector cards become slightly larger vertical cards with an icon, a title in `font-medium text-foreground`, and a description.
- Keep the "Clear selection" button when an option is selected.

### 4. Mobile considerations
- Maintain the current `grid gap-3 sm:grid-cols-3` layout so options stack on mobile and sit side-by-side on desktop.
- Ensure touch targets are at least `min-h-[4rem]` for easy tapping.

### 5. Preserve behavior
- Keep the `simulatedPersona` state and the `onStart` label logic in `WelcomeScreen.tsx` unchanged.
- Keep the 11 existing scenario definitions and the AI paraphrasing flow unchanged.

## Files to modify
- `src/components/mira/SimulatedParentSelector.tsx` — restyle the option cards and selector container.
- `src/components/mira/WelcomeScreen.tsx` — optionally adjust the intro section copy to reduce repetition with the selector sub-line; no functional changes.

## Acceptance criteria
- A first-time visitor can immediately tell the three parent types are clickable options.
- The selected state is obvious.
- The selector still stacks cleanly on mobile and aligns with the rest of the MiraChat design system.