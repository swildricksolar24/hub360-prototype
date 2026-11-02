# Warehouse record — build spec

The plan for building a single warehouse's record page, opened from **Inventory › Warehouses**, from the Figma flow.
It uses the coded design system in this repo as the source of truth.

**Status:**
- Built: everything below. That covers the store, the route, the header (with Active / Actions / Save / ‹ ›), all
  of the tabs with their modals, and Location Details (`LocationDetailsPage.tsx`).
- Not built: Printers, which has no Figma design and shows RecordPage's "not built yet" placeholder.

- **Figma:** *Inventory Management – Core* (file key `7FlRxkXbbjUhWJ3t1MMrVr`). Use the pages listed under
  **"→ Warehouses"**: Details (18:11144), Contacts (525:3677), Items (335:47354), Pick / Pack (68:8126),
  Locations (80:9459), Stock (76:10860) and History (571:39637). Use the frames on the dark background. Ignore the
  **ARCHIVE** sections, and the four older Details frames (508:73574, 508:73686, 508:73788, 508:73890) that sit
  beside them: those use collapsible cards and a Key Contacts card, which the current design replaced.
- **Source of truth:** where Figma and the code disagree, the code wins: the tokens in `tokens.css`, the components
  in `src/components/`, and the app conventions in `CLAUDE.md`:
  - `RecordPage` for the page;
  - `AppModal` for every dialog;
  - the teal brand primary button;
  - hover fades;
  - light and dark themes.
- Figma draws the old shell. Build inside the current `AppShell`; don't copy Figma's chrome.
- **General notes page (462:15713):** applies to everything here:
  1. "All modals should have an 'X' to escape": `AppModal` already has one, including the Add Part / Assembly / Kit
     modals, which Figma draws without it.
  2. A warehouse needs a Contacts tab listing the people who work there, with a modal of their details that links
     to the CRM. This is tab 2 below.
  3. "Number should be #": labels and column headers say `Item #`, `Account #`, `Phone #`, not "Number".

## The flow at a glance

| # | Screen | Figma frame | Opens from |
|---|---|---|---|
| 1 | Details | Details / Filled Out (380:28637) | A warehouse row (or its ••• › View / Edit), or after Add Warehouse saves ("WAREHOUSE ADDED") |
| 1a | Confirm Deactivation | Action Confirmation (508:75882) | Turning the header's Active toggle off |
| 1b | Search Carrier Account | Modal- Add Key Carrier - Default / Search (384:33406, 384:33429) | Details › Add Carrier |
| 1c | Add Carrier Account | Modal- Add Key Carrier - Create New Carrier (384:33589) | Add New Carrier in 1b |
| 1d | Edit Carrier | Modal- Edit Carrier (525:30327) | A carrier row's ••• › Edit |
| 2 | Contacts | 537:57135 (named ".../Details/Filled Out" in Figma) | Contacts tab |
| 2a | Search Contacts | Modal- Add Contact / Search (537:57691, 537:57757) | Contacts › Add Contact |
| 2b | Add Contact | Modal- Add Contact - Create New Contact (537:57704) | Add New Contact in 2a |
| 2c | Edit Contact | Modal- Edit Contact (537:57724) | A contact row, or its ••• › Edit |
| 3 | Pick / Pack | Inventory / Warehouse / Pick - Pack (84:11914) | Pick / Pack tab |
| 3a | Add / Edit Label | Pick/Pack Label Defaults Modal (723:15932, 723:17434) | Label Defaults › Add Label, or a label row |
| 4 | Printers | none in Figma | Printers tab: "not built yet" placeholder |
| 5 | Locations: Overview | Inventory / Warehouse / Location (80:10030) | Locations tab |
| 5a | Locations: Structure | Inventory / Warehouse / Location (562:4260) | Structure in 5's toolbar |
| 5b | Add Location / Add Sublocation | Add Location (80:10747), Add Location (562:3249) | Add New ▾ in 5 |
| 5c | Location Details | Location Details (421:13272), Structure sub-tab (570:34435) | A location row, or its ••• › Edit |
| 6 | Items | Inventory / Warehouse / Items (335:47354 › 571:24397) | Items tab |
| 6a | Search Items | Modal- Add Item / Search (571:41931, 571:41966) | Add Item ▾ › Add Item |
| 6b | Add Part / Assembly / Kit | Modal Screen (571:53644, 571:53661, 571:53678) | Add New ▾ in 6a |
| 6c | Clone Warehouse | Modal- Add Warehouse / Search (571:54749, 571:54762) | Add Item ▾ › Clone Warehouse |
| 7 | Stock | Inventory / Warehouse / Stock (76:11638) | Stock tab |
| 8 | History | 571:57601 (named ".../Items" in Figma) | History tab |

