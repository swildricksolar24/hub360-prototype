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
- Actions ▾ with Merge and Delete, for the checked rows;
- Search;
- brand `Add New ▾` with the options Part, Assembly and Kit.

**Overview table:** ☐ · Item # · Name · Type · Category · Sub Category · status · •••. A pager sits below.

**Stock table:** ☐ · WH · Item # · Description · On Hand · Allocated · Committed · Frozen · Available · Location
(link). A Totals row follows the rows.

**Add Part / Add Assembly / Add Kit**
- Fields: Custom Part # (optional) and Part Name *. The other types are the same with their own words.
- Subtitles:
  - Part: "An individual item that can be used on its own or as a component of an assembly or kit."
  - Assembly: "A combination of two or more parts that are put together to create a single item."
  - Kit: Figma copies the Assembly text; write a kit one, e.g. "A group of parts and assemblies sold or shipped
    together as one item."
- Buttons: Cancel and Create Part / Create Assembly / Create Kit.
- Creating an item opens its new record.

**Merging Items**
- The body explains that every selected item is combined into the item chosen below: its data, assemblies, kits and
  orders move to that item, and the merged items are deactivated.
- Warning: "This process cannot be undone once the merge is complete."
- Field: a search to pick the target item.
- Buttons: Cancel and Merge Items.

**Deleting Items - Confirmation Required**
- The body explains that deleting removes the items from every kit, assembly and order that uses them, and that an
  active replacement is substituted where one exists.
- Then: "This action cannot be undone. Please confirm that you want to proceed with the deletion."
- Buttons: Cancel and a red Delete Items.

## 2. Details (Part 127:6327; Assembly 411:62773; Kit 411:65254)

The same card set serves all three types; the labels follow the type. When a category has no spec template, the
Category Specs card is left out and the remaining cards pair up two per row.

**General Information**
- Title-row checkboxes, each with an ⓘ: Lot Control, Serialized, Non-Inventory Item, Discontinued.
- Row 1:
  - System Part # (read-only, with a lock icon): PA-0002-AJ89-98HB
  - Custom Part #: 000-134
  - Category (Dropdown)
  - Subcategory (Dropdown)
- Row 2:
  - Left: Part Name (REC 325 Solar Panel), Manufacturer (Dropdown) and Model # (TextInput)
  - Middle: Part Description (TextArea)
  - Right: Image(s) (`UploadFile`)
- A **Compliance** sub-heading with checkbox tiles, each with an ⓘ: RoHS, Conflict Mineral Free, REACH, DFARS,
  Prop 65, Mercury Free, VPAR.

**General Specs**
- Spec Sheet: a file picker.
- Unit Type (Each EA), Weight and Unit of Measure (LB).
- Length, Width, Height and Unit of Measure (Inches).

**Category Specs** (the solar panel template)
- Row 1: Power Output, Panel Efficiency (%), Cell Type, Power in Year 1 (%), Annual Degradation (%), Last Year (25)
  and Last Year Power (%).
- Row 2: Backsheet, Frame, Production Factor.
- Row 3: Maximum System Voltage, Maximum Reverse Current, Country of Origin.

**Warranty**
- A switch between Standard Warranties and Extended Warranties, and a brand Add Warranty Information button.
- Table: Category · Term (Months) · Warranty Document (a Link button). Sample: Manufacturer · 120.

**Replacement Items**
- A brand Add Replacement button.
- Table: Type · Item · Name. Samples: Part · 0004-5896-4521 · Hex Bolt; Part · 7012-6589-2568 · Flat Bolt.

**Package Quantities:** Pack and Unit of Measure (Box); Case; Carton; Bulk; Pallet.

**Reorder Details:** Global Min Quantity, Global Safety Stock, Global Reorder Point, Average Lead Time (Days), and
☑ Auto-Calculate (ⓘ).

**Last Purchase:** Supplier; Purchase Date and Purchase Quantity; Unit Type (Each) and Cost ($).

**Supplier**
- A brand Add Supplier button.
- Table: ★ (primary) · Supplier · Item # · Cost · Date · Lead Time (Days).

**Notes**
- A brand ⊕ Add Note button, and a Search.
- Table: avatar · Created By · Last Updated · Note · pin. Samples: Pamela Isley (pinned) and Waylon Jones.

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
- **Merging Parts:** pick the part to merge into, warned that it cannot be undone. Buttons: Cancel and Merge Parts.
- **Deleting Part - Confirmation Required:** the same wording as Deleting Items. Buttons: Cancel and a red Delete
  Part.

**Header Actions ▾:** Deactivate, Merge, Delete.

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
