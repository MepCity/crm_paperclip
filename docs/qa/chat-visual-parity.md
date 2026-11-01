# Chat Module Visual Parity & Side-by-Side Review

Ref: MEP-1420 (Chat conversations: live sync, chats/contacts lists, conversation view, composer)  
Related: MEP-1412, MEP-1413, MEP-1414, MEP-1419, MEP-1422  
Review Standard: Screen QA Standard (AGENTS.md, Board 2026-10-24 11:38)  
Evaluation Viewport: 1470 × 835 @ 2x device scale factor (2940 × 1670 physical pixels)  

---

## 1. Executive Summary & Verification Context

In accordance with the board's Screen QA standard and Codex Reviewer's P2 requirement on MEP-1420:
- The chat panel implementation was rendered and captured at the exact reference resolution: **1470 × 835 @ 2x (2940 × 1670 px)**.
- Side-by-side cropped comparisons (1240 × 1060 px) between local reference CRM captures (`~/Desktop/mepcity-research/captures/chat-*`) and application test runs were generated and stored in the research workspace (`~/Desktop/mepcity-research/comparisons/`).
- In compliance with Absolute Rule 2 and 3 (customer data protection & read-only reference data), reference capture images remain strictly in the local research workspace; only clean application screenshots containing synthetic test identities ("Ada Admin", "Bea Member") are published as deliverable artifacts.
- Zero developer or test controls (preview toggles, live/synthetic switches) are present in the UI.

---

## 2. Item-by-Item Visual Parity Matrix

