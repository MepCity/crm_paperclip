# Tags, Print, Share, Drafts and Recycle Bin evidence inventory

Status: partial continuation of MEP-629 on MEP-779. This index preserves existing
numbered inventories; it does not claim new captures or complete scope.
Screenshots remain in the local research workspace and are never committed.

## Coverage and remaining work

| State | Modules | Evidence status |
| --- | --- | --- |
| Drafts initial empty state | Leads, Contacts, Accounts, Deals | Existing capture and inventory preserved below |
| Manage Tags initial empty state | Leads, Contacts, Accounts, Deals | Existing capture and inventory preserved below |
| Print View submenu | Leads, Contacts, Accounts | Existing capture and inventory preserved below; destination pending |
| Record header | Leads | Existing capture and inventory preserved below |
| Recycle Bin list and initial Search | Shared Setup | Existing capture and inventory preserved below |
| Add Tags initial dialog | Leads | Initial empty popover observed below; MEP-787 accepted baseline background requests |
| Add Tags initial dialog | Contacts, Accounts, Deals | Unobserved |
| Share initial dialog | Leads | Initial private-sharing modal observed below |
| Share initial dialog | Contacts, Accounts, Deals | Unobserved |
| Record Print Preview destination | Four record modules | Unobserved; Leads bounded attempt skipped by attribute guard |
| Print Default view destination | Table modules | Leads requests a guarded new window; destination unobserved |
| Tagged records, populated Drafts, naturally empty bin | Applicable modules | No state may be manufactured by a write |

## Continuation preflight (2026-10-17)

Two browser page targets, no capture lock, one-minute load 151.51.
The approved maximum load is 50; no new capture was launched. Existing
completed captures were not repeated. MEP-765 requires a single attach, a
15-second paint wait per step and stop-on-any-blocked-request semantics.
At that initial preflight its five approved runs remained unconsumed.
Later Add Tags, More and Share evidence is recorded below; MEP-787 replaces
the original stop-on-any-blocked-request rule with baseline comparison. Later module coverage requires
selectors from actual captures; never reconstruct hidden record identifiers.

The inherited inventories below describe observations made on 2026-10-15
and 2026-10-16. They are evidence, not approved implementation requirements.
Numbering restarts for each capture and includes the visible shell.
Unknown icons and unexercised behaviour remain explicitly unverified.


## m6-leads-drafts

### Numbered control inventory

Capture: `m6-leads-drafts`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Bottom left dock | Channels | Channel dock entry; not activated |
| 49 | Bottom left dock | Threads | Thread dock entry; not activated |
| 50 | Content header left | Back arrow | Return navigation; not exercised |
| 51 | Beside Drafts title | Information icon | Help affordance; tooltip not observed |
| 52 | Content header right | Help | Help navigation; not opened |
| 53 | Criteria card upper right | Hide chevron | Expanded criteria visibility; never toggle |
| 54 | Criteria row start | Criterion index | Textbox showing first criterion number |
| 55 | Criteria row | Field selector | Initial None; no selection |
| 56 | Criteria row after field | Operator selector | Initial None; visually inactive |
| 57 | Criteria row after operator | Value textbox | Disabled |
| 58 | Criteria row right | Plus icon | Additional criterion affordance; not activated |
| 59 | Below criteria row | Search | Disabled |

#### Non-interactive content

Drafts title, Criteria heading and naturally empty result card. No record actions are visible.

#### Safety evidence

`meta.json` records 2 blocked requests. No write control was activated.


## m6-contacts-drafts

### Numbered control inventory

Capture: `m6-contacts-drafts`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Beside Drafts title | Information icon | Help affordance; tooltip not observed |
| 50 | Content header right | Help | Help navigation; not opened |
| 51 | Criteria card upper right | Hide chevron | Expanded criteria visibility; never toggle |
| 52 | Criteria row start | Criterion index | Textbox showing first criterion number |
| 53 | Criteria row | Field selector | Initial None; no selection |
| 54 | Criteria row after field | Operator selector | Initial None; visually inactive |
| 55 | Criteria row after operator | Value textbox | Disabled |
| 56 | Criteria row right | Plus icon | Additional criterion affordance; not activated |
| 57 | Below criteria row | Search | Disabled |

#### Non-interactive content

Drafts title, Criteria heading and naturally empty result card. No record actions are visible.

#### Safety evidence

`meta.json` records 3 blocked requests. No write control was activated.


## m6-accounts-drafts

### Numbered control inventory

Capture: `m6-accounts-drafts`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Beside Drafts title | Information icon | Help affordance; tooltip not observed |
| 50 | Content header right | Help | Help navigation; not opened |
| 51 | Criteria card upper right | Hide chevron | Expanded criteria visibility; never toggle |
| 52 | Criteria row start | Criterion index | Textbox showing first criterion number |
| 53 | Criteria row | Field selector | Initial None; no selection |
| 54 | Criteria row after field | Operator selector | Initial None; visually inactive |
| 55 | Criteria row after operator | Value textbox | Disabled |
| 56 | Criteria row right | Plus icon | Additional criterion affordance; not activated |
| 57 | Below criteria row | Search | Disabled |

#### Non-interactive content

Drafts title, Criteria heading and naturally empty result card. No record actions are visible.

#### Safety evidence

`meta.json` records 3 blocked requests. No write control was activated.


## m6-deals-drafts

### Numbered control inventory

Capture: `m6-deals-drafts`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Beside Drafts title | Information icon | Help affordance; tooltip not observed |
| 50 | Content header right | Help | Help navigation; not opened |
| 51 | Criteria card upper right | Hide chevron | Expanded criteria visibility; never toggle |
| 52 | Criteria row start | Criterion index | Textbox showing first criterion number |
| 53 | Criteria row | Field selector | Initial None; no selection |
| 54 | Criteria row after field | Operator selector | Initial None; visually inactive |
| 55 | Criteria row after operator | Value textbox | Disabled |
| 56 | Criteria row right | Plus icon | Additional criterion affordance; not activated |
| 57 | Below criteria row | Search | Disabled |

