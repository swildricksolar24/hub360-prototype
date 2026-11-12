# Items — build spec

The plan for building **Inventory › Items** (`/app/inventory/items`) and the Part, Assembly and Kit record pages from
the Figma flow. It's built in `items/`: the list (`ItemsPage`) and one record page for all three types (`ItemRecordPage`,
`/app/inventory/items/:itemId?tab=…`).

- **Figma:** *Inventory Management – Core* (file key `7FlRxkXbbjUhWJ3t1MMrVr`).
  - Pages: **"→ Items"** (102:4112); the Part pages Details (127:4953), Files (204:13076), Assemblies (217:17715),
    Kits (226:26045), Stock (240:21744) and History (240:21745); Assembly Build (411:64488); Kit Build (411:66241);
    Details - Assembly (411:62771); and Details - Kits (411:62772).
  - The "→ Parts", "→ Assembly" and "→ Kits" pages are empty dividers.
  - Ignore sections named ARCHIVE, "old" and "PREVIOUS DESIGN SYSTEM".
- **Source of truth:** where Figma and the code disagree, the code wins. The rules in [WAREHOUSE_RECORD.md](WAREHOUSE_RECORD.md)
  apply here too:
  - `RecordPage` for every record;
  - `AppModal` for every dialog, with an X (general note 1);
  - "#" instead of "Number" in labels (general note 3);
  - the shared table pattern.

## How the pieces relate

- **One combined Items list.** It has an Overview / Stock switch, and a Type column (Part / Assembly / Kit). There are
  no separate Parts, Assemblies or Kits lists.
- **Each type opens its own record page**, with these tabs:
  - **Part:** Details · Files · Assemblies · Kits · Stock · History. The Assemblies and Kits tabs list the assemblies
    and kits that use the part.
  - **Assembly:** Details · Build · Files · Kits · Stock · History.
  - **Kit:** Details · Build · Files · Stock · History.
- **What each is built from:** an assembly from parts and other assemblies; a kit from parts and assemblies.
- **Routes:**
  - `/app/inventory/items/:itemId`, with `?tab=` choosing the tab.
  - The breadcrumb is Inventory › Items › the item name.
  - The meta line is `PART # / ASSEMBLY # / KIT #: … | CATEGORY: … | SUBCATEGORY: …`.

## 1. Items list (681:14463, 681:14475)

**Toolbar:**
- `ButtonGroup` Overview | Stock;
- View ▾, Columns, Upload;
- Actions ▾ with Activate, Deactivate, Merge and Delete, for the checked rows (Deactivate on several confirms the
  ones no other active build uses together, then asks about each one still used, one at a time);
- Search;
- brand `Add New ▾` with the options Part, Assembly and Kit.

**Overview (Figma 681:14463):** a totals line ("1,412 Items  1,218 Parts  112 Kits  82 Assemblies", counting the
rows that match the view, search and filters), then the table: ☐ · Item (the number, a link, with the name under it)
· Type · Category · Unit · On Hand · Available · Warehouses · Status · •••. Every column sorts and has a "Contains…"
filter. On Hand and Available add up the item's stock rows; Warehouses counts the warehouses holding it. Unit is the
item's Unit Type without its abbreviation (Each, Pair, Foot, Kit). A pager sits below.

