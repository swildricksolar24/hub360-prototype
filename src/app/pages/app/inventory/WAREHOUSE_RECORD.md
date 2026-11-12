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
| 1 | Details | Inventory / Warehouse - A (18:11145); edit form from Details / Filled Out (380:28637) | A warehouse row (or its ••• › View / Edit), or after Add Warehouse saves ("WAREHOUSE ADDED") |
| 1a | Confirm Deactivation | Action Confirmation (508:75882) | Turning the header's Active toggle off |
| 1b | Add Carrier Account | Add Carrier Account — Improved (848:17307) | Details › Add Carrier |
| 1c | New / Copy Carrier Account | Edit Carrier Account — Improved (848:20546) layout | Add New Carrier Account in 1b, or a row's ••• › Copy |
| 1d | Edit Carrier Account / Remove | Edit Carrier Account — Improved (848:20546), Remove Carrier Account — Improved (848:20626) | A carrier row's ••• › Edit |
| 2 | Contacts | Inventory / Warehouse / Details / Filled Out (848:20960) | Contacts tab |
| 2a | Add Contact (CRM search) | Modal- Add Contact - Search (848:21038) | Contacts › Add Contact |
| 2b | Create New Contact | Modal- Add Contact - Create New Contact (848:20988) | Create New Contact in 2a |
| 2c | Edit Contact / Remove | Modal- Edit Contact (848:21010), Modal- Remove Contact (857:22542) | A contact's name, or its ••• |
| 3 | Pick / Pack | View (899:3331), edit (84:11914) | Pick / Pack tab; the header's Edit |
| 3a | Add / Edit Label | Pick/Pack Label Defaults Modal (723:15932, 723:17434) | 4 · Labels while editing |
| 4 | Printers: first setup | Printers · Empty (First Setup) (891:3248) | Printers tab, for a warehouse without printers |
| 4a | Set Up Print Agent | Set Up Print Agent (Modal) (891:3722) | First setup step 1, or Settings › Set Up Print Agent |
| 4b | Add Printer (3 steps) | Add Printer · 1 Connection / 2 Find Printer / 3 Settings & Test (891:3801, 891:3882, 891:4036) | First setup step 2, or List › Add Printer |
| 4c | Printers: List / Settings | 886:64894, 911:5680 | Printers tab |
| 4d | Printer Details | Settings (901:24728, edit 891:12852), Default Use (901:25215, edit 901:25764), Print Jobs (901:26381) | A printer's name |
| 5 | Locations: Tree / Flat List | Inventory / Warehouse / Location (857:28319 tree, 872:53895 flat list) | Locations tab |
| 5b | Add Location (one or a range) | Add Location (Improved) (872:53690), Add Location - Range (857:28408) | Add Location, or a row's + |
| 5c | Location Details | Location Details (857:28345; stock 872:56252; edit 872:62836) | A location's name, or its ••• › View |
| 6 | Items | Inventory / Warehouse / Items (335:47354 › 571:24397) | Items tab |
| 6a | Search Items | Modal- Add Item / Search (571:41931, 571:41966) | Add Item ▾ › Add Item |
| 6b | Add Part / Assembly / Kit | Modal Screen (571:53644, 571:53661, 571:53678) | Add New ▾ in 6a |
| 6c | Clone Warehouse | Modal- Add Warehouse / Search (571:54749, 571:54762) | Add Item ▾ › Clone Warehouse |
| 7 | Stock | Inventory / Warehouse / Stock (571:56332) | Stock tab |
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
  - Opening a record from the list stays in the current app tab (only Tier 1 / Tier 2 open new tabs). ‹ / › and
    leaving a deleted record navigate with `state: { replaceTab: true }`, which also closes the current tab when
    the page it goes to is already open in another.
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
| `labels` | One Tier 3 Label under the title: `ID: PHX-124` (the warehouse code) |
| `tag` | None. Figma shows none. |
| `sections` | Details · Contacts · Pick / Pack · Printers · Locations · Items · Stock · History, in Figma's order |
| `actions` | The full `RecordActions` set on every tab, described below |

**Actions.** In Figma, Items, Locations, Stock and History drop Actions and Save. Keep the full set on every tab
instead, so the header doesn't jump between tabs.
- **Active toggle:** reflects the warehouse's status. Turning it off opens Confirm Deactivation (1a); turning it on
  opens Confirm Activation. Reuse the confirm modals from the Warehouses page.
- **Actions ▾:** Activate or Deactivate, Export, Delete.
- **Edit / Save:** Figma 18:11145 shows **Edit**. It opens the Warehouse Details form (and the Details tab). While
  editing, the button reads **Save**, with an outline **Cancel** before it. Save validates and saves the form (a Toast
  confirms it), then goes back to the read-only view; Cancel drops the changes. ‹ / › also leave edit mode.
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