#### Non-interactive content

Drafts title, Criteria heading and naturally empty result card. No record actions are visible.

#### Safety evidence

`meta.json` records 6 blocked requests. No write control was activated.


## m6-leads-manage-tags

### Numbered control inventory

Capture: `m6-leads-manage-tags`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Content header right | Help | Help navigation; not opened |
| 50 | Empty table center | New Tag | Creation entry; not activated |

#### Non-interactive content

Manage Tags title, module badge, explanatory paragraph, usage counter, table headings Tag Color / Tag Name / Last Modified, and naturally empty table message.

#### Safety evidence

`meta.json` records 2 blocked requests. No write control was activated.


## m6-contacts-manage-tags

### Numbered control inventory

Capture: `m6-contacts-manage-tags`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Content header right | Help | Help navigation; not opened |
| 50 | Empty table center | New Tag | Creation entry; not activated |

#### Non-interactive content

Manage Tags title, module badge, explanatory paragraph, usage counter, table headings Tag Color / Tag Name / Last Modified, and naturally empty table message.

#### Safety evidence

`meta.json` records 2 blocked requests. No write control was activated.


## m6-accounts-manage-tags

### Numbered control inventory

Capture: `m6-accounts-manage-tags`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Content header right | Help | Help navigation; not opened |
| 50 | Empty table center | New Tag | Creation entry; not activated |

#### Non-interactive content

Manage Tags title, module badge, explanatory paragraph, usage counter, table headings Tag Color / Tag Name / Last Modified, and naturally empty table message.

#### Safety evidence

`meta.json` records 2 blocked requests. No write control was activated.


## m6-deals-manage-tags-retry

### Numbered control inventory

Capture: `m6-deals-manage-tags-retry`. Evidence: screenshot.png, aria.yml, controls.json and meta.json.

Numbers refer to individual visible control surfaces, not nested duplicate DOM nodes.
Locations are descriptive, with no implementation measurements. Button purposes
that were not exercised are labelled as affordances; no submit or preference change.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header left | Back arrow | Return navigation; not exercised |
| 49 | Content header right | Help | Help navigation; not opened |
| 50 | Empty table center | New Tag | Creation entry; not activated |

#### Non-interactive content

Manage Tags title, module badge, explanatory paragraph, usage counter, table headings Tag Color / Tag Name / Last Modified, and naturally empty table message.

#### Safety evidence

`meta.json` records 4 blocked requests. No write control was activated.


## m6-leads-print-menu

### Numbered control inventory

Capture: `m6-leads-print-menu`. Customer values are omitted. Shell entries are repeated for standalone reading. Visible list rows are numbered top-to-bottom. No data or preference was changed.

| No. | Location | Control | Purpose / state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Under page title | All Leads | Current list view selector; never changed |
| 49 | Beside current view | Ellipsis | View actions; not opened |
| 50 | List toolbar left | Filter | Filter visibility; never toggled |
| 51 | List toolbar left | Sort | Sort entry; never changed |
| 52 | List toolbar middle | List icon | View preference control; never activated |
| 53 | List toolbar middle | Split icon | View preference control; never activated |
| 54 | List toolbar middle | Table icon | View preference control; never activated |
| 55 | List toolbar middle | Chart icon | View preference control; never activated |
| 56 | List toolbar middle | Board icon | View preference control; never activated |
| 57 | List toolbar middle | Tile icon | View preference control; never activated |
| 58 | List toolbar middle | View options icon | View preference control; never activated |
| 59 | List toolbar after view options | Refresh | Reload affordance; not activated |
| 60 | List toolbar right | Create Lead | Creation entry; not activated |
| 61 | Beside Create | Create chevron | Creation options; not activated |
| 62 | List toolbar far right | Actions | Opens menu |
| 63 | Filter panel top | Search | Search available fields; no input |
| 64 | Filter panel | System Defined Filters chevron | Section visibility; never toggled |
| 65 | Filter panel system section | Activities | Filter checkbox; not selected |
| 66 | Filter panel system section | Campaigns | Filter checkbox; not selected |
| 67 | Filter panel system section | Latest Email Status | Filter checkbox; not selected |
| 68 | Filter panel system section | Locked | Filter checkbox; not selected |
| 69 | Filter panel system section | Record Action | Filter checkbox; not selected |
| 70 | Filter panel system section | Related Records Action | Filter checkbox; not selected |
| 71 | Filter panel system section | Touched Records | Filter checkbox; not selected |
| 72 | Filter panel system section | Untouched Records | Filter checkbox; not selected |
| 73 | Filter panel system section | Cadences | Filter checkbox; not selected |
| 74 | Filter panel lower section | Filter By Fields chevron | Section visibility; never toggled |
| 75 | Filter panel visible field rows | Address | Field filter checkbox; not selected |
| 76 | Filter panel visible field rows | Address - City | Field filter checkbox; not selected |
| 77 | Filter panel visible field rows | Address - Country / Region | Field filter checkbox; not selected |
| 78 | Filter panel visible field rows | Address - Flat / House No. / Building | Field filter checkbox; not selected |
| 79 | Table header left | Select all checkbox | Batch selection; not activated |
| 80 | Primary name column header | All dropdown | Record name scope affordance; not changed |
| 81 | Table far right header | Column settings icon | Column preference; never activated |
| 82 | Table visible row 1 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 83 | Table visible row 1 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 84 | Table visible row 2 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 85 | Table visible row 2 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 86 | Table visible row 3 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 87 | Table visible row 3 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 88 | Table visible row 4 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 89 | Table visible row 4 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 90 | Table visible row 5 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 91 | Table visible row 5 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 92 | Table visible row 6 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 93 | Table visible row 6 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 94 | Table visible row 7 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 95 | Table visible row 7 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 96 | Table visible row 8 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 97 | Table visible row 8 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 98 | Table visible row 8 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 99 | Table visible row 9 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 100 | Table visible row 9 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 101 | Table visible row 9 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 102 | Table visible row 10 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 103 | Table visible row 10 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 104 | Table visible row 10 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 105 | Table visible row 10 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 106 | List footer right | Previous page | Pagination; not activated |
| 107 | List footer right | Next page | Pagination; not activated |
| 108 | Open Actions menu, top-to-bottom | Mass Transfer | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 109 | Open Actions menu, top-to-bottom | Mass Delete | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 110 | Open Actions menu, top-to-bottom | Mass Update | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 111 | Open Actions menu, top-to-bottom | Mass Convert | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 112 | Open Actions menu, top-to-bottom | Manage Tags | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 113 | Open Actions menu, top-to-bottom | Drafts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 114 | Open Actions menu, top-to-bottom | Mass Email | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 115 | Open Actions menu, top-to-bottom | Approve Leads | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 116 | Open Actions menu, top-to-bottom | Deduplicate Leads | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 117 | Open Actions menu, top-to-bottom | Add to Campaigns | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 118 | Open Actions menu, top-to-bottom | Create Client Script | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 119 | Open Actions menu, top-to-bottom | Export Leads | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 120 | Open Actions menu, top-to-bottom | Spreadsheet view | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 121 | Open Actions menu, top-to-bottom | Print View | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 122 | Print submenu top | Print Default view | Print action; never activated |
| 123 | Print submenu bottom | Print Using Canvas | Print action; never activated |

