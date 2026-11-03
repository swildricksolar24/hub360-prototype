# Design System Audit — Design System Base

**Source:** [Figma: __Design System - Base](https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base) · **Audited:** 2026-10-29 · **Method:** read-only Plugin API scan of every variable, style and component (nested instances excluded so values are counted once)

## Summary

**Components reviewed:** 195 (188 sets, 7 standalone) · **Variables:** 183 in 5 collections · **Styles:** 26 text, 1 effect, 1 paint · **Issues found:** 31 · **Score:** 64/100

| Area | Score | Verdict |
|---|---|---|
| Token architecture | 20 / 25 | Real primitive → semantic layering with Light/Dark and Desktop/Mobile modes. Scopes are inconsistent and a few values are broken. |
| Token adoption in components | 20 / 25 | Colors and text styles are close to 100% tokenized. The main gap is auto-layout spacing: a 10px gap that the scale doesn't include. |
| Naming consistency | 9 / 20 | Status asterisks in names, generic set names ("Default" ×9), duplicate names, and `State` used for things that aren't states. |
| Component completeness | 12 / 15 | Interactive states are thorough. Sizes are split into separate sets, there's no loading state, and there are no instance-swap props. |
| Documentation | 3 / 15 | About 190 descriptions are auto-generated placeholders. No variable has a description or code syntax. |

The foundation is stronger than most systems at this stage. Colors and type are nearly fully bound to variables. Most of the remaining work is cleanup (naming and scopes) plus one decision about the spacing scale.

## Fixes applied in Figma (2026-10-29)

Applied to the Figma file and **not yet published** to library consumers. The tables below still show the state before these fixes.

| Issue | Change | Result |
|---|---|---|
| T1 | Added `Spacing/10` (GAP scope) and bound all 322 hardcoded 10px gaps to it | Gap binding 57% → **95.5%** (807 / 845). No visual change. |
| T2 (partial) | Added `Strokes/1` and bound the 30 hardcoded 1px strokes (38 nodes, counting per-side strokes) | Stroke binding 87% → **97%**. `Outline` (0.5px) was kept and not renamed. |
| T3 | Deleted `Transparent/50`, `Transparent/25` and `Semantic Red/Green/Blue/50`. No token aliased them. | 183 → 180 variables. Three nested buttons in **Message** had `Blue/50` (0.8%) as a fill override. They now keep that exact color as a plain fill. |
| T6 | All 61 Foundation primitives are hidden (`[]`). Radius → `CORNER_RADIUS`, Strokes → `STROKE_FLOAT`, Spacing → `GAP`, Font Family → `FONT_FAMILY` | No variable is `ALL_SCOPES` anymore. Designers can no longer pick primitives directly; existing bindings are unaffected. |

**Message close button (fixed):** the close button in both **Message** sets used `Button / Icon Only / Small / Secondary` (`430:701`), a set deleted from the canvas. That set was bound to a retired token set (`Semantic Fill/weaker` at 0.2%).
- **Done:** the Default and Hover buttons in Message (`503:3082`, `503:3094`) now use the live **Button Icon › Icon** (`25:356` / `25:359`) and are renamed `Close Button`. Default uses the standard `Gray Fill/Weaker` 10% background. The Close Small icon is kept, and each colored Message's ✕ is re-colored to its Title color (Semantic Blue/Green/Amber/Red 1000).
- **Size:** the button is now **40×40** (32px icon, padding bound to `Spacing/4`), down from 44×44, so each Message is 72px tall instead of 76px. The old 24px icon wasn't possible: Button Icon's icon layer has a 32px minimum size that can't be overridden on an instance, and the shared component was left unchanged.
- **Also found:** the four Hover-state close buttons in the colored Messages are tinted with `System Blue/300`, `System Amber/300` and `System Red/300`. Those come from a retired token set, not this file's variables. Fixed in the token rebinding below.

**Token rebinding to match the code (2026-10-29):** this applied to the batch-1 component pages: Button Base, Block, Small, Tiny, Button Icon, Badge, Checkbox, Text Input and Message. Every binding now points to a variable in this file. The values are identical, so nothing changes visually except the three close-button hover tints.

