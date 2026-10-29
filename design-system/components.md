# Component Inventory — Design System Base

Imported from [Figma: __Design System - Base](https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base) on 2026-10-29.
Open any node with `https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/?node-id=<id with : replaced by ->`.

**188 component sets + 7 standalone components** across 77 pages. Nine of them sit on Testing and "not used" pages.
A trailing `*` in a name is copied from Figma as-is (see the audit).

Legend: **Variants** = variant count · **Axes** = variant properties · **Props** = TEXT / BOOLEAN properties. No component in the file has an INSTANCE_SWAP property.

## Foundations

| Page | Component | ID | Variants | Axes | Props |
|---|---|---|---|---|---|
| Logos* | Logo Icon | 1:141 | 1 | State | — |
| Logos* | Logo Full | 12:820 | 1 | State | — |
| Logos* | Logo Texala | 79:1443 | 1 | State | — |
| Logos* | Logo Side | 678:371 | 2 | Brand (HUB 360, SS 360) | — |
| Logos* | Recaptcha | 543:1693 | 1 | State | — |
| Logos* | Equal Housing Lender* | 588:622 | 1 | State | — |
| Logos* | Face ID Symbol* | 593:1117 | 1 | State | — |
| Logos* | Google | 1902:3795 | 1 | State | — |
| Logos* | Microsoft | 1902:3803 | 1 | State | — |
| Logos* | _Fake logo | 866:5651 | 1 | State | — |
| Icon Library | Icon / Arrow | 23:137 | 4 | Direction | — |
| Icon Library | Icon / Chevron | 32:920 | 6 | Direction (+ Double Up/Down) | — |
| Icon Library | Icon / Last | 692:1076 | 4 | Direction | — |
| Icon Library | Icon / Material | 56:932 | 95 | Icon | — |
| Colors | Block | 949:2217 | — | standalone | — |
| Arrows | Pointer | 774:1557 | 2 | Type (Straight, Elbow) | — |

## Primitive components

