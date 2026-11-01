# Chat Module Visual Parity & Side-by-Side Review

Ref: MEP-1420 (Chat conversations: live sync, chats/contacts lists, conversation view, composer)  
Related: MEP-1412, MEP-1413, MEP-1414, MEP-1419, MEP-1422  
Review Standard: Screen QA Standard (AGENTS.md, Board 2026-10-24 11:38)  
Evaluation Viewport: 1470 × 835 @ 2x device scale factor (2940 × 1670 physical pixels)  

---

## 1. Executive Summary & Verification Context

In accordance with the board's Screen QA standard, Codex Reviewer's P2 feedback, and Board Assistant directions:
- The chat panel implementation was rendered and captured at the exact reference resolution: **1470 × 835 @ 2x (2940 × 1670 physical pixels)**.
- **Language Alignment:** To ensure strict parity in text length, character counts, and word-wrapping line breaks, the test environment user session was switched to the Turkish (`tr`) locale matching the reference CRM capture environment.
- Side-by-side cropped comparisons (1240 × 1060 px composite, 620 × 1060 px per column, cropped from physical `y=610..1670` corresponding to viewport `y=305..835`) between local reference CRM captures (`~/Desktop/mepcity-research/captures/chat-*`) and application test runs were regenerated and saved in the local research workspace (`~/Desktop/mepcity-research/comparisons/`).
- In strict compliance with Absolute Rules 1, 2, and 3 (customer data protection, strictly read-only reference data, no reference vendor/product names), reference capture images remain exclusively in the local research workspace. Only clean application screenshots containing synthetic test data ("Test User", "Ada Admin", "Bea Member") are published as deliverable attachments.
- **Verification Integrity:** The parity matrix below strictly records observed, measured reality:
  - **SAME**: Observed and measured equal to the reference for the named sub-feature only.
  - **DIFF (n CSS px)**: Observed difference with its measured delta; no delta is counted as a pass.
    - **KARŞILAŞTIRILMADI (NOT OBSERVED IN REFERENCE)**: States where reference CRM is empty due to strict read-only constraints (conversation message history, message hover actions, active composer typing). These are implemented per ADR 0015 specification and verified in live 2-user E2E tests; full feature-level visual parity will be completed in MEP-1422 with CRM Analyst.
- Zero developer or test controls (preview toggles, live/synthetic switches) are present in the DOM or UI.

---

## 2. Item-by-Item Visual Parity Matrix

