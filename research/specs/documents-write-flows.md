# Documents: write flows and permissions

Status: documentation research for MEP-927; MEP-1344 window disposition added
on 2026-10-25, pending independent document review.
Read on 2026-10-20. Complements [Documents](documents.md), approved in MEP-922.
Input to ADR 0008, not an approved implementation or schema.

## Purpose and evidence boundary

Describe documented operations without accessing the reference CRM or running
capture. No writes, downloads, preference changes, screenshots or customer data
were collected. The baseline screen uses an embedded file-service surface;
current Documents help is the working documentation family. Availability in the
specific deployment remains unverified. Legacy library instructions are kept
separate. Generic file-service instructions below describe documented capability,
not proof that every menu is exposed inside Documents.

Sources are cited by article and section beside each assertion. Article names
containing branding are neutralized below; section names are preserved except
where branding is replaced by “file service” or “reference CRM”. No source URLs
are stored. **Unknown** means the reviewed help does not establish the requested
behaviour; it is not permission to choose a convenient default.

## Source register

| ID | Public help article (neutral title) | Family |
| --- | --- | --- |
| A | Documents in reference CRM | Current Documents |
| B | Manage folders in Documents tab | Current Documents |
| C | Manage files in Documents tab | Current Documents |
| D | FAQs: Documents tab (powered by file service) | Current Documents |
| E | Reference CRM – file-service integration | Integration |
| F | Understanding Team Folder roles and permissions | File service |
| G | Add files and folders in My Folders or Team Folders | File service |
| H | Supported files in file service | File service |
| I | View file properties | File service |
| J | Share files and folders internally from a Team Folder | File service |
| K | Share files and folders to external users through email | File service |
| L | Copy or move files and folders | File service |
| M | Delete and restore files and folders | File service |
| N | Data Retention Policy in file service | File service |
| O | Sort and filter files and folders | File service |
| P | Preview and download files | File service |
| Q | Attaching files from file service | CRM attachments |
| R | Uploading Documents, Creating Files, and Other Functions | Legacy library |

## Layout and control relationship

Use the existing control inventory, not a new visual layout. Documentation does
not resolve screenshot-only selectors. D3 corresponds conceptually to team-folder
creation; D4's lock meaning remains unknown. D9/D10 have documented sort/filter
counterparts; D11 has a possible view counterpart. D12/D13 are columns; D14 remains
unidentified. D16 must not be equated with a Properties dialog without evidence.
These are research mappings, not observed interactions.

## Access and folder flows

### My Folders

Documents > My Folders exposes owned-record attachments and does not allow file
or folder creation from Documents. The external file-service interface is a
separate destination. (A — **To access the Documents tab**.)

Managed attachments follow `Apps > reference CRM > module > record > Attachments`.
Only owners see them here, despite shared/hierarchy record access. No add/edit/
delete/external share; templates, upload fields, notes and email attachments are
excluded. (B — **To view the attachments
of a record**.)

Do not implement a personal create-folder flow in this Documents section.
General personal storage in the external service must not override this rule.

### Create, edit and associate team folders

1. Team Folders plus > Create Team Folder > Name > CRM-user Admins;
   without a selection the creator becomes Admin. Assign Organizer/Editor/
   Commenter/Viewer to users, roles or groups > Create.
   (B — **To create a team folder**.)
2. Folder menu > Edit > change name/access > Save.
   (B — **To edit a team folder**.)
3. Plus > Associate Team Folder > select > Associate. Folder menu > Remove >
   Remove Association > Confirm only unlinks; source contents survive.
   (B — **To associate a team folder**, **To remove a team folder**.)

Create/Associate/Edit Team Folder are separate CRM capabilities, independent of
external-service permissions. Even CRM admins need folder access.
(B — **Availability**, introductory **Note**.)

**Unknown:** name constraints, duplicates, membership conflicts, last-admin
removal validation, save errors and success wording (U1/U2).

### Ordinary subfolders and upload sources

In an eligible team location: + New > Folder > name > Create. Editor or higher
can add files/folders. Subfolders can restrict access to selected members.
(G — **To add files and folders**, **2. Create a new folder**.)