| Page | Component | ID | Variants | Axes | Props |
|---|---|---|---|---|---|
| Avatar* | Large | 424:278 | 3 | Type (Default, Initial, Photo) | — |
| Avatar* | Medium | 429:13 | 3 | Type | — |
| Avatar* | Small | 429:22 | 3 | Type | — |
| Avatar* | Icon* | 1786:3173 | 3 | Size (Large, Medium, Small) | — |
| AppBar* | AppBar* | 477:906 | 1 | State | — |
| Badge | Round | 416:1806 | 5 | Color (Amber, Blue, Green, Red, Black) | Label |
| Badge | Pill | 416:1819 | 5 | Color | Label |
| Breadcrumb | Parts | 1537:1525 | 2 | Position (Start, Next) | Label |
| Breadcrumb | Default | 1537:1545 | 4 | Levels (1–4) | — |
| Button Base* | Base / Outline / Icon* | 25:230 | 6 | State¹ | Label |
| Button Base* | Base / Outline* | 24:214 | 6 | State¹ | Label |
| Button Base* | Base / Primary / Icon | 629:917 | 6 | State¹ | Label |
| Button Base* | Base / Primary | 629:933 | 6 | State¹ | Label |
| Button Base* | Brand / Teal / Primary* | 1751:3499 | 6 | State¹ | — |
| Button Base* | Brand / Orange/ Primary* | 1751:3510 | 6 | State¹ | — |
| Button Base* | Brand / Teal / Primary / Icon* | 1751:3521 | 6 | State¹ | Show Icon |
| Button Base* | Brand / Orange/ Primary / Icon* | 1751:3532 | 6 | State¹ | Show Icon |
| Button Block* | Primary / Icon | 25:376 | 6 | State¹ | Label |
| Button Block* | Primary | 25:408 | 6 | State¹ | Label |
| Button Block* | Primary / Outline | 25:430 | 6 | State¹ | Label |
| Button Block* | Brand / Default* | 1751:3585 | 6 | State¹ | — |
| Button Block* | Brand / Icon* | 1751:3596 | 6 | State¹ | Label |
| Button Group* | Part - Vertical | 79:1642 | 6 | Position (Top, Bottom, Center) × State (Default, Hover) | — |
| Button Group* | Part - Horizontal | 28:751 | 6 | State (Left, Center, Right, + Hover of each) | — |
| Button Group* | Button Group / Horizontal* | 523:795 | 4 | Position × State | — |
| Button Group* | Button Group / Vertical* | 523:821 | 4 | Position × State | — |
| Button Icon | Icon | 25:355 | 6 | State¹ | — |
| Button Icon | Brand | 2388:4991 | 6 | State¹ | — |
| Button Icon | Number | 692:1041 | 6 | State¹ | Label |
| Button Side Menu | Side Menu / Tier 1 / Default | 683:2282 | 6 | State¹ | Label |
| Button Side Menu | Side Menu / Tier 1 /Compact | 2171:2645 | 6 | State¹ | Label |
| Button Side Menu | Side Menu / Tier 2 / Default | 685:196 | 6 | State¹ | Label |
| Button Side Menu | Side Menu / Tier 2 / Label | 2190:5985 | 6 | State¹ | Label |
| Button Side Menu | Side Menu / Tier 2 / Compact | 2171:2677 | 6 | State¹ | Label |
| Button Small* | Outline / Icon* | 401:347 | 6 | State¹ | Label |
| Button Small* | Outline / Default | 401:363 | 6 | State¹ | Label |
| Button Small* | Primary / Icon | 401:401 | 6 | State¹ | Label |
| Button Small* | Primary / Default | 401:417 | 6 | State¹ | Label |
| Button Small* | Brand / Default | 1751:3632 | 6 | State¹ | Label |
| Button Small* | Brand / Secondary* | 2548:3743 | 6 | State¹ | Label |
| Button Small* | Brand / Secondary / Icon - Left* | 2734:1004 | 6 | State¹ | Label |
| Button Small* | Brand / Secondary / Icon - Right* | 2734:1035 | 6 | State¹ | Label |
| Button Small* | Brand / Default / Icon - Left* | 1751:3643 | 6 | State¹ | Label |
| Button Small* | Brand / Default / Icon - Right* | 2392:572 | 6 | State¹ | Label |
| Button Tiny | Primary | 2193:6401 | 6 | State¹ | Label |
| Button Tiny | Text | 2193:6668 | 6 | State¹ | Label |
| Chip* | Outline / Right Icon* | 342:5036 | 6 | State¹ | Label |
| Chip* | Outline / Left Icon* | 342:5005 | 6 | State¹ | Label |
| Chip* | Secondary / Right Icon | 342:4973 | 6 | State¹ | Label |
| Chip* | Secondary / Left Icon* | 342:4942 | 6 | State¹ | Label |
| Chip* | Default / Right Icon* | 318:4850 | 6 | State¹ | Label |
| Chip* | Default / Left Icon* | 318:4812 | 6 | State¹ | Label |
| Chip* | Tiny / Icon Left | 2644:4046 | 6 | State¹ | Label |
| Chip* | Tiny / Icon Right | 2673:5696 | 6 | State¹ | Label |
| Checkbox | Default | 397:1330 | 6 | State² | Label, Show Checkmark |
| Checkbox | Default - Icon* | 2499:4513 | 6 | State² | Label, Show Checkmark |
| Checkbox | Small | 363:5386 | 6 | State² | Label, Show Checkmark |
| Checkbox | Small - Icon | 2417:3224 | 6 | State² | Label, Show Checkmark |
| Drop Down Label | Default | 481:856 | 9 | State (…, Default - Light, Required, Default - No Label) | Label, Select |
| Drop Down Label | chips | 2676:6014 | 1 | State | — |
| Drop Down Button* | Icon* | 56:1083 | 6 | State³ | — |
| Drop Down Button* | Icon and Label | 56:1075 | 6 | State³ | Select |
| Drop Down Button* | Default | 56:936 | 6 | State³ | Select |
| Drop Down Button* | Small | 478:1190 | 6 | State³ | Select |
| Editable Cell | Editable Cell | 2903:32 | 7 | Type (Input, Select, Read Only) × State (Default, Error, Hover) | Value |
| Hyperlink* | Large* | 209:3842 | 5 | State (Default, Disabled, Focus, Hover, Press) | Label |
| Hyperlink* | Medium | 195:3817 | 5 | State | Label |
| Hyperlink* | Small | 385:5469 | 5 | State | Label |
| Last Modified | Date | 2328:3773 | 1 | State | Label |
| ListBox* | List Item / Icon | 432:998 | 6 | State² | Label |
| ListBox* | List Item / Avatar | 432:1109 | 6 | State² | Label |
| ListBox* | List Item / Tree | 500:2049 | 6 | State² | Label |
| ListBox* | List Item / Checkbox | 432:1053 | 6 | State² | — |
| ListBox* | List Item / Category | 433:1484 | 1 | State | — |
| ListBox* | List Item / Default | 433:1149 | 6 | State² | Label |
| ListBox* | ListViews* | 433:1231 | 5 | Type (Default, Avatar, Category, Checkbox, Chevron) | — |
| ListBox* | Tree List* | 501:2238 | 1 | State | — |
| OTP Input* | OTP Input* | 414:1616 | 6 | State² | Label |
| Overlay | Overlay | 717:18047 | — | standalone | — |
| Radio Button* | Default* | 397:1297 | 6 | State² | Label, Show Selected |
| Radio Button* | Hint* | 2330:3837 | 6 | State² | Label, Show Selected, Description |
| Skeleton* | Skeleton* | 521:345 | 4 | Shape (Circle, Bar, Block, Square) | — |
| Tag* | Tiny | 2610:6045 | 6 | State¹ | Label |
| Tag* | Small | 339:4909 | 6 | State¹ | Label |
| Tag* | Outline* | 339:4922 | 6 | State¹ | Label |
| Tag* | Default* | 318:4725 | 6 | State¹ | Label |
| Text Area | Default | 303:4524 | 6 | State² | Label, Placeholder, Error |
| Text Input - Label* | Default | 218:3960 | 7 | State² + Required | Label, Placeholder, Error |
| Text Input - Label* | Left Icon* | 277:4338 | 7 | State² + Required | Label, Placeholder, Error |
| Text Input - Label* | Right Icon | 303:4430 | 7 | State² + Required | Label, Placeholder, Error |
| Text Input - Label* | Right Double Icon | 2717:185 | 7 | State² + Required | Label, Placeholder, Error |
| Text Input - Autocomplete* | Text Input - Autocomplete* | 449:2189 | 4 | State (Default, Activated Search, Active Input, Selected) | — |
| Text Input - Numeric* | Text Input - Numeric* | 397:691 | 6 | State² | Label, Placeholder, Error |
| Toggle | Label | 2282:1930 | 12 | Position × Size × State (On, Off, Disabled) | Label |
| Toggle | Large | 404:186 | 3 | State (On, Off, Disabled) | — |
| Toggle | Small | 2283:1939 | 3 | State (Off, On, Disabled) | — |
| Toggle | Toggle Button | 2634:295 | 1 | State × Size | — |
| Tooltip* | Large* | 435:368 | 4 | Position (Top, Bottom, Left, Right) | Label |
| Tooltip* | Small* | 497:785 | 4 | Position | Label |