Figma 18:11145: a row of KPI tiles, then two cards, each with a title and a divider under it (`Card`).

**KPI tiles.** Eight design-system `Tile`s (Base "Tile / KPI"), wrapping to fewer per row on narrow screens. Each opens
what it counts.

| Tile | Value | Note | Opens |
|---|---|---|---|
| Inventory Value | The warehouse's value, whole dollars | +3.2% vs last 30 days (sample) | Stock tab |
| Locations | The warehouse's location count | "478 Filled. 88% Utilization" from its filled count | Locations tab |
| Below Reorder Point | 14 items (sample) | 5 with no open PO | Items tab |
| Open Orders | Its In Process orders | How many are due in the next 7 days | Orders, searched by the code |
| Waiting for Approval | 6 (sample) | 2 older than 3 days | Orders, searched by the code |
| Pending Review | 4 (sample) | 1 with a discrepancy | Orders, searched by the code |
| In Transit | 3 (sample) | 2 arriving tomorrow | Orders, searched by the code |
| Stock needed for projects | 3 short (sample) | For Sale orders due in 14 days | Orders, searched by the code |

**Warehouse Details**, read-only until the header's Edit. Each field is a label (Tiny / Regular, Gray Text/Weak) over
its value (Medium / Bold, Gray Text/Strong), on a grid of a half and two quarters:
- Row 1: Warehouse Name, Warehouse ID (the code).
- Row 2: Address (one line, `formatAddress`), Country, Time Zone.

**Time Zone** (`timeZones.ts`): the zone the state or province is in (Arizona: "Mountain Time (Arizona, no DST)")
until one is picked in the form; a picked zone is saved on the warehouse as `timeZone`.

**Edit form** (after Edit; the header's Save saves it):

| Field | Control | Sample | Layout |
|---|---|---|---|
| Warehouse Name * | TextInput | Phoenix WH | Row 1, half |
| Country * | Dropdown | United States of America | Row 1, quarter |
| Time Zone | Dropdown (follows the state until picked) | Mountain Time (Arizona, no DST) | Row 1, quarter |
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
| ••• | Edit, Copy, Activate / Deactivate, Remove |

The table is Volt's Data Table (`DataTable`, Base 3299:1399): sort icons on each header (Service Type sorts on its
tags), Active / Inactive badges, ••• on every row. Clicking anywhere on a row opens Edit Carrier Account; the
underlined name is the keyboard way in.

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

**Copy** (••• › Copy) opens 1c filled from that account: same carrier, billing type and services, the nickname with
" (copy)" added, and an empty Account # to fill in.

**1d Edit Carrier**
- The same fields as 1c, filled in.
- An Active toggle in the header.
- Billing Type stays single-select. Figma draws it as chips, but the table shows one value per row.
- Footer: red "Remove Carrier" on the left (asks to confirm), with Cancel and Save on the right.

## 2. Contacts

