# Design System

Read this before changing anything that touches UI, styling or components.

## Source of truth

- **Figma:** [__Design System - Base](https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base) (file key `ieTXU4rFsUAmlEsF93zF5T`). Figma owns every token value.
- **Code copy:** `design-system/figma-export/variables.json`, exported 2026-10-29. It already includes token fixes that have not been published from the Figma library yet.
- **Generated files:** `design-system/tokens/tokens.css` and `design-system/tokens/tokens.json` (W3C DTCG). Do not edit them by hand. Change the token in Figma, re-export `variables.json`, then run `node design-system/scripts/build-tokens.mjs`.

## Setup

1. Load `design-system/tokens/tokens.css` once, globally.
2. Set the theme on `<html>`: `data-theme="light"` or `data-theme="dark"`. Without the attribute the page follows `prefers-color-scheme`.
3. Put the attribute on `<html>`, never on an inner element. Semantic tokens are defined on `:root` as `var()` references to primitives. On an inner element the primitives change, but the semantic tokens inherited from `:root` keep their light values.
4. Typography switches to the Mobile values at `max-width: 767px`. Only the Display and Heading 1–2 font sizes and the Display and Heading 1 line heights change.

## Tokens

All names are CSS custom properties from `tokens.css`. Values are listed only where they are the whole story; look up colors in `tokens.css`.

### Spacing — `--space-*`

`2, 4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128, 192, 256` (px). For example, `--space-16`.

Use these for `gap`, `padding` and `margin`. In Figma the spacing variables are scoped to auto-layout gap and padding.

### Corner radius — `--radius-*`

`4, 8, 12, 24, 40, 80` (px). There is no 16 and no full/pill token.

### Stroke width — `--stroke-width-*`

`outline` (0.5px), `1, 2, 4, 6, 8` (px). Default borders are `--stroke-width-1`.

### Color

Use the semantic tokens below. Pick the group that matches the property: **fill** for backgrounds, **stroke** for borders, **text** for text. This mirrors the variable scopes in Figma.

| Group | Tokens | Use for |
|---|---|---|
| Surfaces | `--color-surfaces-base`, `-sunken`, `-raised`, `-overlay`, `-inverse` | Page and container backgrounds |
| Gray fill | `--color-gray-fill-strong`, `-weak`, `-weaker`, `-hover`, `-press`, `-disabled`, `-inverse-strong`, `-inverse-weak` | Neutral backgrounds and interaction states |
| Gray stroke | `--color-gray-stroke-strong`, `-weak`, `-weaker`, `-disabled`, `-inverse-strong`, `-inverse-weak`, `-inverse-disabled` | Neutral borders and dividers |
| Gray text | `--color-gray-text-strong`, `-weak`, `-disabled`, `-inverse-strong`, `-inverse-weak`, `-inverse-disabled` | Body and secondary text |
| Status fill | `--color-semantic-fill-{error,info,success,warning}-{strong,weak}` | Status backgrounds |
| Status stroke | `--color-semantic-stroke-{error,info,success,warning}-{strong,weak}` | Status borders |
| Status text | `--color-semantic-text-error`, `-warning`, `-success`, `-information` | Status text (note: `information`, not `info`) |
| Brand Teal | `--color-brand-teal-fill-{strong,weak,weaker,hover,press,disabled}`, `--color-brand-teal-stroke-{strongest,strong,weak,weaker,disabled}`, `--color-brand-teal-text-{strongest,strong,weak,weaker}` | Primary brand actions and accents |
| Brand Orange | `--color-brand-orange-fill-{strong,weak,weaker,hover,press,disabled}`, `--color-brand-orange-stroke-{strong,weak,weaker,disabled}`, `--color-brand-orange-text-{strong,weak,weaker}` | Secondary brand accents |
| Logo | `--color-logo-color` | Logo marks (teal in light, white in dark) |

**Primitives** (`--color-foundation-*`: solid grays, transparent grays, semantic red/amber/green/blue, brand teal/orange) exist only to feed the semantic tokens. They are hidden from Figma's pickers. Don't reference them in component code.

### Typography

- **Family:** `--font-family-inter` (Inter, falling back to `system-ui, sans-serif`). The tokens don't load the font; the app must load Inter.
- **Size / line height:** `--font-size-*` and `--line-height-*` for `display`, `heading-1` to `heading-4`, `large` (16/24), `medium` (14/20), `small` (12/18), `tiny` (10/16). Display is 56/64 and Heading 1 is 40/48 on desktop.
- **Text classes:** prefer these over setting the properties by hand. Weights: regular 400, medium 500, semi-bold 600, bold 700.