| Was bound to | Now bound to | Where |
|---|---|---|
| Remote `Brand Teal Fill/Strong, Hover, Press, Disabled` | Local `Brand Teal Fill/*` | Brand buttons (Base, Block, Small) |
| Remote `Brand Orange Fill/*` | Local `Brand Orange Fill/*` | Brand / Orange buttons |
| Remote `Spacing/12`, `Corner Radius/4` | Local `Spacing/12`, `Corner Radius/4` | Small checkboxes |
| Remote `Strokes/Thin` (2px) | Local `Strokes/2` | Text Input borders (60 bindings) |
| Remote `Solid/White` | Local `Foundation/Solid/White` | Page header frames and labels |
| Remote `Spacing/24` as a **font size** | Local `Font Size/Heading 3` (24px) | State labels on the Badge, Checkbox and Text Input pages |
| `Foundation/Semantic Blue / Green / Red/200` | `Semantic Fill/Info / Success / Error Weak` | Typed Message backgrounds |
| `Foundation/Semantic */1000` on text | `Semantic Text/Information / Success / Warning` | Typed Message title and body |
| `Foundation/Semantic */1000` on icons | `Semantic Fill/* Strong` | Typed Message icons and close ✕ |
| Retired `System Blue / Amber / Red/300` | `Semantic Fill/Info / Warning / Error Weak` | Message close-button hover |

Left as it was on purpose: the **Caution** Message background stays on `Foundation/Semantic Amber/200` (20%). No semantic token has that value; `Warning Weak` is 10%.

**Dark-mode Overlay changed in Figma (2026-11-03):** Surfaces/Overlay now points to Foundation/Solid/900 (`#212931`) in Dark, was Solid/800 (`#36454f`); the code was synced to match. That's the same value as Surfaces/Sunken, so in Dark the two no longer differ: anything Sunken on a card (the 35% row tint, a Data Header's fill) blends into it. Kept on purpose; Light mode keeps all four surfaces distinct.

**Dark-mode red changed in Figma (2026-11-03):** the Semantic Red primitives now use the light red `#c73a3a` in Dark too (Red/1000 `#c73a3a`, Red/800 `#c73a3acc`, Red/200 `#c73a3a33`), which undoes the lighter `#ff9c94` from the fix below. The code was synced to match. In Dark, error text (Semantic Text/Error) is now **3.1:1** on Surfaces/Base, **2.6:1** on the error background and **1.9:1** on Surfaces/Overlay (modals, cards), all below the 4.5:1 AA minimum for text; with `#ff9c94` they were 7.8, 5.2 and 4.9. White on the red fill stays 5.1:1. Kept on purpose: the darker red is the chosen look for Dark mode.

**Dark-mode error colors (fixed 2026-10-29):** in Dark mode, `Semantic Text/Error` and `Semantic Fill/Error Weak` both resolved to the same solid `#ff9c94`. Error text on an error background was invisible (1.0:1). That affected the Text Input Error state in Figma, and the coded Checkbox, TextInput and Message error states. Red now follows the same Dark pattern as blue, green and amber; light mode is unchanged.

| Variable | Dark before | Dark after |
|---|---|---|
| `Foundation/Semantic Red/1000` | `#c73a3a` | `#ff9c94` |
| `Foundation/Semantic Red/800` | `#c73a3acc` | `#ff9c94cc` |
| `Foundation/Semantic Red/200` | `#ff9c94` (solid) | `#ff9c9433` (20% tint) |
| `Semantic Text/Error` (Dark) | → Red/200 | → Red/1000 (same `#ff9c94` text color) |

- **Contrast in Dark:**
  - Error text on the error background over `Surfaces/Base` goes from 1.0:1 to **5.2:1**.
  - Error icons on that background go from 2.6:1 to 5.2:1.
  - Over the darker `Surfaces/Overlay` both reach 3.5:1. That's the same as blue, green and amber there, so it's a system-wide issue to solve separately.
- **Red Badge:** its text switched from `Foundation/Solid/White` to `Gray Text/Inverse Strong` (white in light, black in dark; 10.4:1 on the new red), matching the other Badge colors.
- **Error Message:** its title and body are now bound to `Semantic Text/Error`.
- **Light mode (not changed):** error text on an error background over `Surfaces/Base` is 3.67:1. Red's light `/200` is a 14% tint where the other hues use 20%.

**Figma synced to the code (2026-10-29):** applied to every component set on the 67 library pages. A re-scan afterwards found **no bindings to variables outside this file**.

*Part 1 — switched to local variables* (no visible change, or a 10% shift where noted):

