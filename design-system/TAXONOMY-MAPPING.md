# Component structure: mapping table

**Applied 2026-11-04.** The Figma "__Design System - Base" file's pages sit under the new section headers (FOUNDATIONS,
PRIMITIVES, COMPONENTS / FORMS, … / FEEDBACK, … / OVERLAYS, … / DATA DISPLAY, … / NAVIGATION, TEMPLATES), and Storybook's
sidebar uses the same groups (`Components/Forms/…` and so on). The five "not used" pages the app does use (Radio
Button, Text Input - Numeric, Skeleton, Tooltip, Data Rows) moved into their groups without the label; the other
"not used" pages stay at the bottom of the file. Decisions 1, 2, 5 and 6 at the end are still open.

## The new structure

| # | Group | What goes in it | Figma today | Storybook today |
|---|---|---|---|---|
| 1 | **Foundations** | Tokens, icons, logos | DESIGN TOKENS | Foundations |
| 2 | **Primitives** | Atoms: one control or element, not made of other components | PRIMITIVE COMPONENTS | Primitives |
| 3 | **Components › Forms** | Inputs built from primitives: dropdowns, pickers, uploads, search | split across Primitive and Web | split |
| 4 | **Components › Feedback** | Status and progress: messages, toasts, loading | WEB COMPONENTS | Web Components |
| 5 | **Components › Overlays** | Things that float over the page: modals, menus, tooltips | WEB COMPONENTS | Web Components |
| 6 | **Components › Data display** | Showing records and figures: tables, tiles, cards, timelines | split across Web and Custom | split |
| 7 | **Components › Navigation** | Moving around the app: shell bars, tiers, tabs, breadcrumbs | SHELL NAV + INTERIOR NAV | Navigation |
| 8 | **Templates** | Page layouts that screens are built from | none (screens live in "_Sign In / Shell") | none |

Retired: the **Web Components** and **Custom Components** groups. **Custom** sorts by who made a component, not what it
does; its members move to Data display, Navigation and Templates.

**Used in app** counts the prototype files that import the component directly (`src/app`). "Inside X" means another
component uses it, so it's in use even with 0 direct imports.

## 1. Foundations (no changes)

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| Tokens | - Colors, - Spacing, - Typography, - Surfaces | Foundations/Tokens | via CSS | |
| Icon | - Icon Library | Foundations/Icon | 27 | |
| Logo | - Logos | Foundations/Logo | 3 | |

## 2. Primitives

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| Avatar | - Avatar | Primitives | 7 | |
| Badge | - Badge | Primitives | 5 | |
| Button | - Button Large, Brand Large, Block, Small, Brand Small, Tiny | Primitives | 29 | Six Figma pages; consider one "- Button" page with sections |
| IconButton | - Button Icon | Primitives | 7 | |
| Checkbox | - Checkbox | Primitives | 7 | |
| RadioButton | - Radio Button | Primitives | 2 | Moved out of "not used" (Nov 4) |
| Toggle | - Toggle | Primitives | 6 | |
| Chip | - Chip | Primitives | 3 | |
| Tag | - Tag | Primitives | 3 | |
| Hyperlink | - Hyperlink | Primitives | 2 | |
| TextInput | - Text Input | Primitives | 24 | |
| TextArea | - Text Area | Primitives | 8 | |
| LastModified | - Last Modified | Primitives | 0 | Keep or retire? |
| Scrollbar | - Scrollbar (Web) | Web Components | inside Modal | **Moves** from Web: it's an atom |

## 3. Components › Forms

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| Dropdown (incl. Drop Down Menu) | - Drop Down Label, - Drop Down Button | Primitives | 25 | **Moves** from Primitives: built from a trigger + ListBox |
| ListBox (incl. TreeList) | - ListBox | Primitives | inside Dropdown | **Moves** from Primitives |
| AutocompleteInput | **deleted from Figma** (was Text Input - Autocomplete*) | Primitives | 1 | **Moves** from Primitives; needs a Figma design again (see below) |
| NumericInput | - Text Input - Numeric | Primitives | 7 | **Moves**; moved out of "not used" (Nov 4) |
| OtpInput | - OTP Input - **not used** | Primitives | 0 | **Moves**; keep or retire? |
| ButtonGroup | - Button Group | Primitives | 3 | **Moves** from Primitives: a set of buttons |
| EditableCell | - Editable Cell | Primitives | 1 | **Moves** from Primitives (could also go to Data display) |
| DropdownSelector | - Drop Down - Selector | Web Components | 0 | Keep or retire? |
| FilterChipDropdown | - Drop Down - Filter Chip | Web Components | 0 | Keep or retire? |
| DropdownTree | - Dropdown Tree - **not used** | Web Components | 0 | Retire? |
| MultiselectDropdown | - Multiselect Dropdown - **not used** | Web Components | 0 | Retire? (Dropdown has `multiple`) |
| SearchBar | - Search Bar | Web Components | 18 | |
| UploadFile | - Upload Document | Web Components | 5 | |
| Captcha | - Captcha | Web Components | 1 | |
| RangeSlider | - Range Slider - **not used** | Web Components | 0 | Retire? |
| Rating | - Rating - **not used** | Web Components | 0 | Retire? |
| SignaturePad | - Signature - **not used** | Web Components | 0 | Retire? |

## 4. Components › Feedback

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| Message | - Message | Web Components | 12 | |
| Toast | - Toast | Web Components | 12 | |
| Progress | - Progress Bar | Web Components | 2 | |
| Skeleton | - Skeleton | Primitives | 3 | **Moves** from Primitives; moved out of "not used" (Nov 4) |
| NotificationBox | - Notification Box - **not used** | Web Components | 0 | Retire? (the header uses InboxModal) |

