/**
 * Sample data for the header's Notifications, Chat and Email buttons (Figma "_Sign In / Shell" › Communication,
 * 774:5511). State is in memory, like the rest of the prototype.
 */
export type InboxKind = 'notifications' | 'messages' | 'email';

export type InboxItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  /** Sender's name (chat and email): the photo, the initials fallback, and the line under the preview. */
  from?: string;
  /** The sender's company (outside senders) or department (Solar Topps colleagues), shown after the name. */
  org?: string;
  unread: boolean;
  bookmarked?: boolean;
};

/**
 * Sender pictures for chat and email: cartoon avatars saved in assets/people/ as <sender-name>.svg. They come
 * from DiceBear's "Avataaars" style (api.dicebear.com/9.x/avataaars, seeded with the file name, on a pastel
 * background): "Avataaars" by Pablo Stanley, https://avataaars.com/, free for personal and commercial use.
 */
const PHOTOS = import.meta.glob<string>('../assets/people/*.svg', { eager: true, import: 'default' });

/** The sender's picture, or undefined when there is none (the card then shows initials). */
export const senderPhoto = (from: string) =>
  PHOTOS[`../assets/people/${from.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`];

/** Modal titles from Figma; the header buttons keep their own labels (Notifications, Messages, Email). */
export const INBOX_TITLES: Record<InboxKind, string> = {
  notifications: 'Notifications',
  messages: 'Chat',
  email: 'Email',
};