Some filter items are clipped by the viewport; their labels are corroborated by accessibility evidence. Column field labels are non-interactive headings. Toolbar icon view names describe shapes; exact tooltips are unverified and no view changes were attempted.


## m6-contacts-print-menu

### Numbered control inventory

Capture: `m6-contacts-print-menu`. Customer values are omitted. Shell entries are repeated for standalone reading. Visible list rows are numbered top-to-bottom. No data or preference was changed.

| No. | Location | Control | Purpose / state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Under page title | All Contacts | Current list view selector; never changed |
| 49 | Beside current view | Ellipsis | View actions; not opened |
| 50 | List toolbar left | Filter | Filter visibility; never toggled |
| 51 | List toolbar left | Sort | Sort entry; never changed |
| 52 | List toolbar middle | List icon | View preference control; never activated |
| 53 | List toolbar middle | Split icon | View preference control; never activated |
| 54 | List toolbar middle | Table icon | View preference control; never activated |
| 55 | List toolbar middle | Chart icon | View preference control; never activated |
| 56 | List toolbar middle | Board icon | View preference control; never activated |
| 57 | List toolbar middle | Tile icon | View preference control; never activated |
| 58 | List toolbar middle | View options icon | View preference control; never activated |
| 59 | List toolbar after view options | Refresh | Reload affordance; not activated |
| 60 | List toolbar right | Create Contact | Creation entry; not activated |
| 61 | Beside Create | Create chevron | Creation options; not activated |
| 62 | List toolbar far right | Actions | Opens menu |
| 63 | Filter panel top | Search | Search available fields; no input |
| 64 | Filter panel | System Defined Filters chevron | Section visibility; never toggled |
| 65 | Filter panel system section | Activities | Filter checkbox; not selected |
| 66 | Filter panel system section | Campaigns | Filter checkbox; not selected |
| 67 | Filter panel system section | Latest Email Status | Filter checkbox; not selected |
| 68 | Filter panel system section | Locked | Filter checkbox; not selected |
| 69 | Filter panel system section | Record Action | Filter checkbox; not selected |
| 70 | Filter panel system section | Related Records Action | Filter checkbox; not selected |
| 71 | Filter panel system section | Touched Records | Filter checkbox; not selected |
| 72 | Filter panel system section | Untouched Records | Filter checkbox; not selected |
| 73 | Filter panel system section | Cadences | Filter checkbox; not selected |
| 74 | Filter panel lower section | Filter By Fields chevron | Section visibility; never toggled |
| 75 | Filter panel visible field rows | Account Name | Field filter checkbox; not selected |
| 76 | Filter panel visible field rows | Assistant | Field filter checkbox; not selected |
| 77 | Filter panel visible field rows | Asst Phone | Field filter checkbox; not selected |
| 78 | Filter panel visible field rows | Connected To | Field filter checkbox; not selected |
| 79 | Filter panel visible field rows | Contact Name | Field filter checkbox; not selected |
| 80 | Table header left | Select all checkbox | Batch selection; not activated |
| 81 | Primary name column header | All dropdown | Record name scope affordance; not changed |
| 82 | Table far right header | Column settings icon | Column preference; never activated |
| 83 | Table visible row 1 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 84 | Table visible row 1 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 85 | Table visible row 1 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 86 | Table visible row 1 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 87 | Table visible row 2 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 88 | Table visible row 2 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 89 | Table visible row 2 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 90 | Table visible row 2 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 91 | Table visible row 3 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 92 | Table visible row 3 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 93 | Table visible row 3 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 94 | Table visible row 3 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 95 | Table visible row 4 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 96 | Table visible row 4 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 97 | Table visible row 4 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 98 | Table visible row 4 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 99 | Table visible row 5 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 100 | Table visible row 5 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 101 | Table visible row 5 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 102 | Table visible row 5 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 103 | Table visible row 6 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 104 | Table visible row 6 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 105 | Table visible row 6 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 106 | Table visible row 6 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 107 | Table visible row 7 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 108 | Table visible row 7 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 109 | Table visible row 7 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 110 | Table visible row 7 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 111 | Table visible row 8 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 112 | Table visible row 8 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 113 | Table visible row 8 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 114 | Table visible row 9 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 115 | Table visible row 9 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 116 | Table visible row 9 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 117 | Table visible row 10 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 118 | Table visible row 10 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 119 | Table visible row 10 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 120 | Table visible row 11 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 121 | Table visible row 11 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 122 | Table visible row 11 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 123 | Table visible row 12 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 124 | Table visible row 12 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 125 | Table visible row 12 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 126 | Table visible row 12 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 127 | Table visible row 12 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 128 | Table visible row 13 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 129 | Table visible row 13 | Activity badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 130 | Table visible row 13 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 131 | Table visible row 13 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 132 | Table visible row 13 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 133 | Table visible row 14 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 134 | Table visible row 14 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 135 | Table visible row 14 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 136 | Table visible row 14 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 137 | List footer right | Previous page | Pagination; not activated |
| 138 | List footer right | Next page | Pagination; not activated |
| 139 | Open Actions menu, top-to-bottom | Mass Transfer | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 140 | Open Actions menu, top-to-bottom | Mass Delete | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 141 | Open Actions menu, top-to-bottom | Mass Update | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 142 | Open Actions menu, top-to-bottom | Manage Tags | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 143 | Open Actions menu, top-to-bottom | Drafts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 144 | Open Actions menu, top-to-bottom | Mass Email | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 145 | Open Actions menu, top-to-bottom | Approve Contacts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 146 | Open Actions menu, top-to-bottom | Deduplicate Contacts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 147 | Open Actions menu, top-to-bottom | Add to Campaigns | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 148 | Open Actions menu, top-to-bottom | Create Client Script | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 149 | Open Actions menu, top-to-bottom | Export Contacts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 150 | Open Actions menu, top-to-bottom | Spreadsheet view | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 151 | Open Actions menu, top-to-bottom | Print View | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 152 | Print submenu top | Print Default view | Print action; never activated |
| 153 | Print submenu bottom | Print Using Canvas | Print action; never activated |

