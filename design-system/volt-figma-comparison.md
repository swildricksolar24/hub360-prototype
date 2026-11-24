# Volt vs Figma Base: full comparison (Nov 24, 2026)

Every coded component in `src/components/` was compared with its sets in "__Design System - Base"
(`ieTXU4rFsUAmlEsF93zF5T`). The comparison was read-only: nothing was changed in code or Figma.

Each set's spec was read with `design-system/scripts/figma-spec.js` and checked against the CSS and TSX: sizes, padding,
gaps, corners, fills, strokes, text styles, bound variables, states, and variant and prop names.

The following were not counted as differences:
- code-only behaviour (fades, focus rings Figma doesn't draw, read-only regions)
- strokes drawn as inset box-shadows
- deprecated prop aliases
- today's changes, which are already in sync

Icon and Logo were left out because they are exported assets.

## Summary

- **Match Figma:** about 30 of the 67 components:
  - Primitives: Badge, Hyperlink, LastModified, RadioButton, Tag, TextInput.
  - Forms: ButtonGroup, Captcha, EditableCell, NumericInput, RangeSlider, Rating, UploadFile.
  - Navigation: Breadcrumb, Footer, MainDropDown, NavTier2, NavTier4, SideMenuButton, SubMenu.
  - Data display: Cards (the coded sets), PageTracker, Status, Timeline.
  - Feedback and overlays: ActionBanner, NotificationBox, Overlay, Skeleton, Toast.
- **Differ:** the rest. Most differences are minor (a token one step off, or a 2px gap).

The tables below list the ones a user would notice first.

## 1. Code was behind Figma (visible): FIXED in Volt on Nov 24, 2026

All 19 rows below are now done. These were left as they are:
- **DropdownTree and MultiselectDropdown:** the 2px gap to the menu stays 4px, per the popup rule.
- **16px text:** uses the Large 24px line height rather than Figma's raw 26px, so the chip is 32px and the tree field 40px, 2px shorter than Figma.
- **SearchBar:** the Active corners already matched.

| Component | Where | Figma | Code |
|---|---|---|---|
| Button | Small (all 3 sets) › corner radius | 8 | 12 (Button.module.css:17) |
| Button | Small Solid / Teal / Base › Disabled label | Gray Text/Disabled | Foundation/Solid/White (:447) |
| Button | Large `brand` (Teal Base / Icon) › Default / Hover fill | Fill/Weak at rest, Fill/Strong on hover | the reverse (:199, :492) |
| Button | Large `brand-orange`, `brand-outline`, `orange-outline` › same pattern | Fill/Weak at rest, Fill/Strong on hover / press | Fill/Strong at rest, Hover / Press tokens after (:211–330) |
| Chip | every set › Selected | Brand Teal Fill/Weaker, no ring | Gray Fill/Weaker + teal ring (Chip.module.css:95–126) |
| Checkbox | Medium - Icon* › label to info icon | 4px | 16px (Checkbox.module.css:12) |
| Checkbox | Small - Icon › info icon | Gray Fill/Strong in every state | Fill/Weak, Disabled, Error colors (:8, :88, :96) |
| ListBox | List Item › Hover | Brand Teal Fill/Weaker | Surfaces/Raised (ListBox.module.css:132) |
| ListBox | List View (433:1231) › whole list | now a menu panel: 16 inset, 8 gap, 12 corners, Overlay, shadow; rows 8/12, 8 corners, Large text, 40px | 1px gaps on Surfaces/Base, rows 12px padding, Medium text (:23–75) |
| Dropdown / FilterChipDropdown | Menu Options / Chips panel | 16px padding, Surfaces/Overlay, no outline | 12/8 padding, Brand Teal Fill/Weaker, 1px outline (Dropdown.module.css:294–302) |
| DropdownSelector / DropdownTree / MultiselectDropdown | chip, search field and tree field text | 16px Regular (no text style in Figma; Volt's Large is 16/24) | Small 12/18 |
| AppBar | search field text | 16px Regular (no text style) | Small 12/18 (AppBar.module.css:66) |
| Tabs | Tab / Tiny* › Current | no underline | underlined (Tabs.module.css:157) |
| JumpLinks | standalone › padding | 16 / 24 / 0 / 24 | 16 / 24 / 16 / 24 (JumpLinks.module.css:15); inside NavTier3 it already matches |
| DataRow | Row Item › slot | Tag Base / Small (teal pill, 24px) | RowSlot gray pill (DataRow.module.css:103) |
| DataTable | Row › Inactive | 40% opacity on checkbox and cells, text stays Strong | text turns Weak, checkbox not faded (DataTable.module.css:116) |
| ContextMenu | Menu Item › Selected | Brand Teal Fill/Weaker | no selected state |
| Tile | KPI › icon | Gray Fill/Strong | Gray Text/Weak (Tile.module.css:54) |
| SearchBar | Searched List value text | Medium/Semi-Bold, Gray Text/Weak | Regular, Gray Text/Strong (SearchBar.module.css:168) |

## 2. Decisions: code differs on purpose, or Figma may be wrong

| Component | Difference | Why it's a question |
|---|---|---|
| IconButton | Medium icon: Figma 24px, code 32px | Volt kept the 32px glyph its 44px buttons always had (open question from the size rename) |
| IconButton | Brand › Disabled icon: Figma = Brand Teal Fill/Disabled, the same as the background | the icon disappears in Figma; code keeps it white |
| Progress | Circle: Figma track uses an 8px OUTSIDE stroke, so the track and arc sit side by side (157px) | looks like a Figma construction error; code draws them on one ring |
| DataTable | Total row: Figma = normal row, bold; code = Brand Teal Fill/Weaker | code follows the Inventory file's design (76:11638) |
| DataTable | ••• per row: Figma shows it at rest; code shows it on hover, focus or selection | deliberate in code |
| AutocompleteInput | suggestion list: Figma = attached with a 2px teal outline; code = the standard menu frame | code follows the design-system.md rule that every popup uses Menu Options |
| Modal (AppModal) | `danger` start action: Figma = solid red; AppModal = red outline | CLAUDE.md describes the outline |
| Message | close button: Figma 40px, code 44px (IconButton medium) | 40 isn't on the IconButton scale |
| Accordion | Category Hover radius 0 and open header corners | Figma looks inconsistent (Default is 12) |
| Header | Notifications state: teal avatar ring, 4-side stroke | probably a Figma slip |
| Button | Medium icon sets bind Fill tokens to the icon; code uses the text color | Figma is inconsistent between sets |

## 3. Figma nodes and names that moved

- **Card** (`Card.tsx`, story `figma('2220:3790')`): the Figma set was deleted, so the component has no Figma source. The Cards page now has Card / Row / Tiny (2903:53) and Card / Category (2921:7899), which HelpCenter draws.
- **Modal close button:** 690:3483 no longer exists. It is now "Button / Icon Only / Small / Secondary" 430:701 (Modal.stories.tsx:205, Modal.tsx:69, Modal.module.css:67).
- **DataHeader:** Tenant Headers* 1098:813 was deleted.
- **DataRow:** Slot* 765:10067 was deleted (Row Item's slot now holds Tag Base / Small).
- **Button Medium right-icon sets:** 2392:572 and 2734:1035 were deleted. Their stories and `iconPosition="right"` at medium have no Figma source.
- **Renamed in Figma:**
  - 2676:6014 → Menu Options / Chips
  - 3078:320 → Menu Options / Default
  - 433:1231 → List View
  - 449:2189 → Search Input
  - Modal sets → "Modal / Dialog" and "Modal / Dynamic"
  - 2903:53 → Card / Row / Tiny
  - 2921:7899 → Card / Category
- **Not coded:** Card / Row / Tiny and Card / Category as Cards variants (HelpCenter has its own copies).

## 4. Minor (token one step off, a few pixels)

- **Button:**
  - Small Gray / Text-White Focus: Figma 4px centered, code 2px inset.
  - Large Teal Base Disabled label: Solid/100 vs 200.
  - Block Brand Disabled label: Solid/200 vs White.
- **Toggle:** Button Small label is Tiny/Medium (500) in Figma, 400 in code.
- **Avatar:**
  - Medium Photo backdrop: Black vs teal.
  - Profile Icon Small: 31 vs 32.
- **Scrollbar:** radius 2 vs radius-4, already noted in code.
- **TextArea:** the code's Required state has no Figma variant.
- **ContextMenu:**
  - Label is Gray Fill/Strong in Figma, Gray Text/Strong in code.
  - Show Submenu defaults to true in Figma.
- **MenuSidebar:**
  - Label: Fill/Strong vs Text/Strong.
  - Disabled label: Fill/Disabled vs Text/Disabled.
  - Stroke: top and bottom only in Figma.
- **Tabs:** Focus stroke has no bottom in Figma.
- **NavTabBar:** icon and close-icon tones, Strong vs Weak, in a few states.
- **NavTier1:**
  - Icons: Fill/Strong vs Weak.
  - Medium selected: Gray Fill/Hover vs Weaker.
- **NavTier3:** Collapsed section gap is 12 in Figma, 8 in code.
- **DataHeader:**
  - Stretched tiles: Gray Fill/Disabled vs 50% of it.
  - "Stretched 2 icons" isn't coded.
- **DataRow:** Row Item props Show Avatar, Show Icon and Icon aren't in RowItem.
- **TwoLineCell:** Link description is indented 2px in code.
- **Tooltip:** arrow sizes. Large is 30×24 vs 24×24, and Small about 17×10 vs 10×10; Figma's Small set is inconsistent too.
- **Message:** Caution fill is Amber/200 vs Amber/100, already noted in code.
- **Dropdown:**
  - Menu Options / Default width 238 vs min-width 200.
  - Option label: Fill/Strong vs Text/Strong.
- **FilterChipDropdown:**
  - Required ring: Strong vs Weak.
  - Focus fill: Press vs Hover.
- **DropdownSelector:**
  - Gap to menu: 0 vs 4.
  - Photo tiles: 38 vs 43.
  - Nested holder inset.
- **DropdownTree:**
  - Active fill while open.
  - Gap to menu: 2 vs 4.
- **MultiselectDropdown:**
  - Menu outline: 0.5px Gray Stroke/Weak in Figma, none in code.
  - Menu dividers: in code, not in Figma's holder.
  - Selected chevron: 24 vs 20.
  - Gap to menu: 2 vs 4.
- **ListBox:**
  - Avatar and Tree Disabled: 50% opacity in Figma.
  - Icon Error chevron: Weakest vs Strongest.
- **SearchBar:**
  - Active input corners: 12 all round vs top only.
  - With Icon tag radius: 8 vs 12.
- **OtpInput:** Disabled text stays Strong in Figma.
- **SignaturePad:**
  - Clear label: Strong vs Weak.
  - Default state has no drawing area in Figma.
- **EditableCell:** Error stroke is 1.5px in Figma (no token), 2px in code.
- **HelpCenter and Modal:** story and inventory names are stale.

## Figma-side clean-up spotted (no code change)

- **Status Step Upcoming:** the main components have teal connectors; the instances override them to gray.
- **Modal close button:** its main component binds legacy "Semantic Fill/…" variables.
- **Button Block Brand / Icon:** Focus and Selected stroke weights are swapped.
- **Text Input Left Icon › Error:** the box is 48px tall.
- **Drop Down Icon + Label Medium:** non-Default states have 24 / 16 padding.
- **Header Notifications:** strokes on all 4 sides.
- **MenuSidebar Disabled:** the label is the same color as its background.