export const SAMPLE_INBOX: Record<InboxKind, InboxItem[]> = {
  notifications: [
    {
      id: 'n1',
      title: 'Your Balance is Overdue',
      message: "Invoice INV-20418 for Phoenix Warehouse supplies was due Oct 25. Pay it now to avoid a late fee and keep your purchasing account active. The balance is $4,812.60 across 14 line items, mostly racking hardware and conduit. If you've already paid, it can take up to two business days to post; send the confirmation number to Accounts Payable and they'll match it to the invoice.",
      time: '54min ago',
      unread: true,
    },
    {
      id: 'n2',
      title: 'Low Stock: 400W Solar Panels',
      message: "Mesa Warehouse has 12 panels left, below the reorder point of 40. A purchase order draft is ready for your review. At the current install pace the panels run out in about six working days, and SunVolt Supply needs five days to deliver. The draft orders 120 panels at last quarter's price; approve it today to keep the Scottsdale and Chandler jobs on schedule.",
      time: '2h ago',
      unread: true,
    },
    {
      id: 'n3',
      title: 'Cycle Count Due Tomorrow',
      message: 'Tempe Warehouse aisle B is scheduled for its quarterly count on Oct 31. Assign a counter before 5 PM today. Aisle B holds 212 bins, mostly inverters, optimizers and wiring, so plan for about three hours. Receiving is paused in that aisle during the count, and any variance over 2% needs a recount before it is posted.',
      time: '5h ago',
      unread: false,
    },
    {
      id: 'n4',
      title: 'Shipment Delayed',
      message: 'PO-7731 from SunVolt Supply is running two days late. The new delivery date is Monday, Nov 3. The carrier reported a weather hold at its El Paso hub; nothing in the order is damaged. Two installs scheduled for Nov 1 use panels from this order, so check with Project Management about moving them or pulling stock from Mesa.',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: 'n5',
      title: 'Password Expires Soon',
      message: "Your password expires in 7 days. You can change it in Account Settings under Security & Login. Choose at least 12 characters, and don't reuse any of your last five passwords. If it expires first, you'll need a verification code sent to your email to sign in again.",
      time: 'Mon, Oct 27',
      unread: false,
    },
  ],
  messages: [
    {
      id: 'm1',
      from: 'Selina Kyle',
      org: 'Project Management',
      title: 'New Project Next Week',
      message: "Can we walk the Scottsdale site on Monday? I'd like to confirm the panel count before we order racking. The customer added a detached garage to the scope, so the roof plan went from 28 to 36 panels. If you can bring the warehouse pick list, we can check it against the new layout on site and get the racking order in by Wednesday.",
      time: '54min ago',
      unread: true,
    },
    {
      id: 'm2',
      from: 'Harvey Dent',
      org: 'Receiving',
      title: 'Receiving Dock Schedule',
      message: "Two trucks are booked for Thursday morning. Can someone from receiving be at dock 3 by 7:30? The first truck is the SunVolt order (PO-7731, 6 pallets) and the second is conduit and wire from Desert Freight. We'll need the forklift charged and the overflow area in aisle F cleared before they arrive.",
      time: '1h ago',
      unread: true,
    },
    {
      id: 'm3',
      from: 'Edward Nygma',
      org: 'Inventory Control',
      title: 'Count Variance on Inverters',
      message: "The Tempe count shows 3 fewer inverters than the system. Did anything ship without a pick ticket? The missing units are the 7.6 kW model, serials ending 4471 through 4473. They were last scanned into bin B-14 on Oct 20. If they went out on a job, I can post the adjustment today; otherwise I'll open a loss report.",
      time: '3h ago',
      unread: true,
    },
    {
      id: 'm4',
      from: 'Pamela Isley',
      org: 'Purchasing',
      title: 'Supplier Samples Arrived',
      message: "The new mounting brackets from GreenRail are in. I left them on the shelf next to receiving. They're about 15% cheaper than our current brackets and rated for the same wind load. Can install crews try a set on next week's Tempe job and send me feedback? If they hold up, I'll switch the standing order in December.",
      time: '4h ago',
      unread: true,
    },
    {
      id: 'm5',
      from: 'Jervis Tetch',
      org: 'Reporting & Analytics',
      title: 'Monthly Report',
      message: "Do you want the monthly inventory report split by warehouse, or combined like last time? Splitting it adds a page per warehouse but makes the Mesa shortages easier to spot. I can also add a chart of stock value by month if that would help the budget review. I'm planning to send it out Monday morning.",
      time: 'Yesterday',
      unread: false,
    },
  ],
  email: [
    {
      id: 'e1',
      from: 'Marcus Reyes',
      org: 'SunVolt Supply',
      title: 'Order Confirmation PO-7731',
      message: "Thanks for your order of 120 400W panels and 24 string inverters. Tracking details will follow when the order ships. The order total is $38,940.00, billed on net-30 terms to your Phoenix account. Your expected delivery window is Oct 30 to Nov 3; we'll call your receiving team the day before to book a dock time.",
      time: '32min ago',
      unread: true,
    },
    {
      id: 'e2',
      from: 'Dana Whitfield',
      org: 'Accounts Payable',
      title: 'Invoice INV-20418 Reminder',
      message: 'This is a reminder that invoice INV-20418 is past due. Reply to this email if you need a copy of the invoice. The vendor has offered to waive the late fee if payment is approved by Friday. Please confirm the receiving records match the invoice, then approve it in Purchasing so we can release the payment.',
      time: '1h ago',
      unread: true,
    },
    {
      id: 'e3',
      from: 'Lucius Fox',
      org: 'Finance',
      title: 'Q4 Purchasing Budget',
      message: "I've attached the Q4 purchasing budget by warehouse. Please flag anything that looks off before Friday. The total is $412,000, up 8% on Q3, mostly because of the Chandler expansion. Mesa's line is tight if the panel price increase goes through, so let me know if we should move money from Tempe's tools budget.",
      time: '2h ago',
      unread: true,
    },
    {
      id: 'e4',
      from: 'Tyler Brooks',
      org: 'GreenRail Mounting',
      title: 'Updated Price List for 2027',
      message: "Our 2027 price list is attached. Orders placed before Dec 15 are held at current pricing. Rail and clamp prices go up about 6% in January; tilt kits stay the same. We're also adding a 25-foot rail that cuts splices on long arrays. I can send samples or set up a call with your purchasing team.",
      time: '4h ago',
      unread: true,
    },
    {
      id: 'e5',
      from: 'Daniel Kim',
      org: 'HUB 360 Support',
      title: 'Weekly Inventory Summary',
      message: 'Stock value is up 4% this week. Two items are below their reorder point and one count is overdue. Low stock: 400W panels at Mesa (12 left) and MC4 connectors at Tempe (80 left). The overdue count is Phoenix aisle D, which was due Oct 24. Open the Inventory dashboard for the full breakdown by warehouse.',
      time: '6h ago',
      unread: true,
    },
    {
      id: 'e6',
      from: 'Leslie Thompkins',
      org: 'Safety & Compliance',
      title: 'Safety Training on Nov 6',
      message: "Forklift and ladder safety training is on Thursday, Nov 6 at 9 AM in the Mesa break room. Please confirm your team. The session runs about two hours and counts toward this year's OSHA certification. Everyone who drives a forklift must attend or book the Nov 13 make-up session. Send me your list of names by Monday so I can print certificates.",
      time: 'Yesterday',
      unread: true,
    },
    {
      id: 'e7',
      from: 'Luis Ortega',
      org: 'Desert Freight',
      title: 'Proof of Delivery: Shipment 55120',
      message: 'Shipment 55120 was delivered to Phoenix Warehouse at 2:14 PM and signed for by H. Bullock. All 9 pallets arrived intact, and the signed delivery receipt is attached. If you find any damage while unpacking, report it within 5 business days so we can file a claim with the carrier.',
      time: 'Yesterday',
      unread: true,
    },
    {
      id: 'e8',
      from: 'Barbara Gordon',
      org: 'Facilities',
      title: 'Warehouse Access Badges',
      message: 'New access badges for the Tempe warehouse are ready. Pick yours up at the front desk this week. Old badges stop working on Nov 10. The new badges also open the loading dock gate after hours, so you no longer need to call security for late deliveries. Bring a photo ID when you collect yours.',
      time: 'Tue, Oct 28',
      unread: true,
    },
  ],
};