Some filter items are clipped by the viewport; their labels are corroborated by accessibility evidence. Column field labels are non-interactive headings. Toolbar icon view names describe shapes; exact tooltips are unverified and no view changes were attempted.


## m6-accounts-print-menu

### Numbered control inventory

Capture: `m6-accounts-print-menu`. Customer values are omitted. Shell entries are repeated for standalone reading. Visible list rows are numbered top-to-bottom. No data or preference was changed.

| No. | Location | Control | Purpose / state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Under page title | All Accounts | Current list view selector; never changed |
| 49 | Beside current view | Ellipsis | View actions; not opened |
| 50 | List toolbar left | Filter | Filter visibility; never toggled |
| 51 | List toolbar left | Sort | Sort entry; never changed |
| 52 | List toolbar middle | List icon | View preference control; never activated |
| 53 | List toolbar middle | Split icon | View preference control; never activated |
| 54 | List toolbar middle | Table icon | View preference control; never activated |
| 55 | List toolbar middle | Chart icon | View preference control; never activated |
| 56 | List toolbar middle | Board icon | View preference control; never activated |
| 57 | List toolbar middle | Tile icon | View preference control; never activated |
| 58 | List toolbar middle | View options icon | View preference control; never activated |
| 59 | List toolbar after view options | Refresh | Reload affordance; not activated |
| 60 | List toolbar right | Create Account | Creation entry; not activated |
| 61 | Beside Create | Create chevron | Creation options; not activated |
| 62 | List toolbar far right | Actions | Opens menu |
| 63 | Filter panel top | Search | Search available fields; no input |
| 64 | Filter panel | System Defined Filters chevron | Section visibility; never toggled |
| 65 | Filter panel system section | Activities | Filter checkbox; not selected |
| 66 | Filter panel system section | Locked | Filter checkbox; not selected |
| 67 | Filter panel system section | Record Action | Filter checkbox; not selected |
| 68 | Filter panel system section | Related Records Action | Filter checkbox; not selected |
| 69 | Filter panel system section | Touched Records | Filter checkbox; not selected |
| 70 | Filter panel system section | Untouched Records | Filter checkbox; not selected |
| 71 | Filter panel system section | Cadences | Filter checkbox; not selected |
| 72 | Filter panel lower section | Filter By Fields chevron | Section visibility; never toggled |
| 73 | Filter panel visible field rows | Account Name | Field filter checkbox; not selected |
| 74 | Filter panel visible field rows | Account Number | Field filter checkbox; not selected |
| 75 | Filter panel visible field rows | Account Owner | Field filter checkbox; not selected |
| 76 | Filter panel visible field rows | Account Site | Field filter checkbox; not selected |
| 77 | Filter panel visible field rows | Account Type | Field filter checkbox; not selected |
| 78 | Filter panel visible field rows | Annual Revenue | Field filter checkbox; not selected |
| 79 | Filter panel visible field rows | Billing Address | Field filter checkbox; not selected |
| 80 | Filter panel visible field rows | Billing Address - City | Field filter checkbox; not selected |
| 81 | Table header left | Select all checkbox | Batch selection; not activated |
| 82 | Primary name column header | All dropdown | Record name scope affordance; not changed |
| 83 | Table far right header | Column settings icon | Column preference; never activated |
| 84 | Table visible row 1 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 85 | Table visible row 1 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 86 | Table visible row 1 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 87 | Table visible row 1 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 88 | Table visible row 2 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 89 | Table visible row 2 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 90 | Table visible row 2 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 91 | Table visible row 2 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 92 | Table visible row 3 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 93 | Table visible row 3 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 94 | Table visible row 3 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 95 | Table visible row 4 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 96 | Table visible row 4 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 97 | Table visible row 4 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 98 | Table visible row 4 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 99 | Table visible row 5 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 100 | Table visible row 5 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 101 | Table visible row 5 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 102 | Table visible row 6 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 103 | Table visible row 6 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 104 | Table visible row 7 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 105 | Table visible row 7 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 106 | Table visible row 7 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 107 | Table visible row 8 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 108 | Table visible row 8 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 109 | Table visible row 8 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 110 | Table visible row 9 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 111 | Table visible row 9 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 112 | Table visible row 9 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 113 | Table visible row 9 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 114 | Table visible row 10 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 115 | Table visible row 10 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 116 | Table visible row 10 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 117 | Table visible row 10 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 118 | Table visible row 11 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 119 | Table visible row 11 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 120 | Table visible row 11 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 121 | Table visible row 12 | Notes badge | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 122 | Table visible row 12 | Row selection checkbox | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 123 | Table visible row 12 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 124 | Table visible row 12 | Record or field link (value omitted) | Navigation/selection affordance; not activated; source controls.json and screenshot |
| 125 | Beside All Accounts | All Locked Accounts | Additional view tab; not selected |
| 126 | List footer right | Previous page | Pagination; not activated |
| 127 | List footer right | Next page | Pagination; not activated |
| 128 | Open Actions menu, top-to-bottom | Mass Transfer | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 129 | Open Actions menu, top-to-bottom | Mass Delete | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 130 | Open Actions menu, top-to-bottom | Mass Update | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 131 | Open Actions menu, top-to-bottom | Manage Tags | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 132 | Open Actions menu, top-to-bottom | Drafts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 133 | Open Actions menu, top-to-bottom | Deduplicate Accounts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 134 | Open Actions menu, top-to-bottom | Create Client Script | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 135 | Open Actions menu, top-to-bottom | Export Accounts | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 136 | Open Actions menu, top-to-bottom | Spreadsheet view | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 137 | Open Actions menu, top-to-bottom | Print View | Navigation/menu affordance; only safe research entries opened; no operation executed |
| 138 | Print submenu top | Print Default view | Print action; never activated |
| 139 | Print submenu bottom | Print Using Canvas | Print action; never activated |

