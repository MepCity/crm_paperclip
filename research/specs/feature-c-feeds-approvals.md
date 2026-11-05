# Feature C research: Feeds wall and My Jobs / Approvals

Status: research spec for ADR 0018 (read-only study, nothing submitted in the reference CRM).
Captures live in the external research workspace under `captures/<slug>/` (never in this repo).
UI strings are quoted in Turkish as shown by the reference; names, record data and org identifiers are omitted.

## 0. Summary of what the reference lets us see

| Area | Observable? | Finding |
|---|---|---|
| Feeds wall (`Feeds` module) | **No** | Module metadata: `show_as_tab: true`, `visible: false`. Opening its tab route shows a blocking dialog "İzin Reddedildi" ("You do not have enough permission to perform this action. Contact your administrator.") with one `Tamam` button. No wall, composer, comments, likes or filters can be seen with the signed-in account. |
| Record feed | **No** | `feeds_required` is `false` on 60 module entries and `true` on one (Deals). The Lead/Deal detail screens (existing specs `record-detail.md`, `deals-record-detail.md`) show a `Timeline` area (History / Interactions) but no "Feeds" panel. The Timeline is the only record-level change log we can see. |
| My Jobs (`Approvals` module, label "İşlerim") | **Yes, all empty** | Page with 4 job tabs + "Gözden Geçirme Günlükleri" (review logs) page. Every count is 0 and every list is empty, so no item detail, approve/reject/delegate controls or history rows exist to observe. |
| Approval process setup | **Yes (list, empty)** | Setup > Process Management > "Onay İşlemleri": no approval process configured. |
| Review process setup | **Yes (empty state)** | Setup > Process Management > "Gözden Geçirme Süreçleri": no process configured. |
| Feed settings setup route | **No** | The guessed settings route is rejected as an invalid URL; no feed setup screen is reachable by navigation. |
| Notification bell panel | **Not opened** | Per task rule (opening may reset the unseen counter). Only the bell icon and the passive counter endpoint are known. |

Consequence: the Feeds wall, post composer, comments, likes, follow/unfollow, feed filters, approval item detail, approve/reject/delegate dialogs and approval history rows are **not observable** in this account. They are listed in §6 as open questions and in §7 the data-model sketch is marked as "observed" vs "proposed (documentation-level, unverified)".

## 1. Captures

| Slug | What it is |
|---|---|
| `mep1452-feeds-wall` | Feeds tab route; permission-denied dialog over the shell. |
| `mep1452-myjobs-entry` | My Jobs landing (default tab: Reviews, empty). |
| `mep1452-myjobs-blueprint-tab` | Tab "Şema Geçişleri" (Blueprint transitions). |
| `mep1452-myjobs-imagevalid-tab` | Tab "Görüntü Doğrulamaları" (image validations). |
| `mep1452-myjobs-reviewlogs` | "Gözden Geçirme Günlükleri" (review history page). |
| `mep1452-myjobs-status-dd` | Reviews tab with the status filter open. |
| `mep1452-myjobs-module-dd` | Reviews tab with the module filter open. |
| `mep1452-myjobs-approvals-tab` | Attempt to open the "onaylar" tab: **click was refused by the capture tool's dangerous-text guard** (label contains "onay"), so this capture shows the default Reviews tab. Not an approvals capture. |
| `mep1452-setup-approval-process` | Setup > Onay İşlemleri list (empty). |
| `mep1452-setup-review-process` | Setup > Gözden Geçirme Süreçleri (empty state). |
| `mep1452-setup-feed-settings` | Invalid-URL page (guessed route); evidence that no such route exists. |

## 2. Feeds (company wall)

Screen S-F1: Feeds tab route (`mep1452-feeds-wall`).

1. Shell stays rendered behind a dimmed overlay (left rail, top bar unchanged).
2. Centred modal, white, large radius, at top of the viewport:
   1. Red "prohibited" icon (left of title).
   2. Title "İzin Reddedildi".
   3. Body "Bu işlemi gerçekleştirmek için yeterli izniniz yok. Yöneticiniz ile irtibata geçin."
   4. Primary-outlined button "Tamam" (autofocused, bottom right) — dismisses the dialog.
3. No tab, filter, composer or post is rendered. Inventory size: 4 controls/elements.

Nothing else on Feeds can be described from observation. Facts from metadata only: Feeds is a default (system) module, tab enabled but not visible to this user/profile; Deals has `feeds_required: true`, which suggests a per-module "feed" requirement flag, whose meaning is unverified.

Rail/top-bar context: the left rail of this build does not list Feeds at all; the top bar has the bell icon (entry point for notifications; not opened). Related existing specs: `app-shell.md` (rail and bell), `chat-module.md` (the separate bottom chat bar), `record-detail.md` (Timeline).

