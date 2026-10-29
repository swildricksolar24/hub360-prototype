# Building a component from Figma

How every coded component in `src/components/` is made. Batch 1 (Icon, Button, IconButton, Badge, Checkbox, TextInput, Message) is the reference implementation, so read one of those before starting.

## 1. Read the Figma spec (read-only)

- **File:** `ieTXU4rFsUAmlEsF93zF5T` ("__Design System - Base"). Node IDs for every set are in `design-system/components.md`.
- **Never change the Figma file** while building code. Raise mismatches instead.
- **Extract the spec:** paste `design-system/scripts/figma-spec.js` into a Figma MCP `use_figma` call. Set `SETS` to the component set IDs and `PAGES` to their page IDs. It returns each set's properties, its first variant in full, and every other variant as a diff, with variable names for fills, strokes, spacing, radius and stroke width.
- **Look at it:** take one `get_screenshot` of each set. Sets often render in Dark mode in screenshots.
- **Variable names map to CSS variables** by kebab-casing them with a prefix:
  - `Gray Fill/Hover` → `--color-gray-fill-hover`
  - `Spacing/12` → `--space-12`
  - `Corner Radius/12` → `--radius-12`
  - `Strokes/2` → `--stroke-width-2`
  - `Font Size/Medium` → `--font-size-medium`
- **Text style names map to `.text-*` classes:** `Medium/Semi-Bold` → `.text-medium-semi-bold`, or font-size/line-height variables plus a weight (Regular 400, Medium 500, Semi Bold 600, Bold 700). Every name must exist in `design-system/tokens/tokens.css`.
- **Remote or retired variables** (shown as `«Name»`): map them to the local token with the same value, and list the mapping as a mismatch.

## 2. Write the component

Each component gets a folder `src/components/<Name>/` with three files:
- `<Name>.tsx`: a typed React function component. Props carry a JSDoc comment naming the Figma property or variant they map to.
- `<Name>.module.css`: a CSS Module.
- `<Name>.stories.tsx`: the stories (see section 3).

**Styling rules:**
- Use only `tokens.css` variables. No hex colors, and no px for spacing, radius, stroke width, font size or line height.
- **Component dimensions** with no token (box, avatar or icon sizes) may be px, with a short comment.
- **Primitives** (`--color-foundation-*`) only when Figma itself uses a primitive and no semantic token has that value. Mark each with a comment.
- **Strokes:** draw them as `box-shadow: inset 0 0 0 <width> <color>`, so state changes don't shift layout.
- **Variable-driven states:** set `--bg`, `--fg` and `--ring` custom properties per variant and state, like `Button.module.css` does.

**States:**
- Hover, Press and Focus are real CSS: `:hover`, `:active`, `:focus-visible` (or `:focus-within` on wrappers).
- Selected is `aria-pressed` or `aria-selected`.
- Disabled is the native `disabled` attribute.
- Error and Required are props.
- Never add a `state` prop that fakes hover or focus.

**Composition:**
- Reuse existing components, especially `Icon`, `Button`, `IconButton`, `Checkbox`, `TextInput` and `Badge`.
- Don't recreate a nested Figma instance that already exists in code.

**Accessibility:**
- Use native elements (`button`, `input`, `a`, `dialog`).
- Every control needs an accessible name.
- Decorative icons need no `label`.

**API mapping:**
- Map several Figma sets of one family onto one component with props, as Button does for 25 sets. Don't make one component per Figma set.
- App-specific Figma sets (for example `Screen=Users` variants) become generic components driven by data or props.

**Off limits:**
- No new npm dependencies.
- Don't edit `.storybook/`, `design-system/tokens/`, or the batch-1 components.

## 3. Write the stories

- **Title:** follow the Figma section: `Primitives/<Name>`, `Web Components/<Name>`, `Custom/<Name>`, `Navigation/<Name>` or `Foundations/<Name>`.
- **`Playground` story:** live controls.
- **One story per Figma component set:**
  - Spread `figma(nodeId, 'Page › Set name')` from `src/storybook/figma.ts` into `parameters`.
  - Show every variant. For a `State` axis use `StateGrid` from `src/storybook/StateGrid.tsx`, and spread `pseudoStates` into `parameters` so Hover, Press and Focus render without a mouse.
  - Set `controls: { disable: true }` on these set stories.
- See `Button.stories.tsx` and `Checkbox.stories.tsx` for the pattern.

## 4. Check it

- `npx tsc --noEmit` must report no errors in your files.
- Storybook runs at `http://127.0.0.1:6007` with hot reload. `curl -s http://127.0.0.1:6007/index.json` must list your story IDs.
- Compare at least one story per component against its Figma screenshot. Comparing computed styles in the story iframe (`/iframe.html?id=<story-id>&viewMode=story`) is the most reliable check.

## 5. Report mismatches

For each component, list every place the code deliberately differs from Figma, with the reason. For example:
- a remote or retired variable mapped to a local token
- a hardcoded Figma value replaced with the nearest token
- inconsistent variants normalized
- a state Figma doesn't have
- an app-specific variant made generic
