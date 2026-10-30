/** Sample content for the Help page's sections. In memory, like the rest of the prototype. */

export type HelpTopic = 'Inventory' | 'Receiving' | 'Purchasing' | 'Shipping' | 'Counts' | 'Reports';

export const TOPICS: { id: HelpTopic; icon: string; description: string }[] = [
  { id: 'Inventory', icon: 'warehouse', description: 'Items, stock levels and warehouses' },
  { id: 'Receiving', icon: 'receiving', description: 'Docks, deliveries and putaway' },
  { id: 'Purchasing', icon: 'recent-sales', description: 'Purchase orders and suppliers' },
  { id: 'Shipping', icon: 'service', description: 'Picking, packing and carriers' },
  { id: 'Counts', icon: 'sales', description: 'Cycle counts and variances' },
  { id: 'Reports', icon: 'reports', description: 'Dashboards and exports' },
];

export type Guide = { id: string; title: string; topic: HelpTopic; minutes: number; summary: string; steps: string[] };

export const GUIDES: Guide[] = [
  {
    id: 'g1',
    title: 'Find an item and check its stock',
    topic: 'Inventory',
    minutes: 3,
    summary: 'Look up any item and see how many are on hand in each warehouse.',
    steps: [
      'Open Inventory from the left menu, then choose Items.',
      'Type the item name, SKU or serial number in the search box.',
      'Open the item to see stock on hand, on order and reserved, by warehouse.',
      'Use the History section to see every receipt, move and shipment.',
    ],
  },
  {
    id: 'g2',
    title: 'Move stock between warehouses',
    topic: 'Inventory',
    minutes: 4,
    summary: 'Transfer items from one warehouse to another and track them in transit.',
    steps: [
      'Open Inventory › Warehouses and choose the warehouse sending the stock.',
      'Choose Actions › New Transfer and pick the receiving warehouse.',
      'Add the items and quantities, then Save.',
      'The receiving warehouse confirms the transfer when the stock arrives.',
    ],
  },
  {
    id: 'g3',
    title: 'Receive a purchase order',
    topic: 'Receiving',
    minutes: 5,
    summary: 'Check in a delivery against its PO and put the stock away.',
    steps: [
      'Open Inventory › Receiving and find the PO number.',
      'Scan or enter each item and the quantity that arrived.',
      'Mark anything damaged or missing; the PO stays open for the rest.',
      'Choose a bin for each item, then Save to add it to stock.',
    ],
  },
  {
    id: 'g4',
    title: 'Book a dock time',
    topic: 'Receiving',
    minutes: 2,
    summary: 'Schedule a delivery so receiving is ready when the truck arrives.',
    steps: [
      'Open Inventory › Receiving › Dock Schedule.',
      'Pick a dock and a time slot, then link the PO or shipment.',
      'The supplier gets a confirmation email with the dock number.',
    ],
  },
  {
    id: 'g5',
    title: 'Create a purchase order',
    topic: 'Purchasing',
    minutes: 4,
    summary: 'Order stock from a supplier and send the PO for approval.',
    steps: [
      'Open Inventory › Purchasing and choose New Purchase Order.',
      'Pick the supplier and the warehouse the order ships to.',
      'Add items; prices fill in from the supplier’s price list.',
      'Save and submit. Orders over $10,000 need a manager’s approval.',
    ],
  },
  {
    id: 'g6',
    title: 'Approve a draft reorder',
    topic: 'Purchasing',
    minutes: 2,
    summary: 'Review the PO drafts HUB 360 creates when stock falls below its reorder point.',
    steps: [
      'Open the Low Stock notification, or Inventory › Purchasing › Drafts.',
      'Check the quantities and the supplier, and adjust them if needed.',
      'Choose Approve to send the PO to the supplier.',
    ],
  },
  {
    id: 'g7',
    title: 'Pick and pack an order',
    topic: 'Shipping',
    minutes: 5,
    summary: 'Work through a pick list and pack an order for the carrier.',
    steps: [
      'Open Inventory › Shipping and choose an order with status Ready to Pick.',
      'Follow the pick list; scan each bin and item as you go.',
      'Pack the items, enter the box size and weight, then print the label.',
      'Mark the order Packed. It moves to Ready to Ship.',
    ],
  },
  {
    id: 'g8',
    title: 'Run a cycle count',
    topic: 'Counts',
    minutes: 6,
    summary: 'Count part of a warehouse without stopping the whole operation.',
    steps: [
      'Open Inventory › Counts and choose New Count.',
      'Pick the warehouse and the aisles or bins to count, then assign a counter.',
      'Counters scan each bin and enter what they find.',
      'Review the variances and submit. Variances over 2% need a recount.',
    ],
  },
  {
    id: 'g9',
    title: 'Resolve a count variance',
    topic: 'Counts',
    minutes: 3,
    summary: 'Find out why a count doesn’t match the system and post the adjustment.',
    steps: [
      'Open the count and choose the item with a variance.',
      'Check its History for shipments or moves without a scan.',
      'Recount the bin if needed, then post the adjustment with a reason.',
    ],
  },
  {
    id: 'g10',
    title: 'Export the monthly inventory report',
    topic: 'Reports',
    minutes: 2,
    summary: 'Download stock value and movement by warehouse as a spreadsheet.',
    steps: [
      'Open Inventory › Reports and choose Monthly Inventory.',
      'Pick the month and the warehouses to include.',
      'Choose Actions › Export to download it as a CSV or PDF.',
    ],
  },
];

