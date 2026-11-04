---
description: Push a coded component's changes back into the Figma design system (code → Figma), after your approval
argument-hint: <Component> [Component…]   e.g. Footer, or Footer Tile
---

Update the Figma design system to match these coded components: **$ARGUMENTS**

This edits Figma main components in "__Design System - Base" (`ieTXU4rFsUAmlEsF93zF5T`), so every instance in every
file changes. **Never change Figma before the user approves the list in step 4.** Don't commit or push code.

For each component named:

1. **Read the code**: `src/components/<Name>/` (its `.tsx`, `.module.css` and stories). Note every value and state:
   sizes, padding, gaps, radius, fills, strokes, text styles and the tokens behind them.
2. **Read the Figma set(s)** with a read-only `use_figma` call (`design-system/scripts/figma-spec.js`), using the
   node IDs in `design-system/components.md` or the story's `figma()` links. Take one screenshot.
3. **Compare and sort the differences** into three groups:
   - **Push to Figma:** real design changes made in code (a color, padding, text style, radius, a new state or
     variant).
   - **Code-only, keep:** behaviour Figma doesn't model (hover fade animations, focus rings Figma doesn't draw,
     responsive step-downs, minimum gaps, accessibility-only markup). These stay in code.
   - **Can't push yet:** a code value with no Figma variable. Propose the variable (name, collection, Light/Dark
     values, scope); it's added in Figma only with approval, then re-exported to `variables.json` and rebuilt.
4. **Stop and ask.** Show the three groups as a short table, with the main components and the number of variants each
   change touches. Wait for the user's go-ahead (they may approve only part of the list).
5. **Make the approved edits** with `use_figma`:
   - bind every value to a variable or style (resolve the variable for each node, so colors don't render black)
   - keep names, variant properties and component IDs, so instances don't break
   - add new variants inside the existing set
   - note the change in the set's description

   Take a screenshot of the updated set and compare it with the coded story.
6. **Update the records:** `design-system/components.md` (variants, props), and `design-system/AUDIT.md` for any
   notable change.
7. **Report** what changed in Figma, per set and variant, and what was kept code-only. Remind the user to **publish
   the Base library** so other Figma files get the change.