**Stock (Figma 681:14475):** ☐ · Item (TwoLineCell: the number, a link, with the name under it) · Category ·
Warehouse · On Hand · Allocated · Committed · Frozen · Available · Status · •••, one row per item and warehouse
location; an item with no stock gets one row with "—" and zeros. Every column sorts and has a "Contains…" filter.
Status is a Badge pill: black **Inactive (catalog)** for an inactive item, amber **Below reorder pt** when Available is
0 or under the item's reorder point, otherwise green **Stocked**. ••• has View Item and View Warehouse Stock. Location
(a link to the warehouse's Locations tab) is off by default and can be added under Columns. No Totals row on the list;
an item's own Stock tab keeps Warehouse … Status plus Location, and a Totals row.

**Create New Item** (Figma "Modal - Add New Item" 681:14400; opened from Add New ▾ › Part / Assembly / Kit)
- Subtitle: "* Required. Adds the item to the catalog. Open it afterwards to add specs, suppliers and files."
- Item type *: Part · Kit · Assembly as small Tags; Add New ▾ picks the starting one, and it can be changed here.
- System Item # (read-only, bold): the # the item will get, with the type's prefix (PA, KT, AS).
- Custom Item # (optional). Figma note: the system # is enough; a custom # is for tenants who want their own.
- Item Name *.
- Category, Subcategory (its options follow the category) and Unit * (Each, Pair, Foot, Box, Kit; kits start on Kit).
- Buttons: Cancel and Create. Figma note: Create opens the new item in a new app tab, so the list's tab stays.

**Merging Items** (only from Actions › Merge with two or more rows checked; rows and records have no Merge)
- Body (Figma copy): "This Merge option allows you to combine all selected Items with the Item chosen below. …"
- Warning: "Warning: This process cannot be undone once the merge is complete."
- A table of the checked items (Keep · Item · Type · Category · Status). The Keep radio picks the item the others
  merge into; the first is picked to start with, so Merge Items is active at once. No search. Over 6 items, the table
  scrolls inside the Volt Scrollbar, 6 rows tall (less on a short window, so the buttons stay on screen).
- Buttons: Cancel and Merge Items.

**Deleting Items - Confirmation Required** (Figma 681:14500)
- Body, Large/Regular: "You are about to delete the selected Item(s). Deleting these Items will remove them from
  any Kits, Assemblies, or Orders where they are currently used. If an active replacement Item is available, it will
  be substituted automatically where applicable."
- Then a red warning, like Merging Items': "Warning: This action cannot be undone. Please confirm that you want to
  proceed with the deletion." (Figma has it in plain text without "Warning:"; changed to match the Merge modal.)
- Buttons: Cancel and a red Delete Items.

## 2. Details (Part 127:6327; Assembly 411:62773; Kit 411:65254)

Built to Figma's Part Details (127:6327). The same cards serve all three types; the labels follow the type. Two
columns (1060 : 560 in Figma, one column under 1280px): Identification, Specifications, Units & Packaging and
Warranty on the left; Images, Tracking, Compliance and Replacement Items on the right; Notes under both.

**Editing banner** (Figma 918:39755): while Details has unsaved changes, the shared `EditBanner` sits above the
header: "You’re editing REC 325 Solar Panel. 2 unsaved changes." with Discard Changes and Save Changes. Save
(here or the header's) checks the name, the category and any required category spec (Solar Panels: Power output),
and gives a blank unit barcode a generated one.

**Identification** (Figma note: the system # can't be changed; changing the category swaps the category specs, and
asks first)
- Row 1: Item Name * (twice the width), System Part # (disabled), Custom Part #.
- Row 2: Category *, Subcategory, Manufacturer, Model #.
- Description (TextArea).
- Changing to a category with other specs, when there are some, opens **Change Category** ("…specs will be cleared").

**Specifications** (Figma notes: category specs and their units come from Inventory Settings › Categories; Add Spec
adds a general spec to this item only; the spec sheet button reads "+ Add Spec Sheet" until there is one)
- Title row: the spec sheet (gray button with its file name) and a brand Edit, or a brand + Add Spec Sheet.
- GENERAL: Weight (with a lbs / kg / g / oz picker), Dimensions (L × W × H, typed as "68.1 × 40.9 × 1.2", with an
  in / ft / mm picker) and Country of Origin. Added specs show under them (each removable); + Add Spec opens a small
  modal (Spec Name *, Value).
- "SOLAR PANEL SPECS (from category)": Power output *, Panel efficiency, Cell type ▾, Frame, Backsheet ▾; Power after
  year 1, Annual degradation, Power after year 25, Production factor; Max system voltage, Max reverse current.

**Units & Packaging** (Figma notes: conversions of the base unit, each with its own barcode and a print-label
action; the base unit can't change once stock has been received; a blank barcode is generated; barcodes must be
unique across items)
- Buy Unit (Default), Sell Unit (Default), Count Unit (Default), from the units below.
- Table (DataTable + EditableCell): Unit · Contains · UoM · Barcode / UPC · Weight · print label · remove. The base row
  (Each, contains 1) is read-only with a lock; the others are editable with a trash button. A duplicate barcode is
  marked and explained under the table. + Add Unit adds a row.

**Warranty** (Figma note: Edit opens the warranty pop-up, the same as Add Warranty; removing one doesn't change
warranties already registered on sold serials)
- A sunken row per warranty: Standard (black) or Extended (green) pill, who · what ("Manufacturer · Product",
  "Installer · Workmanship"), the term ("25 years"), its document or pricing ("Priced by system size · 2 tiers"),
  edit and remove.
- + Add Warranty offers Standard or Extended (Figma's button has no menu; the pop-up needs one of the two).

**Images:** three across, 110px tiles with a star (the main image; starring another moves it first), a remove ✕ and a
drag handle; drag to reorder. Photos can also be dragged onto the gallery from the computer (it outlines in teal while
they're over it); with no photos the card shows the Volt upload drop zone. JPG, PNG or WebP up to 25 MB; other files are
turned away with a notice. A photo added this session shows in its tile. + Upload takes the same files. Hint: "Drag to reorder. The starred image is the main
image on lists, quotes and the catalog. JPG, PNG or WebP up to 25 MB."

**Tracking** (Figma note: a part can be both lot controlled and serialized): a sunken row per toggle with its hint:
Lot control, Track expiry dates (FEFO; needs lot control, so it's off and disabled without it), Serial numbers,
Non-inventory item, Discontinued.

**Compliance:** RoHS, REACH, Conflict Mineral Free, Mercury Free, Prop 65, DFARS, VPAR, each with a status menu
(Compliant, Warning required, Not applicable, Not reviewed). Mark All ▾ sets them all.

**Replacement Items** (Figma note: drag to set the order they're offered in; the reason shows to the person picking a
substitute): a sunken row each: drag handle, "# · name" (a link), the reason ▾ (Preferred substitute, When REC is out
of stock, Customer approval needed, Last resort) and remove. + Add Replacement opens the Add Replacement modal.

**Notes:** + Add Note in the title row, the search under it, then the table: avatar · Created By · Last Updated · Note
· pin.

**Not on Figma's Details** (kept under Notes until their tabs exist; Figma's tab bar adds Suppliers and Cost):
- **Reorder Details:** Global Min Quantity, Global Safety Stock, Global Reorder Point, Average Lead Time (Days), and
  ☑ Auto-Calculate (ⓘ).
- **Last Purchase:** Supplier; Purchase Date and Purchase Quantity; Unit Type (Each) and Cost ($).
- **Supplier:** + Add Supplier; table: ★ (primary) · Supplier · Item # · Cost · Date · Lead Time (Days).

**Modals**
- **Add Warranty**
  - Standard: repeatable groups of Category, Term (Number), Term (Units) and Warranty Document (a link or an upload),
    each with a trash button.
  - Extended: the same, plus ☐ Offered by Installer and draggable price rows of Type (kW), Value (0 - 99.99) and
    Unit Cost.
  - Footer: ⊕ Add Warranty on the left; Cancel and Save on the right.
- **Add Supplier**
  - Supplier (Dropdown) with ☐ Set as Primary Supplier; Supplier Part # and Supplier Part Name.
  - "Package + Cost Details": Quantity, Cost and Lead Time for each of Package, Case, Carton, Bulk and Pallet.
  - "Price Breaks": a switch between Package, Case, Carton, Bulk and Pallet; Percentage Off or Discounted Price;
    ⊕ Add Quantity; and draggable rows of Up to Quantity and Percentage Off (644 / 20%, 852 / 25%).
  - "Last Updated: May 18, 2026" sits beside each section title.
  - Footer: red Remove Supplier on the left; Cancel and Save on the right.
- **Add Replacement:** a search ("Search by Number or Name"), then a table of Type · Item · Name with a trash button
  per row. Buttons: Cancel and Save.
- **Add Note / Edit Note**
  - Toggles: Pin For Myself, Pin For Everyone, Pop-Up.
  - Note (TextArea), and Note Type checkboxes: Admin, Warehouse, General.
  - Buttons: Cancel and Save Note.
  - Edit Note adds "Last Updated" under the title and a red Delete on the left.
- **Deactivating Part - Active Assemblies or Kits Error**
  - Shown when the part is used in assemblies or kits.
  - It asks "Would You Like To?" with three radios:
    1. Replace this part with another, with a Part Name picker under it (recommended).
    2. Deactivate the assemblies and kits that include this part.
    3. Remove this part from those assemblies and kits.
  - Buttons: Cancel and Deactivate Part.
- **Merging Parts:** not in the prototype. Merging happens from the Items list (two or more checked), so a record has
  no Merge.
- **Deleting Part - Confirmation Required:** the same wording as Deleting Items. Buttons: Cancel and a red Delete
  Part.

**Header Actions ▾:** Deactivate, Delete.

## 3. Files (612:14668)

- A folder breadcrumb (Home › folder) sits above the toolbar.
- **Toolbar:** View ▾, Columns, Upload, Actions ▾, Search, and brand `Add New ▾` with New Folder, File Upload,
  Folder Upload and Upload from URL.
- **Table:** ☐ · File Name · File Type (an icon and the type) · Modified · Modified By · status · •••. File types:
  Folder, pdf, png, mov, jpg, doc, xls, ppt, url.
- **Modals:**
  - New Folder: Name. Buttons: Cancel and Create. The new folder's row then shows its name in an edit field.
  - Upload File from URL: Name and URL. Buttons: Cancel and Create.
  - View File:
    - The file title, with ← / → arrows to step through files.
    - A preview.
    - Edit, Download and Set as Profile Image buttons.
    - Footer: a red Delete.
  - Edit File: a crop box with Move, Scale and Reset; File Name (with the type beside it) and File Description.
    Buttons: Cancel and Save.
- **Profile image** (from the header avatar):
  - Profile Image: a round crop, with Edit, Upload From Library, Upload File and Upload a URL.
  - Edit Profile Image.
  - Choose From Files Library: a thumbnail grid, then Upload.
  - Upload Image from URL.
- The prototype can't store real files: uploads add rows with sample previews.

## 4. Assemblies / Kits tabs on a Part (629:74896, 636:20618)

**Toolbar:** View ▾, Columns, Actions ▾, Search, and brand ⊕ Add Assembly (or ⊕ Add Kit).

**Table:** ☐ · Assembly # (or Kit #) · Name · Category · Sub Category · status · •••.

**Add Assembly / Add Kit** (the full version)
- Custom #, Category, Subcategory, Name and Description.
- An "Assembly Build" (or "Kit Build") section: a search ("Search to Add Items in Assembly"), then a table of
  Item # · Item Type · Item Name · Quantity, with a trash button per row.
- The create button stays disabled until the build has items.

**View Assembly / View Kit**
- Read-only: System #, Custom #, Category and Subcategory.
- A search of the items in it, then a table of Item Type · Item # · Item Name · Quantity.
- Kits add Unit Cost and Net Cost columns, and a Net Cost total.
- Buttons: Cancel and Go To Assembly Main Page (or Go To Kit Main Page).

## 5. Build tab (Assembly 641:69761, Kit 641:70542)

- A search ("Search to Add Items in Assembly" or "in Kit") and a Net Cost total.
- Table: Item Type · Item # (link) · Item Name · Quantity (NumericInput) · Unit Cost · Net Cost, with a trash button
  per row.
- Show cost columns for both types; Figma's Kit Build drops them, but its View Kit shows them.
- Net Cost = Quantity × Unit Cost. The total sums the rows.

## 6. Stock (411:44083)

The same as the list's Stock table, for this item only, with a Totals row and a pager.

## 7. History (283:76194)

**Toolbar:** Columns and Search.

**Table:** Warehouse · Action Type (a teal chip) · Action Performed (with links) · Created By · Date Created.

Clicking an Action Type opens that order:
- **Stock Order / Pick Order:**
  - Header table: Order # · Created By · Created On · Due On · Warehouse · status.
  - Items table: Item Type · Item # · Item Name · Requested Quantity · Pick Quantity · Difference.
  - Footer: "Last Modified: …", with Cancel and Go To Order.
- **Build Order:** the same, plus an assembly table, and Qty Required / Qty Picked columns.

## Figma bugs to ignore

- The Kits tab frame repeats "Kits" and drops Stock; the History frame repeats "History".
- "Add Replacment" and "Quanitity" are typos.
- Titles and numbers differ between frames: "PART B" vs "PART D", "002-" vs "0002-".
- Assembly and Kit Details reuse the solar panel specs.

## Build order

1. The Items list and its create, merge and delete modals.
2. The Part record: Details first, then Stock and History.
3. The Assembly and Kit records, with Build.
4. Files.
5. The Part's Assemblies and Kits tabs.