export type Video = { id: string; title: string; topic: HelpTopic; length: string; description: string };

export const VIDEOS: Video[] = [
  { id: 'v1', title: 'A tour of HUB 360', topic: 'Inventory', length: '4:12', description: 'The tabs, menus and header buttons, and how to find your way around.' },
  { id: 'v2', title: 'Receiving a PO, start to finish', topic: 'Receiving', length: '3:45', description: 'Check in a delivery, handle a short shipment and put the stock away.' },
  { id: 'v3', title: 'Running a cycle count', topic: 'Counts', length: '5:20', description: 'Set up a count, assign counters and review the variances.' },
  { id: 'v4', title: 'Creating and approving POs', topic: 'Purchasing', length: '4:05', description: 'From a low-stock alert to an approved purchase order.' },
  { id: 'v5', title: 'Picking with the scanner', topic: 'Shipping', length: '2:58', description: 'Scan bins and items to pick an order without errors.' },
  { id: 'v6', title: 'Building a report', topic: 'Reports', length: '3:30', description: 'Filter, group and export inventory data.' },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Why is my count variance flagged?',
    a: 'A variance is flagged when a counted quantity differs from the system by more than 2%. Recount the bin, check the item’s History for unscanned moves, then post an adjustment with a reason.',
  },
  {
    q: 'How do I reorder low stock?',
    a: 'When an item falls below its reorder point, HUB 360 creates a draft purchase order and sends you a Low Stock notification. Review the draft in Inventory › Purchasing › Drafts and approve it.',
  },
  {
    q: 'Can I reorder or close tabs?',
    a: 'Yes. Drag a tab to move it, or use Ctrl+Shift+← / → when the tab has focus. Close a tab with its ×. The shell always opens on Dashboard.',
  },
  {
    q: 'Why can’t I sign in?',
    a: 'After 3 wrong passwords your account locks for a short time. Use Forgot Password on the sign-in screen to reset it with a code sent to your email.',
  },
  {
    q: 'How do I switch to dark mode?',
    a: 'Open the account menu (your photo, top right) and choose Theme. It switches between System, Light and Dark.',
  },
  {
    q: 'Who can approve purchase orders?',
    a: 'Purchasing managers approve any PO. Warehouse leads can approve POs under $10,000 for their own warehouse.',
  },
];

export type Release = { version: string; date: string; items: { kind: 'New' | 'Improved' | 'Fixed'; text: string }[] };

export const RELEASES: Release[] = [
  {
    version: '0.246',
    date: 'Oct 30, 2026',
    items: [
      { kind: 'New', text: 'Notifications, Chat and Email open from the header, with bookmarks and unread marks.' },
      { kind: 'New', text: 'Help Center with guides, videos, FAQs and support tickets.' },
      { kind: 'Improved', text: 'Tabs are easier to read, and you can drag them to reorder.' },
    ],
  },
  {
    version: '0.245',
    date: 'Oct 23, 2026',
    items: [
      { kind: 'New', text: 'Inventory section with HubSight, Warehouses, Items, Counts and more.' },
      { kind: 'Improved', text: 'Sign Out now asks before signing you out.' },
      { kind: 'Fixed', text: 'Footer links open the policy documents in a new tab.' },
    ],
  },
  {
    version: '0.244',
    date: 'Oct 16, 2026',
    items: [
      { kind: 'New', text: 'Dark mode, from the account menu.' },
      { kind: 'Fixed', text: 'The verification code screen accepts pasted codes.' },
    ],
  },
];

export type TicketStatus = 'Submitted' | 'In Progress' | 'Waiting on You' | 'Resolved';

export type Ticket = { id: string; subject: string; topic: string; updated: string; status: TicketStatus; message?: string };

export const TICKET_STEPS: TicketStatus[] = ['Submitted', 'In Progress', 'Resolved'];

export const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'TCK-1048',
    subject: 'Scanner won’t connect at Mesa dock 2',
    topic: 'Hardware',
    updated: 'Oct 29, 2026',
    status: 'In Progress',
    message: 'Our technician is shipping a replacement cradle; it should arrive Monday.',
  },
  {
    id: 'TCK-1045',
    subject: 'Need access to Purchasing approvals',
    topic: 'Account & Access',
    updated: 'Oct 28, 2026',
    status: 'Waiting on You',
    message: 'Please confirm which warehouses you approve POs for.',
  },
  {
    id: 'TCK-1031',
    subject: 'Monthly report shows the wrong totals',
    topic: 'Reports',
    updated: 'Oct 14, 2026',
    status: 'Resolved',
    message: 'Fixed in version 0.244. The report now includes in-transit stock.',
  },
];

export const SUPPORT = { phone: '(602) 555-0142', email: 'support@hub360.example', hours: '7 AM – 6 PM MST, Monday to Friday' };