## 3. My Jobs / Approvals

### 3.1 Page frame (S-J1, `mep1452-myjobs-entry`)
Route: the `Approvals` module tab; rail label and page title "İşlerim". Rail entry sits in the module list (not in the pinned group) with a briefcase icon and is shown as selected.

Numbered inventory (default state, Reviews tab selected):
1. Page title "İşlerim" (top bar, left).
2. Tab strip, 4 tabs, each = label + rounded count badge (all show 0):
   1. "Şema Geçişleri 0" — Blueprint transitions waiting for me.
   2. "onaylar 0" — approval-process items waiting for me (label is lower-case in the reference; keep as is).
   3. "İncelemeler 0" — review-process items; **selected by default** (underline, bold label).
   4. "Görüntü Doğrulamaları 0" — image validations.
3. Link-style button at the end of the strip "Gözden Geçirme Günlükleri" — opens the review-history page (S-J5).
4. Reviews table (card with rounded border), header columns left→right: "Kayıt Adı", "Gözden Geçirilecek Alan Sayısı", "Tüm Durum ▾" (status filter), "Oluşturan", "Gönderme Tarihi", "İşlem Adı", "Tüm Modüller ▾" (module filter), "Düzen" (column/layout control; clipped at the right edge in the capture).
5. Empty state centred under the header: "İnceleme Bekleyen Kayıt Yok".
Inventory: 1 title + 4 tabs + 4 badges + 1 link + 8 column headers + 2 filters (among the headers) + 1 empty message.

Data calls on load (shapes only): count of approval-process items for the approver (`GET …/Approvals/actions/count?approver=…&type=approval_process` → `{count}`), a features count (`GET …/Approvals/actions/features_count` → 4 `{name,count}` entries = the four tabs), and the active tab's list (`GET …/Approvals?type=review_process&per_page=10&page=1`, 204 = empty). Paging parameters are `per_page` and `page`.

### 3.2 Reviews status filter (S-J2, `mep1452-myjobs-status-dd`)
Dropdown opens under "Tüm Durum", with a search box (focused) and a single-select list, current value check-marked:
1. "Tüm Durum" (default)
2. "Gözden geçirme için bekliyor" (waiting for review)
3. "İnceleme Sürüyor" (review in progress)
4. "Yeniden gözden geçirme için bekliyor" (waiting for re-review)
5. "Reddedildi" (rejected)
The arrow flips up while open. Review states therefore: pending → in progress → rejected / re-review.

### 3.3 Reviews module filter (S-J3, `mep1452-myjobs-module-dd`)
Dropdown under "Tüm Modüller" (opens right-aligned): search box, then "Tüm Modüller" (checked) followed by module names (observed: Müşteri Adayları, Kişiler, Firmalar, Satış Fırsatları, Ürünler, Teklifler, …; list scrolls). Single select; the module set is the modules that can carry a review process.

### 3.4 Blueprint tab (S-J4a, `mep1452-myjobs-blueprint-tab`)
Header columns/filters: "Kayıt Adı", "Tüm Modüller ▾", "Tüm Sahipler ▾" (owner), "Tümü ▾" (a third filter, values not opened). List call `GET …/Approvals?type=blueprint&per_page=10&page=1` (204, empty). No empty-state text was captured.

### 3.5 Image validations tab (S-J4b, `mep1452-myjobs-imagevalid-tab`)
Columns: "Kayıt Adı", "Tüm Modüller ▾", "Oluşturan:", "Hata Durumundaki Eylem", "Bekleyen Resim Sayısı". Empty state "Bekleyen onay yok". Calls: `GET …/settings/zia/visions` and `…/visions/approvals/actions/total_records?page=1&per_page=10` (both 204). The reference logged a client error while parsing the empty visions response (empty-state robustness bug in the reference; do not replicate).

### 3.6 Review logs page (S-J5, `mep1452-myjobs-reviewlogs`)
Separate full page (tabs gone), title "Gözden Geçirme Geçmişi", right link "Gözden geçirilecek kayıtlara dön" (back to the queue). Row of four dropdown filters: "Tüm Modüller ▾", "Tüm Kullanıcılar ▾", "Tüm Eylemler ▾", "Herhangi bir zaman ▾" (date range). Empty state "Görüntülenecek kayıt yok". Calls: `GET …/Approvals/history?action=All Actions&type=review&per_page=20` (204) and `GET …/Approvals/history/meta?type=review` → `{data:{actions:[6 × {display_value,value}], modules:[13 × {display_label,name}], users:[3 × {name,id,email}]}}`, i.e. the filter option lists are served by a meta call (6 actions, 13 modules, 3 users in this org).
Inventory: 1 title + 1 link + 4 filters + 1 empty message.

