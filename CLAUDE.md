# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.

## Project overview

hub360-prototype is a React component library and Storybook built from the Figma design system "__Design System - Base" ([Figma](https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base), file key `ieTXU4rFsUAmlEsF93zF5T`).

It contains:
- the design tokens as CSS variables and DTCG JSON
- the first batch of coded components (Icon, Button, IconButton, Badge, Checkbox, TextInput, Message)
- a Storybook that documents them, with a link from each story to its Figma component
- an inventory and an audit of the Figma system

There is no application yet. The git remote is `origin` → https://github.com/swildricksolar24/hub360-prototype (public), branch `main`.

Every push to `main` rebuilds Storybook and publishes it to GitHub Pages at https://swildricksolar24.github.io/hub360-prototype/. The workflow is `.github/workflows/storybook-pages.yml`; it runs the type check before building, and a failure stops the deploy.

## Commands

```bash
npm run storybook          # Storybook dev server on http://localhost:6007 (also serves the Storybook MCP at /mcp)
npm run build-storybook    # static build to storybook-static/
npm run typecheck          # tsc --noEmit
npm run build:tokens       # regenerate design-system/tokens/* from figma-export/variables.json
node design-system/scripts/normalize-icons.mjs   # clean SVGs re-exported from Figma into src/components/Icon/svg
```

Storybook runs on **6007**, not the default 6006, because another local project uses 6006. `.mcp.json` registers the Storybook MCP server at `http://localhost:6007/mcp`; it only responds while `npm run storybook` is running. There are no unit tests, and the MCP's `test-run` tool is unavailable because `@storybook/addon-vitest` isn't installed.

## Architecture

```
design-system/
  figma-export/variables.json   Snapshot of Figma variables + text/effect/paint styles (input)
  scripts/build-tokens.mjs      Turns the snapshot into the token files below
  scripts/normalize-icons.mjs   Strips Figma's icon background and makes icon paints currentColor
  tokens/tokens.json            W3C DTCG tokens; Figma modes and scopes under $extensions["com.figma"]
  tokens/tokens.css             CSS custom properties, theme switching, .text-* classes
  components.md                 Inventory of all Figma components (node IDs, variants, properties)
  AUDIT.md                      Design system audit and the fixes applied in Figma
src/
  design-system.md              How to use the tokens and components; read before any UI work
  components/<Name>/            <Name>.tsx, <Name>.module.css, <Name>.stories.tsx
  components/Icon/svg/          109 icons exported from the Figma Icon Library
  docs/Tokens.mdx               "Foundations/Tokens" docs page (reads tokens.json via TokenTables.tsx)
  storybook/                    Story helpers: figma.ts (Figma links), StateGrid.tsx (state grids)
.storybook/                     main.ts, preview.tsx (tokens.css + theme toolbar), preview-head.html (Inter font)
```

Token data flows one way: **Figma → `variables.json` → `build-tokens.mjs` → `tokens.json` + `tokens.css`**.

- **Variable rows:** in `variables.json`, each variable is a row: `[name, type, scopes, ...valuePerMode]`. A value written as `"{Path/To/Var}"` is an alias, and aliases always point within the same collection.
- **CSS names:** `build-tokens.mjs` names CSS variables `--{prefix}-{path}` in kebab-case. The prefixes are `space`, `radius`, `stroke-width` and `color`; Typography variables get no prefix (e.g. `--font-size-medium`). Variables are keyed by collection plus name, because names like `8` repeat across Spacing, Corner Radius and Strokes.
- **Modes:** the Light/Dark color modes become `:root`, `:root[data-theme="dark"]` and a `prefers-color-scheme` fallback. The Desktop/Mobile typography modes become a `max-width: 767px` media query.

## Conventions

- **Generated files:** never hand-edit `design-system/tokens/*`. Change the token in Figma, re-export `variables.json`, then rebuild.
- **Figma is the source of truth:** for token values and component structure. Writes to the Figma file go through the Figma MCP (`use_figma`). Ask before changing an existing main component in Figma, because the change reaches every instance of it.
- **Theme attribute:** `data-theme` must go on `<html>`, or semantic color tokens won't switch to dark values. Storybook's Theme toolbar sets it.
- **Component styling:** CSS Modules using only `tokens.css` variables. Strokes are inset `box-shadow`s, so state changes don't shift layout. States use real CSS (`:hover`, `:active`, `:focus-visible`); Figma's `Selected` maps to `aria-pressed`, and `Disabled` to the native `disabled` attribute.
- **Stories:** one `<Name>.stories.tsx` per component, with a `Playground` story plus one story per Figma component set. Each set story spreads `figma(nodeId, name)` from `src/storybook/figma.ts` (Design panel + "Open in Figma" link). It renders every Figma `State` with `StateGrid`, and spreads `pseudoStates` so Hover / Press / Focus render without a mouse.
- **Validating changes:** after changing `build-tokens.mjs` or `variables.json`, check that every `var()` in `tokens.css` points to a defined variable and every alias in `tokens.json` resolves. After component changes, run `npm run typecheck` and look at the affected stories in Storybook.

## Design system

**Before any task that touches UI, styling, components, colors, spacing, typography, theming or icons, read [`src/design-system.md`](src/design-system.md).** Do this before changing code. It lists the real tokens, the coded components and the usage rules.

- Use tokens, not raw values. Prefer semantic tokens over `--color-foundation-*` primitives.
- If a needed token doesn't exist, stop and raise it rather than hardcoding a value. New tokens are added in Figma first.
- Reuse the coded components in `src/components/` before building new ones. To build a new component, start from its entry in `design-system/components.md`, and check `design-system/AUDIT.md` for known issues with it.