| Was bound to | Now bound to | Bindings |
|---|---|---|
| Remote `Strokes/Thin` (2) | `Strokes/2` | 88 |
| Remote `Spacing/24` used as a **font size** | `Font Size/Heading 3` (24) | 80 |
| Remote `Corner Radius/4`, `Spacing/12` | local `Corner Radius/4`, `Spacing/12` | 66 |
| Remote `Solid/White` | `Foundation/Solid/White` | 109 |
| Remote `Small` (16px font size) | `Font Size/Large` | 18 |
| Deleted `Icon/System Blue` | `Semantic Stroke/Info Strong` | 15 |
| Deleted `Icon/Brand Teal`, `Icon/Error` | `Brand Teal Fill/Strong`, `Semantic Fill/Error Strong` | 3 |
| Deleted `Semantic Text/strong`, `Semantic Fill/disabled` | `Gray Text/Strong`, `Gray Fill/Disabled` | 4 |
| Deleted `Semantic Fill/strong` (100%) | `Gray Fill/Strong` (90%) | 1 |
| Deleted `Stroke/Strong` (50%) | `Gray Stroke/Weaker` (40%) | 1 |
| Deleted `Semantic Text/weak` (70%) | `Gray Text/Weak` (80%) | 2 |

*Part 2 — light-mode fixes* (visible changes, matching the code):

| Fix | Where |
|---|---|
| White text and icons → `Gray Text/Strong` / `Gray Fill/Strong` | Accordion (Categories, Drop Down - Accordion), Rating |
| Hover digit `Gray Text/Inverse Strong` → `Gray Text/Strong` | OTP Input |
| Artwork `Gray Fill/Inverse Strong` (white in light) → `Gray Fill/Strong`, with the same change in the coded Logo | Equal Housing Lender, Face ID |
| 18 near-invisible strokes bound to deleted 0.4% variables (`Stroke/Weak`, `Stroke/Disabled`) removed | Checkbox, Radio, OTP, Text Input, Numeric, Selector |
| `Semantic Fill/weaker` → `Gray Fill/Weaker`; `Text/Weakest` (10% text) → `Gray Text/Weak` | ListBox Category |
| `Semantic Text/disabled` (10%) → `Gray Text/Disabled` (20%) | Tag Outline (Disabled) |

Not synced, on purpose:
- The extra code states (focus, press, disabled, open).
- The Caution message background (20% in Figma, 10% in code).
- Tooltip direction and stroke-alignment normalizations.

None of this is published until the Figma library is published.

## Hover fades added in Figma (2026-10-30)

The coded components fade their state colors over 150ms (CSS `ease`). To match, the `State=Default` variant of 81
library sets (86 variants) got a prototype interaction: **On hover → Change to** its `State=Hover` sibling, **Smart
Animate**, 150ms, custom bezier `0.25, 0.1, 0.25, 1`. It covers the buttons (Base, Block, Icon, Small, Tiny, Button
Group parts), the side menu buttons, Chip, Checkbox, Radio Button, Tag, Hyperlink, ListBox, the drop-downs (Label,
Button, Accordion, Selector, Main Drop Down), Context Menu, Menu Sidebar, Search Bar, both Tab Bar pages and Help
Center. Sets whose coded component has no fade were left alone: Text Input, Numeric, Text Area, OTP, Message, Upload,
Editable Cell, Filter Chip drop-down and Tier 3 Icon. Archived and "not used" pages were skipped.

Not synced:
- the Side Menu buttons' press and select scale (a press to 98.5%, a swell to 101% on select), which the Page Tracker's
  buttons share: Figma prototypes can't show it, so the sets carry a note instead (their hover fade was synced on
  2026-11-02, below);
- the Tier 3 collapsed layout (full title, centered sub menu, actions kept top right).

## Required drop-down outline (2026-11-02)

Drop Down Label `State=Required` (2363:179) drew its outline with Brand Teal Stroke/Strong, brighter than the Brand
Teal Stroke/Weak of Text Input - Label `State=Required`, so a required drop-down and a required input next to each
other didn't match. Its `box` stroke (2363:182) is now bound to Brand Teal Stroke/Weak (2px, 70%), the same as the text
input, and the coded Dropdown matches. Files that use the library get it once the library is published.

## Code changes of 2026-11-02 synced to Figma