## Routing and data

- **Route:** `/app/inventory/warehouses/:code`, with the tab in the query: `?tab=contacts` opens Contacts, and no
  tab opens Details.
  - The tab is a query rather than a path segment so that switching tabs doesn't open a new app tab (the shell opens
    one app tab per pathname).
  - `AppShell` matches `/app/:section/:page?/*`, so Inventory and its Tier 2 menu (with Warehouses selected) stay in
    place on deeper paths.
  - The app tab's label is the warehouse name, e.g. "Phoenix WH", from `recordLabel` on the Warehouses entry in
    `navigation.ts`. Its title is "Inventory · Warehouses · Phoenix WH".
  - ‹ / › and leaving a deleted record navigate with `state: { replaceTab: true }`, which reuses the current app tab.
- **Opening a record:** in the Warehouses list, the code and name cells link to the record, and ••• › View opens it.
  DataRow has no row-click, so links keep it keyboard-accessible.
- **Shared data:** today the warehouse list is local state in `WarehousesPage`. Move it into a small in-memory store,
  `warehouseStore.ts` (`useSyncExternalStore`, like `theme.ts`), so the list and the record edit the same warehouses.
  The record's carriers, contacts, labels, locations, items and stock live in the same store, keyed by warehouse code.
  Sample data goes in `warehouseRecordData.ts`. State resets on reload, like the rest of the prototype.
- **Unknown code:** "Warehouse not found" with a link back to the list.

## Header (all tabs)

Build it with `RecordPage`:

| Part | Value |
|---|---|
| `icon` | `warehouse` |
| `title` | The warehouse name in capitals, e.g. "PHOENIX WH" |
| `breadcrumb` | Inventory › Warehouses (link to the list) › the warehouse name |
| `meta` | `SYSTEM ID: PHX-124` (the warehouse code) |
| `labels` / `tag` | None. Figma shows none. |
| `sections` | Details · Contacts · Pick / Pack · Printers · Locations · Items · Stock · History, in Figma's order |
| `actions` | The full `RecordActions` set on every tab, described below |

**Actions.** In Figma, Items, Locations, Stock and History drop Actions and Save. Keep the full set on every tab
instead, so the header doesn't jump between tabs.
- **Active toggle:** reflects the warehouse's status. Turning it off opens Confirm Deactivation (1a); turning it on
  opens Confirm Activation. Reuse the confirm modals from the Warehouses page.
- **Actions ▾:** Activate or Deactivate, Export, Delete.
- **Save:** saves the Details form (a Message confirms it).
- **‹ / ›:** move to the previous / next warehouse in the list order, staying on the same tab.

**Inactive warehouses:** when a warehouse is inactive, its record still opens and can be edited.

## Standard table (tabs 1, 2, 5, 6, 7)

All of these tabs use the same table pattern as the Warehouses list:
- `DataHeader` / `DataRow` with header and row checkboxes;
- sort and filter icons on every header;
- alternating Sunken / Overlay rows;
- inactive rows dimmed to 0.4, keeping the pill and ••• at full strength;
- the Active / Inactive pill;
- a ••• `ContextMenu` on each row;
- the `PageTracker` pager, when Figma shows it.

