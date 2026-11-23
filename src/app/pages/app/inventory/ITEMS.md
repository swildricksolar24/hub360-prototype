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
  - the shared table pattern: every table here is the Volt `DataTable` (the record tabs' Suppliers, Where Used, Files,
    Build, History and the History order modal included), with a sort chevron on each header and a checkbox-list filter
    on the columns whose values repeat (Type, Category, Sub Category, Unit, Status, Warehouse, Location, Action Type,
    Created By, File Type, Modified By, Item Type). Filters show only on lists of more than 10 rows; a filtered Status
    column gets a "Status" header, which Figma leaves off.

## How the pieces relate

- **One combined Items list.** It has an Overview / Stock switch, and a Type column (Part / Assembly / Kit). There are
  no separate Parts, Assemblies or Kits lists.
- **Each type opens its own record page**, with these tabs:
  - **Part:** Details · Suppliers · Cost · Where Used · Stock · Files · History (Figma's Part pages, 1144:7736 and
    on). Where Used lists the assemblies and kits that use the part; Suppliers and Cost hold what used to sit under
    Details. Old `?tab=assemblies` / `?tab=kits` links open Where Used.
  - **Assembly:** Details · Build · Suppliers · Cost · Where Used (the kits that use it) · Stock · Files · History.
  - **Kit:** Details · Build · Suppliers · Cost · Stock · Files · History.
  - Details and Cost are **read-only** until the header's brand **Edit** (Figma): every field, button and menu in
    their cards is off (a disabled fieldset), drag to reorder and dropping photos too; links still work, and the spec
    sheet shows as a link that opens it. The fields keep their normal look (`data-readonly`; buttons show as
    disabled), the cursor stays a plain arrow, and the photo tiles hide their delete and drag controls. Notes stay usable. Edit unlocks the fields (on another tab it opens Details,
    cursor in Item Name), turns into **Save** with an outline **Cancel** before it, and shows the editing toast.
    Save saves and locks the fields again; Cancel drops the changes and locks them. Moving to the previous / next item ends editing.
- **What each is built from:** an assembly from parts and other assemblies; a kit from parts and assemblies.
- **Routes:**
  - `/app/inventory/items/:itemId`, with `?tab=` choosing the tab.
  - The breadcrumb is Inventory › Items › the item name.
  - The meta line is `PART # / ASSEMBLY # / KIT #: … | CATEGORY: … | SUBCATEGORY: …`.

## 1. Items list (681:14463, 681:14475)

**Toolbar:**
- `ButtonGroup` Overview | Stock;
- View ▾, Columns, Upload;
- Actions ▾ with Activate, Deactivate, Merge, Delete and Export to CSV. Each action is on only when it fits the
  checked rows:
  - **Activate** needs a checked item that's inactive, and acts on the inactive ones only.
  - **Deactivate** needs an active one, and acts on the active ones only. Deactivating several confirms the ones no
    other active build uses together, then asks about each one still used, one at a time.
  - **Merge** needs two or more checked items, all of one type (parts with parts, and so on).
  - **Delete** needs one or more.
  - **Export** exports the checked rows ("Exported 2 items to CSV."), or the whole list when none are checked.
  - In Stock, the actions apply to the items of the checked lines, and Export counts the lines (stock records in By
    Warehouse, items in By Item).
  - A disabled action is greyed out with no reason shown. Every table's Actions ▾ uses the same rules (tableKit's
    `statusActions` and `checkFirst`).
- Search;
- brand `Add New ▾` with the options Part, Assembly and Kit.