Generic service sources include Upload files/Upload folder > select > Open,
drag/drop, and Import from Cloud > provider > authenticate > select file.
Providers listed are Google Drive, Box, Dropbox, OneDrive and Evernote; cloud
import requires successful authentication. (G — **3. Upload a file or folder
from your computer**, **4. Import files from other cloud storage services**.)

The same article gives paid-plan per-file upload ceilings of 10 GB (Starter),
50 GB (Team), and 250 GB (Business). These are not a verified limit for the
connected deployment. (G — **Upload limits**.)

**Unknown:** subfolder naming/duplicate validation and its embedded permission
editor; which generic sources appear in Documents (U1/U3).

## Team membership and permissions

Roles are specific to each folder, not global user roles. (F — **Understanding
Team Folder roles and permissions**.)

| Role | Documented baseline capability | Source section |
| --- | --- | --- |
| Admin | Manage members/settings; add, edit, move, rename, share content | F — Admin |
| Organizer | Add members except assigning Admin; add/edit/rename/share and move within folder | F — Organizer |
| Editor | View/add/edit/copy/rename; cannot share/move/delete | F — Editor |
| Commenter | View/copy/comment/download | F — Commenter |
| Viewer | View/copy/download/sync, subject to restrictions | F — Viewer |

Restricted downloads prevent Viewer and view-only collaborators from downloading
and printing. (F — note on restricted download.)

CRM team-folder role changes synchronize into the file service; the reverse
is not supported. (D — **If I change a user's team folder role in the Documents
tab, will it be synced with file service?**.)