¹ Default, Hover, Press, Selected, Focus, Disabled · ² Default, Disabled, Error, Focus, Hover, Press · ³ Default, Hover, Press, Focus, Disabled, Error

## Web components

| Page | Component | ID | Variants | Axes | Props |
|---|---|---|---|---|---|
| Drop Down - Accordion* | Categories | 476:5 | 4 | Type (Item, Category) × State | Show Icon |
| Drop Down - Accordion* | Drop Down - Accordion* | 477:64 | 2 | State (Default, Open) | — |
| Drop Down - Filter Chip | Default | 2678:7113 | 9 | State (…, Default - Light, Press - Alt, Required) | Label, Select |
| Drop Down - Selector | Autocomplete / Dropdown | 451:779 | 6 | State (Default, Hover, Active, Active Input, Selected, Disabled) | Label |
| Drop Down - Selector | Autocomplete / Dropdown / Chips | 2747:6026 | 6 | State (same) | Label |
| Drop Down - Selector | Autocomplete / Dropdown / Photo Library | 2781:1158 | 5 | State | Label |
| Drop Down - Selector | Dropdown Selector | 455:455 | 4 | State (Default, Hover, Indent, Indent Hover) | Label, Show Icon |
| Drop Down - Selector | Dropdown Holder | 455:472 | 3 | State (Scrollbar, Default, Gallery) | — |
| Drop Down - Selector | Chip | 455:696 | 1 | State | Label |
| Captcha | Captcha | 544:60 | 2 | State (Unchecked, Checked) | — |
| Card* | Card* | 2220:3790 | 4 | Mode (Edit, Save, Active, Title) | Label |
| Context Menu* | Menu Item | 485:1008 | 5 | State | Show Icon, Show Submenu, Label |
| Context Menu* | Context Menu* | 486:92 | 1 | State | — |
| Breadcrumb | Breadcrumb | 483:1252 | 1 | State | — |
| Modal* | Dialog / Modal | 429:687 | 2 | Style (Default, Scrollbar) | Title, Body |
| Modal* | Modal - Dynamic | 2684:8355 | 1 | State | — |
| Modal* | Modal - Dialog* | 2831:8727 | 1 | State | Title, Description |
| Dropdown Tree* | Dropdown Tree* | 462:1445 | 5 | State (Default, Active, Active Hover, Active Open, Selected) | — |
| Menu Sidebar* | Menu Sidebar Item | 490:750 | 5 | State | Label |
| Menu Sidebar* | Menu Sidebar* | 490:809 | 1 | State | — |
| Message | Message | 503:3072 | 2 | State (Default, Hover) | Title, Body |
| Message | Message | 503:3176 | 8 | Type (Info, Caution, Error, Success) × State | — |
| Modal Screen | Modal Screen* | 805:922 | — | standalone | — |
| Multiselect Dropdown* | Multiselect Dropdown* | 455:647 | 5 | State (Default, Active, Active Hover, Active Selected, Selected) | Select |
| Notification Box* | Notification Box* | 744:4494 | 4 | Type (Alert, Chat, Email, Read) | — |
| Progress Bar* | Progress Bar* | 520:583 | 2 | Style (Default, With Percentage) | — |
| Progress Bar* | Progress Circle | 520:588 | 2 | Style | — |
| Rating* | Rating* | 408:370 | 1 | State | Label |
| Scrollbar | Scrollbar | 431:266 | 1 | State | — |
| Search Bar | Search Input | 605:10332 | 5 | State (Default, Active, Disabled, Focus, Hover) | Label |
| Search Bar | Searched List Type | 2539:4739 | 4 | Type × State | Name, Nickname |
| Signature* | Signature Pad* | 399:486 | 2 | State (Default, Active) | Label |
| Slider* | Range Slider* | 398:1585 | 2 | State (Default, Active) | — |
| Timeline | TimeLine | 440:1994 | 1 | State | — |
| Timeline | Status Step | 2899:7484 | 9 | State (Done, Current, Upcoming) × Property (Start, Middle, End) | Label |
| Timeline | Status Connector | 2900:5 | 2 | State (Done, Upcoming) | — |
| Tab Bar* | Tab / Small | 494:266 | 5 | State (Default, Current Tab, Disabled, Focus, Hover) | — |
| Tab Bar* | Tab / Tiny* | 742:4310 | 5 | State | — |
| Tab Bar* | Tab Content | 494:454 | 1 | State | — |
| Tab Bar* | Tab Bar* | 494:338 | 1 | State | — |
| Upload Document | Upload File | 2334:4353 | 2 | State (Default, Hover) | — |