Reuse the Warehouses page's classes. Move them into a shared `table.module.css` in `inventory/`, so each tab doesn't
copy them.

## 1. Details

Two cards, each with a title and a divider under it (`Card`).

**Warehouse Details**, editable inline. Save in the header saves it.

| Field | Control | Sample | Layout |
|---|---|---|---|
| Warehouse Name * | TextInput | Phoenix WH | Row 1, wide |
| Country * | Dropdown | United States of America | Row 1, narrow |
| Address 1 * | TextInput | 11565 W Summertime | Full width |
| Address 2 | TextInput | — | Full width |
| City * | TextInput | Phoenix | Row 4, thirds |
| State * | Dropdown | Arizona | Row 4, thirds |
| Zip Code * | TextInput | 85085 | Row 4, thirds |

Required markers follow the Add Warehouse modal; the Details card in Figma shows none. The values come from the
warehouse itself, so they match the list.

**Carrier Accounts**: title on the left, `⊕ Add Carrier` (brand, small, icon left) on the right.

| Column | Sample |
|---|---|
| ☐ | |
| Name | UPS |
| Account # | 132456 |
| Account Nickname | UPS - PHX WH01 |
| Billing Type | Prepaid |
| Service Type | Tags: Ground, LTL |
| (status pill) | Active |
| ••• | Edit, Activate / Deactivate, Remove |

The second sample row is FedEx · 465798 · FX - PHX WH01 · Collect · Ground, LTL · Inactive. There is no pager.

**1b Search Carrier Account**
- An `AutocompleteInput` search over known carriers.
- Each result shows the carrier name, a subline (e.g. "FedEx - Florida") and its account # at the right. Figma's
  "Title" label there is a placeholder for Account #.
- Picking a result adds that account to the warehouse.
- Buttons: Cancel, and brand `⊕ Add New Carrier`, which opens 1c.

**1c Add Carrier Account**
- Description: "*Indicates required field".
- Fields:
  - Carrier Name * (Dropdown: UPS, FedEx, USPS, DHL)
  - Account # * (TextInput)
  - Account Nickname (TextInput)
  - Billing Type * (Dropdown: Prepaid, Collect, Third Party)
  - Service Type * (MultiselectDropdown: Ground, LTL, International, Express)
- Buttons: Cancel, Save.

**1d Edit Carrier**
- The same fields as 1c, filled in.
- An Active toggle in the header.
- Billing Type stays single-select. Figma draws it as chips, but the table shows one value per row.
- Footer: red "Remove Carrier" on the left (asks to confirm), with Cancel and Save on the right.

## 2. Contacts

One untitled card, with `⊕ Add Contact` on the right above the table.

| Column | Sample |
|---|---|
| ☐ | |
| ★ | Filled for the warehouse's primary contact. Clicking a star makes that contact primary; only one star is filled at a time. |
| Name | Waylon Jones |
| Phone # | 602-358-9652 |
| Email | wjones@hb360.com |
| Role | Manager |
| Additional Roles | Tags: Shipping, Receiving |
| (status pill) | Active |
| ••• | Edit, View Profile, Activate / Deactivate, Remove |

The other sample rows:
- Obi Wan · 526-365-5569 · owan@hb360.com · Accounting · Inactive
- Pamela Isley · 480-320-2253 · pisely@hb360.com · Associate · Inventory Control · Active

Fix Figma's "Recieving" typo. Clicking a row opens 2c.

**Role options:** Manager, Assistant Manager, Inventory Control, Receiving, Shipping, Dock Coordinator, Freight
Coordinator, Carrier Contact, IMS/WMS Admin, IT / Technical Contact, ERP Integration Contact, Purchasing,
RMA / Disputes, Safety Officer, Hazmat Coordinator, Security Contact, Fire / Safety, Facility Maintenance, Billing,
Accounts Payable, Accounts Receivable, Lead Installer, Installer, Electrician, Service Tech, Accounting, Associate,
Other.
- They come from the archived role list (525:11924), with the duplicate "Receiving" removed.
- Accounting and Associate are added because the sample rows use them.