Some filter items are clipped by the viewport; their labels are corroborated by accessibility evidence. Column field labels are non-interactive headings. Toolbar icon view names describe shapes; exact tooltips are unverified and no view changes were attempted.


## m6-leads-detail

### Numbered control inventory

Capture: `m6-leads-detail`. Sources: screenshot.png, aria.yml, controls.json. Record values and portrait are not copied. No tag chip is visible; this does not establish populated-tag appearance.

| No. | Position | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Top left | Application selector | Opens application selection; not exercised |
| 2 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| 3 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| 4 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| 5 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| 6 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| 7 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| 8 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| 9 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| 10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| 11 | Below teamspace selector | Search | Module navigation search; no input |
| 12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| 13 | Left sidebar, Sales | Leads | Module navigation |
| 14 | Left sidebar, Sales | Contacts | Module navigation |
| 15 | Left sidebar, Sales | Accounts | Module navigation |
| 16 | Left sidebar, Sales | Deals | Module navigation |
| 17 | Left sidebar, Sales | Documents | Module navigation |
| 18 | Left sidebar, Sales | Campaigns | Module navigation |
| 19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| 20 | Left sidebar, Activities | Tasks | Module navigation |
| 21 | Left sidebar, Activities | Meetings | Module navigation |
| 22 | Left sidebar, Activities | Calls | Module navigation |
| 23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| 24 | Left sidebar, Integrations | Visits | Module navigation |
| 25 | Left sidebar, lower edge | Price Books | Module navigation |
| 26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Record header left | Back arrow | Return to list |
| 49 | Below record identity | Add Tags | Tag entry; no existing chip is visible |
| 50 | Record header right | Send Email | Email action; never activated |
| 51 | Record header right | Convert | Conversion action; never activated |
| 52 | Record header right | Edit | Edit action; never activated |
| 53 | Record header right | More Options | Record action menu entry |
| 54 | Record header far right | Previous record | Navigation; not activated |
| 55 | Record header far right | Next record | Navigation; not activated |
| 56 | Related List rail | Notes | Section navigation; not activated |
| 57 | Related List rail | Connected Records | Section navigation; not activated |
| 58 | Related List rail | Cadences | Section navigation; not activated |
| 59 | Related List rail | Attachments | Section navigation; not activated |
| 60 | Related List rail | Products | Section navigation; not activated |
| 61 | Related List rail | Open Activities | Section navigation; not activated |
| 62 | Related List rail | Closed Activities | Section navigation; not activated |
| 63 | Related List rail | Invited Meetings | Section navigation; not activated |
| 64 | Related List rail | Emails | Section navigation; not activated |
| 65 | Related List rail | Campaigns | Section navigation; not activated |
| 66 | Related List rail | Social | Section navigation; not activated |
| 67 | Related List rail | Voice of the Customer | Section navigation; not activated |
| 68 | Related List rail bottom | Add Related List | Customization entry; never activated |
| 69 | Links rail | Add Link | Creation entry; never activated |
| 70 | Content top left | Rail visibility icon | Visibility preference; never activated |
| 71 | Content top tabs | Overview | Selected |
| 72 | Content top tabs | Timeline | History navigation; not activated |
| 73 | Status strip left | Left chevron | Strip navigation; not activated |
| 74 | Status strip | Contact in Future (clipped) | Status action; never activated |
| 75 | Status strip | Contacted | Status action; never activated |
| 76 | Status strip | Junk Lead | Status action; never activated |
| 77 | Status strip | Current status dropdown | Status action; never activated |
| 78 | Status strip | Not Contacted | Status action; never activated |
| 79 | Status strip | Pre-Qualified | Status action; never activated |
| 80 | Status strip | Not Qualified | Status action; never activated |
| 81 | Status strip right | Right chevron | Strip navigation; not activated |
| 82 | Status strip far right | Negative status dropdown | Status action; never activated |
| 83 | Business card | Email link | Mail action; never activated; address omitted |
| 84 | Business card phone row | Call icon | Calling action; never activated |
| 85 | Business card mobile row | Call icon | Calling action; never activated |
| 86 | Details section header | Hide Details | Visibility preference; never activated |
| 87 | Details lower phone field | Call icon | Calling action; never activated |
| 88 | Details lower email field (clipped) | Email link | Mail action; never activated; address omitted |