| Scale | Classes |
|---|---|
| Display, Heading 1–4, Large | `.text-{scale}-regular`, `.text-{scale}-bold` (e.g. `.text-heading-2-bold`) |
| Medium, Small | `.text-{scale}-regular`, `-semi-bold`, `-bold` |
| Tiny | `.text-tiny-regular`, `-medium`, `-semi-bold`, `-bold` |
| Super Tiny | `.text-super-tiny-regular` (avoid; see rules) |

### Elevation

`--shadow-drop` (`0 4px 4px 0 var(--color-shadow-drop)`, black at 25%) is the only shadow. There is no elevation scale. Its color is the `Shadow/Drop` variable (Figma effect style "Drop Shadow"). `--color-shadow-large` (black at 18%) is the color of Figma's larger Modal - Dialog shadow (0 20 60); no coded component uses it yet.

## Usage rules

1. **No raw values when a token exists.** No hex colors, and no px for spacing, radius, stroke width, font size or line height. If the value you need has no token, stop and raise it. Don't hardcode it, and don't add a token only in code: tokens are added in Figma first.
2. **Semantic over primitive.** Use `--color-gray-text-strong`, not `--color-foundation-transparent-1000`. Known exceptions, copied from Figma because no semantic token exists yet:
   - white text, icons and strokes on brand fills (`--color-foundation-solid-white`)
   - the Brand Secondary button fills (`solid-white`, `solid-100`)
   - the black Badge (`solid-white` text, `solid-black` fill)

   Each exception is commented in the component CSS.
3. **Match the token to the property.** Fill tokens for backgrounds, stroke tokens for borders, text tokens for text.
4. **Contrast limits.** `--color-brand-orange-text-strong` is about 2.4:1 on white and `--color-brand-teal-text-weak` about 1.6:1; both fail WCAG AA. Use them only for decorative or large text. `--color-brand-teal-text-strongest` and `-strong` pass.
5. **Disabled text is very faint.** `--color-gray-text-disabled` is 20% opacity. Use it only for disabled controls.
6. **Some colors don't change in dark mode.** Brand Orange is the same in light and dark. Check orange combinations in dark mode.
7. **Status tints are weaker on the dark overlay surface.** In dark mode, status text on its own weak fill passes AA (about 5.2:1) on `--color-surfaces-base`. On `--color-surfaces-overlay` (modals, cards) it drops to about 3.5:1 for all four hues (info, success, warning, error). Avoid long status text inside overlays.
8. **Avoid `.text-super-tiny-regular`.** It is 8px with an 8px line height.
9. **Spacing is not a strict 4px grid.** `--space-10` exists because the components use 10px gaps. Prefer the scale steps the Figma components use.

## Components

Coded components live in `src/components/<Name>/<Name>.tsx`. Every one has a Storybook story file (run `npm run storybook`, port 6007), grouped the same way as the Figma file. Each component's props are documented in its stories and in the Storybook MCP docs tools. Use these before building anything new.

Every Figma set on the library pages has a coded component. The exceptions are the pages marked "not used", the Testing page and the Holder scaffolding.

The groups run from small to large, the same in Storybook and in the Figma file's page sections (the reasoning is in
`design-system/TAXONOMY-MAPPING.md`):

| Storybook group (Figma section) | Components |
|---|---|
| Foundations | Icon (111 icons), Logo (9 logos) |
| Primitives (single elements) | Avatar, Badge, Button, Checkbox, Chip, Hyperlink, IconButton, LastModified, RadioButton, Scrollbar, Tag, TextArea, TextInput, Toggle |
| Components › Forms | AutocompleteInput, ButtonGroup, Captcha, Dropdown (Drop Down Label + Drop Down Button + Drop Down Menu), DropdownSelector, DropdownTree, EditableCell, FilterChipDropdown, ListBox (plus TreeList), MultiselectDropdown, NumericInput, OtpInput, RangeSlider, Rating, SearchBar, SignaturePad, UploadFile |
| Components › Feedback | Message, NotificationBox, Progress, Skeleton, Toast |
| Components › Overlays | ContextMenu, Modal (plus ModalPanel), Overlay, Tooltip |
| Components › Data Display | Accordion, Card, Cards (CardLarge, CardRow), DataHeader, DataRow, DataTable, PageTracker, Tile, Timeline |
| Components › Navigation | AppBar, Breadcrumb, Footer, Header, MainDropDown, MenuSidebar, NavTabBar, NavTier1, NavTier2, NavTier3, NavTier4, SideMenuButton, SubMenu, Tabs |
| Templates | HelpCenter. The app's own layouts (AppShell, RecordPage, AuthLayout, AppModal) live in `src/app/` and have no stories yet |

Most-used APIs:

| Component | Key props |
|---|---|
| Icon | `name`, `size` (20 / 24 / 32), `color`, `label` |
| Button | `variant`, `size` (base / small / tiny), `block`, `icon`, `iconPosition`, `selected`, `disabled` |
| IconButton | `label` (required), `icon` or `number`, `variant` (default / brand), `size` (base 80px / compact 40px), `selected` |
| TextInput | `label` (text or markup, e.g. a red required `*`), `error` (message), `leftIcon`, `rightIcons`, `trailingAction` (an interactive control after the divider, e.g. show/hide password), plus native input props (`required`, `disabled`, …) |
| Dropdown | `options`, `label`, `variant` (field / button / small / icon), `multiple`, `value` / `onChange`, `error`, `required` |
| Modal | `open`, `onClose`, `title`, `description`, `actions`, `variant` (default / sectioned / confirm), `width`. The close button is Figma "Button / Icon Only / Small / Secondary" (44px; Hover fades to Gray Fill/Hover). In the prototype app use `AppModal`, which wraps it |
| Message | `title`, `body`, `type`, `onClose` |
| Toast | `type`, `title`, `body`, `onClose`, `inline`. A page notice that slides down at the top center and leaves after 5 seconds; `onClose` runs once it has gone. `inline` draws it in place (previews only) |
| CardLarge / CardRow | CardLarge: `title`, `headingLevel`, `children` (Figma Card / Large: a titled section on Surfaces/Sunken). CardRow: `media` (80px), `title`, `subtitle`, `action`, `highlighted` (Figma Card / Row / Small) |
| NavTier4 | `aria-label`, `items` (`{ id, label }`), `activeId`, `onSelect`, `toolbar` (Figma Tier 4: the view buttons under a record's Tier 3 header, with an optional toolbar after a divider) |
| DataTable | `aria-label`, `columns` (`DataColumn[]`: `key`, `label`, `width` px or `'fill'`, `align`, `sortable`, `flush` for a column of buttons with no side padding), `rows` (each with an `id`), `cells(row)`, `rowLabel(row)`, `selected` / `onSelectedChange` (the checkbox column), `sort` / `onSortChange`, `onMore(row)` + `renderAfterRow(row)` (the ••• and its menu), `actionsVisible`, `striped`, `inactive(row)`, `empty`. The clean table (Figma Data Table page): use it for new tables instead of hand-assembling DataHeader + DataRow |
| Tile | `label`, `value`, `note`, `icon` (Figma Tile / KPI). A button with `onClick` or a link with `href`; it fills its parent's width, so put it in a grid or a sized box. On a tile narrower than about 216px the value steps down to Heading 4 |
| NavTabBar | `tabs` (`{ id, label, icon?, title? }`: keep `label` short and put the full name in `title`, which becomes the tooltip and accessible name), `activeId`, `onSelect`, `onClose`, `onReorder` (drag tabs or Ctrl+Shift+←/→ to reorder; called with the new id order), `onShowAll` (an "All tabs" button at the far right of the bar; Figma Tab Bar), `onHome`, `onAdd`. Restyled from Figma for readability: 40px bar on Surfaces/Base, 14px tabs, brand-teal underline on the active tab. Each tab hugs its label; when they don't fit, the longer names shrink first with "…", each keeping at least 3 letters (or its whole name if shorter), and once even that doesn't fit, tabs show only their icon (name in the tooltip; the × on hover, focus or the active tab, which stays at least 52px) and keep shrinking to 36px; past that the tab strip scrolls sideways (Figma: Tab Label / Tab Button Compact states and Tab Bar Active Tab = Crowded) |
| Footer | `copyright`, `version` (centered), `links` (`{ label, href, newWindow? }`; `newWindow` opens the link in a new window and says so to screen readers) |

Button variants that exist in Figma, by size:
- **base:** `primary`, `outline`, `brand` (teal), `brand-outline` (teal fill with a gray border: Figma "Brand / Teal / Outline"), `brand-orange`
- **small:** `primary`, `outline`, `brand`, `brand-outline` (Figma "Brand / Small / Outline"; use it for card actions such as the Inventory dashboard's Review), `brand-secondary`
- **tiny:** `primary`, `text`, `brand` (Figma "Primary / Tiny / Brand"; use it for an action inside a table row, such as Low Stock's View PO / Create PO)

Other combinations render, but have no Figma design.

States follow Figma:
- **Hover, press and focus:** CSS states (`:hover`, `:active`, `:focus-visible`).
- **Selected:** `aria-pressed` on toggle-style controls, and `aria-current="page"` on navigation items (SideMenuButton, NavTier1, NavTier2).
- **Disabled and error:** props.

Every Figma set is listed in `design-system/components.md`, with node IDs, variants and properties. To build or change a component, follow `design-system/component-build-guide.md`.