## 5. Components › Overlays

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| Modal (incl. Modal Screen) | - Modal, - Modal Screen | Web Components | 1 (+ AppModal) | Modal Screen (used by the Shell file) sits next to - Modal |
| ContextMenu | - Context Menu | Web Components | 5 | |
| Tooltip | - Tooltip | Primitives | 2 | **Moves** from Primitives; moved out of "not used" (Nov 4) |
| Overlay (scrim) | - Overlay | Primitives | inside Modal | **Moves** from Primitives |

## 6. Components › Data display

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| DataTable | - Data Table (New) | Custom Components | 0 | The standard table for new work |
| DataHeader | - Data Headers | Custom Components | 25 | Older table parts the Inventory tables use |
| DataRow | - Data Rows | Custom Components | 22 | Moved out of "not used" (Nov 4) |
| PageTracker | - Page Tracker | Custom Components | 7 | Table paging |
| Tile | - Tiles | Custom Components | 1 | |
| Cards (CardLarge, CardRow) | - Cards | Custom Components | 0 | |
| Card | **deleted from Figma** (was Card*) | Web Components | 0 | Not used and no Figma design: retire? Cards covers it |
| Accordion | - Drop Down - Accordion | Web Components | 1 | |
| Timeline | - Timeline | Web Components | 2 | |

## 7. Components › Navigation

| Component | Figma page today | Storybook today | Used in app | Note |
|---|---|---|---|---|
| NavTabBar | - Tab Bar (Shell Nav) | Navigation | 1 | |
| Header | - Header (Shell Nav) | Navigation | 1 | |
| Footer | - Footer (Shell Nav) | Navigation | 1 | |
| NavTier1 | - Tier 1 | Navigation | 1 | |
| NavTier2 | - Tier 2 | Navigation | 1 | |
| NavTier3 | - Tier 3 | Navigation | 1 (RecordPage) | |
| NavTier4 | - Tier 4 | Navigation | 0 | |
| SubMenu | - Sub Menu | Navigation | inside RecordPage / Tier 3 | |
| SideMenuButton | - Button Side Menu (Primitive) | Navigation | inside Tier 1 / 2 | |
| Breadcrumb | - Breadcrumb | Navigation | 1 | The Web page was deleted Nov 4; the coded `size="default"` style went with it |
| Tabs | - Tab Bar - **not used** | Navigation | 0 | Retire? (NavTabBar replaced it) |
| AppBar | - AppBar - **not used** | Navigation | 0 | Retire? (Header replaced it) |
| MenuSidebar | - Menu Sidebar - **not used** | Navigation | 0 | Retire? (Tier 1 / 2 replaced it) |
| MainDropDown | - Main Drop Down - **not used** | Custom Components | 0 | Retire? |

## 8. Templates (new)

These exist in the prototype's code but not in the design-system library or Storybook today. Moving them in means
new stories, and in Figma, components or example frames built from the Shell file's screens.

| Template | Code today | Figma today | Note |
|---|---|---|---|
| App Shell | `src/app/shell/AppShell.tsx` | "_Sign In / Shell" screens | Tab bar, header, Tier 1 / 2, footer around a page |
| Record Page | `src/app/components/RecordPage.tsx` | Tier 3 + Sub Menu in Base | Tier 3 header + sections |
| Sign-in layout | `src/app/pages/auth/AuthLayout.tsx` | "_Sign In / Shell" | Sign In, Sign Up, password reset |
| Standard modal | `src/app/components/AppModal.tsx` | Modal Screen + Dialog / Modal | Teal primary, Cancel by default |
| Help Center kit | `src/components/HelpCenter` | - Help Center | Article row + category card for Help pages |

## Decisions needed before moving anything

1. **The groups:** keep the eight above, or rename (e.g. "Patterns" instead of "Templates")?
2. **Retire or keep:** 15 coded components have no use in the app (most on "not used" Figma pages): LastModified,
   OtpInput, DropdownSelector, FilterChipDropdown, DropdownTree, MultiselectDropdown, RangeSlider, Rating,
   SignaturePad, NotificationBox, Tabs, AppBar, MenuSidebar, MainDropDown and Card. Retiring one removes its code,
   story and Figma page. (DataTable, Cards and NavTier4 are new, so they're not on this list.)
3. ~~**Wrong "not used" labels**~~ **Done Nov 4:** Radio Button, Text Input - Numeric, Skeleton, Tooltip and Data Rows
   lost the label and moved into their groups; Modal Screen sits under Overlays.
4. ~~**Duplicates**~~ **Done Nov 4:** the Web Breadcrumb page was deleted, leaving one.
5. **Deleted Figma sets:** see the next section.
6. **Templates:** build them into the library now, or later once real screens need them?

## Figma sets that were deleted but are still coded

Found while drafting: six Storybook stories link to Figma nodes that no longer exist in the Base file, and no
component with those names is left anywhere in it.

| Figma set (deleted) | Coded as | Used in app | Suggestion |
|---|---|---|---|
| Text Input - Autocomplete* | AutocompleteInput | 1 | Keep the code; redesign or restore it in Figma |
| Card* | Card | 0 | Retire the code |
| Button / Icon Only / Small / Secondary | Modal's close button | inside every modal | Find its new home in Figma (likely - Button Icon) and relink |
| Tenant Headers* | a DataHeader story | 0 | Drop the story |
| Slot* | a DataRow story | 0 | Drop the story |
| Equal Housing Lender* (logo) | a Logo story | 0 | Drop the logo, or restore it in Figma |
