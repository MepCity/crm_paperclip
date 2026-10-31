# Internal chat panel

Research: MEP-1413, 2026-10-31 (Istanbul). Scope: the CRM's embedded internal
messaging surface. This is an evidence-bounded functional specification, not an
approved architecture or a claim that all requested states were observable.

## Purpose and evidence boundary

The requested product supports conversations between users in the same
organization, channels, threads, pins, unread tracking and presence. The current
reference session exposes only three footer entries and empty conversation and
contact lists. Channels and Threads are not visible footer entries. A channel
creation entry is visually unavailable beneath an external messaging-service
access notice. Do not silently substitute these restrictions for the requested
product scope, or invent populated screens from the empty-state evidence.

Only the capture tool was used. No messages, invitations, reactions, pins,
channels or users were created or changed. No presence/status selection,
intentional read/unread mutation or settings change was performed. All names,
addresses and organization values are omitted; use `Current user` and
`Organization user` in implementation examples. Reference screenshots and raw
capture files stay in the local research workspace and must not be committed or
uploaded to the task.

## Layout and shared control inventory

The panel overlays the lower-left CRM content above the footer; it does not
replace the main CRM page. The footer remains visible underneath it. Mixed
English/Turkish labels occur in the same panel. Positions below describe the
captured state rather than a responsive-layout contract.

All controls in this section belong to the chat module, hosted by the app shell.
The underlying CRM navigation, list controls and right-side utility strip belong
to their existing modules; opening chat leaves them visible in the background.
Sources: `chat-shell`, `chat-chats`, `chat-contacts`, `chat-pins`.

| ID | Position / control | Observed behavior or research limit |
| --- | --- | --- |
| 1 | Footer, left: My Pins / İşaretlemelerim, pin icon | Opens the empty pinned-chat list; this is navigation, not a pin operation. |
| 2 | Footer, middle: Chats / Sohbetler, chat icon | Opens Recent conversations. Selected footer entry is highlighted. |
| 3 | Footer, right: Contacts / Kişiler, people icon | Opens the contact list, initially Frequents. These are messaging contacts, not CRM contact records. |
| 4 | Header, left: avatar and Current user | Displays the signed-in user's identity. No profile editing inspected. |
| 5 | Header, below name: presence dot, Available and caret | Current user has a green dot and Available label. Menu was not opened; status changes need immediate logged restoration within the authorized window. |
| 6 | Header, right: diagonal arrows, accessible name Enlarge | Maximize affordance. Not activated because preference persistence is unverified and layout preference writes are forbidden. |
| 7 | Header, far right: X, accessible name Minimize | Panel dismissal affordance; despite X artwork, accessibility calls it Minimize. Not activated. |
| 8 | Below header, left: Search (Ctrl + Space), magnifier | Editable search field; shortcut is advertised, not exercised. No text was entered. |
| 9 | Inside search field, right: Advanced search, sliders | Search options affordance; separate state documented below. |
| 10 | Beside search: @, Mentions | Opens the mentions reading surface; not a message reaction. |
| 11 | Far right of search row: outline star, Starred Messages | Opens the starred-message reading surface; not a star/unstar action. |
| 12 | Under search, left tab | Recent for Chats; Frequents with heart and dropdown for Contacts; My Pins for Pins. Selected state is visibly highlighted. |
| 13 | Under search, right tab: Unread / Okunmamış | Selects the unread list. No explicit mark-read operation was used. |
| 14 | Body | Empty-state illustration and explanation; content depends on selected destination/tab. No real conversation rows were visible. |
| 15 | Panel bottom-right: circular +, Quick Actions | Opens an overlaid action menu and becomes an X while that menu is open. |

## Captured states and additional controls

### Chats and unread

Sources: `chat-chats`, `chat-unread`. Shared controls 1–15 remain present.
Recent is initially selected. The empty Recent body explains that conversations
with people and teams appear here and points toward people/channels. This does
not prove a channel entry exists in this session. Selecting Unread shows an
illustration and `No unread chats`. No numeric badge was visible on the footer
or tabs. No row, timestamp, message preview, populated unread badge or incoming
message was observed.

### Contacts

Source: `chat-contacts`. Shared controls 1–15 remain present; control 12 is
Frequents and contains the additional control below.

16. At the right edge of Frequents, a downward caret button opens the contact
    category menu. The default contact list is empty. Its explanation directs
    the user to enter an email address in the search box to invite a user.