### 3.6a Not observed
"onaylar" tab (guard-refused, §1); any non-empty row; row click/detail; approve / reject / delegate buttons and their dialogs; comment-on-decision fields; "Düzen" panel contents; bell panel. The reference's own list of job kinds is, per the four tabs: Blueprint transitions, approval processes, review processes, image validations.

## 4. Setup screens (read-only navigation)

### 4.1 Onay İşlemleri (S-A1, `mep1452-setup-approval-process`)
Settings area, left settings rail with "Onay İşlemleri" selected under group "İşlem Yönetimi" (siblings: Şema, Gözden Geçirme Süreçleri, Bağlı İş Akışı). Content card:
1. Title "Onay İşlemi" and subtitle "Onay sürecini kullanarak bir veya daha fazla yöneticiden onay için kayıt gönderimini otomatikleştir."
2. Orange announcement banner (dismiss "×"): announces a redesigned approval-process builder with named steps, precise rules and assignees; buttons "Önizleme Oluştur" (primary), "Yeni Görünüme Geç" (outlined), link "Yenilikler?"; auto-migration date stated in the banner. (Product-marketing content; not to be replicated.)
3. "İşlemleri Yeniden Düzenle" button (disabled: nothing to reorder).
4. Table header: "İşlem Adı", "Modül ▾" (filter: Tümü, Müşteri Adayları, Kişiler, Firmalar, Satış Fırsatları, Görevler, Toplantılar, Aramalar, Ürünler, Teklifler, Satış Siparişleri, Satın Alma Siparişleri, Faturalar, Kampanyalar, Tedarikçiler, Fiyat Listeleri, Servis Dosyaları, Çözümler), "Yürütme Eşiği ▾" (Tümü / Oluştur / Düzenle — trigger on record create or edit), "Cetvel" (schedule), "Durum ▾" (Tümü / Aktif / Etkin Değil).
5. Empty state "Onay işlemi yapılandırmanız yok" and primary button "+ Onay İşlemi Ekle" (not pressed).
Inventory: 1 title, 1 subtitle, 1 banner (3 actions + close), 1 reorder button, 5 columns (3 filters), 1 empty message, 1 add button.
Findings: approval processes are per-module (18 modules offered), triggered on create/edit (and a schedule column), have an active/inactive status and an order. Module list for approvals is wider than our Phase-1 modules.

### 4.2 Gözden Geçirme Süreçleri (S-A2, `mep1452-setup-review-process`)
Title, "Yardım" link, centred illustrated empty state with two blurbs: "Bilgilerin El ile Gözden Geçirilmesi" (organisation requires submitted information to be verified manually, field by field) and "Bilgi Toplamayı İyileştir" (identify problems through detailed reports), with a "Yeni Süreç Oluştur" button below the fold (text seen in the page, not pressed). Calls: list (`GET …/settings/review_process`, 204) and counts (`…/review_process/actions/count` → `{total_count, active_count}`).

### 4.3 Feed settings
No reachable screen (guessed route rejected). Open question Q3.

## 5. Flows

Observed (all empty-state only):
1. Open My Jobs → counts load → Reviews tab list loads (204) → empty message.
2. Switch tab → one extra list call with `type=blueprint|review_process|…`; the tab strip, counts and review-logs link stay.
3. Open status/module filter → searchable single-select list; selection (not performed) would refetch the list.
4. Review logs link → history page with 4 filters whose options come from a meta call; back link returns to the queue.

Documented/unobserved (do **not** build from this spec alone): post → comment → like → @mention → notification; record change → feed item; follow/unfollow; approve/reject/delegate → history. Nothing could be executed or seen. Existing in-repo sources that touch these ideas: the `Timeline` of a record (History tab) is our current change-log analogue; `home-workqueue.md` row WD09 lists "Jobs: approval, review, Blueprint, image validation; approve/reject/delegate" as documented-only.

## 6. Open questions

1. Feeds wall: the account lacks permission. Can the board grant a view-only profile/permission for Feeds (a **board** action; never done by agents in the reference), or provide board-made screenshots of the wall, composer, comment/like row, filters, follow entry points and record feed? Without them the Feeds UI cannot be copied one-to-one.
2. Approval items: can the board point to a pending approval (or screenshots of one) so the "onaylar" tab, item detail, approve/reject/delegate dialogs and approval history can be captured? The capture tool's guard refuses any control whose label contains "onay"; opening the tab needs a board-authorised exception for that single, non-submitting tab click.
3. Where would feed settings live, and are they a Setup screen at all in this build?
4. Does the bell panel mix feed events (mentions, follows, record updates) with approvals/tasks? Opening it may mark items seen, so it needs board approval or board screenshots.
5. Is `feeds_required: true` on Deals a "feed enabled for the module" switch, and what would it gate?
6. Is "onaylar" (lower-case) a translation defect in the reference? We copy it only if the board confirms.
7. Delegation: not visible; is there reassign-on-behalf, and which statuses exist beyond the five review states (waiting, in progress, waiting re-review, rejected)?
8. Approval-process setup new-view builder ("Yeni Görünüme Geç") was not opened; its step/rule/assignee model is unseen.

