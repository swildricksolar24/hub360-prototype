# Warehouses — build spec

The plan for building **Inventory › Warehouses** (`/app/inventory/warehouses`) from the Figma flow, using the coded
design system in this repo as the source of truth. Nothing here is built yet; the page is still the "not built yet"
placeholder.

- **Figma:** *Inventory Management – Core* › page **"→ Warehouses"**
  ([link](https://www.figma.com/design/7FlRxkXbbjUhWJ3t1MMrVr/Inventory-Management---Core?node-id=68-8125),
  file key `7FlRxkXbbjUhWJ3t1MMrVr`). Use the frames on the dark background. The gray **ARCHIVE** section
  (599:14833) holds older versions; ignore it.
- **Source of truth:** where Figma and the code disagree, the code wins: the tokens in `tokens.css`, the components
  in `src/components/`, the app conventions in `CLAUDE.md` (`AppModal` for every dialog, teal brand primary button,
  hover fades, light and dark themes).
- Figma draws the old shell (26px tab bar, older header, 11-item side menus). Build inside the current `AppShell`;
  don't copy Figma's chrome.

## The flow at a glance

| # | Screen | Figma frame | Opens from |
|---|---|---|---|
| 1 | Warehouses list | Inventory / Warehouse - A (732:51717) | Inventory › Warehouses |
| 2 | Confirm Activation | ACTIVATION (732:52285) | Row ••• › Activate, or Actions › Activate |
| 3 | Confirm Deactivation | DEACTIVATION (732:52301) | Row ••• › Deactivate, or Actions › Deactivate |
| 4 | Edit Columns | Edit Columns (732:51812) | Toolbar › Columns |
| 5 | Edit Columns, naming a view | Adding View Name (732:51925) | Typing a View Name in 4 |
| 6 | Edit Columns, saved view | Editing View with Name (732:52038) | Opening a saved view |
| 7 | Delete view confirmation | Action Confirmation (732:52350) | Delete View in 6 |
| 8 | Upload File | Upload Spreadsheet (826:58304) | Toolbar › Upload |
| 9 | Match Columns | Map Columns - Default (826:58411) | Next in 8 |
| 10 | Review & Import | Review Import (826:58495) | Next in 9 |
| 11 | Upload error | Map Columns - Upload Error (826:58404) | Upload fails |
| 15 | Add Warehouse | Add Warehouse (732:51736) | Toolbar › Add Warehouse |

## 1. Warehouses list

**Page frame.** Content area of the shell (Tier 1 Inventory selected, Tier 2 Warehouses selected). Two stacked cards
on `--color-surfaces-overlay`, radius `--radius-12`: a toolbar card, then the table card. See open question 2
about the Tier 3 header.

**Toolbar** (left to right):

| Figma | Code |
|---|---|
| "View: All" drop-down | `Dropdown variant="small"`; options: All, plus saved views from Edit Columns |
| "Columns" (icon) | `Button size="small" variant="primary" icon="view-column"` → opens 4 |
| "Upload" (icon) | `Button size="small" variant="primary" icon="upload"` → opens 8 |
| "Actions" drop-down | `Dropdown variant="small"`; options for the selected rows: Activate, Deactivate, Export |
| "Search" | `SearchInput` (fills the remaining width); filters by code, name and address |
| "Add Warehouse" | `Button size="small" variant="brand"` → opens 15 |

**Table** — `DataHeader` + `DataRow`, `leading="checkbox"` (no avatar), `actions` on (the ••• button).

| Column key | Header | Align | Sample |
|---|---|---|---|
| `code` | Code | start | PHX-124 |
| `name` | Name | start | Phoenix WH |
| `address` | Address | start (widest) | 11565 W Summertime, Phoenix, AZ 85085 |
| `value` | Inventory Value | end | $1,250,569.32 |
| `locations` | Locations | end | 542 |
| `filled` | Filled Locations | end | 478 |
| `empty` | Empty | end | 64 |
| `status` | (no header) | end | Figma Tag "Small" pill: Active on Brand Orange Fill/Strong, Inactive on Gray Fill/Weak 70% |

- Every header has sort and filter icons (Figma "Header Item / 2 Icons"): `onSortChange`, `onFilter`,
  `activeFilters`. The select-all checkbox sits in the header's leading area (`allSelected`, `onSelectAllChange`).
- **Inactive rows** are dimmed (Figma greys the text). Use `--color-gray-text-weak` on the row's cells; the
  checkbox and ••• stay enabled.
- **Row •••** opens a `ContextMenu`: View, Edit, Activate or Deactivate (whichever applies), Delete. Figma doesn't
  draw this menu; these are the proposed items.
- Sample data: the two Figma rows plus enough made-up Arizona warehouses to fill a few pages
  (PHX, TUC, MESA, GIL, SCOT…).

**Pagination** — `PageTracker`: `pageSizeOptions={[10, 25, 50]}`, `maxPageButtons={5}`, shows "2 of 13".

**States to cover:** loading (`Skeleton` rows with `aria-busy`), empty ("No warehouses yet" + Add Warehouse),
no search results, and rows selected (Actions enabled only when at least one row is selected).

## 2–3. Confirm Activation / Deactivation

Figma uses the confirm layout: a teal bar across the top and a round check badge. In code that is the design-system
`Modal variant="confirm"` (560px). `AppModal` only renders the default layout today, so add a
`variant: 'default' | 'confirm'` prop to `AppModal` rather than using `Modal` directly (keeps the brand primary and
the Cancel default).

- Title: **Confirm Activation** / **Confirm Deactivation**
- Body: "You are about to **ACTIVATE** this record. This change will take effect immediately. Do you want to
  continue?" (DEACTIVATE for the other; the verb is bold teal, `--color-brand-teal-text-strongest`)
- Actions: Cancel (outline), **Confirm** (brand). Confirm flips the row's status and shows a success `Message`.

## 4–7. Edit Columns

`AppModal` with `width` wider than 800 (see open question 3; Figma is about 905px).

- Title **Edit Columns**. Description: "Drag and drop fields to customize which columns appear and their order.
  Select multiple fields to move them together. Click the snowflake icon to freeze columns in place. To save your
  customized layout for future use, enter a View Name."
- **View Name** — `TextInput`, placeholder "Optional". A divider (1px `--color-gray-stroke-disabled`) under it.
- **Search** — `SearchInput`, filters both lists.
- Two panels side by side (radius `--radius-12`):
  - **Database Fields** (panel on `--color-surfaces-sunken`): every available field, each a `Checkbox` plus a
    draggable row ("⠿ Field Name", `drag-indicator` icon). Checking a field adds it to Column Headers.
  - **Column Headers** (panel tinted `--color-brand-teal-fill-weaker`): the chosen columns in table order, each
    with a selection box, a draggable row ("⠿ Column Name") and a freeze toggle on the right — `IconButton
    size="compact" variant="brand"` with `freeze` (frozen) / `unfreeze` (not frozen, shown at the Brand disabled
    fill), `aria-pressed` for the state.
  - Panel headers are teal bars (`--color-brand-teal-fill-strong`, white text) with a select-all box on the left.
- Reordering: drag and drop with the pointer, plus Alt+↑/↓ from the keyboard. Reuse the live-slide approach from
  `NavTabBar` (pointer events, FLIP slide). Selecting several rows moves them together.
- Footer: Cancel (outline) and **Apply** (brand). Once a View Name is typed (5) the primary becomes **Save**.
- **Saved view (6):** "Last Modified: May 18, 2026" at the top right, View Name filled ("WH Pref 261006"), and a
  red **Delete View** button at the start of the footer (the destructive red style from Account Settings:
  `--color-semantic-fill-error-strong` with `--color-gray-text-inverse-strong` text).
- **Delete confirmation (7):** title "Deleting View - Confirmation Required", the View Name shown read-only, body
  "Please confirm that you want to proceed with the deletion. This action cannot be undone.", Cancel and a red
  **Delete Item**.
- Saved views appear in the toolbar's "View" drop-down.

No coded component exists for these two lists; build them in the page folder from `Checkbox`, `IconButton`,
`Icon` and tokens (Figma's are local components, not library ones).

## 8–11. Upload File (three-step import)

Rebuilt from the newer Figma frames: "Upload Spreadsheet" (826:58304), "Map Columns - Default" (826:58411), "Review
Import" (826:58495) and "Map Columns - Upload Error" (826:58404). One flow in `UploadFlow.tsx`; each step is an
`AppModal` with a `Timeline` (Upload File → Match Columns → Review & Import) under the title.

- **1. Upload File** (800px). Title stays **Upload File** (Figma says "Import Warehouses"). Description "Fill in our
  template, upload it here, then match your columns on the next step." A gray **Download Template** button (`import`
  icon) downloads the CSV in `public/templates/`. The drop zone is `UploadFile` restyled to Figma (sunken fill, 2px
  dashed border, 40px `file-upload` icon), hint "CSV or XLSX · up to 10 MB · up to 5,000 rows". Choosing a file
  starts the upload at once: a file row (document icon, name, "Uploading… 65%", a 6px teal bar, size) with an X that
  cancels or removes it. Footer: Cancel, **Next: Match Columns** (disabled until the upload finishes).
- **2. Match Columns** (1040px). "We matched 7 of 9 columns automatically…" (the count when the file arrived).
  Pills: matched (green), need a match (amber), skipped (black). A caution notice names the required fields
  (Warehouse ID, Warehouse Name, Country) and says which aren't matched yet. The table (shared table template):
  Column in Your File · Sample Values (first three) · HUB360 Field (`EditableCell` select; required fields marked
  `*`, "Don’t import" skips a column, a field already used isn't offered again) · Status. Columns match by name and
  common aliases (Street → Address 1, ST → State, Zip → Zip Code…). Footer: Back, Cancel, **Next: Review** (disabled
  while a required field is unmatched or a column needs a match).
- **3. Review & Import** (800px). Tiles: New warehouses (green), Update existing (teal; a Warehouse ID that already
  exists updates that warehouse, keeping what the file has no column for), Rows with errors (red). "Rows with errors
  (skipped)" lists each row number and problem (empty ID / name / country, an unsupported country, a short or bad US
  ZIP, an ID repeated in the file), with **Download Error Report** (a CSV of them). Footer: Back, Cancel,
  **Import N Warehouses**. Import shows a toast ("2 warehouses added and 1 updated.").
- **Upload error:** unchanged. A file that isn't CSV/XLSX, is over 10 MB or 5,000 rows, has no header row, or is
  named with "error" shows "We couldn’t upload your file. Please try again." with Cancel and **Try Again**.
- XLSX files can't be read by the prototype, so they import the template's two sample rows.

## 15. Add Warehouse

`AppModal` (Figma ≈ 800px), title **Add Warehouse**, "*Indicates required field" under it (red `*` like Sign Up).

| Field | Control | Required | Notes |
|---|---|---|---|
| Warehouse ID | `TextInput` | yes | placeholder WH-001; must be unique |
| Country | `Dropdown` | yes | default United States of America |
| Warehouse Name | `TextInput` | yes | full width |
| Find address | `SearchBar` | | Figma 826:57894; placeholder "Start typing an address to fill the fields below". Searches sample addresses in the chosen country (`FindAddress.tsx`); picking one fills the address fields below, which stay editable |
| Address 1 | `TextInput` | yes (US) | full width |
| Address 2 | `TextInput` | | full width |
| City / State / Zip Code | `TextInput` / `Dropdown` / `TextInput` | yes (US) | one row of three; State placeholder "Select"; ZIP is 12345 or 12345-6789 |

Canada and Mexico swap in their own address fields and required parts (`AddressFields.tsx`).

Footer: Cancel (outline), **Create** (brand). Errors show under each required field on Create. A new warehouse
joins the table as Active with zero locations.

## Files when we build

```
src/app/pages/app/inventory/
  WarehousesPage.tsx          list, toolbar, table, pagination; owns the modals
  warehouses.module.css
  warehouseData.ts            sample warehouses, fields, saved views
  EditColumnsModal.tsx        4–7 (+ the two drag lists)
  UploadModal.tsx             8–9, 14
  MapColumnsModal.tsx         10–13
  AddWarehouseModal.tsx       15
public/templates/warehouses-template.csv
```

Route: `<Route path="inventory/warehouses" element={<WarehousesPage />} />` in `App.tsx`, above the generic
`:section/:page?` route. `AppModal` gains `variant="confirm"` for 2–3.

## Open questions (decide before building)

1. **Status pill colors.** Figma: Active orange, Inactive dark gray. `StatusPill`: Active green (success). Keep the
   design system's green, or match Figma?
2. **Tier 3 header.** Figma's list has no Tier 3 header; our convention starts every page from `RecordPage`. Use it
   on this list page, or skip it like Account Settings?
3. **Modal widths.** Figma: Add Warehouse ≈ 800, Upload ≈ 728, Edit Columns ≈ 905, Map Columns ≈ 1,550. Our
   convention is 800. Allow Edit Columns and Map Columns to be wider?
4. **Map Columns options.** Figma's sample options are US states (placeholders). Use the real warehouse fields:
   Code, Name, Address 1, Address 2, City, State, Zip Code, Country, Inventory Value, Locations, Filled Locations?
5. **Not drawn in Figma:** the row ••• menu, the Actions drop-down options, the filter pop-overs, and the empty and
   no-results states. The proposals above stand in until they're designed.