Eight automatic requests were blocked. Passed non-GET paths and per-path counts match the inherited `w2f-detail-more` baseline. No record action or preference control was activated.


## m6-recycle-bin

### Numbered control inventory

Capture: `m6-recycle-bin`. Sources: screenshot.png, aria.yml, controls.json.
Each number denotes one visible control surface; record values are omitted.
No Restore, Delete, Empty or selection control was activated.

| No. | Position | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Settings sidebar top | Setup Home / back | Navigation/search affordance; no preference changed |
| 2 | Settings sidebar top | Setup customization icon | Navigation/search affordance; no preference changed |
| 3 | Settings sidebar top | Search settings | Navigation/search affordance; no preference changed |
| 4 | Settings sidebar, visible top-to-bottom | Connected Workflow | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 5 | Settings sidebar, visible top-to-bottom | Experience Center chevron | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 6 | Settings sidebar, visible top-to-bottom | Signals | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 7 | Settings sidebar, visible top-to-bottom | CommandCenter | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 8 | Settings sidebar, visible top-to-bottom | Segmentation | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 9 | Settings sidebar, visible top-to-bottom | Data Administration chevron | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 10 | Settings sidebar, visible top-to-bottom | Import | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 11 | Settings sidebar, visible top-to-bottom | Export | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 12 | Settings sidebar, visible top-to-bottom | Data Backup | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 13 | Settings sidebar, visible top-to-bottom | Remove sample data | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 14 | Settings sidebar, visible top-to-bottom | Storage | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 15 | Settings sidebar, visible top-to-bottom | Recycle Bin | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 16 | Settings sidebar, visible top-to-bottom | Admin Tools | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 17 | Settings sidebar, visible top-to-bottom | Sandbox | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 18 | Settings sidebar, visible top-to-bottom | Copy Customization | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 19 | Settings sidebar, visible top-to-bottom | Marketplace chevron | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 20 | Settings sidebar, visible top-to-bottom | All extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 21 | Settings sidebar, visible top-to-bottom | Reference provider extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 22 | Settings sidebar, visible top-to-bottom | Google extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 23 | Settings sidebar, visible top-to-bottom | Microsoft extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 24 | Settings sidebar, visible top-to-bottom | Extension Builder | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 25 | Settings sidebar, visible top-to-bottom | Facebook | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 26 | Settings sidebar, visible top-to-bottom | LinkedIn (clipped) | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header right | Help | Help navigation; not opened |
| 49 | Toolbar left | Restore | Not marked disabled; never pressed |
| 50 | Toolbar left after Restore | Delete | Not marked disabled; never pressed |
| 51 | Toolbar far right | Empty Recycle Bin | Not marked disabled; never pressed |
| 52 | Table header first column | Select all checkbox | Unchecked; never selected |
| 53 | Table header far right | Search funnel | Panel affordance; never activated because persistence is unknown |
| 54 | Table row 1 | Selection checkbox | Unchecked; row values intentionally omitted |
| 55 | Table row 2 | Selection checkbox | Unchecked; row values intentionally omitted |
| 56 | Table row 3 | Selection checkbox | Unchecked; row values intentionally omitted |
| 57 | Table row 4 | Selection checkbox | Unchecked; row values intentionally omitted |
| 58 | Table row 5 | Selection checkbox | Unchecked; row values intentionally omitted |
| 59 | Table row 6 | Selection checkbox | Unchecked; row values intentionally omitted |
| 60 | Table row 7 | Selection checkbox | Unchecked; row values intentionally omitted |
| 61 | Table row 8 | Selection checkbox | Unchecked; row values intentionally omitted |
| 62 | Table row 9 | Selection checkbox | Unchecked; row values intentionally omitted |
| 63 | Table row 10 (clipped at bottom) | Selection checkbox | Unchecked; row values intentionally omitted |
| 64 | Content right edge | Vertical scroll container | Independent scroll area; no sort or preference changes |

Non-interactive content: title, explanatory retention/permission notices, displayed range/count, and table headers Name / Type / Deleted By / Deleted Time. Controls reported below the visible scroll area are not asserted visible. Four automatic requests were blocked: reminder/status and telemetry; no action was attempted.


## m6-recycle-bin-search-cached

### Numbered control inventory

Capture: `m6-recycle-bin-search-cached`. Sources: step-1.png, step-1.yml, controls.json and meta.json.
The shell entries retain their preceding inventory numbers; seven record checkboxes are visible in this expanded state.
Each number denotes one visible control surface; record values are omitted.
No Restore, Delete, Empty or selection control was activated.