**2a Search Contacts**
- The search lists people from the CRM. Each result shows an `Avatar`, the name, the company and the primary role.
  Samples: Wayne Nelson / Solar Topps; Jeremy Wonder / ABC Holding Company.
- Picking a result adds that person.
- Buttons: Cancel, and brand `⊕ Add New Contact`, which opens 2b.

**2b Add Contact**
- Description: "*Indicates required field".
- Fields:
  - Company Name (Dropdown)
  - Contact Name * (TextInput)
  - Contact Phone # (TextInput, `type="tel"`)
  - Contact Email Address (TextInput, `type="email"`)
  - Primary Role (Dropdown)
  - Additional Roles (MultiselectDropdown)
- Buttons: Cancel, Save.

**2c Edit Contact**
- The same fields as 2b, filled in.
- In the header: an Active toggle and a brand "View Profile" button. The CRM isn't built, so View Profile shows a
  Message: "The CRM isn't part of this prototype yet."
- Footer: red "Remove Contact" on the left (asks to confirm), with Cancel and Save on the right.

## 3. Pick / Pack

A two-column grid of cards, each with a title and a divider. The fields save with the header's Save.

**Left column**

| Card | Fields |
|---|---|
| Pick Ticket Setup | Picking Format (Dropdown, placeholder "Select format…") · Print Order (Dropdown: Entry date / creation) · Default Printer (Dropdown: HP02156 - Back Office) · Notification Email Address (TextInput: warehouse-alerts@beacondepot.com) · ☑ Auto Print Tickets to Warehouse |
| Packing List Defaults | Packing Format (Dropdown: Default) · Packing Slip Printer (Dropdown: HP0034 - Warehouse Office) · Notification Email Address (TextInput: invoices@beacondepot.com) · ☑ Show Pricing on Packing Slip |
| Label Defaults | `⊕ Add Label` on the right. A table: ☐ · Name · Printer · Size · a row action (a magnifier in Figma). Samples: Pick/Pack Label Carton · CJ3000 - Shipping Office · 4 × 6 in; Shipping Label · CJ3000 - Front Office · 4 × 6 in. Clicking a row opens Edit Label. |

The Label Defaults row action uses ••• (Edit, Delete) instead of Figma's magnifier, to match the other tables. The
label name is "Pick/Pack Label Carton" everywhere; Figma's table says "Pick Pak".

**Right column**

| Card | Fields |
|---|---|
| Allocations and Commit Timing | Allocate Stock When (Dropdown: Order Creation) · Commit Stock When (Dropdown: Pack Complete) · Number of Days Before / After (NumericInput: 0) · Entry (Dropdown: Due Date) |
| Fulfillment and Optimization | Checkbox groups, each under a bold sub-heading. **Stock Default Rules:** ☑ Show Only Available Items, ☑ Enable FIFO / FEFO Rotation. **Pick Operations:** ☑ Allow Partial Pick, ☐ Allow Overpicking on Orders, ☑ Allow Item Substitutions. **Path and Route Optimization:** ☐ Route by Item # , ☑ Route by Quantity (Highest → Lowest), ☑ Travel Path Optimization, ☑ AI Route Optimization Engine. **Scanning and Validation:** ☑ Scan Location Before Selecting Item, ☑ Validate Lot Numbers, ☑ Validate Serial Numbers, ☐ Manual Confirmation of Quantity |

Figma draws Number of Days as a select; it's a `NumericInput` here.

**3a Add / Edit Label** (`AppModal`, `width={1040}`)
- Title: "Add Label" or "Edit Label".
- Description: "Choose the label and printer for this warehouse. The size is preset from the label and can be
  changed. *Indicates required field".
