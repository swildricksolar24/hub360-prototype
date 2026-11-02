# Orders — build spec

The plan for **Inventory › Orders** (`/app/inventory/orders`). It's thin, because Figma is: most of the area isn't
designed.

It's built in `orders/`:
- the Move Request and Adjustment records (`OrderRecordPage`, `/app/inventory/orders/:orderId`), with the Add Items
  picker;
- a stand-in orders list (`OrdersPage`), because Figma has no list design. Review it with the designer.

The other order types open a record that says they aren't designed yet.

- **Figma:** *Inventory Management – Core* (file key `7FlRxkXbbjUhWJ3t1MMrVr`), under **"→ Order"**.
- **Empty pages:**
  - "→ Order" (292:26345): so there is **no orders list**;
  - Move (681:18789), Transfer (681:19408), Build (681:19409), Sale (681:19410), Purchase (681:19411) and
    Return (681:19412).
- **Designed:** two order records, both a Tier 3 header over a line-item table:
  - **Adjustment** (681:18788 › 705:167001);
  - **Order - Move Request** (292:26346): the current frame 296:52864, the Add Items picker 292:26783, and an older
    MUI frame, 292:26446.

## Shared header (both records)

| Part | Value |
|---|---|
| Breadcrumb | Inventory › Orders |
| Title | Figma says "ORDERS". Use the order #, e.g. "MO # 12456", as the old frame does. |
| Icon | The circular left-right arrows |
| Tag | An "In Process" pill. It's the only status Figma draws. |
| Labels | ORDER TYPE: Move · WAREHOUSE: PHX-004 · WAREHOUSE NAME: Phoenix |
| Meta | Created: May 18, 2026 (the old frame also shows Due) |
| Actions | Actions ▾, Save, ‹ / ›. No Active toggle. |

Adjustment also draws the warehouse's tabs (Details, Contacts, …), which look copied in; leave them out.

## Move Request (296:52864)

**Toolbar:** Search, plus the brand buttons Bulk Edit (table icon) and Add (plus icon).

**Table:** ☐ · Item # · Description · Location · On Hand · Move Quantity · New Location · New On Hand · status · •••.

- A row can switch to inline editing:
  - Item # (Dropdown), Description (TextInput) and Location (Dropdown);
  - Move Quantity (NumericInput) and New Location (Dropdown).
- New On Hand = On Hand − Move Quantity.
- Sample: AD23-4529 · Lug Nut with optional screw · PHX-066 · 204 · 24 · PHX-244 · 180.
- The pager shows 10 per page.

**Add Items picker** (292:26783)
- A search ("Search by part, assembly, kit name or location") and a location filter.
- Table: ☐ · Item # · Name · Location · OH · Avail · status icons (frozen, hidden).
- Multi-select. Add the buttons Figma leaves out: Cancel and Add Items.

**Canvas notes:** "move request - have on one screen - multiple select", "the search is powerful", "where to move",
"how much quantity", "have the ability to edit quantity", "split item", "process move". Read together:
- pick several items;
- set the destination and quantity for each line;
- split one item across lines;
- then **Process Move**: put it in Actions ▾, with a confirmation.

## Adjustment (705:167001)

**Toolbar:** Search ("Search to Add Items") and a "Net Cost $0.00" total.

**Table:** Item Type · Item # (link) · Item Name · Quantity · Unit Cost · Net Cost, with a trash button per row.
Samples: Part 1234567 Hex Bolt 2 × $1.24; Part PA-1234567 Hex Nut 2 × $0.98; Assembly AS-1234567 Shock Build 1 ×
$3.24.

Its search placeholder ("in Kit") and its ORDER TYPE label ("Move") are copied from other screens: fix them to
"Adjustment".

## Open questions (ask the designer before building)

1. The orders list: columns, filters, and how a new order of each type is started.
2. The Transfer, Build, Sale, Purchase and Return records.
3. The statuses beyond In Process, and their colors.
4. The contents of the Actions ▾, ••• and Bulk Edit menus.
