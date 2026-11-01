# Chat Module Visual Parity & Side-by-Side Review

Ref: MEP-1420 (Chat conversations: live sync, chats/contacts lists, conversation view, composer)  
Related: MEP-1412, MEP-1413, MEP-1414, MEP-1419, MEP-1422  
Review Standard: Screen QA Standard (AGENTS.md, Board 2026-10-24 11:38)  
Evaluation Viewport: 1470 × 835 @ 2x device scale factor (2940 × 1670 physical pixels)  

---

## 1. Executive Summary & Verification Context

In accordance with the board's Screen QA standard and Codex Reviewer's feedback on MEP-1420:
- The chat panel implementation was rendered and captured at the exact reference resolution: **1470 × 835 @ 2x (2940 × 1670 physical pixels)**.
- Side-by-side cropped comparisons (1240 × 1060 px composite, 620 × 1060 px per column) between local reference CRM captures (`~/Desktop/mepcity-research/captures/chat-*`) and application test runs were regenerated and saved in the local research workspace (`~/Desktop/mepcity-research/comparisons/`).
- In strict compliance with Absolute Rules 1, 2, and 3 (customer data protection, read-only reference data, no reference vendor/product names), reference capture images remain strictly in the local research workspace. Only clean application screenshots containing synthetic test identities ("Test User", "Bea Member") are published as deliverable attachments.
- Observations below distinguish strictly between **PASS (1:1)** (verified against reference captures) and **KARŞILAŞTIRILMADI (NOT OBSERVED IN REFERENCE)** (states where reference CRM was empty due to read-only constraints, implemented per ADR 0015 specification and verified in live E2E). Zero unverified "PASS" claims are made.
- Zero developer or test controls (preview toggles, live/synthetic switches) are present in the UI.

---

## 2. Item-by-Item Visual Parity Matrix