## Custom components

| Page | Component | ID | Variants | Axes | Props |
|---|---|---|---|---|---|
| Data Headers* | User Headers | 707:5584 | 7 | Screen (Users, Departments, Locations, Roles, Supervisors, Tags, Notes) | — |
| Data Headers* | Header Item | 754:2169 | 2 | State (Default, Default - 2 Icons) | Label |
| Data Headers* | Tenant Headers* | 1098:813 | 1 | State | — |
| Data Rows* | Data Rows | 707:5559 | 7 | Screen | Show Shade |
| Data Rows* | Row Item | 759:2011 | 1 | State | Value, Show Slot, Show Value |
| Data Rows* | Slot* | 765:10067 | 1 | State | — |
| Data Rows* | Tenant Rows* | 1098:940 | 1 | State | — |
| Main Drop Down* | Main Drop Down* | 711:13334 | 5 | State | Label |
| Page Tracker | Tracker | 708:1452 | 1 | State | — |
| Help Center | Help Article Row | 2903:53 | 4 | Type (Compact, Result) × State | Title, Meta, Path, Snippet |
| Help Center | Help Category Card | 2921:7899 | 2 | State | Title, Description, Count |

## Navigation

| Page | Component | ID | Variants | Axes | Props |
|---|---|---|---|---|---|
| Main Nav › Tab Bar | Tab Bar | 2133:4457 | 4 | Active Tab (First–Fourth) | — |
| Main Nav › Tab Bar | Tab Button | 1994:336 | 3 | State (First / Last, Active, Inactive) | — |
| Main Nav › Tab Bar | Tab Label | 1994:326 | 2 | State | Label |
| Main Nav › Tab Bar | Tab Small | 2049:540 | 2 | State | — |
| Main Nav › Header | Header | 708:1883 | 2 | State (Default, Notifications) | — |
| Main Nav › Tier 1 | Tier 1 | 708:1635 | 2 | State (Default, Compact) | — |
| Main Nav › Tier 1 | Side Sub Menu | 2131:4190 | 1 | State | Title |
| Main Nav › Tier 1 | Top Navigation | 2172:4052 | 3 | Size (Large, Medium, Small) | — |
| Main Nav › Tier 2 | Tier 2 | 708:1647 | 3 | State (Default, Collapsed, Label) | — |
| Main Nav › Tier 3 | Tier 3 Labels | 2642:3610 | 4 | Labels (1–4) | — |
| Main Nav › Tier 3 | Tier 3 Label | 2642:3631 | 1 | State | Label, Value |
| Main Nav › Tier 3 | Tier 3 | 2644:3738 | 2 | State (Expanded, Collapsed) | — |
| Main Nav › Tier 3 | Tier 3 Icon | 2648:4086 | 4 | Size × State | — |
| Interior Nav › Sub Menu | Sub Menu | 708:1502 | 3 | State (Default, Tiny, Text) | — |
| Interior Nav › Footer | Footer | 1544:2832 | 1 | State | — |

## Scaffolding, testing and unused

| Page | Component | ID | Notes |
|---|---|---|---|
| Holder | Holder / Header / Footer | 79:1514, 28:650, 28:651 | Page-frame scaffolding; 31 hardcoded fills |
| Cover | Cover | 574:1238 | File cover |
| ***Testing*** | Box* | 707:5534 | No description |
| MultiColumn ComboBox -- not used* | Items*, Column*, Table* | 464:1967, 464:1983, 464:2032 | |
| Date Input -- not used* | Date Input* | 2903:18 | Proposal |
| Status Pill -- not used | Status Pill | 2895:7444 | Proposal: Gray/Teal Pill colors |
| Menu Bar -- not used* | Menu Bar*, box* | 490:646, 605:10806 | |
| Toolbars -- not used | Toolbar | 707:5627 | 7 screen variants |