| No. | Position | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Settings sidebar top | Setup Home / back | Navigation/search affordance; no preference changed |
| 2 | Settings sidebar top | Setup customization icon | Navigation/search affordance; no preference changed |
| 3 | Settings sidebar top | Search settings | Navigation/search affordance; no preference changed |
| 4 | Settings sidebar, visible top-to-bottom | Connected Workflow | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 5 | Settings sidebar, visible top-to-bottom | Experience Center chevron | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 6 | Settings sidebar, visible top-to-bottom | Signals | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 7 | Settings sidebar, visible top-to-bottom | CommandCenter | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 8 | Settings sidebar, visible top-to-bottom | Segmentation | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 9 | Settings sidebar, visible top-to-bottom | Data Administration chevron | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 10 | Settings sidebar, visible top-to-bottom | Import | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 11 | Settings sidebar, visible top-to-bottom | Export | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 12 | Settings sidebar, visible top-to-bottom | Data Backup | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 13 | Settings sidebar, visible top-to-bottom | Remove sample data | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 14 | Settings sidebar, visible top-to-bottom | Storage | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 15 | Settings sidebar, visible top-to-bottom | Recycle Bin | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 16 | Settings sidebar, visible top-to-bottom | Admin Tools | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 17 | Settings sidebar, visible top-to-bottom | Sandbox | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 18 | Settings sidebar, visible top-to-bottom | Copy Customization | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 19 | Settings sidebar, visible top-to-bottom | Marketplace chevron | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 20 | Settings sidebar, visible top-to-bottom | All extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 21 | Settings sidebar, visible top-to-bottom | Reference provider extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 22 | Settings sidebar, visible top-to-bottom | Google extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 23 | Settings sidebar, visible top-to-bottom | Microsoft extensions | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 24 | Settings sidebar, visible top-to-bottom | Extension Builder | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 25 | Settings sidebar, visible top-to-bottom | Facebook | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 26 | Settings sidebar, visible top-to-bottom | LinkedIn (clipped) | Navigation entry; only Recycle Bin opened; chevrons not toggled and operations never executed |
| 27 | Top bar | Search records | Global record search; no input |
| 28 | Top bar, after search | Plus | Global creation entry; never activated |
| 29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| 30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| 31 | Top bar, utility group | Calendar | Calendar navigation |
| 32 | Top bar, utility group | Marketplace | Extensions navigation |
| 33 | Top bar, utility group | Setup | Settings navigation |
| 34 | Top bar, utility group | Profile | Profile menu |
| 35 | Top right | Applications menu | Application launcher |
| 36 | Bottom left dock | My Pins | Dock entry; not activated |
| 37 | Bottom left dock | Chats | Dock entry; not activated |
| 38 | Bottom left dock | Contacts | Dock entry; not activated |
| 39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 40 | Bottom right dock | Announcements | Named utility entry; not activated |
| 41 | Bottom right dock | Motivator | Named utility entry; not activated |
| 42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| 43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| 44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| 45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| 46 | Bottom right dock | Help | Named utility entry; not activated |
| 47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| 48 | Content header right | Help | Help navigation; not opened |
| 49 | Toolbar left | Restore | Not marked disabled; never pressed |
| 50 | Toolbar left after Restore | Delete | Not marked disabled; never pressed |
| 51 | Toolbar far right | Empty Recycle Bin | Not marked disabled; never pressed |
| 52 | Table header first column | Select all checkbox | Unchecked; never selected |
| 53 | Table header far right | Search funnel | Opened once under the approved exception; inline initial state only |
| 54 | Table row 1 | Selection checkbox | Unchecked; row values intentionally omitted |
| 55 | Table row 2 | Selection checkbox | Unchecked; row values intentionally omitted |
| 56 | Table row 3 | Selection checkbox | Unchecked; row values intentionally omitted |
| 57 | Table row 4 | Selection checkbox | Unchecked; row values intentionally omitted |
| 58 | Table row 5 | Selection checkbox | Unchecked; row values intentionally omitted |
| 59 | Table row 6 | Selection checkbox | Unchecked; row values intentionally omitted |
| 60 | Table row 7 (clipped at bottom) | Selection checkbox | Unchecked; row values intentionally omitted |
| 64 | Content right edge | Vertical scroll container | Independent scroll area; no sort or preference changes |

Non-interactive content: title, explanatory retention/permission notices, displayed range/count, and table headers Name / Type / Deleted By / Deleted Time. Controls reported below the visible scroll area are not asserted visible. Four automatic requests were blocked: reminder/status and telemetry; no action was attempted.

#### Added inline search controls

| No. | Position | Control | Initial state |
| --- | --- | --- | --- |
| 65 | Name, operator row | Operator combobox | contains |
| 66 | Name, value row | Empty textbox | No input |
| 67 | Type, operator row | Operator combobox | is |
| 68 | Type, value row | Type combobox | Select; choices not opened |
| 69 | Deleted By, operator row | Operator combobox | contains |
| 70 | Deleted By, value row | Empty textbox | No input |
| 71 | Deleted Time, operator row | Operator combobox | is |
| 72 | Deleted Time, value row | Date textbox | DD.MM.YYYY; empty |
| 73 | After date textbox | Time textbox | 01:00 with AM indicator |
| 74 | Operator row far right | Search button | Visible; never pressed |

Ready passed, cache enabled, one click and Escape completed, no skipped step or visible dialog after close. Four automatic reminder/status and telemetry POSTs blocked. No option selection, input or search submission. Two pages remained and the lock was released. No tab was closed by the analyst.


## m6-leads-add-tags-v2 — initial popover

Observed on 2026-10-17 from `step-2.png` and `step-2.yml`. The final screenshot
is after Escape; use the step evidence for the opening. Existing record-header
and shared-shell inventories above apply to the unchanged surrounding surface.
No record values or images are reproduced here.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Under record identity, popover top | Enter Tags combobox / textbox | Empty, focused; no suggestions visible; no input |
| 2 | Popover bottom right | Cancel | Enabled-looking dismissal affordance; not clicked |
| 3 | Popover bottom right, after Cancel | Save | Disabled; never clicked |

The tag glyph is decorative. There is no visible close icon or dim backdrop.
Escape was pressed. All three requested steps completed, ready passed, one CDP
attach; 19 blocked background POST requests, zero print calls and zero window
requests. MEP-787 accepted all 19 as baseline background traffic and accepted
this opening. The original stop was correctly applied; it is now resolved.
No Add Tags retry is allowed. Subsequent evidence is recorded below.