Every design-system change made in code on Nov 2 was carried into the Base file. Each page touched has
"(Nov 2, 2026)" after its name in the page list, and each changed set has a Development (or, for motion, Interaction)
note headed **Updated Nov 2, 2026** or **New Nov 2, 2026**.

Changed in Figma:
- **Context Menu\*** (486:92): 8px inset (Spacing/8) between the panel and its rows. **Menu Item** (485:1008): 12px side
  padding (Spacing/12), 8px corners (Corner Radius/8), and a new `State=Selected` (Brand Teal Fill/Weaker).
- **Drop Down Menu** (3078:320, new, Drop Down Label page): the open Drop Down, built from Menu Items on the Context
  Menu panel. The coded Dropdown opens this instead of a ListViews list (ListBox on its own still follows ListViews).
- **Toast** (3079:263, new page "- Toast" after "- Message"): Type = Info, Success, Caution, Error; the typed Message on
  Surfaces/Overlay with 4px corners and the Drop Shadow, 560px wide. Coded as the app's `Toast`.
- **Side Menu** sets (Tier 1 Default / Compact, Tier 2 Default / Label / Compact): the On hover Smart Animate is now
  240ms on cubic-bezier(0.2, 0, 0, 1), was 150ms ease.
- Drop Down Label `State=Required` outline (above).