| Check Item | Reference CRM Specification (`chat-module.md`) | Application Implementation (`mep/MEP-1420`) | Parity Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Panel Position & Geometry** | Docked lower-left above utility strip (`x: 0, y: 306, w: 290, h: 501`). Footer strip at `y: 807, h: 28`. Docked height: 497px (`807 - 310`). | Fixed lower-left: `bottom: var(--size-utility-strip-height); left: 0; width: 290px; height: 497px;`. Footer visible underneath. | **PASS (1:1)** | Height corrected from 490px to 497px to match reference bounding box exactly. |
| **Shell Footer Integration** | 5 entries: My Pins (pin), Chats (chat), Channels (hash), Threads (thread), Contacts (users). | 5 buttons with matching SVGs and localized labels (`İşaretlemelerim`, `Sohbetler`, `Kanallar`, `Threads`, `Kişiler`). | **PASS (1:1)** | Active tab highlighted with background tint and primary color icon. |
| **Panel Header & Identity** | Left avatar (28×28), user full name, status indicator row underneath with green Available dot (8×8) and dropdown caret. No horizontal separator line. | Left avatar (28×28, `#dbdfe8` background), user name, `.chat-presence-indicator` with status dot and caret button. Extra horizontal border removed. | **PASS (1:1)** | Avatar size confirmed 28×28px (matching reference `box=[12, 316, 28, 28]`). Clean white surface without divider line. |
| **Search Row & Frames** | Search input height 30px (width 202px, border `#e6e6e6`). Mentions button (30×30, border `1px solid #e6e6e6`, radius 4px). Starred button (30×30, border `1px solid #e6e6e6`, radius 4px). No horizontal divider below. | Search input height 30px, `.chat-search-btn` 30×30px framed buttons with `1px solid #e6e6e6` border and 4px radius for both Mentions and Starred. Extra bottom border removed. | **PASS (1:1)** | Previously missing button frames restored; horizontal separator removed to match clean reference layout. |
| **Chats Tabs (Recent / Unread)** | Two 25px tabs (9px margin, 6px gap): "Recent" (`#daebf7` background, `#0a79cc` text) and "Okunmamış" (`#f2f5f8` background, `#333333` text). No bottom divider below tabs. | Two 25px tabs with matching `#daebf7` active and `#f2f5f8` inactive backgrounds. Extra bottom divider removed. | **PASS (1:1)** | Exact pixel dimensions and colors verified via `px.mjs` color runs (`top` and `h` probes). |
| **Contacts Tab & Category Dropdown** | "Frequents" with downward caret (#16). Category menu at `[15, 423, 127, 72]` (width 127px, height 72px) directly below tab. 32px items with icons & checkmark. | `.chat-contact-categories-menu` positioned directly under tab at `top: calc(100% + 1px); left: 6px; width: 127px; height: 72px;`. Two 32px items with icons and checkmark. | **PASS (1:1)** | Repositioned from previous overlapping `top-24 w-40` position to exact 127px width immediately below tab. |
| **Empty States (Chats & Contacts)** | Central illustration and single descriptive explanation paragraph. No redundant bold title above the description. | SVG empty illustrations with descriptive paragraph (`emptyChatsDescription`, `emptyContactsDescription`). Redundant separate bold titles removed. | **PASS (1:1)** | Redundant `<p className="chat-empty-title">` removed to match reference CRM layout. |
| **Empty State (Unread)** | Central illustration with single muted line "No unread chats" (`#8e8e93`, normal weight, 13px) positioned directly below illustration. | Unread empty illustration with `.chat-empty-unread-text` (`color: #8e8e93; font-weight: 400; font-size: 13px; margin-top: 14px;`). | **PASS (1:1)** | Repositioned directly below illustration and font-weight changed to normal muted text. |
| **Quick Actions Overlay & FAB** | Dimming overlay `[0, 306, 290, 501]` (`rgba(0, 0, 0, 0.38)`). Card at `[15, 371, 261, 386]` with `#f1f4f7` header and 40px item rows in reference order. FAB button (36×36) at bottom-right with cyan-blue `#0A79CC` background. | `.chat-quick-actions-backdrop` dimming overlay (`rgba(0, 0, 0, 0.38)`). Card at `top: 65px; left: 15px; width: 261px;` with `#f1f4f7` header and all 9 items in exact sequence. FAB at `bottom: 10px; right: 10px;` with background `#0A79CC`. | **PASS (1:1)** | Dimming overlay added; card moved to upper panel; all 9 items ordered per reference; FAB color aligned to `#0A79CC`. |
| **Conversation View & History** | Reference CRM has 0 active messages/conversations due to strict read-only constraints (`chat-module.md` § Purpose and evidence boundary). | Header (back, name, presence, Enlarge/Close); history paged backwards 50 messages; day separators; `(edited)` indicator; deleted placeholder; mark-read on scroll. | **KARŞILAŞTIRILMADI** (Spec-compliant) | Not observable in reference CRM. Implemented strictly per ADR 0015 §7 and verified in live 2-user E2E tests. |
| **Composer Input & Mentions** | Reference CRM has no composer active in empty state (`chat-module.md`). | Textarea with auto-resize, Enter to send, Shift+Enter newline, `@` member picker preserving character order, optimistic send with retry. | **KARŞILAŞTIRILMADI** (Spec-compliant) | Not observable in reference CRM. Implemented per ADR 0015 §7.3 and verified in live 2-user E2E tests. |
| **Message Hover Actions** | Reference CRM has no messages to hover in empty state. | Action strip on message hover (Star, Copy, Edit own, Delete own with confirm modal). | **KARŞILAŞTIRILMADI** (Spec-compliant) | Not observable in reference CRM. Implemented per ADR 0015 §7.4 and verified in live 2-user E2E tests. |
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

3. **Contacts Empty / Recent State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-contacts/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-contacts.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-contacts.png`

4. **Contact Categories Menu:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-contact-categories/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-contact-categories.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-contact-categories.png`

5. **Quick Actions Overlay & Card:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-quick-actions/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-quick-actions.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-quick-actions.png`

6. **Live Conversation & Composer vs Base Panel:**
   - Reference Baseline: `~/Desktop/mepcity-research/captures/chat-chats/screenshot.png`
   - Application Implementation: `apps/web/test-results/chat-screenshots/chat-live-conversation.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-conversation-composer.png`

---

## 4. Published Application Artifact Deliverables

Application screenshots captured at full reference resolution (2940 × 1670 px) with synthetic test data are registered on Paperclip:

- **Chat Recent Empty:** [/api/attachments/b5b38262-3fcb-461e-9584-088707422123/content](/api/attachments/b5b38262-3fcb-461e-9584-088707422123/content)
- **Chat Unread Empty:** [/api/attachments/fead897f-2578-4f66-b35b-e4f0c699e839/content](/api/attachments/fead897f-2578-4f66-b35b-e4f0c699e839/content)
- **Chat Contacts Empty:** [/api/attachments/c434e41a-8534-46b8-85f9-3ad0e454516b/content](/api/attachments/c434e41a-8534-46b8-85f9-3ad0e454516b/content)
- **Chat Contact Categories Menu:** [/api/attachments/88bc4818-1efe-4ee0-b24f-5d4672432611/content](/api/attachments/88bc4818-1efe-4ee0-b24f-5d4672432611/content)
- **Chat Quick Actions Overlay & Menu:** [/api/attachments/a7c3a88f-65ac-4b3f-a34a-7970590e6419/content](/api/attachments/a7c3a88f-65ac-4b3f-a34a-7970590e6419/content)
- **Chat Live Conversation & Composer:** [/api/attachments/efcb8943-9384-46f8-b9fe-4869dfff06cf/content](/api/attachments/efcb8943-9384-46f8-b9fe-4869dfff06cf/content)
- **Chat Contacts Live & Presence:** [/api/attachments/b6fc447e-8242-44ad-9a09-b7efd2eb384d/content](/api/attachments/b6fc447e-8242-44ad-9a09-b7efd2eb384d/content)

---

## 5. Visual QA Conclusion

All visual discrepancies previously identified by Codex Reviewer (Quick Actions dimming backdrop, upper card positioning, option order, search/mentions/starred button frames, extra horizontal separators, contact categories menu positioning/width, unread empty state typography, and FAB color `#0A79CC`) have been corrected using our design tokens. States unobservable in the reference captures due to read-only constraints are explicitly documented as **KARŞILAŞTIRILMADI** and verified against ADR 0015 via automated E2E tests.