Source `chat-contact-categories` captures this menu: Frequents with heart and
selected checkmark above Recent with clock. Neither option was selected in this
menu; category preference persistence is unverified.

Frequent/recent membership, user ordering, contact availability and email-search
results cannot be inferred from this empty list. No address was entered.

### My Pins

Source: `chat-pins`. Shared controls 1–15 remain present; control 12 is My Pins.
The body explains that favorite chats can be kept at hand and adds:

17. Centered beneath the empty-state explanation: `+Add Chats`. It is a button
    for starting pinned-chat selection. Opening the picker is documented
    separately; no chat was selected or pinned.

### Quick Actions

Source: `chat-quick-actions`. The panel is dimmed behind an inset menu. Controls
1–15 remain in the background. Menu ordering is top to bottom:

18. Menu header: Quick Actions.
19. An unnamed textbox appears in the accessibility/control output; no visible
    search field is discernible in the screenshot. No text entry tested.
20. Send a Direct Message, speech-bubble-plus icon: new direct-message entry;
    opening was refused by the capture tool's send guard (`chat-direct-start`,
    step 3 skipped). No alternative selector or guard bypass was attempted.
21. Start a Group Conversation, connected-people icon: group conversation entry.
22. Invite People, person-plus icon: opens the initial external-user invitation
    dialog (see below).
23. Make a Call, phone icon: visible; not activated (calling is outside scope).
24. External messaging-service access notice/link: separates the lower feature
    group. Not followed; no account or service was connected.
25. Create a Channel, hash icon: gray in the screenshot under the notice.
26. Meet Now, video icon and right caret: gray; not activated.
27. Schedule Meeting, calendar icon: gray; not activated.
28. Schedule Live Event, broadcast icon: gray; not activated.

The control inventory reports the lower items with `aria-disabled=false`, even
though their screenshot treatment is gray beneath the service-access notice.
Record this accessibility/visual discrepancy; do not claim a verified enabled
channel-creation flow. A subsequent safe opening attempt is documented below; no access restriction was bypassed.

### Invitation dialog

Source: `chat-invite`. Opens through Chats → Quick Actions → Invite People.
The CRM and chat panel are dimmed behind a centered dialog.

29. Top-left dialog title: Invite External User. This is explicitly external
    invitation UI, not evidence that cross-organization messaging belongs in our
    requested internal-only product.
30. Top-right X: close affordance; its accessible name is an icon glyph.
31. Body: Email Address label and one textbox, placeholder Enter email id here.
32. Below input: informational notice that an invitation shares the inviter's
    identity, profile and location information with the recipient (paraphrased).
33. Footer, left of primary action: Cancel / İptal.
34. Footer, right: Send Invites. Visible but never pressed, including with an
    empty field. Required-field, invalid-address, duplicate, permission, success
    and server-error behavior remain unknown.

`chat-invite-cancel` repeats the opening and then presses İptal with the field
untouched: the dialog disappears and the docked Recent panel remains. Its step
3 screenshot preserves the open dialog and step 4 preserves the cancellation.

### Mentions and starred messages

Sources: `chat-mentions`, `chat-starred`. Both open a large modal over a dimmed,
blurred CRM background. These are separate reading dialogs, not the maximized
chat-panel state. A technical-error notification appears above both dialogs.

35. Mentions header, left: title.
36. Beside title: unchecked Hide @all, @available mentions checkbox. Untouched;
    persistence unknown.
37. Next checkbox: Show Unread Mentions, unchecked. Untouched.
38. Header action: Mark all as read, visually muted. Never activated.
39. Header, far right: X close button with glyph accessible name. Untouched.
40. Mentions body: illustration and explanation that mentions/tags will appear
    here; no result rows. Accessibility also exposes another glyph button and
    Go to Message, but neither is visible in the screenshot's empty body; do
    not render those as visible empty-state actions from this evidence.
41. Starred Messages header: title and far-right X. No message rows observed;
    body remains on a spinner while the technical-error alert is visible.
42. Top notification: red error icon, a retry-later technical-failure message
    (paraphrased) and right-hand X. No retry control is visible. Not dismissed.

The captures establish a failure state, not a successful empty starred list.
No causal link between the alert and any blocked request is established.

### Advanced search

Source: `chat-advanced-search`. Opens a broad overlay with a top search bar,
left filter column and right results area. No query was entered or submitted,
no checkbox changed, and no filter cleared or saved.