Folder Admin alone changes settings: Manage > Settings controls email uploads,
external sharing, download/print and upload conversion. (B — **To set a team
folder's settings**.) Generic settings affect view and view-and-comment access.
(E — **Manage team folder settings**.)

An item/subfolder share can give a Viewer or Commenter Edit access to selected
content. Therefore the baseline role is not the whole effective permission
model. (J — **Share a sub-folder inside a Team Folder**.)

**D4:** none of the reviewed help explicitly identifies that captured lock glyph.
Do not infer “read-only”, “private”, “checked out” or a particular effective role.
(U2.)

## File operations

### Upload and create

Documents > folder > destination > + New > Upload files > chooser > select >
Open. Folder upload-conversion settings can convert supported files. + New also
creates documents, spreadsheets, presentations and screen/video/audio recordings.
(C — **To upload files from local device**, **To create a file**.)

Upload size depends on edition; file storage and preview support are separate
constraints. The FAQ permits all file types, including ZIP/PDF, and bulk folder
upload. (D — **Are there any limitations or restrictions on the types of files
that can be accessed or uploaded?**, **Can I bulk import or export files and
folders in the Documents tab?**.)

**Same-name handling:** the reviewed upload-help article does not define the
collision prompt, suffixing, replacement or skip behaviour. Do not infer from
migration tools or desktop add-ons. **Unknown:** active-plan limit, simultaneous
file-count cap, same-name decisions, zero-byte/blocked files, partial failures,
progress/cancel/retry and exact quota-error wording (U3/U4).

### Preview and download

Generic service: right-click file > Preview, or select > More actions > Preview.
Folder Download produces a ZIP. (P — **Preview a file**, **Download a folder**.)
Documents: choose location > hover/select file checkbox > Download.
(C — **To download a file**.)

Supported preview examples include documents, spreadsheets, presentations,
images, media, PDF, archives and developer files; upload acceptance does not imply
preview/conversion support. PDF preview lists 250 MB, video 1 GB with a 180-minute
maximum, audio 500 MB, developer files 10 MB. Conversion lists document formats
such as DOCX/ODT/TXT, spreadsheet formats such as XLSX/CSV/ODS, and presentation
formats such as PPTX/ODP. (H — **Supported files for preview**, **Supported files
for conversion**.)

The same source conflicts internally: word-file summary 20 MB versus document
list 10 MB with DOCX exception 50 MB; presentation summary 500 MB versus list
400 MB; ZIP summary 150 MB versus list 2 GB. Do not select a limit silently.
(H — **Supported files for preview**.)

**Unknown:** supported preview table for the target edition, unsupported/oversize
messages, loading failures, download denial UI and multi-download packaging (U5).

### Versions and check-out

Documents: select file > more > Check Out > confirm Check Out. After editing,
select > more > Check In > version note > Check In. Discard Check Out has a
separate confirmation. (C — **To check out and check in a file**.)

Generic service: More actions > Properties > Versions > Upload new version >
Choose a file > Upload New Version (non-native files). Built-in editor versions
live in their editors. Preview/download, restore as top without overwriting,
save as new, keep forever and delete are available. Private-folder version
viewing requires Editor+; public-folder members can view. Organizer/Admin can
delete/restore versions during retention. (I — **Versions**, **Restore
versions**.)

Team-folder files support versioning; record attachments in My Folders do not.
(D — **How will version control be handled for files in the Documents tab?**.)

**Unknown:** exact checkout authority/lock error, version-note validation,
filename/type compatibility, version-number format and concurrent-upload
behaviour (U6).

### Rename and move

Editor+ can rename files/ordinary folders (F — **Editor**, **Organizer**, **Admin**).
The reviewed current CRM help does not give a file-rename dialog sequence.
Team-folder rename uses Edit/Save as above. Do not copy a desktop add-on's rename
flow into Documents. **Unknown:** embedded file-rename steps and validation (U7).

Generic move: select > right-click Move to (or More actions > Move to) > select
destination > Move. Organizer/Admin can move within a team folder. Moving out
requires source Admin; moving to another team/shared folder also requires
Editor+ at destination. Destination permissions matter; general personal-to-team
moves retain prior shares alongside destination access, except external shares
when the destination forbids them. These rules do not authorize moving managed
record attachments. (L — **Move files and folders**, **Permissions and limitations
to move files and folders**.)

**Unknown:** embedded destination choices, name conflicts, circular/descendant
moves, partial moves and cross-folder share warnings (U7).

### Trash, restore, unlink and permanent deletion

Documents: select file > more > Move to Trash. Restore through Manage > Trash >
select > Restore. To remove from Trash: select > Delete > confirm Delete.
(C — **To move a file to trash**, **To delete a file permanently**.)

Generic trash flow additionally specifies a Move to Trash confirmation. Trashing
shared content removes it for collaborators; restore returns to original
location. Organizer/Admin can trash and restore. (M — **Move a file or folder to
Trash**, **Restore a file or folder from Trash**.) Only folder Admin deletes
items from Trash. Associated team folders must be unlinked before source-service
deletion. (E — **Delete files and folders**, **Manage team folder settings**.)

Retention can route trash-deleted items to administrator Deleted Items before
final erasure. Trash policy documents indefinite retention or 7/15/30/90/120 days;
Deleted Items uses 7/30/90/120 days. (N — **Data Retention Policy for Trash in My
Folders and Team Folders**, **Data Retention Policy for Deleted Items in Admin
Console**.) Another help page restricts Data Administration by plan and gives a
narrower auto-delete list. (M — final Data Administration note.)

**Unknown:** actual retention/edition, confirmation presence in embedded trash,
restoration when parent is absent/name taken and impact on existing linked record
attachments (U8). A team-folder Remove action is disassociation, not trashing.

### Sharing and links

Documents: select file(s) > Share > choose people and access level.
(C — **To share a file**.)

Generic internal sharing: select > Share > recipient email > access > optional
message/expiry > Share. Members already inherit team-folder access. File levels
include Share, Edit, View and comment, View (plus editor-specific field-value
access); folder levels include Organize, Edit, View and comment, View. Whole-team
sharing uses Change Visibility beside Permalink > Anyone in the Team > access/
expiry > Save > Copy. Stop individual sharing via access dropdown > Remove
access; whole-team visibility can be narrowed again. (J — **Share a file or folder
with members who are NOT part of your Team Folder**, **Share a file or folder
with your entire team**, **Remove or stop sharing files or folders**.)

External email sharing: select > Share > email addresses > access level.
(K — **Share a file or folder through email to external users**.) Generic
integration supports direct email, team/internet access, download links, embed
codes and custom external links; Organizer+ shares team content.
(E — **Share files and folders**.)

**Unknown:** embedded link-generation dialogs, password/expiry validation,
revocation effects, disabled-share messaging, recipient errors and whether each
link type is available in the active plan (U9).

## Sorting, filtering, view and Details

| Controls | Documented service capability / boundary | Source section |
| --- | --- | --- |
| D9 | Sort by Name/Extension/Type A–Z or Z–A; Last Modified/Time Created oldest or newest; Size smallest/largest. Shared Time only in Shared with Me. Sorting affects the current user's view. | O — Sort files and folders |
| D10 | Filter categories: Folders, My Drafts (team only), Documents, Spreadsheets, Presentations, PDF, Images, Audio, Video, Links; one or more selections update the list. | O — Filter Files and folders |
| D11 | Thumbnail, List, Compact are documented; identification of this exact glyph remains uncertain. | D — Can I change the view of files and folders in the Documents tab? |
| D12–D13 | Header-click sorting/cycle/tie-breaking is not established by reviewed help; baseline only shows descending modification indicator. | documents.md; U10 |
| D14 | Column-plus action/options remain unidentified. | documents.md; U10 |
| D16 | Properties is documented, but mapping it to this Details strip is unproven. | I — General Info; U11 |

Generic Properties: select > More actions > Properties. General Info includes
format, creator/time, modifier/time, latest-version size, all-version storage,
permalink and comment/view/download counts. Activity and Access Stats have plan
and permission gates. (I — **General Info**, **Activity**, **Access Stats**.)

**Unknown:** D16 fields for folders/no selection, default panel, persistence and
whether the same tabs appear embedded (U11). No sort, filter or panel preference
was changed during this research.

## Relationship to record attachments

Legacy help explicitly documents record > Attachments > Documents > select files
> Attach, allowing one document to link to multiple records. This is **legacy
only**; it does not prove current picker or storage semantics.
(R — **Attach Files from Documents Tab**.)

A separate current attachment integration documents record > Attachments >
Attach > file-service source > select > Pick > sharing settings > Share. It
attaches links, with access for anyone in team, anyone with link, or existing
permitted members. It lists up to ten files per operation and no size ceiling for
this link-attachment action; these are not Documents-upload limits.
(Q — **Sharing documents through file service**, **Attaching files from file
service**, **Attaching files from multiple teams**.)

Managed record attachments must be added from record detail, not by uploading
into their Documents tree. Ownership transfer moves the attachment folder to
the new owner. Deleted record attachments use the CRM recycle bin (60 days),
separate from ordinary document Trash. (D — **Will I be able to add attachments
to records through the Documents tab or via file service?**, **What happens to
the attachments in the Documents tab when a record owner is changed?**, **What
are data recovery options for attachments and files stored in the Documents tab?**.)

**Unknown:** whether the captured Attach > Documents option opens the legacy
selector, a current embedded picker, or another adapter; deduplication, linking
versus copying, access after unsharing, and version propagation require a decision
or stronger public evidence (U12). Preserve this distinction in ADR 0008.

## Validation, success and errors

The cited steps establish operations and outcomes, not literal toast text.
For every flow above, exact success/error messages, field error placement,
required markers, cancellation and retry states remain **unknown** unless
explicitly described. “Create”, “Save”, “Delete” and “Confirm” above are action
labels, not claimed success messages. Do not manufacture reference wording.

| Flow | Established validation/access boundary | Unspecified result UI |
| --- | --- | --- |
| Team creation/edit | CRM profile capability; CRM-user admins; creator fallback (A/B above) | Name rules, invalid membership, success/error U1/U2 |
| Subfolder/upload | Editor+; cloud authentication; plan/storage limits (G above) | Name/file validation, partial success/quota UI U1/U3/U4 |
| Preview/download | Format/size capability and download restrictions (F/H above) | Unsupported/denied/loading/network UI U5 |
| Versions/rename/move | Role and location gates (F/I/L above) | Collision, concurrent operation, lock/result UI U6/U7 |
| Trash/restore | Organizer/Admin; Admin removal; retention (C/E/M/N above) | Missing parent/conflict/retention result UI U8 |
| Share/attach | Role, recipient access and attachment origin (E/J/Q above) | Invalid recipient, expiry, revoked link, result UI U9/U12 |

## Open questions and resolution ownership

These are bounded evidence gaps, not reasons to execute reference writes.
UI Lead reviews screen/wording gaps; Platform Lead reviews access/lifecycle
conflicts; CTO resolves scope and ADR decisions. MEP-928 may inspect only safe
read-only states; anything requiring a write stays undocumented or requires a
board decision through the owning lead.

| ID | Unresolved question | Owner / safe resolution |
| --- | --- | --- |
| U1 | Empty/whitespace/length/reserved characters, duplicate folder/file names and required-name messages? | UI Lead; public help or decision |
| U2 | What exactly is D4's lock, what member editor is exposed, how are conflicting role/group grants and last-admin removal handled? | UI Lead + Platform Lead; MEP-928 for safe identity, permission decision separately |
| U3 | Which upload sources, exact active-plan byte/count ceilings and nested-folder restrictions apply? | Platform Lead; edition evidence/public help |
| U4 | Same name+extension: replace/version/keep/skip, auto-suffix, extension case, mixed failures, cancellation/retry? | UI Lead + Platform Lead; public upload help/decision |
| U5 | Resolve inconsistent preview limits; unsupported, oversize, permission and download errors? | Platform Lead + UI Lead; MEP-928 for existing preview only |
| U6 | Version retention/numbering/restore authority, checkout locks and concurrent upload errors? | Platform Lead; public help/ADR |
| U7 | Embedded file rename sequence, move collisions/cycles and effective-share changes? | UI Lead + Platform Lead; public help/decision |
| U8 | Active trash/Deleted Items policy and plan mismatch, restore collisions, permanent-deletion terminology and attachment-link effects? | Platform Lead; ADR |
| U9 | Available share link types and their full dialogs, validation and revocation behaviour? | UI Lead + Platform Lead; public help/decision |
| U10 | D11/D14 identity and options; header sorting, reset and persisted preferences? | UI Lead; MEP-928 safe evidence only |
| U11 | D16 exact file/folder/no-selection contents and persistence? | UI Lead; MEP-928 without preference toggles |
| U12 | Current Attach > Documents picker contract and attachment/document identity, storage and lifecycle relationship? | Platform Lead + UI Lead; reconcile existing attachment spec and public help before ADR |
| U13 | Literal validation, success/error text and empty/loading/partial/permission states for all flows? | UI Lead; public help or explicit decision, never trial writes |

## Data-model requirements for ADR 0008

The following are analyst-derived requirements from the cited flows, not a
reference schema export. Documents lacks exported fields/layouts (documents.md).
ADR authors must choose representation and resolve U1–U13 before encoding unknown
behaviour as constraints.

| Concept | Required information and relationships | Derivation |
| --- | --- | --- |
| Folder space | Personal managed-attachment root versus collaborative team root; parent/child tree; display name; creator/modifier/times | A/B/G |
| Team-folder association | Source folder identity distinct from CRM association; unlink must preserve source contents | B/E |
| Membership/grant | Folder + user/group/CRM-role principal + folder role; item-specific grants and effective permissions | B/F/J; conflict precedence U2 |
| Folder policy | External-share, email-upload, download/print and conversion flags; capability/plan gates | B/E/G |
| File | Stable identity, parent, name/extension/format, latest version, size, creator/modifier/times; distinguish managed record attachment | G/H/I/L/Q |
| Version | File relation, payload reference, size, notes, order/current pointer, retention state; native-editor distinction | C/I; numbering U6 |
| Checkout | File, actor and lock state; check-in/discard transition | C; expiry/conflicts U6 |
| Share | Item, principal/audience, access level, expiry and revocation; permalink versus external-link identity | E/J/K/Q; exact link fields U9 |
| Trash entry | Item, originating location, deletion state and retention/restore eligibility; separate administrator recovery stage | C/M/N; active policy U8 |
| Record attachment | Record/module/owner relation; source kind (managed upload versus document link); file association distinct from attachment identity | B/D/Q/R; copy/link boundary U12 |
| Storage capability | Per-file, aggregate and preview/conversion limits independent of link-attachment selection limits | D/G/H/Q |
| Read models | Optional activity/stats and selected version; distinguish latest size from cumulative storage | I; embedded Details U11 |
| View preference | Per-user sort/filter/view state if implementation requires it; independent of content permission | D/O; persistence and columns U10 |

Required permission checks include CRM tab/profile gates, folder membership,
item grants, source/destination move rights, download/share policies, version and
trash authority, and record access versus ownership. Enforce these independently;
a global “can edit documents” flag cannot express the documented distinctions.

## W2 observation-window disposition (MEP-1344)

### Decision and evidence boundary

The Platform Lead's final decision in MEP-1355 explicitly applies to W2–W4:
unsupported flows remain **not observed, gap**. W0 completion (MEP-1342) proves
the guarded tool was reviewed; it does not establish a live Documents policy,
write request format, success response or verified cleanup contract. W1
(MEP-1343) completed with the same documentation-only disposition.

At this checkpoint the local window directory contains only the empty change-log
scaffold, with no policy file or transaction rows. The W2 issue has no published
`capture-write-window-policy` block. The required board-authored recipient
confirmation is also absent; no agent substitutes its own comment for it.
The tool's supported contract in [the window guide](../../docs/capture-write-window.md)
rejects multipart uploads, unknown request formats and frame selectors for write
controls. Documents uses an embedded file-service surface. Synthetic JSON routes
are not evidence of that surface's write or cleanup behavior.

No reference session was opened for MEP-1344, and no new screenshot, control
inventory, request trace or literal result message was collected. Existing
documentation and safe baseline evidence above remain at their original evidence
level. No new public-source claim is introduced by this addendum.

### U1–U13 coverage

All thirteen questions remain unresolved for live deployment behavior. This table
records the requested observation and the precise remaining evidence gap; it does
not replace the documented capabilities or ownership table above.

| ID | Requested W2 observation | Window result and remaining gap |
| --- | --- | --- |
| U1 | Create a test folder and subfolder; exercise name validation | Not observed, gap: required/blank/length/reserved-name and duplicate messages remain unknown. |
| U2 | Create a test team folder and edit its members | Not observed, gap: embedded member editor, grant precedence, last-admin handling and lock meaning remain unverified. |
| U3 | Upload a small test file and inspect available sources | Not observed, gap: multipart upload is unsupported; actual sources, byte/count limits and nested restrictions remain unknown. |
| U4 | Upload the same filename again | Not observed, gap: replacement/version/keep/skip options, suffixing, mixed failures and retry/cancel behavior remain unknown. |
| U5 | Preview and download the test file | Not observed, gap: no test file was created; actual preview limits, unsupported/loading/permission errors and download packaging remain unverified. |
| U6 | Upload a version; check out, check in and discard checkout | Not observed, gap: authority, lock conflicts, note validation, numbering, retention and concurrent-upload outcomes remain unknown. |
| U7 | Rename and move test content | Not observed, gap: embedded dialogs, collision/cycle validation, destination permissions and share-change warnings remain unknown. |
| U8 | Trash, restore and permanently delete only test items | Not observed, gap: no owned test item or verified delete/purge contract exists; retention, restore conflicts and linked-attachment effects remain unknown. |
| U9 | Share test content internally without creating an external link | Not observed, gap: recipient/access validation, notifications, revocation and embedded dialog availability remain unknown. External-link creation stays outside W2 scope. |
| U10 | Change and restore sort/filter/view preferences | Not observed, gap: no exact read/write/restore setting contract exists; comparator, header cycle, persistence and D11/D14 identity remain unknown. |
| U11 | Open Details for file, folder and no selection | Not observed, gap: no preference-changing panel action was attempted; D16 contents, tabs and persistence remain unverified. |
| U12 | Attach a document to an owned test record | Not observed, gap: no owned test record or safe attachment/cleanup contract exists; picker identity, link/copy semantics and lifecycle remain unresolved. |
| U13 | Capture validation, success, error, empty/loading/partial/permission states | Not observed, gap: no literal messages or new state captures are claimed for any W2 flow. |

### Restore statement and follow-up boundary

MEP-1344 created no test folder, file, version, team membership, share, attachment
or record; it changed no preference or setting and initiated no download or
notification. There is no issue-scoped mutation to restore. The empty journal is
consistent with that statement; it is not proof of other issues' activity and
does not replace the W5 global cleanup report (MEP-1347).

This is completion of the window gap record, **not functional parity approval**
and not acceptance of ADR 0008's proposed write behavior. U1–U13 and their
existing decision owners remain open. No ADR status, permission or data contract
is changed. Under MEP-1355, a future live flow requires the actual board
confirmation, a single-flow contract derived from read-only evidence, and a
separate high-tier issue with Platform Lead and CTO approval. The decision
forbids starting that path after the cleanup cutoff; this document grants no
exception to the window expiry.