**Latest Figma (848:20960 …), as built:** All / Internal / External chips (internal = the company's own people,
shown "HUB360 (Internal)"), a search and Add Contact; columns ★, Name, Company, Phone, Email, Primary Role, Additional
Roles, status. Add Contact searches the CRM with a checkbox per person ("Already on this warehouse" can't be picked),
Create New Contact has First / Last Name and "Make Primary Contact for Warehouse", Edit adds Active, View in CRM and
Remove from Warehouse; removing the primary contact offers a New Primary Contact. The notes below describe the first
version.


One untitled card, with `⊕ Add Contact` on the right above the table.

| Column | Sample |
|---|---|
| ☐ | |
| ★ | Filled for the warehouse's primary contact. Clicking a star makes that contact primary; only one star is filled at a time. |
| Name | Orson Krennic |
| Phone # | 602-358-9652 |
| Email | okrennic@hb360.com |
| Role | Manager |
| Additional Roles | Tags: Shipping, Receiving |
| (status pill) | Active |
| ••• | Edit, View Profile, Activate / Deactivate, Remove |

The other sample rows:
- Obi Wan · 526-365-5569 · skarn@hb360.com · Accounting · Inactive
- Kendal Ozzel · 480-320-2253 · pisely@hb360.com · Associate · Inventory Control · Active

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

**Latest Figma (899:3331 view, 84:11914 edit), as built:** five numbered cards, read-only until the header's Edit;
the edit banner above the header ("You're editing Warehouse Pick / Pack Settings. 2 unsaved changes.") saves or
discards. 1 · Allocation & Commit (stages, commit at or after allocation, "Start allocating N days before the order's
Due date"), 2 · Picking (format, printer, auto-print, sort chips, then by, rotation chips, pick rules and scanning &
validation switches), 3 · Packing, 4 · Labels (edit / delete and Add Label Default while editing; these save as they
change) and 5 · Notifications. The printer menus list the Printers tab's printers. The notes below describe the first
version.


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

Figma "Printers" page (886:64893). Data: `printerData.ts` (printers, print agents, document defaults, print jobs,
printing defaults); stores in `warehouseStore.ts`. Phoenix WH (PHX-124) starts set up; every other warehouse starts at
first setup. The list view, the open printer and its view are in the URL: `?tab=printers&view=settings`,
`&printer=pr3&pview=jobs`.

- **First setup (891:3248):** three steps. 1 Set Up Print Agent; 2 Add Printer (on once an agent is paired); 3 Go to
  Pick / Pack (off until there's a printer).
- **Set Up Print Agent (891:3722):** Download · Install · Pair stepper, Windows / macOS, a pairing code with a 10-minute
  countdown, "Waiting for the agent to connect…". In the prototype the agent pairs 4 seconds after a download is picked;
  Done adds it.
- **Add Printer (891:3801 → 891:4036):** 1 Connection (print agent, Find it on the network / Enter an IP address /
  USB); 2 Find printer (what the agent found, one at a time; ones already added can't be picked; Scan Again); 3 Settings &
  test (name, area, type, label sizes, resolution, speed, darkness, "Use as default for" chips, label preview, Print
  Test Label → "did it come out right?"). Save Printer adds it, and makes it the default for the chosen documents.
- **List (886:64894):** All / Online / Offline chips, search, Add Printer; Printer, Area, Type, Connection, Label Sizes,
  Used For (its default documents), Status; ••• View, Pause / Resume, Remove. The header has no Edit here.
- **Settings (911:5680):** Printing Defaults (label language, retries, history, who's notified, fall back to another
  printer) save as they change; Print Agents lists every agent in the company.
- **Printer Details (901:24728 …):** title with its status, a trail back to Printers, Print Test Page, Pause / Resume
  Printing and Remove from Warehouse (Figma's red outline button isn't in the design system yet, so it's an outline
  button that opens a red confirmation). Settings (Printer, Connection with Test Connection, Labels & Print Quality,
  Maintenance), Default Use (the warehouse's document defaults, "If this printer is offline", "Who can print here") and
  Print Jobs (the failed-job notice with Send to Another Printer / Retry Job, filters, the job table with Reprint /
  Retry / Cancel). The header's Edit edits Settings and Default Use together, with the edit banner above the header.
- **Helper switches (a prototype tool, not in Figma):** each tab adds on / off switches to the shell's Helper panel
  (`shell/PrototypeHelper.tsx`, `shell/helperFlags.ts`; the life preserver icon beside All tabs) for states the sample
  data doesn't show: empty lists (carriers, contacts, label defaults, locations, items, stock, history), no primary
  contact, and on Printers: no printers, agent offline, the open printer offline / paused / inactive, no document
  defaults, a default with no printer, and on Print Jobs a failed job (with the next one held) and a queued job. They
  change the view only. Print Jobs' failed-job alert is Volt's ActionBanner, with a fix for each error.
- **Default Use and Pick / Pack:** Default Use edits the warehouse's document defaults (`printerData` defaults). Figma
  says these are the same as Pick / Pack › Label Defaults; in the prototype the two lists are still separate.

## 5. Locations

**Latest Figma (857:28319 tree, 872:53895 flat list, 872:53690 / 857:28408 Add Location, 857:28345 Location Details),
as built:** the warehouse's totals (Locations, In use, Empty, Utilization, Frozen, Non-pickable), Tree / Flat List,
View (All, Active, Inactive, Frozen, Non-pickable, Empty), Columns, Upload, Actions (incl. Print barcode labels),
search by name or code, Add Location. Columns: name (tree: indented, expand / collapse), Parent (flat list), Code,
Type, Items (units on hand here and below), Utilization ("used/total (free)" slots), Rules badges, status, a + (add a
location inside) and •••. Drag a row onto another to move it there (within 4 levels), or onto "Drop here to move to the
top level". Codes come from the tree (A, A-01, A-01-01) unless set. Add Location adds one location or a numbered range
(prefix, From, To) with generated codes, a preview, capacity, the Frozen / Non-pickable rules and "Print barcode labels
after creating". Location Details: read-only details (Name, Code, Type, Parent, Description, Capacity) with Print
Label, a Rules card whose switches save at once, Edit / Save / Cancel in the header (Edit can rename, recode or move
it), and Tree / Flat List / Stock below. The notes below describe the first version.


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

**Latest Figma (571:56332), as built:** the toolbar sits on its own card above the table. The rest is as below.


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
| Created By | Maximilian Veers |
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