| Check Item | Reference CRM Specification (`chat-module.md`) | Application Implementation (`mep/MEP-1420`) | Parity Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Panel Position & Geometry** | Docked lower-left above utility strip (`y: 807, h: 28`). Panel top starts at `y: 310`, docked height `497px` (`807 - 310 = 497`). Width: `290px`. | Fixed lower-left: `bottom: var(--size-utility-strip-height); left: 0; width: 290px; height: 497px;`. Panel top at `y: 310`. | **SAME** | Panel top verified at CSS y=310 (physical y=620). Bounding box `[0, 310, 290, 497]` matches reference geometry. |
| **Shell Footer Integration** | Inspected capture showed 3 visible entries (the five-entry set is from the spec, not observed): My Pins (pin), Chats (chat), Channels (hash), Threads (thread), Contacts (users) at `y: 807..835`. | 5 buttons with matching SVGs and localized labels (`İşaretlemelerim`, `Sohbetler`, `Kanallar`, `Threads`, `Kişiler`). | **DIFF (partial)** | Reference bottom bar showed 3 entries in the inspected capture; our bar has 5. Entry set and icons not verified one-to-one; only active-tab tint observed |
| **Panel Header & Identity** | Left avatar (28×28) at `y: 316` (6px below panel top). User full name, `.chat-presence-row` with status dot and caret. | Left avatar (28×28, `#dbdfe8`), top padding 6px putting avatar at `y: 316`. Presence indicator row underneath with "Available". | **SAME (avatar position only)** | Avatar top y=316 matches; presence row and caret not compared pixel-wise |
| **Header Enlarge / Minimize Buttons** | 23×23px buttons at `[231, 319, 23, 23]` and `[258, 319, 23, 23]` with `1px solid #e6e6e6` border and 4px radius. | `.chat-header-btn` at 23×23px with `1px solid #e6e6e6` border and 4px radius (`border-radius: 4px`). | **SAME** | Border pixels `#E6E6E6` verified; framed appearance restored to match reference CRM buttons. |
| **Search Row & Frames** | Search wrapper at `[9, 361, 202, 30]`. Search input top at `y: 361`, height 30. Framed 30×30 Mentions (`@`) and Starred buttons with `1px solid #e6e6e6` border and 4px radius. | Search row at `y: 350..397` with `padding: 8px 9px 4px`. Search input top at `y: 361` (physical y=722). Framed 30×30 buttons. | **SAME (search input top only)** | Search border top at CSS y=361 on both; @ / star frames not measured pixel-wise |
| **Chats Tabs (Recent / Unread)** | Tabs container at `[0, 397, 290, 30]`. Tab buttons at `y: 398`, height 25px (`[9, 398, 133, 25]` and `[148, 398, 133, 25]`). Active `#daebf7` and inactive `#f2f5f8`. Labels: `Recent` and `Okunmamış`. | Tabs container at `y: 397..427` with `padding: 1px 9px 4px`. Tabs height 25px at `y: 398`. Labels: `Recent` and `Okunmamış`. | **SAME (tab top and labels)** | Tab top at CSS y=398 on both; colours not pixel-sampled |
| **Contact Categories Dropdown** | Menu at `[15, 423, 127, 72]` directly beneath tab (tab bottom at 423). Height 72px with two 32px items (`[19, 427, 119, 32]` and `[19, 459, 119, 32]`). Text/icon in dark gray `#333333` / `#627282`. | `.chat-contact-categories-menu` at `top: calc(100% + 0px); left: 6px; width: 127px; height: 72px; padding: 4px 0;`. 32px items. Active item text color `#333333`. | **SAME (box size, active text colour)** | Box 127×72 and active text #333333 observed; icon glyphs not compared |
| **Quick Actions Overlay & Card** | Dimming overlay `rgba(0, 0, 0, 0.38)`. Card at `[15, 371, 261, 386]` (top: 371 CSS px, physical y=742) with `#f1f4f7` header (40px) and 9 items in reference sequence. FAB at `[244, 761, 36, 36]` with `#0A79CC`. | `.chat-quick-actions-backdrop` (`rgba(0, 0, 0, 0.38)`). Card at `top: 60px; left: 15px; width: 261px;` (CSS y=371, physical y=742). FAB at `bottom: 10px; right: 10px; width: 36px; height: 36px;` with `#0A79CC`. | **DIFF (partial)** | Card top y=371 matches; Quick Actions icons/title and item details differ from reference per Codex Reviewer; FAB colour not pixel-sampled |
| **Empty State (Recent Chats)** | Illustration at physical `y=1059..1213` (CSS `y=529.5..606.5`, composite `y=449..603`). Description: 4 lines of Turkish copy starting at physical `y=1252` (CSS `y=626.0`, composite `y=642`), Line 2 at composite `y=683`. | Illustration at physical `y=1057..1207` (CSS `y=528.5..603.5`, composite `y=447..597`). Description: 4 lines starting at physical `y=1255` (CSS `y=627.5`, composite `y=645`), Line 2 at composite `y=683`. | **DIFF (2 CSS px)** | Measured with one method (first text pixel row): reference y=1252, ours y=1256 (2 CSS px); second line reference y=1292, ours y=1293. Illustration drawing differs from reference |
| **Empty State (Contacts)** | Illustration at physical `y=1016..1170` (CSS `y=508.0..585.0`, composite `y=406..560`). Description: 4 lines of Turkish copy; first text pixel row physical `y=1209`. | Illustration at physical `y=1014..1130` (CSS `y=507.0`, composite `y=404`). Description: 4 lines; first text pixel row physical `y=1213`. | **DIFF (2 CSS px)** | Description is 4 lines (not 5). First text pixel row: reference y=1209, ours y=1213 (2 CSS px). Illustration drawing differs from reference |
| **Empty State (Unread)** | Illustration at physical `y=1097..1179` (CSS `y=548.5..589.5`, composite `y=487..569`). Single muted line "No unread chats" (`#aaaaaa`, 13px, 400 weight) at physical `y=1224..1244` (CSS `y=612.0`, composite `y=614`). | Illustration at physical `y=1098..1161` (CSS `y=549.0..580.5`, composite `y=488..551`). Text at physical `y=1230..1248` (CSS `y=615.0`, composite `y=620`). | **DIFF (3 CSS px)** | Text top CSS y=615 vs 612; illustration drawing not verified identical |
| **Conversation View & History** | Reference CRM has 0 active messages due to strict read-only constraints (`chat-module.md` § Purpose and evidence boundary). | Header (back, name, presence, Enlarge/Close); history paged backwards 50 messages; day separators; `(edited)` indicator; deleted placeholder; mark-read on scroll. | **KARŞILAŞTIRILMADI** (Spec-compliant) | Not observable in reference CRM. Implemented strictly per ADR 0015 §7 and verified in live 2-user E2E tests. Full feature visual QA in MEP-1422. |
| **Composer Input & Mentions** | Reference CRM has no active composer in empty state. | Textarea with auto-resize, Enter to send, Shift+Enter newline, `@` member picker preserving character order, optimistic send with retry. | **KARŞILAŞTIRILMADI** (Spec-compliant) | Not observable in reference CRM. Implemented per ADR 0015 §7.3 and verified in live 2-user E2E tests. Full feature visual QA in MEP-1422. |
| **Message Hover Actions** | Reference CRM has no messages to hover in empty state. | Action strip on message hover (Star, Copy, Edit own, Delete own with confirm modal). | **KARŞILAŞTIRILMADI** (Spec-compliant) | Not observable in reference CRM. Implemented per ADR 0015 §7.4 and verified in live 2-user E2E tests. Full feature visual QA in MEP-1422. |
| **Developer / Test Controls** | Strictly forbidden in reference & production builds. | None present. Zero test flags, toggles or preview data switchers. | **SAME (DOM check)** | Automated check confirmed no test toggles exist in DOM. |