- **Left:**
  - Label Name * (Dropdown)
  - Printer * (Dropdown)
  - Label Size *: `ButtonGroup` of 2 × 1 in · 3 × 2 in · 4 × 6 in · 4 × 8 in · Custom. Choosing a label presets the
    size. Helper text: "4 × 6 in is the preset for Pick/Pack Label Carton. Change it only if the printer is loaded
    with different label stock."
  - Copies per Carton (NumericInput: 1) and Orientation (Dropdown: Portrait / Landscape), side by side.
- **Right:**
  - The "Label Preview" panel, captioned with the size and "sample data".
  - The preview is a mock label: PICK / PACK · PHX-124 · Phoenix WH · ORDER ORD-10480 · Ship to: Gomez Residence,
    4418 E Cactus Rd, Phoenix, AZ 85032 · Carton 1 of 3 · 12 items · a barcode · ORD-10480-C01.
  - The preview's aspect ratio follows the size.
  - "Full-Size Preview" and "Print Test Label" (primary, small, with icons) show a Message, because the prototype
    can't print.
- **Footer:** Cancel and Save Label. Edit Label adds a red Delete on the left.

## 4. Printers

The tab is in every Figma header, but no page is designed. Show `RecordPage`'s "not built yet" placeholder.

## 5. Locations

**Toolbar** (the Warehouses list toolbar):
- `ButtonGroup` Overview | Structure, then a divider;
- View ▾, Columns, Upload, Actions ▾, Search;
- brand `Add New ▾`, with the options Add Location and Add Sublocation.

**5 Overview table**

| Column | Sample |
|---|---|
| ☐ | |
| Location | Zone A |
| Description | Location Description |
| Type | Pallet / Bin / Shelves |
| Frozen | Yes |
| Non-Pickable | No |
| Empty | Yes |
| # of Sublocations | 0 |
| (status pill) | Active |
| ••• | |

The pager sits below. The samples are Zone A, Zone C and Zone H as in Figma; add enough to fill a page.

**5a Structure**
- A tree in place of the table, with no pager.
- Each row is a bar with: a drag handle, a depth badge (1–4), "↳" indented by depth, the bold name, and four icon
  buttons: outdent (←), indent (→), add child (⊕), edit.
- Sample: 1 Area A › 2 Shelf 1 › 3 Bin 1 › 4 Bin 1 - Left.
- Dragging reorders rows among their siblings. Indent and outdent change a row's depth.
- Build it from `ListBox`'s `TreeList` if it fits. Otherwise make a page-level component; don't add a new library
  component without asking.

**5b Add Location / Add Sublocation**
- Description: "*Indicates required field".
- Fields:
  - Sublocation only: Location (Dropdown, the parent; shown first).
  - Location Name * (or Sublocation Name *) and Type (Dropdown: Pallet, Bin, Shelves, Rack, Zone), side by side.
  - Description (TextArea).
  - Under "Status Options": Frozen, Non-Pickable and Empty checkboxes, each with an ⓘ `Tooltip`.
- In Add, all three checkboxes start unchecked; Figma draws them checked, but that looks like an artifact.
- Buttons: Cancel and Create Location (or Create Sublocation).

**5c Location Details**
- A deeper route: `/app/inventory/warehouses/:code/locations/:locationId`.
- `RecordPage` with the title "ZONE A", the breadcrumb Inventory › Warehouses › Phoenix WH (link) › Zone A, and the
  full action set.
- **Location Details card:**
  - Frozen, Non-Pickable and Empty checkboxes (each with ⓘ) on the title row.
  - Name * (wide) and Type * (narrow), side by side.
  - Description (TextArea).
- **Second card:**
  - Toolbar: `ButtonGroup` Overview | Stock | Structure; View ▾, Columns, Upload, Actions ▾, Search; brand
    "Add Item".
  - Overview table: ☐ · Location · Item # · Name · Type · Category · Sub Category · status · •••, with a pager.
    Samples: RA-01-01 · 123456 · Part, Kit, or Assembly Name · Part · Name · Sub Name · Active.
  - Structure: the 5a tree, for this location's children only.
  - Stock: not designed; use the Stock table (7), filtered to this location.