Notes only (the change is in code; the Figma component already fits or can't show it): Drop Down Button › Small
(`menuPlacement="above"`), Page Tracker (Rows per Page is a Drop Down; button motion; disabled icon), Text Input,
Text Area and Numeric (red required asterisk), Tier 1 and Tier 2 (`iconSize`, and how the app shell styles them),
Main Nav Tab Bar (tabs shrink and truncate), Logo Side (brand text), Upload File (`iconSize`), User Headers and Data
Rows (`--data-leading-width`), Button Icon (disabled icon now dims in code, as Figma shows).

Nothing above is in other files until the library is published.

## Raw colors bound to variables (2026-11-03)

A scan of every page found colors not bound to a variable in nine live components. All are fixed:
- **Shadows:** Autocomplete / Dropdown, … / Chips, … / Photo Library, Dialog / Modal (Default, Scrollbar) and Modal -
  Dynamic had a raw #000 25% shadow identical to the Drop Shadow style; they now use the style. Modal - Dialog's own
  larger shadow (0 20 60) is bound to the new **Shadow/Large**.
- **New variables** (Colors, Light and Dark, effect-color scope): **Shadow/Drop** → Foundation/Transparent/Black - 25,
  and **Shadow/Large** → Foundation/Transparent/Black - 18. The **Drop Shadow** effect style's color is bound to
  Shadow/Drop, so `--shadow-drop` in code now reads `var(--color-shadow-drop)`.
- **Card / Row / Small** and **Card / Large:** the 8% #191b26 stroke is bound to Gray Stroke/Disabled (10%).
- **Upload File:** the "browse" link (#0063a0) is bound to Semantic Text/Information, as in the coded UploadFile.

Still raw by design: the logos (brand artwork), the Pointer annotation arrow, the **Skeleton Gradient** paint style
(three grays), documentation layers on the foundation pages, and the "not used" and Testing pages. Figma's purple
component-set outline isn't a design color.

## Token coverage

| Category | Defined | Bound in components | Hardcoded / off-scale |
|---|---|---|---|
| Colors (fills/strokes) | 136 variables (61 primitive, 75 semantic) | ~100% of library components | 0 in components. 31 raw fills in *Holder* Header/Footer, ~70 in logo art (expected for brand marks) |
| Typography | 19 variables, 26 text styles | ~100% of text nodes styled | 2 unstyled (Logo Side), 1 (Cover). 4 text styles not bound to variables |
| Padding | 17 spacing variables | 2,349 / 2,407 (98%) | 58 unbound, 6 off-scale (26px, 50px) |
| Gap (item spacing) | same | 485 / 845 (57%) | **360 unbound, 327 off-scale: 10px ×322, 1px ×5** |
| Corner radius | 6 variables | 559 / 590 (95%) | 31 unbound. Off-scale: 14px ×9, 62px ×3, 2px ×1 |
| Stroke width | 5 variables | 257 / 296 (87%) | 39 unbound. **1px ×30 (no 1px token exists)**, 1.5px ×2 |
| Elevation / shadow | 1 effect style | — | No elevation scale; the shadow color is a raw `#00000040` |
| Motion, breakpoints, z-index | none | — | Not defined |

**Worst offenders for unbound values:** Timeline › Status Step (24), Text Input › Right Double Icon (18), Text Input › Left/Right Icon (16 each), Hyperlink Large/Medium/Small (15 each). In nearly all of them the cause is the 10px gap.

## Token issues

| # | Severity | Issue | Where | Recommendation |
|---|---|---|---|---|
| T1 | High | **10px gap used 322 times, but the spacing scale has no 10.** | Inputs, hyperlinks, buttons, nav | Decide one way: add `Spacing/10`, or move these to 8 or 12. Then bind them. This one change takes gap binding from 57% to ~95%. |
| T2 | High | **No 1px stroke token.** Strokes are 0.5 ("Outline"), 2, 4, 6, 8, so 1px borders are hardcoded (30×). | Strokes collection | Add `Strokes/1`. Rename `Outline` to `0.5` or a semantic name (`hairline`). Note that 0.5px renders unevenly on 1× screens. |
| T3 | High | **`Transparent/50` and `/25` are 0.5% and 0.25% opacity.** They are effectively invisible. On a scale where `/100` = 10%, they should be 5% and 2.5%. `Semantic Red/Green/Blue/50` are 0.5% (Light) and 0.8% (Dark). | Foundation colors | Looks like a percent/fraction entry slip. Fix them to 0.05 and 0.025, or delete them if they're unused. |
| T4 | High | **Brand text tokens fail contrast.** `Brand Orange Text/Strong` (#f36e20 at 80%) on white is ~2.4:1. `Brand Teal Text/Weak` (teal at 30%) is ~1.6:1. Both are scoped to TEXT_FILL. | Colors | Use them only for decorative or large text, or re-point them (Orange text → a darker orange primitive, ≥4.5:1). Teal 1000/900 pass (~6.8:1). |
| T5 | Medium | **`Black - 40` holds 44% (Light) and 60% (Dark).** It's the only alias-with-opacity value in the file, and its name doesn't match either number. | Foundation/Transparent | Rename it (e.g. `Scrim`) and move it out of the primitives into a semantic `Overlay/Scrim`. |
| T6 | Medium | **Inconsistent scopes on primitives.** Six `Foundation/Solid/*` colors and `Black - 40` are `ALL_SCOPES`, while the other 54 primitives are hidden (`[]`). `Corner Radius/8` and `Strokes/Outline` are `ALL_SCOPES`. `Spacing/4` includes `FONT_VARIATIONS`. | All collections | Hide every primitive (`[]`). Give radius `CORNER_RADIUS`, strokes `STROKE_FLOAT`, and spacing `GAP` only. |
| T7 | Medium | **Interaction direction differs by brand.** Teal Fill goes Hover 800 → Press 900 (darker). Orange Fill goes Hover 800 → Press 600 (lighter). | Brand Fill tokens | Pick one direction for pressed states. |
| T8 | Medium | **Uneven semantic ramps.** Warning Weak uses Amber/100 while the other Weak fills use /200. Error and Success Stroke Strong use /800 while Warning and Info use /1000. Red has no /100; Amber has no /50. | Semantic Fill/Stroke | Use the same step map for all four semantic hues. |
| T9 | Medium | **Fixed values that don't switch for dark mode.** `Semantic Red/1000` and all of Brand Orange are identical in both modes, while Green, Blue and Amber lighten. `Gray Fill/Inverse Weak` is Solid/600 in both modes. | Colors | Add dark values, or confirm on purpose that they stay fixed. |
| T10 | Medium | **Primitives and semantics share one collection** ("Colors", 136 vars). Primitives are published alongside semantics. | Collections | Split into `Primitives` (hidden from publishing) and `Semantic` (Light/Dark). This also makes the scope fix in T6 simpler. |
| T11 | Low | **Names that don't match.** `Semantic Text/Information` vs `Semantic Fill/Info …`. Teal has `Text/Strongest` and `Stroke/Strongest`; Orange doesn't. `Logo Color` sits at the root with no group. | Colors | Use `Info` everywhere, and give both brand hues the same slots. |
| T12 | Low | **Single-mode collections are named "Mode 1".** | Spacing, Radius, Strokes | Rename the mode to `Default` (it shows in Dev Mode and in exports). |
| T13 | Low | **Radius scale gaps.** No 16, no "full/pill" token. 14px and 62px appear hardcoded. | Corner Radius | Add 16 and `Full` (9999). Move 14 → 12 and 62 → Full. |
| T14 | Low | **No code syntax or descriptions on any variable.** | All | Set WEB code syntax (e.g. `var(--color-gray-text-strong)`). The generated `tokens/tokens.css` uses that naming. |

## Typography issues

| # | Severity | Issue | Recommendation |
|---|---|---|---|
| Y1 | Medium | `Medium/Semi-Bold`, `Small/Semi-Bold`, `Tiny/Medium` and `Super Tiny/Regular` are **not bound** to the font-size and line-height variables, so they won't switch to Mobile values. | Bind them like the other 21 styles. |
| Y2 | Medium | `Super Tiny/Regular` is 8px with 8px line height (100%). That's below readable size and has no leading. | Remove it, or limit it to non-text uses (e.g. badge counts) and set line height to 12px or more. |
| Y3 | Low | Weight naming varies: `Semi-Bold` vs `Tiny/Semi Bold`. There are no font-weight variables. | Standardize on `Semibold`, and add `Font Weight/*` variables. |
| Y4 | Low | `Annotation/*` (Roboto Mono 16/32/64) are documentation styles published next to product styles. | Prefix them with `_` or `.` so they're hidden from publishing. |

## Naming consistency

| Issue | Components | Recommendation |
|---|---|---|
| **Status asterisks in names.** 60 sets and 38 pages end in `*` (e.g. `Icon*`, `Large*`, `Brand / Orange/ Primary / Icon*`). A few descriptions say the asterisk means "Under UX/UI review"; for most there's no explanation. | Throughout | Remove the `*` from names. Track status in the description, a page status emoji, or Figma's Ready-for-dev marking. Names flow into code and Code Connect. |
| **Generic set names** that only make sense with the page as context: `Default` ×9, `Small` ×7, `Large` ×4, `Medium` ×2, `Icon` ×3, `Primary` ×2, `Brand`, `Text`, `Label`, `Number`, `Parts`. | Checkbox, Tag, Hyperlink, Text Area, Drop Down, Toggle, Tooltip, Avatar… | Fully qualify names: `Checkbox / Default`, `Tag / Small`. Assets-panel search currently returns 9 indistinguishable "Default" sets. |
| **Duplicate names.** Two `Message` sets on one page (503:3072, 503:3176). Two `Breadcrumb` pages (Primitive and Web). Two `Tab Bar` pages (Web and Main Nav). `Header`/`Footer` exist in both Holder and Nav. `Chip` vs `chips` vs Chip page. `Box*` vs `box*`. | Several | Merge them, or rename each to say how it differs. |
| **Spacing and casing in paths.** `Brand / Orange/ Primary*`, `Side Menu / Tier 1 /Compact`, `TimeLine` (page is "Timeline"), lowercase `chips`, `box*`. | Button Base, Side Menu, Timeline | Use ` / ` with a space on both sides and Title Case. |
| **`State` used for non-state values.** Examples: `Part - Horizontal` State = Left/Center/Right; `Drop Down Label` State = "Default - Light", "Required", "Default - No Label"; Sub Menu State = Tiny/Text; Tier 2 State = Label; Tab Button State = "First / Last"; Header Item State = "Default - 2 Icons". | ~12 sets | Split these into separate axes (`Position`, `Size`, `Required` boolean, `Show Label` boolean). Keep `State` for interaction state only. |
| **Generic property names.** `Property` (Timeline › Status Step), `Variant` (Menu Bar). | 2 sets | Rename them (e.g. `Position`). |
| **State order varies.** Some sets go Default, Hover, Press, Selected, Focus, Disabled; others are alphabetical. | Buttons vs Chip/Tag/Inputs | Use one canonical order. It affects the instance property dropdown. |
| **39 single-variant sets.** These are sets whose only variant is `State=Default`: all 9 logos, AppBar, Context Menu, Rating, Scrollbar, Tab Bar, Footer, and more. | Many | Convert them to plain components. The wrapper adds a meaningless property. |

## Component completeness

| Component family | States | Variants / API | Docs | Score | Notes |
|---|---|---|---|---|---|
| Buttons (Base, Block, Small, Tiny, Icon) | ✅ 6 states | ⚠️ 33 sets across 5 pages | ❌ | 6/10 | Size, icon position and style are each separate sets. 3 Brand sets have no `Label` text prop. No Loading state. |
| Text inputs (Label, Numeric, Area, Autocomplete) | ✅ incl. Error | ⚠️ `Required` is a State; Text Area and Numeric lack it | ❌ | 7/10 | Left/Right/Double icon are separate sets instead of booleans. No Read-only or Filled state. |
| Checkbox / Radio | ✅ | ⚠️ Checked is a boolean; no Indeterminate | ❌ | 7/10 | |
| Toggle | ⚠️ On/Off/Disabled only | ⚠️ Large/Small sets plus a Label set with a Size axis | ❌ | 5/10 | No Hover/Focus. Disabled doesn't distinguish on vs off. |
| Chip / Tag | ✅ | ⚠️ 12 sets; icon side is a set, not a prop | ❌ | 6/10 | |
| Avatar / Hyperlink / Tooltip | ✅ | ⚠️ Size is split into separate sets (Avatar *Icon* is the one that uses a Size axis) | ❌ | 6/10 | |
| Drop-downs (Label, Button, Selector, Filter Chip, Tree, Multiselect, Accordion) | ✅ | ⚠️ State mixes interaction, style and required | ❌ | 6/10 | 7 related pages. Consider one Select family. |
| Modal / Message / Notification | ⚠️ | ⚠️ 2 sets named `Message`; 3 modal sets | ❌ | 5/10 | |
| Tabs (Web Tab Bar + Main Nav Tab Bar) | ✅ (no Press) | ⚠️ Two separate tab systems | ❌ | 5/10 | |
| Navigation (Tier 1–3, Sub Menu, Header) | n/a | ⚠️ State used for layout modes | ❌ | 5/10 | Tier 3 has 30 unbound gaps |
| Data Headers / Rows | n/a | ⚠️ `Screen` variants hard-code app screens | ❌ | 5/10 | Fine as app-specific patterns, but they belong outside the base library |

**System-wide gaps:**

- No component has an `INSTANCE_SWAP` property. Icons, avatars and slots can only be swapped by digging into layers.
- No Loading state on buttons or inputs.
- No Date picker (a proposal sits on a "not used" page).
- No Table primitive outside the unused MultiColumn ComboBox.

## Documentation

- **~190 of 195 descriptions** are auto-generated placeholders ("… [Auto-generated Oct 2026 — add usage notes]"). Two are empty (`Side Sub Menu`, `Box*`). Two are Claude proposals on unused pages. **0 have authored usage guidance.**
- **0 / 183 variables** have a description or code syntax.
- The *Please Read* page explains the Primitive / Web / Custom tiers well. Nothing in the file documents the token tiers, theming or naming rules.

## Priority actions

1. **Fix the spacing scale (T1).** Decide on 10px (add the token, or snap to 8/12), then bulk-bind gaps. This is the biggest single win for token adoption and for parity between code and design.
2. **Fix the broken values (T3, T5) and the failing text contrast (T4).** These are small edits that prevent visible bugs and accessibility failures.
3. **Clean up names before anyone wires Code Connect.** Drop the `*` markers, fully qualify generic set names, and de-duplicate `Message`, `Breadcrumb` and `Tab Bar`. Renaming later breaks every consumer.
4. **Consolidate size and icon variants.** Merge `Large/Medium/Small` sets into a `Size` axis, and `Icon - Left/Right` sets into booleans plus an instance-swap. This roughly halves the button, chip and input set count.
5. **Tidy token plumbing (T2, T6, T10, T14).** Add a 1px stroke token, hide primitives, split the collections, and add WEB code syntax that matches `tokens/tokens.css`.
6. **Write real descriptions** for the ~40 most-used primitives (buttons, inputs, checkbox, radio, toggle, select). Cover when to use each, its variants, and keyboard behaviour.

## Files produced by this import

- `figma-export/variables.json` — raw export of all 180 variables (re-exported after the fixes) (per-mode values, aliases, scopes), plus text, effect and paint styles
- `tokens/tokens.json` — W3C DTCG tokens (207), with Figma modes and scopes under `$extensions["com.figma"]`
- `tokens/tokens.css` — CSS custom properties: Light/Dark via `data-theme` and `prefers-color-scheme`, Mobile type via a ≤767px media query, and `.text-*` classes
- `components.md` — inventory of all 195 components with node IDs, variant axes and properties
- `scripts/build-tokens.mjs` — regenerates the token files: `node design-system/scripts/build-tokens.mjs`