## m6-leads-detail-more — record action menu

Observed on 2026-10-17 from `step-2.png`, `step-2.yml`, `controls.json`
and `meta.json`. The menu is anchored beneath More Options, above record
content. Existing shared shell, record header and related-list inventories
apply to the surrounding screen; no surrounding control was changed.
The following numbers cover every visible menu entry, from top to bottom.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Menu first group | Clone | Duplicate record entry; never activated |
| 2 | After Clone | Share | Opens initial sharing state; separate capture below |
| 3 | After Share | Delete | Destructive entry; never activated |
| 4 | After separator | Print Preview | Preview entry; separate bounded capture |
| 5 | After preview | Find and Merge Duplicates | Duplicate-resolution entry; not activated |
| 6 | Next row | Mail Merge | Document action entry; not activated |
| 7 | After second separator | Run Macro | Automation entry; never activated |
| 8 | Next row | Customize Business Card | Preference action; never activated |
| 9 | Next row | Organize Lead Details | Layout action; never activated |
| 10 | Next row | Add Related List | Layout action; never activated |
| 11 | Next row | Review History | History entry; not activated |
| 12 | Next row | Enroll to Cadence | Enrollment action; never activated |
| 13 | Next row | Add Kiosk | Configuration action; never activated |
| 14 | Next row | Create Button | Configuration action; never activated |
| 15 | Menu last row | Create Client Script | Configuration action; never activated |

Ready passed; both clicks completed; one CDP attach. Nineteen POSTs were
blocked: sixteen telemetry and three non-telemetry paths, each occurring once,
matching the detail baseline. No unexpected blocked path or new unblocked
non-GET request. Zero print calls, window requests, downloads or file choosers.
No field input or submission. Share and Print Preview selectors were exported
uniquely by the capture tool.


## m6-leads-share-v2 — initial sharing modal

Observed on 2026-10-17 from `step-3.png`, `step-3.yml` and `meta.json`.
A centered modal at the top of the viewport overlays a dimmed record detail.
The title is Sharing Lead; the background shell and record controls are inert
while it is open. The shared shell and record-header inventories above describe
that unchanged background. The following inventory covers all visible modal
controls; no close icon was visible in this captured viewport.

| No. | Location | Control | Purpose / initial state |
| --- | --- | --- | --- |
| 1 | Title row right | Help icon | Help affordance; not opened |
| 2 | Record access type row | Private radio | Checked; not changed |
| 3 | After Private | Public radio | Unchecked; not changed |
| 4 | Next row left | Add members textbox | Empty; no member search or selection |
| 5 | Same row right | Access combobox | Full Access; options not opened |
| 6 | Below member row | With Related list checkbox | Unchecked; never toggled |
| 7 | Beside related-list label | Information icon | Tooltip not inspected |
| 8 | Footer right | Cancel | Enabled; not clicked; Escape used |
| 9 | After Cancel | Share | Disabled in accessibility evidence; never submitted |

Ready passed; record link, More and Share clicks completed, then Escape.
One CDP attach; no skipped steps or visible dialog after close. Twenty-one
background POSTs were blocked: eighteen telemetry plus the three baseline
non-telemetry paths, each once. No unexpected blocked path or new unblocked
non-GET request. Zero print calls/window requests/downloads/file choosers.
No input, recipient, access-level, related-list or preference change.

## Earlier continuation preflight

After Share completed, one-minute load was 101.77 (approved limit 50).
Print Preview and independent Print Default view were not started. Neither
approved attempt is consumed. Other module initial dialogs and filter details
remain unobserved. Existing completed captures must not be repeated.


## m6-leads-print-preview-v2 — guarded attempt, no destination

Observed on 2026-10-17. This capture establishes no Print Preview state.
Ready passed; record link and More Options clicks completed, then the exported
Print Preview control was skipped by the dangerous-attribute guard. The visible
state remains the record action menu inventoried under `m6-leads-detail-more`.
There are no newly observed destination controls to number. The permitted
attempt is consumed; the skipped step requires Platform Lead review, despite
capture exit zero. No alternate selector or retry was attempted.

Preflight: load 9.60, lock absent, two page targets; single CDP attach. Eighteen
blocked POSTs (fifteen telemetry; each of the three detail-baseline requests once).
No unexpected blocked request or new unblocked non-GET request; zero print calls,
window requests, popups, downloads and file choosers. No input or preference change.


## m6-leads-print-default-v2 — guarded new-window request

Observed on 2026-10-17 from step screenshots, accessibility snapshots and
metadata. The existing Print View submenu inventory applies to steps 1–2;
the final screenshot is the original Leads list with menus closed. Shared shell
inventory and the list inventory in [leads.md](leads.md) apply to that background.
No destination surface was visible, so no destination controls can be numbered.
The controls exercised in this attempt are:

| No. | Location | Control | Observed behaviour |
| --- | --- | --- | --- |
| 1 | List toolbar upper right | Actions | Opens module menu |
| 2 | Actions menu bottom | Print View | Hover opens submenu |
| 3 | Submenu top | Print Default view | Click requests another window; capture refuses it |

Ready passed; all three steps completed; single CDP attach. Preflight load 9.87,
no lock, two page targets. Fifteen blocked POSTs: thirteen telemetry and each of
two list-baseline legacy requests once. No unexpected blocked request or new
unblocked non-GET request. One window request refused, zero print calls, popups,
downloads and file choosers. No target navigation, input or preference change.
Both approved print attempts are now consumed. Print Preview needs guard review;
Print Default view needs a decision about destination inspection. Neither target
layout is inferred from the originating page or recorded address.