## 6. Items

**Toolbar:** View ▾, Columns, Upload, Actions ▾, Search, and brand `Add Item ▾` with the options Add Item and
Clone Warehouse.

| Column | Sample |
|---|---|
| ☐ | |
| Item # | 123456 |
| Name | Part, Kit, or Assembly Name |
| Type | Part / Kit / Assembly |
| Category | Name |
| Sub Category | Sub Name |
| (status pill) | Active |
| ••• | |

There is a pager. Use real-looking sample items in place of Figma's placeholders, e.g. Hex Bolt (Part), Shock Build
(Assembly), Install Kit (Kit). Share them with the Items section later.

**6a Search Items**
- Results show an icon, the item name, the item # and the type at the right.
- Picking a result adds that item.
- Buttons: Cancel; outline "Add All Items", which adds every result; and brand `Add New ▾`, with the options Part,
  Assembly and Kit.

**6b Add Part / Add Assembly / Add Kit**
- Description: "*Indicates required field".
- Fields:
  - Custom Part Number * (label it "Custom Part #", per the general note)
  - Part Name *
  - The Assembly and Kit modals ask for their own # and name in the same way.
- Buttons: Cancel and Create Part / Create Assembly / Create Kit.

**6c Clone Warehouse**
- Search Warehouse: each result shows the warehouse name and its system ID. Cancel is the only button.
- Picking a warehouse copies its items into this one: confirm first, then show a Message with the count added.

## 7. Stock

**Toolbar:** View ▾, Columns, Upload, Actions ▾, Search. Leave out Figma's "Create Order ▾" until Orders is built
(Figma's note: "When orders get built").

| Column | Sample |
|---|---|
| ☐ | |
| Item # | AS4-597-3248 |
| Description | Item Description |
| On Hand | 10 |
| Allocated | 10 |
| Committed | 10 |
| Frozen | 0 |
| Available | 0 |
| Location | Tool Room 1 (a link to its Location Details) |
| ••• | |

- No status pill.
- A bold **Totals** row on the header's teal tint, followed by the pager.
- Make the sample numbers consistent: Available = On Hand − Allocated − Frozen. The totals sum the rows, since
  Figma's don't.

## 8. History

**Toolbar:** Columns and Search only.

| Column | Sample |
|---|---|
| Action Type | Teal badge: Stock Order / Pick Order / Build Order / Move Order |
| Action Performed | Wraps to two lines, with links to the order or item |
| Created By | Roman Sionis |
| Date Created | Two lines: Jun 16, 2026, then 12:37:45 PM |

- Rows are 80px tall, with no checkboxes and no •••.
- There is a pager.
- Write real sentences in place of Figma's lorem ipsum, e.g. "Moved 24 × Lug Nut (AD23-4529) from PHX-066 to
  PHX-244".

## Files when we build

- `inventory/warehouseStore.ts`: shared warehouses and their record data.
- `inventory/warehouseRecordData.ts`: sample data.
- `inventory/WarehouseRecordPage.tsx`: the route, header and tabs.
- `inventory/record/<Tab>.tsx`: one file per tab.
- `inventory/record/*Modal.tsx`: one file per modal.
- `inventory/table.module.css`: the shared table styles.
- `inventory/LocationDetailsPage.tsx`.

## Build order

1. Store, route and header.
2. Details.
3. Contacts.
4. Locations (with Location Details).
5. Items.
6. Stock.
7. Pick / Pack.
8. History.
9. Printers placeholder.

## Open questions (my default in brackets)

1. Should Items, Locations, Stock and History drop Actions and Save, as Figma draws them? [Keep the full set on every
   tab.]
2. What does the ★ in Contacts mean? [The primary contact, one per warehouse.]
3. Where does a carrier, contact or label get removed? [Each one's edit modal, plus its row's •••, both with a
   confirmation.]