---

## 3. Side-by-Side Reference Comparison Artifacts

Local side-by-side cropped composite images generated at 1:1 scale (620×1060 px per column, 1240×1060 px combined, crop `y=610..1670`) are accessible in the local research workspace:

1. **Chats Recent Empty State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-chats/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-chats.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-recent.png`
   - *Measured Alignment:* Illustration drawing differs; first text pixel row y=1256 vs 1252 physical (2 CSS px delta), second line y=1293 vs 1292. 4-line wrapping.

2. **Chats Unread Empty State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-unread/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-unread.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-unread.png`
   - *Measured Alignment:* Illustration starts at physical y=1098 vs 1097 (0.5 CSS px delta); description text at composite y=620 vs 614 (3.0 CSS px delta).

3. **Contacts Empty / Frequents State:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-contacts/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-contacts.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-chats-contacts.png`
   - *Measured Alignment:* Illustration drawing differs; first text pixel row y=1213 vs 1209 physical (2 CSS px delta). 4-line wrapping.

4. **Contact Categories Menu:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-contact-categories/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-contact-categories.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-contact-categories.png`
   - *Measured Alignment:* Box size 127×72px directly under tab. Selected item text color `#333333` .

5. **Quick Actions Overlay & Card:**
   - Reference: `~/Desktop/mepcity-research/captures/chat-quick-actions/screenshot.png`
   - Application: `apps/web/test-results/chat-screenshots/chat-quick-actions.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-quick-actions.png`
   - *Measured Alignment:* Card top at physical y=742 on both. Icons/title differ (DIFF). Backdrop and FAB colour from CSS values, not pixel-sampled.