## 7. Data-model sketch (input for ADR 0018)

Labels: **[O]** observed in the reference, **[P]** proposed by us, unverified.

Feeds **[P]** (nothing observed; keep minimal until Q1 is answered):
- `feed_post` (id, author_user_id, body, record_ref nullable (module + record id), group_id nullable, created_at, deleted_at) — a wall post, optionally attached to a record.
- `feed_comment` (id, post_id, author_user_id, body, created_at).
- `feed_like` (post_id or comment_id, user_id, created_at; unique per user+target).
- `feed_follow` (user_id, record_ref | user_id | module, created_at) — follow/unfollow of records and people.
- `feed_item` (derived/materialised): event_type (field_changed, note_added, task_created, record_created, status_changed), actor_user_id, record_ref, payload (changed fields before/after), created_at. Source: the existing audit/timeline events of Notes, Activities, record edits; one write path that emits an event, fan-out by follow relation at read time (no per-user inbox table at first).
- Mentions: parsed from body into `feed_mention` (post_id|comment_id, user_id) and surfaced through the existing notification mechanism.
- Visibility **[P, depends on Feature D]**: a user sees a feed item only if they may read the underlying record (same record-level access as the list/detail endpoints: profile read permission for the module + role-hierarchy/sharing-rule visibility); posts without a record ref are visible to all active users unless a group is set (members only). Field-level changes shown in `payload` must drop fields the viewer's profile cannot read. Feeds module access itself is a profile permission (the reference denies it to this account).

My Jobs / Approvals:
- Four job kinds **[O]**: blueprint transition, approval process, review process, image validation. For our scope the proposal is to implement **approval process** and **review process** only; blueprint and image validation tabs stay as visible but empty/disabled tabs if the board wants parity.
- `approval_process` **[O fields from setup list]**: id, name, module, execution trigger (on create / on edit / both), schedule (nullable), status (active / inactive), position (reorder). **[P]** steps: ordered list of {step name, criteria, approver set (user, role, or group), required count}, plus on-approve/on-reject action hooks (field update, notification).
- `approval_request` **[P]** (the "item" in the queue): id, process_id, record_ref, submitter_user_id, submitted_at, current_step, status (pending, approved, rejected, delegated, recalled), approver candidates.
- `approval_decision`/history **[O column set for review logs: module, user, action, time; action list has 6 values, not read]**: request_id, step, actor_user_id, action (approved, rejected, delegated, reassigned, recalled, …), comment, acted_at.
- `review_request` **[O columns]**: record_ref, fields_to_review_count, status (waiting for review, review in progress, waiting for re-review, rejected), created_by, submitted_at, process name, module. Review history = the same decisions filtered by `type=review`, filterable by module, user, action, time range.
- Queue endpoint shape **[O]**: `GET /Approvals?type=<kind>&per_page=&page=` (204 when empty), `GET /Approvals/actions/count`, `GET /Approvals/actions/features_count` (tab badges), `GET /Approvals/history?type=&action=&per_page=` and `GET /Approvals/history/meta?type=` for filter options. Our API should mirror these paths per the one-to-one rule.
- Link to records: `record_ref` = (module, record id); a pending request locks or flags the record (reference behaviour unverified → Q2). Submission is automatic by the process trigger, manual submit is unverified.
- Link to Feature D **[P]**: who may approve = users named by the step's approver set, resolved at request time; approvers need read access to the record regardless of normal sharing (an approval grants a scoped read for the record's displayed fields). Who may see an item in the queue = its current approvers (and admins). Who may create/edit/reorder processes = a Setup permission in the profile (admin-only by default). Every approve/reject/delegate decision is an audited action and must pass an explicit permission check; delegation targets must be active users with read access.

## 8. Suggested slicing after board answers (proposal, not a plan)
1. My Jobs shell: tabs with counts, Reviews table with the two filters, review logs page, all empty states — this is fully specified by the captures above and can be built now.
2. Setup > Approval processes list (empty state, columns, filters, add button) — specified; builder dialog blocked on Q8.
3. Feeds (wall, composer, comments, likes, follow) and approval item detail/decision dialogs — blocked on Q1/Q2.
