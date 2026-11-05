---
description: Pull a component's current design from the Figma design system into the code (Figma → code)
argument-hint: <Component> [Component…]   e.g. Footer, or Footer Tile
---

Update these coded components to match the Figma design system: **$ARGUMENTS**

Figma is the source of truth. This changes code only: never edit Figma here, and don't commit.

For each component named:

1. **Find it in Figma.** Read `src/design-system.md` first. Look up the component's Figma set(s) in
   `design-system/components.md` (node IDs) and its story's `figma('<nodeId>', …)` links. The file is
   "__Design System - Base" (`ieTXU4rFsUAmlEsF93zF5T`). If a node is missing, search the file by name; it may have
   moved or been renamed. Say so if it was deleted.
2. **Read the current spec** with a read-only `use_figma` call (`design-system/scripts/figma-spec.js` is a ready
   extractor): every variant and state, sizes, padding, gaps, radius, fills, strokes (weight, align, whether they
   count in the layout), text styles and the variables bound to each. Take one screenshot of the set.
3. **Compare with the code** (`src/components/<Name>/`): list every difference.
4. **Update the code** to match, following `design-system/component-build-guide.md`:
   - tokens only, semantic over primitive
   - strokes as inset `box-shadow`
   - real CSS states (`:hover`, `:active`, `:focus-visible`, `aria-pressed`, `disabled`)

   If Figma uses a value with no token, stop and raise it; don't hardcode it. Keep deliberate code-only behaviour
   (hover fades, focus rings Figma doesn't draw), and say which ones you kept.
5. **Update the story** so each Figma set has a story with every state (`StateGrid` + `pseudoStates`) and a correct
   `figma()` link. Update `design-system/components.md` and `src/design-system.md` if variants, props or names
   changed.
6. **Check it:**
   - `npm run typecheck`
   - measure the story in Storybook (port 6007) in light and dark: sizes, colors and states against Figma
   - if the component is used in the prototype, check it there too
   - if its states are in the playground (`playground/`, port 5180), run the contrast check on
     https://accessibleweb.com/color-contrast-checker/ (blend see-through fills over their background first)
7. **Report** a short table: what Figma has, what the code had, what it has now, plus anything not changed and why.
   Leave everything uncommitted.