**Overview (Figma 681:14463):** a totals line ("1,412 Items  1,218 Parts  112 Kits  82 Assemblies", counting the
rows that match the view, search and filters), then the table: ☐ · Item (the number, a link, with the name under it)
· Type · Category · Unit · On Hand · Available · Warehouses · Status · •••. Every column sorts; Type,
Category, Unit and Status also filter (a checkbox list of the column's values, with search on longer lists). On Hand and Available add up the item's stock rows; Warehouses counts the warehouses holding it. Unit is the
item's Unit Type without its abbreviation (Each, Pair, Foot, Kit). A pager sits below.

**Stock (Figma 681:14475):** ☐ · Item (TwoLineCell: the number, a link, with the name under it) · Category ·
Warehouse · On Hand · Allocated · Committed · Frozen · Available · Status · •••, one row per item and warehouse
location; an item with no stock gets one row with "—" and zeros. Every column sorts; Item, Category, Warehouse, Location and Status also filter (a checkbox list of their values).
Status is a Badge pill: black **Inactive (catalog)** for an inactive item, amber **Below reorder pt** when Available is
0 or under the item's reorder point, otherwise green **Stocked**. ••• has View Item and View Warehouse Stock. Location
(a link to the warehouse's Locations tab) is off by default and can be added under Columns. No Totals row on the list;
an item's own Stock tab keeps Warehouse … Status plus Location, and a Totals row.

**By Warehouse | By Item:** at the top of the Stock table card, above the table, two tabs (Volt `JumpLinks as="tabs"`;
Figma draws them with Jump Link instances, a 56px row: the 44px tabs and 12px under them). The table under them is their
`role="tabpanel"`. **By Warehouse** (the default) is the table above. **By Item** has one row per item, with On Hand,
Allocated, Committed, Frozen and Available added up across its warehouses. Warehouse shows the code when there's one,
otherwise "N warehouses", and "—" for none (KT-0042). Location works the same way, with a link only when there's one
location. Status is the most urgent across its warehouse rows, so it's **Below reorder pt** if any of them is. The
••• menu has only View Item, and the item number opens the record. Selection, column filters, sort, paging, Columns
and the toolbar search work in both views. Switching views clears the checked rows, goes back to page 1, and drops any
Warehouse or Location filter, because those values read differently in the two views. The sort and the other filters
stay.

**Create New Item** (Figma "Modal - Add New Item" 681:14400; opened from Add New ▾ › Part / Assembly / Kit)
- Subtitle: "* Required. Adds the item to the catalog. Open it afterwards to add specs, suppliers and files."
- Item type *: Part · Kit · Assembly as small Tags; Add New ▾ picks the starting one, and it can be changed here.
- System Item # (read-only, bold): the # the item will get, with the type's prefix (PA, KT, AS).
- Custom Item # (optional). Figma note: the system # is enough; a custom # is for tenants who want their own.
- Item Name *.
- Category, Subcategory (its options follow the category) and Unit * (Each, Pair, Foot, Box, Kit; kits start on Kit).
- Buttons: Cancel and Create. Figma note: Create opens the new item in a new app tab, so the list's tab stays.

**Merge Items** (Figma "Modal - Merge" 681:14487, "Merge Items (Improved)"). It opens only from Actions › Merge, with
two or more items of one type checked; rows and records have no Merge. It uses the standard `AppModal` at 900px, with
no header icon.
- **Title:** "Merge {n} items into one".
- **Description:** "Choose the item to keep. Everything from the other item moves to it, and the other item is
  deactivated." With 3 or more items it says "the other items … are deactivated".
- **Body**, top to bottom, 24px apart:
  1. **"KEEP THIS ITEM"** (Tiny/Semi-Bold, Gray Text/Weak), then 8px, then one radio card per checked item.
     - Clicking anywhere on a card keeps it. The group is `role="radiogroup"`.
     - Each card has a Volt RadioButton, then "{id} · {name}" (Medium/Bold) over a Tiny/Regular line such as "324 on
       hand · 3 warehouses · 2 suppliers · used in 2 kits" (the used-in part only when the item is used).
     - On the right is a Badge pill: blue "Keep" on the kept card, black "Merge & deactivate" on the others.
     - The kept card has the Selected look (Brand Teal Fill/Weaker, a 2px Brand Teal Stroke/Weak inset). The others are
       Gray Fill/Weaker.
     - The cards have 12/12/12/16 padding, 12px corners and a 14px gap.
     - The first item is kept to start with.
     - With 7 or more items, the cards scroll inside the Volt Scrollbar, 6 cards tall (less on a short window, so the
       buttons stay on screen).
  2. **"What moves to {kept id}"**: a Gray Fill/Weaker box with 16px padding and 12px corners. Its bullets (Medium/
     Regular, 6px apart) come from the merged items and change when the kept item changes. A bullet with nothing to
     report is left out.
     - "{n} units of stock ({ids}), with cost history"
     - "{n} suppliers ({names}) added to the supplier list"
     - "{n} open orders updated to use {kept id}". Open orders are In Process orders with an Adjustment line for a
       merged item. The orders' sample data numbers items differently, so this bullet doesn't show today.
     - "{id} stays as an alias of {kept id}, so searching for {id} (or scanning its old labels) finds {kept id}"
  3. A Volt Checkbox **"I understand this can't be undone"**, in Semantic Text/Error, Bold.
- **Footer:** Cancel, and the brand "Merge Items", which stays disabled until the box is ticked. Each time the modal
  opens, the box starts unticked and the first item is kept.
- **Merging:**
  - Stock, suppliers, notes, files and history move to the kept item, and the merged items are deactivated.
  - Builds that used them use the kept item instead.
  - Open orders' Adjustment lines switch to the kept item.
  - The merged items' numbers become the kept item's `aliases`, so the Items search finds it by them.
  - A toast says "… merged into …".

**Deleting Items - Confirmation Required** (Figma 681:14500)
- Body, Large/Regular: "You are about to delete the selected Item(s). Deleting these Items will remove them from
  any Kits, Assemblies, or Orders where they are currently used. If an active replacement Item is available, it will
  be substituted automatically where applicable."
- Then a red warning: "Warning: This action cannot be undone. Please confirm that you want to
  proceed with the deletion." (Figma has it in plain text without "Warning:"; changed to match the Merge modal.)
- Buttons: Cancel and a red Delete Items.

## 2. Details (Part 1144:7736; Assembly 411:62773; Kit 411:65254)

Built to Figma's "Inventory / Items / Details" (1144:7736). The same cards serve all three types; the labels follow
the type. Full-width rows: **Identification | Images** in one panel and **Tracking | Compliance** in one panel (1030 :
602 in Figma, stacked under 1280px), then Specifications, Units & Packaging, Warranty, Replacement Items and Notes.

**Jump links** (Figma 1144:7748, Tier 3 with Jump Links on): the bottom row of the header card on Details only
(RecordPage `jumpLinks`):
Identification / Images · Tracking / Compliance · Specifications · Units & Packaging · Warranty · Replacement · Notes.
Each scrolls to its card. The one picked is bold with a brand teal underline that slides to it, and it stays picked
while the page scrolls until another is picked. Once the full header has scrolled away, the Tier 3 Sticky bar (the
links and the header's actions, flush with the page's top edge) shows at the top, and a picked card lands 16px under
it; its double chevron scrolls back to the top. Identification / Images starts picked.

**Matching heights:** controls in a row are the same height. Rows with 40px compact icon buttons (Units & Packaging,
Replacement Items, warranty tiers) use 40px fields; fields elsewhere are 44px, and a unit picker or remove button inside
a field (Weight, Dimensions, added specs) doesn't make it taller; the Notes pin and the row's ••• are both the
standard 40px compact icon button; the
header's previous / next arrows are 44px like Active, Actions and Edit.

**Delete All** (Figma): Images, Units & Packaging (the base unit stays), Warranty and Replacement Items have a red
brand "Delete All" before their Add / Upload button. It's off when there's nothing to delete and always asks first.

**Suppliers tab** (Figma 1152:40675): View ▾ (All / Primary), Columns, Upload, Actions ▾, Search, ⊕ Add Supplier;
table: Supplier (with a blue "Primary" pill) · Supplier Part # · Buy Unit · Cost / Buy Unit · Cost / Each · Price
Breaks · Lead Time · Last Purchased · •••; the buy unit is the largest package with a cost. Figma's footnote under it.
**Cost tab** (Figma: "for later"): Reorder Details and Last Purchase, side by side, saved with Details' Save.

**Editing toast** (replaces Figma's Editing Banner 918:39755 on the item record): Edit brings down an info `Toast`
from the top, "You’re editing REC 325 Solar Panel." / "Save or Cancel at the top of the page when you’re done.", with
no buttons but its close; it leaves after 5 seconds like every toast, and Save or Cancel takes it away. Save checks the name, the category and any required category spec (Solar Panels: Power output),
and gives a blank unit barcode a generated one.

**Identification** (Figma note: the system # can't be changed; changing the category swaps the category specs, and
asks first)
- Row 1: Item Name * (twice the width), System Part # (read-only, but it looks like the other fields), Custom Part #.
- Row 2: Category *, Subcategory, Manufacturer, Model #.
- Description (TextArea, 6 rows, so Identification is about as tall as the Images card beside it).
- Changing to a category with other specs, when there are some, opens **Change Category** ("…specs will be cleared").

**Specifications** (Figma notes: category specs and their units come from Inventory Settings › Categories; Add Spec
adds a general spec to this item only; the spec sheet button reads "+ Add Spec Sheet" until there is one)
- Title row (Robby, Figma 127:4953): one gray button with the spec sheet's name and an edit icon at its end (a long
  name is cut short); it opens the **Spec Sheet** modal. With none, a brand + Add Spec Sheet opens the same modal.
- GENERAL: Weight (with a lbs / kg / g / oz picker), Dimensions (L × W × H, typed as "68.1 × 40.9 × 1.2", with an
  in / ft / mm picker) and Country of Origin. Added specs show under them (each removable); + Add Spec opens a small
  modal (Spec Name *, Value).
- "SOLAR PANEL SPECS (from category)": Power output *, Panel efficiency, Cell type ▾, Frame, Backsheet ▾; Power after
  year 1, Annual degradation, Power after year 25, Production factor; Max system voltage, Max reverse current.

**Units & Packaging** (Figma notes: conversions of the base unit, each with its own barcode and a print-label
action; the base unit can't change once stock has been received; a blank barcode is generated; barcodes must be
unique across items)
- Buy Unit (Default), Sell Unit (Default), Count Unit (Default), from the units below.
- Table (DataTable + EditableCell): Unit · Contains · UoM · Barcode / UPC · Weight · print label · remove. Each row
  has 16px around it and its fields and buttons sit 8px apart (no cell padding; the print and remove columns are 40px). The base row
  (Each, contains 1) is read-only with a lock; the others are editable with a trash button. A duplicate barcode is
  marked and explained under the table. + Add Unit adds a row.

**Warranty** (Figma note: Edit opens the warranty pop-up, the same as Add Warranty; removing one doesn't change
warranties already registered on sold serials)
- A sunken row per warranty: Standard (black) or Extended (green) pill, Provided by · Covers ("Manufacturer ·
  Product", "Installer · Workmanship"), the term ("10 years"), then the document (standard) or the price (extended:
  "Priced by system size · 3 tiers", "Flat price · $199.00", "Per unit · $12.00"), edit and remove.
- Edit opens that one warranty. + Add Warranty is a plain button; the type is picked in the modal.

**Images:** a three-column grid of 88px tiles (Figma draws 110; smaller so the card stays about as tall as Identification). The first photo is the main image and is twice the size of the others
(two columns by two rows, 184px tall) with a Volt tiny "Main" Tag at its bottom left; the next two photos fill the column
beside it and the rest the rows under it. Each tile has a delete (trash) button at the top right and a drag handle (at
the bottom left, or the top left on the main image), each a white icon on a see-through dark backing; drag to reorder,
and the photo dragged to the front becomes the large main image. Photos can also be dragged onto the gallery from the
computer (it outlines in teal while they're over it); with no photos the card shows the Volt upload drop zone. JPG, PNG
or WebP up to 25 MB; other files are turned away with a notice. A photo added this session shows in its tile; the solar
panel samples show real photos from `src/app/assets/item-photos` (Wikimedia Commons, credited in its CREDITS.md). The
dark backings keep the corner icons readable over any photo. + Upload takes the same files. Hint: "The large image is
the main image on lists, quotes and the catalog. Drag another to the front to make it the main image. JPG, PNG or WebP
up to 25 MB."

**Tracking** (Figma note: a part can be both lot controlled and serialized): a sunken row per toggle with its hint:
Lot control, Track expiry dates (FEFO; needs lot control, so it's off and disabled without it), Serial numbers,
Non-inventory item, Discontinued.

**Compliance:** RoHS, REACH, Conflict Mineral Free, Mercury Free, Prop 65, DFARS, VPAR, each with a status menu
(Compliant, Warning required, Not applicable, Not reviewed). Mark All ▾ sets them all.

**Replacement Items** (Figma note: drag to set the order they're offered in; the reason shows to the person picking a
substitute): a sunken row each: drag handle, "# · name" (a link), the reason ▾ (Preferred substitute, When REC is out
of stock, Customer approval needed, Last resort) and remove. The names share one column (as wide as the longest,
up to half the row) and the reason menus stretch over the rest, lined up from row to row, on one line when the row is 460px or wider; in a narrower row the reason drops under the name
at full width. + Add Replacement
opens the Add Replacement Item modal; the items it adds go to the end of the list as "Preferred substitute".

**Notes:** + Add Note in the title row, the search under it, then the table: the author's photo (its own column, no heading) · Created By · Last Updated · Note
· pin, on the Volt `DataTable` (Created By and Last Updated keep their width, the note fills the rest; the pin is a
compact `IconButton`, selected when pinned, its bookmark icon Brand Teal when pinned and 40% gray (Foundation/Transparent/400) otherwise; Edit / Delete sit in the row's •••).

**Not on Figma's Details** (kept under Notes until their tabs exist; Figma's tab bar adds Suppliers and Cost):
- **Reorder Details:** Global Min Quantity, Global Safety Stock, Global Reorder Point, Average Lead Time (Days), and
  ☑ Auto-Calculate (ⓘ).
- **Last Purchase:** Supplier; Purchase Date and Purchase Quantity; Unit Type (Each) and Cost ($).
- **Supplier:** + Add Supplier; table: ★ (primary) · Supplier · Item # · Cost · Date · Lead Time (Days), on the Volt
  `DataTable` (the name fills, the rest keep their width; ★ is a plain star, no button box, filled brand teal for the primary; Edit /
  Make Primary / Remove in the row's •••).

**Modals**
- **Add Warranty / Edit Warranty** (Figma "Add Warranty (Improved)" 1152:23496, 900px; one warranty per modal; it
  replaces the separate Standard and Extended Warranty modals and the "Offered by Installer" checkmark)
  - Warranty Type * : Volt small Tags "Standard (included)" and "Extended (sold separately)".
  - Covers * (Product, Performance, Workmanship), Provided by * (Manufacturer, Installer), Term * and Units (Years,
    Months), four across.
  - Warranty document: "Upload a PDF or paste a link", with an Upload button.
  - Extended only, a sunken "Price (extended warranties only)" panel. Priced by: Flat price (one Price), System size
    (kW) or Per unit (Price per unit). System size shows the tiers table (System size from (kW) · To (kW) · Price per
    kW, EditableCells with a trash button each; + Add Tier) and a note with worked examples from the first two tiers
    ("an 8.2 kW system → 8.2 × $55.00 = $451.00; a 14 kW system → 14 × $45.00 = $630.00").
  - Footer: Cancel and Add Warranty (Save when editing). Covers, Provided by and Term are required.
- **Add Supplier**
  - Supplier (Dropdown) with ☐ Set as Primary Supplier; Supplier Part # and Supplier Part Name.
  - "Package + Cost Details": Quantity, Cost and Lead Time for each of Package, Case, Carton, Bulk and Pallet.
  - "Price Breaks": a switch between Package, Case, Carton, Bulk and Pallet; Percentage Off or Discounted Price;
    ⊕ Add Quantity; and draggable rows of Up to Quantity and Percentage Off (644 / 20%, 852 / 25%).
  - "Last Updated: May 18, 2026" sits beside each section title.
  - Footer: red Remove Supplier on the left; Cancel and Save on the right.
- **Add Replacement Item** (Figma 175:4904, 640px): "Offered when {item #} is short or discontinued. Items already
  chosen are not shown in the list below." A search ("Search items by #, name or manufacturer"), then a pick list on
  the Volt DataTable with checkboxes: Item # · Name · Available (stock available in every warehouse), sortable. It
  lists active items of the same type, the same category first, without the item itself or ones already chosen.
  Buttons: Cancel and Add ("Add 2" when two are checked; off until one is).
- **Spec Sheet:** "The manufacturer's spec sheet for {item}. Upload a PDF or paste a link." The current sheet with
  View, then Replace with (a link or an Upload). Footer: red Remove Spec Sheet on the left; Cancel and Save. Without a
  sheet it's "Add Spec Sheet" and the field is required. The change is kept by the page's Save, like the card's fields.
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
  Folder Upload and Upload from URL. Actions ▾:
  - Download and Delete work on one or more checked files.
  - Activate is on only when a checked file is inactive, and Deactivate only when one is active. Each acts only on the
    files it changes.
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

## 4. Where Used (Figma 1152:53629)

**Toolbar:** on a Part, Figma's switch All (n) · Assemblies (n) · Kits (n) as small Tags; a search ("Search assemblies
and kits that use this part"); brand "Create New Assembly or Kit ▾" (New Assembly / New Kit). An assembly's Where Used
lists the kits that use it, with "Create New Kit".

**Table:** Used In (the number in bold over the name) · Type (blue pill) · Category · Sub Category · Status (green
Active / black Inactive pill) · •••. Type, Category, Sub Category and Status filter on lists over 10 rows. ••• has View,
Go To, Activate / Deactivate and Remove from its build.

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