43. Across top: blank query textbox with magnifier.
44. Left header: Filter options and Clear all action.
45. At filter/results boundary: collapse icon; untouched (layout preference).
46. From: user picker textbox, placeholder @user, dropdown caret.
47. In: conversation picker, placeholder #channel or chat, dropdown caret.
48. Date: Any time field with calendar icon.
49. Conversation Type: Threads, Chats and Channels checkboxes, all checked in
    the initial state. This confirms vocabulary, not access to populated lists.
50. Include bot messages checkbox, initially unchecked.
51. Include all open channels checkbox, initially unchecked.
52. Channel Types picker with placeholder Select channel types and caret.
53. Message Contains: Text, File, Link and My mentions checkboxes, unchecked.
54. Top of results: Messages, Links and Files category controls; Messages
    visibly selected. No category was changed.
55. Overlay top-right: X close affordance (glyph accessible button).
56. Result body: illustration, no-matches explanation and Try new search
    action. This is the initial state after opening with no query; it does not
    establish actual search semantics or indexing behavior.

### Add Chats picker

Source: `chat-pin-picker`. My Pins → +Add Chats opens a tall centered dialog
over the dimmed CRM and panel. No item was selected.

57. Header: My Pins > Add Chats breadcrumb/title.
58. Header right: X close affordance, glyph accessible name.
59. Beneath header: Search / Ara textbox with magnifier. No text was entered.
60. Rest of dialog: blank selection area, no rows and no visible submit action
    in this initial state. Selection-to-pin persistence is unobserved.

### New group conversation

Source: `chat-group-start`. Quick Actions → Start a Group Conversation opens a
centered user-selection dialog. No group was created and no user selected.

61. Header: instruction to select users for a group chat.
62. Header right: X close button with glyph accessible name.
63. Beneath header: Search / Ara textbox with magnifier; not filled.
64. Below search: blank user-selection area. No visible submit action, member
    rows, naming field or permission explanation in this initial state.

## Flows and state behavior

1. Open Chats from the footer → shared header/search/filter controls → Recent
   empty state. Select Unread → unread empty state and selected-tab highlight.
2. Open Contacts → Frequents empty state and category dropdown. The on-screen
   instruction suggests email search can lead to invitation; that transition
   was not exercised because the read-only capture workflow does not enter text.
3. Open My Pins → empty favorite-chat state → Add Chats affordance. Never select
   a result, because that could persist a pin.
4. Open Quick Actions → Invite People → inspect initial dialog only. Do not
   submit. No outcome after send is specified from observation.

Only the current user's Available indicator was observed. No other user's
presence, typing indicator, delivery/read receipt, reconnect state, push update,
badge increment/decrement, notification or concurrent-device synchronization was
observed. Empty Recent and Contacts lists may reflect this session's data and
service availability; they are not proof that the organization has no users or
history. Capture diagnostics contain background page errors and blocked
requests. The initial docked lists show no user-visible error banner; Mentions
and Starred Messages do show the technical-error notification described above.

## Permissions and architecture boundary

Same-organization users are the authorized product audience. Reference behavior
for user visibility, roles, deactivated users, channel membership, private/public
channels, thread visibility and history access was not verifiable with empty
lists and a single signed-in identity. Enforce organization isolation in the
architecture, but treat its detailed policy as an ADR decision rather than an
observed reference contract. No cross-account tests or external invitation were
performed. No transport, storage, endpoint or delivery-guarantee contract is
implied by this UI research.

## Open questions / acceptance gaps

1. Channels and Threads are required by the assignment but absent from the
   observed footer. Determine whether a different existing service entitlement
   or reference session exposes them; do not create an account, connect a
   service or change settings to investigate.
2. No existing direct conversation, channel or thread was available to open.
   Their headers, composer tools, message ordering, replies, menus, populated
   pins and message actions remain unobserved. Test writes require the supported, scoped capture-tool window described below.
3. Maximize/minimize persistence is unknown. The controls are inventoried, but
   no maximized screenshot was obtained; safe logged restoration support is pending.
4. Search results, unread badges with nonzero values, presence transitions,
   realtime behavior and invitation validation/errors require further safe
   evidence or explicitly recorded design decisions. Do not synthesize them as
   observed parity.
5. Decide how the external invitation affordance and unavailable service-linked
   entries map to the internal-only product. No expansion of scope is implied.
6. The direct-message start picker could not be inspected: the tool classifies
   its Send-labelled entry as dangerous. A capture-tool owner can assess safe
   dialog-only support separately; this research did not relax any guard.

## Capture references and verification