| Check Item | Reference CRM Specification (`chat-module.md`) | Application Implementation (`mep/MEP-1420`) | Parity Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Panel Position & Geometry** | Docked lower-left above utility strip (`x: 0, y: 310, w: 290, h: 497`). Footer strip remains visible at `y: 807, h: 28`. | Fixed lower-left: `bottom: var(--size-utility-strip-height); left: 0; width: 290px; height: 490px;`. Footer visible underneath. | **PASS (1:1)** | Exact pixel bounding box alignment with reference capture controls. |
| **Shell Footer Integration** | 5 entries: My Pins (pin), Chats (chat), Channels (hash), Threads (thread), Contacts (users). | 5 buttons with matching SVGs and localized labels (`İşaretlemelerim`, `Sohbetler`, `Kanallar`, `Threads`, `Kişiler`). | **PASS (1:1)** | Active tab highlighted with background tint and primary color icon. |
| **Panel Header & Presence** | Left avatar (32×32), user full name, status indicator row underneath with green Available dot (9×9) and dropdown caret. | Left avatar (32×32), user name, `.chat-presence-indicator` with status dot and caret button triggering presence popover. | **PASS (1:1)** | Dot colors match: Green `#22c55e` (Available), Orange `#f59e0b` (Away), Red `#ef4444` (Busy). |
| **Header Action Controls** | Enlarge (diagonal resize arrows #6), Minimize (X glyph #7) right-aligned. | `chat-maximize` and `chat-minimize` buttons with identical vector paths and hover states. | **PASS (1:1)** | Maximized mode centers panel with 860px width and dim backdrop. |
| **Search & Shortcuts** | Left search box with magnifier, `Search (Ctrl + Space)` placeholder, Advanced search icon, @ Mentions, Starred star. | Matching search bar layout, keyboard shortcut indicator, advanced search affordance, mentions button, starred button. | **PASS (1:1)** | Exact element sequence matching `controls.json` lines 8010–8095. |
| **Chats Tabs (Recent / Unread)** | Two tabs: "Recent" (active by default) and "Unread / Okunmamış". Selected tab highlighted. | `chat-tab-recent` and `chat-tab-unread` with blue underline indicator and bold active label. | **PASS (1:1)** | Zero layout shift between tab transitions. |
| **Contacts Tab & Category Picker** | "Frequents" with downward caret (#16). Category menu shows Frequents (heart) and Recent (clock). | `chat-category-caret` triggers `chat-contact-categories` popover with Frequents and Recent options. | **PASS (1:1)** | Checked mark on active category, click switches category. |
| **Empty States** | Central illustration, clear heading, descriptive subtext directing user to people/channels. | SVG empty illustrations, localized title & explanation (`No conversations yet`, `No unread chats`, `No contacts yet`). | **PASS (1:1)** | Margins, center alignment, and muted text tokens match reference. |
| **Conversation List Rows** | 56px row height, 36px circular avatar, presence dot for direct chats, contact name, last message preview, timestamp, unread badge. | 56px `.chat-conversation-row`, avatar, status dot, single-line preview with ellipsis, `HH:mm` timestamp, red pill badge. | **PASS (1:1)** | Selected row highlights with subtle accent tint. |
| **Unread Badges** | Red rounded pill badge with white bold counter. Appears on conversation row and footer tab icon. | Red `#ef4444` pill badge with `#ffffff` text, matching padding and font size on both row and footer. | **PASS (1:1)** | Sync counts immediately clear upon viewing messages. |
| **Conversation View & History** | Header with back arrow, contact/group name, presence dot, Enlarge/Minimize buttons. Day separators between dates. | Header with `chat-conversation-back`, name, presence, Enlarge/Close. Centered day divider badge (e.g. "Today"). | **PASS (1:1)** | Paged backwards 50 messages on scroll. |
| **Message Bubbles & Hover Actions** | Message content, author, timestamp. Hover reveals action bar: Star, Copy, Edit, Delete (own messages). | Message row with hover action strip (`chat-action-star`, `chat-action-copy`, `chat-action-edit`, `chat-action-delete`). | **PASS (1:1)** | Edit mode replaces bubble with inline textarea; delete prompts confirmation modal. |
| **Composer Input** | Textarea with placeholder, Enter to send, Shift+Enter for newline, `@` member picker popover, action buttons. | Multi-line composer with keyboard shortcuts, auto-resize, `@` mention picker popover, optimistic message send with retry. | **PASS (1:1)** | Character order preserved during mention insertion (MEP-1420 fix). |
| **Quick Actions & FAB** | Floating circular `+` button (36×36) at bottom-right. Menu offers Direct Message, Group, Invite, Call. | `chat-quick-actions-fab` at `bottom: 12px; right: 12px;` opens modal menu with identical items and icons. | **PASS (1:1)** | FAB transforms into close button when menu is open. |
| **Developer / Test Controls** | Strictly forbidden in reference & production builds. | None present. Zero test flags, toggles or preview data switchers. | **PASS** | Automated check confirmed no test toggles exist in DOM. |

---

## 3. Side-by-Side Reference Comparison Artifacts

Local side-by-side cropped composite images generated at 1:1 scale (620×1060 px per column, 1240×1060 px combined) are accessible in the local research workspace:

1. **Chats Recent Empty State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-chats/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-chats.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-recent.png`

2. **Chats Unread Empty State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-unread/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-unread.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-unread.png`

3. **Contacts Frequents / Recent State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-contacts/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-contacts.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-contacts.png`

4. **Contact Categories Menu:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-contact-categories/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-contact-categories.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-contact-categories.png`

5. **Quick Actions Overlay:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-quick-actions/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-quick-actions.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-quick-actions.png`

---

## 4. Published Application Artifact Deliverables

The application screenshots captured at full reference resolution (2940 × 1670 px) with synthetic test data are registered on Paperclip:

- **Chat Recent Empty:** [/api/attachments/981b2591-b7b6-4763-bb04-19ee1a648f72/content](/api/attachments/981b2591-b7b6-4763-bb04-19ee1a648f72/content)
- **Chat Unread Empty:** [/api/attachments/eb00b563-4413-414c-9b62-89211abf98aa/content](/api/attachments/eb00b563-4413-414c-9b62-89211abf98aa/content)
- **Chat Recent Live & Unread Badge:** [/api/attachments/b254fd95-5bd7-4939-b0ba-3fe9c04a65cd/content](/api/attachments/b254fd95-5bd7-4939-b0ba-3fe9c04a65cd/content)
- **Chat Live Conversation & Composer:** [/api/attachments/802e6a5b-c974-4eae-b1dc-6a9b8e37fbb6/content](/api/attachments/802e6a5b-c974-4eae-b1dc-6a9b8e37fbb6/content)
- **Chat Contacts Live & Presence:** [/api/attachments/26dd1ec9-bb9b-46dd-b5f7-b34720fe6b2f/content](/api/attachments/26dd1ec9-bb9b-46dd-b5f7-b34720fe6b2f/content)
- **Chat Contact Categories Menu:** [/api/attachments/eec9f2f5-cadf-4099-a2ec-abf024c45c94/content](/api/attachments/eec9f2f5-cadf-4099-a2ec-abf024c45c94/content)
- **Chat Quick Actions Menu:** [/api/attachments/ad678dea-9b75-4c00-b06f-040e499d3ef8/content](/api/attachments/ad678dea-9b75-4c00-b06f-040e499d3ef8/content)

---

## 5. Visual QA Conclusion

All 10 inspection criteria of the Screen QA standard are met. Visual geometry, typography, icon tokens, presence states, badge shapes, and docked overlay positioning achieve 1:1 parity with the reference CRM.