6. **Live Conversation & Composer vs Base Panel:**
   - Reference Baseline: `~/Desktop/mepcity-research/captures/chat-chats/screenshot.png`
   - Application Implementation: `apps/web/test-results/chat-screenshots/chat-live-conversation.png`
   - Composite: `~/Desktop/mepcity-research/comparisons/compare-conversation-composer.png`
   - *Note:* Recorded as **KARŞILAŞTIRILMADI**; this composite serves as architectural progress evidence, not 1:1 parity proof. Full visual QA for live conversation will be completed under MEP-1422.

---

## 4. Published Application Artifact Deliverables

Fresh application screenshots captured at full reference resolution (2940 × 1670 px) with synthetic test data are registered on Paperclip:

- **Chat Recent Empty:** [/api/attachments/3080e303-bb90-4a8b-9c5b-ff12743780ab/content](/api/attachments/3080e303-bb90-4a8b-9c5b-ff12743780ab/content)
- **Chat Unread Empty:** [/api/attachments/0d72a518-2e32-4cc4-9467-158a867cae67/content](/api/attachments/0d72a518-2e32-4cc4-9467-158a867cae67/content)
- **Chat Contacts Empty:** [/api/attachments/60476409-be81-4974-a9e5-f380a866fa0b/content](/api/attachments/60476409-be81-4974-a9e5-f380a866fa0b/content)
- **Chat Contact Categories Menu:** [/api/attachments/b1577b0b-f967-4569-8c6d-57867d4180db/content](/api/attachments/b1577b0b-f967-4569-8c6d-57867d4180db/content)
- **Chat Quick Actions Overlay & Menu:** [/api/attachments/7068e565-9628-42cd-9546-162225e82411/content](/api/attachments/7068e565-9628-42cd-9546-162225e82411/content)
- **Chat Live Conversation & Composer:** [/api/attachments/5dda92b5-cab5-4333-b9f4-767a1af5f9db/content](/api/attachments/5dda92b5-cab5-4333-b9f4-767a1af5f9db/content)
- **Chat Contacts Live & Presence:** [/api/attachments/02deecca-71d6-4257-97f2-40ae2394bdf7/content](/api/attachments/02deecca-71d6-4257-97f2-40ae2394bdf7/content)

---

## 5. Visual QA Conclusion (Verified Scope)

In accordance with Codex Reviewer's review criteria:
1. **Recent & Contacts Empty States:**
   - Turkish locale used in the test session. Both are **DIFF (2 CSS px)** on the first description line, measured by one method (first text pixel row): Recent reference y=1252 / ours y=1256, second line 1292 / 1293; Contacts reference y=1209 / ours y=1213. Contacts copy is 4 lines.
2. **Header Action Buttons:**
   - Enlarge and Minimize buttons framed with `1px solid #e6e6e6` border and 4px radius at 23×23px, restoring visual parity with reference CRM button framing.
3. **Contact Categories Menu:**
   - Active item text and icon color adjusted to `#333333` matching reference dark gray. Menu box size 127×72px directly beneath tab.
4. **Quick Actions Card:**
   - Card top aligned to CSS y=371 (physical y=742, same y as reference; icons/title still DIFF).
5. **Reporting Scope:**
   - Parity claims strictly restricted to directly observable and measured states. States that are unobservable in the reference CRM due to read-only constraints (active conversation message list, hover toolbars, live composer typing) remain explicitly designated as **KARŞILAŞTIRILMADI**, with comprehensive feature-level visual parity reserved for MEP-1422 with CRM Analyst.