Capture slugs refer to local research captures, not committed assets. Each
completed capture includes screenshot, accessibility tree, visible controls,
page text, network metadata and capture metadata; step captures retain the
intermediate navigation states. Screenshots were inspected against control and
accessibility output. No application code changed, so runtime/unit/e2e tests do
not apply to this document-only research change. The evidence gaps above must
remain visible in the research review and architecture handoff.

| State | Capture slug | Coverage |
| --- | --- | --- |
| Closed footer | `chat-shell` | Three entries; no Channels/Threads entry |
| Chats / Recent | `chat-chats` | Empty |
| Chats / Unread | `chat-unread` | Empty |
| Contacts / Frequents | `chat-contacts` | Empty |
| Contact categories | `chat-contact-categories` | Frequents and Recent options |
| My Pins | `chat-pins` | Empty |
| Quick Actions | `chat-quick-actions` | Visible menu and service restriction |
| Invite People | `chat-invite` | Initial external invitation dialog only |
| Cancel invitation | `chat-invite-cancel` | Empty dialog cancelled; no invitation sent |
| Mentions | `chat-mentions` | Empty explanation plus technical error |
| Starred Messages | `chat-starred` | Spinner plus technical error |
| Advanced search | `chat-advanced-search` | Initial filters and no-results state |
| Add Chats picker | `chat-pin-picker` | Blank search/selection dialog |
| New group conversation | `chat-group-start` | Blank user-selection dialog |
| New direct message | `chat-direct-start` | Guard refusal; screenshot remains on Quick Actions |

Capture metadata was checked after every click sequence. Blocked requests
include background reminder/status calls and client telemetry. Opening Add
Chats also attempted a system-action POST classified by the guard as a Pins
menu action; it was blocked. The group-start system-action POST was also
blocked. No block was bypassed and no user selected. These capture restrictions
and page errors can limit list completeness and must not become product error
requirements without corroborating evidence.

## Authorized chat window follow-up

The board authorized CRM Analyst to observe Chat writes on 2026-10-31 until
10:00 Istanbul (07:00 UTC), superseding the original read-only task scope for
that interval only. Targets are restricted to self-chat and `ZZTEST-` channels
with only the signed-in user. Other people must never be messaged, mentioned,
invited or notified. Every write requires a durable change log and verified
cleanup before expiry; settings require immediate restoration. After expiry,
read-only rules apply again. This authorization does not disable capture guards.

At 02:46–02:49 Istanbul, follow-up inspection established a tooling blocker:
`write-window.mjs` fixes its expiry to 2026-10-26T04:00:00Z, and both write-policy
versions omit Chat from their allowed modules. The observe-mode activation also
requires a published policy and identity/recipient evidence. The existing local
policies belong to the earlier window; none was reused or edited. Therefore no
Chat write activation or reference write was attempted. Platform support is
tracked in MEP-1417; tested, approved, scoped tool support would be required
before write research resumes. Permission alone does not make the present tool capable
of safely observing self-chat, membership, message cleanup or restored settings.

`chat-channel-start` is a **partial capture**, not a completed screen capture.
Steps 1 and 2 opened Chats and Quick Actions. Step 3 targeted the uniquely named
Create a Channel menu item with a normal click. It timed out after 15 seconds:
the enclosing menu intercepted pointer events, while the target had disabled
visual styling despite `aria-disabled=false`. Step screenshots and accessibility
trees, network output and partial metadata were preserved. No channel dialog
opened; no forced click, service connection or alternative selector was used.
Seven background reminder/status/telemetry requests were blocked. This proves
that the normal opening attempt failed in this session, not its root cause or
the creation flow's behavior.

The original 15 completed captures and 64-control inventory remain valid within
their stated limits. The additional partial capture does not close acceptance
gaps. Send/edit/delete/react/reply/pin/unpin, populated threads/channels/pins,
nonzero unread states and maximized view remain pending. No test content or
setting was created or changed in this follow-up, so no Chat cleanup was due.

Platform disposition (MEP-1417, 2026-10-31): safe Chat write support cannot be
provided within this window. The analyst must stay read-only; no tool files
were changed. The expired REST-oriented policy cannot safely establish Chat
transport, self-only membership and verified deletion. This is a platform
constraint decision, not observed transport evidence or approval of invented
reference behavior. Write-flow gaps above remain explicit. CTO/UI Lead must
record any implementation choices for those gaps; they are not parity findings.
The updated evidence-bounded research returns to independent review without
claiming that every requested state has been captured.
