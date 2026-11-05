# Roles, profiles, users and data sharing (Feature D research)

Source: read-only captures of the reference CRM setup area (Users and Control), taken with the capture tool, plus the metadata export and public documentation where marked. Names of people are replaced by "User A/B/C". UI language of the reference is Turkish; labels are given in English with the Turkish label in parentheses where it helps parity.

Captures (research workspace only, never committed): `captures/mepd-users`, `mepd-profiles`, `mepd-profile-admin`, `mepd-profile-standard`, `mepd-roles`, `mepd-role-manager`, `mepd-datasharing`, `mepd-sharingrules2` (tab click, see §5.2), `mepd-groups`, `mepd-territories`; plus the earlier `setup-leads-field-permissions`.

Setup navigation: left panel group "Security Control" (Güvenlik Denetimi) lists: Profiles, Roles and Sharing, Mail add-on users, Compliance settings, Territory management, Trusted domain, Support access, SSO, Security policies, AD sync, Login history, Audit log. "Users" sits in the "General" group. "Profiles" is also in the "Frequently used" group.

## 1. Users (Kullanıcılar)

Route: `/settings/users` (opens with the first user selected; detail is a master–detail split, not a separate page). Tabs on top: **Users**, **Groups**, **Activate Users** (Kullanıcıları Etkinleştir).

Inventory (list pane, left):
1. Status filter dropdown, default "Active Users (3)" — switches the list between active/inactive etc. (options not opened; open question Q1).
2. Primary button "New User" with a split caret (secondary menu, not opened; Q2).
3. Select-all checkbox + search box ("Search") above the list.
4. Per-row checkbox (hidden for the signed-in super admin row), avatar with a presence dot (green = signed-in/online, grey = offline), full name (upper-case), "Role, Profile" line, e-mail (ellipsis truncation). The super-admin row shows a coloured "Super Admin" pill in place of the profile name.
5. Selected row has a light highlight and an avatar ring.

Detail pane (right):
6. Header: large avatar, full name, "Super Admin" badge (only for the organisation's super admin), pencil icon (edit; not opened), line "Role / reporting-to user" (role name, then the manager's name), e-mail with envelope icon.
7. "Hide details / Show details" collapse link.
8. Section **User Information**: First Name, Last Name, Email, **Role**, **Profile**, Alias, Phone, Mobile, Website, Fax, Date of Birth; **Address Information**: Street, City, State, Zip, Country; **Audit Information**: Created By (+time), Modified By (+time), Invited By, Confirmed Time, Status Updated By; **Teamspace information** ("Associated with": a chip per teamspace); **Localization**: Language, Country locale, Date format, Time format, Time zone, Preferred distance unit, Number format; **Groups** (member-of list, "-" when none, with an add-to-group control); **Display name format and preferences**: name-format dropdown (six orderings of Salutation/First/Last) and sort-order dropdown (First, Last / Last, First).

States: super admin has no row checkbox and no delete; the role shown for the super admin is the top role. Counts in the status filter label are live (3 active users, licence limit 25 from metadata).

Rules visible: each user has exactly one role and one profile; role provides record access (hierarchy), profile provides permissions. There is no per-user permission screen.

## 2. Profiles (Profiller)

### 2.1 List — `/settings/profiles`
1. Page title + help text ("A profile is a set of permissions…").
2. Search box ("Search").
3. Primary button **New Profile** (not opened; Q3).
4. Table, columns: Profile Name (link), Profile Description (truncated with an inline "More" link that expands), Created By, Modified By (both empty for the two system profiles).
5. Rows: 2 profiles, both system-defined: **Administrator** and **Standard**. No row actions, no delete icon for system profiles.

### 2.2 Profile detail — `/settings/profiles/:id` (view mode)
Header: back arrow + "Profile: <name>", buttons **Clone** (Kopyala) and **View Users**.
Left nav (anchors): *Module Permissions* → Basic, Import/Export, Send Email, Tools, Other; *Set Permissions* → Administrator Level, Email & Templates, Automation, Web form, Data Management, AI assistant, CPQ; *Extension Permissions* → first-party apps, Google, Microsoft, Others, Social; *Developer Permissions* → API Access, Manage Extensibility, Manage CRM Variables.
Content (each row = permission name, a toggle (shown on = granted) and, where relevant, a read-only summary of sub-actions):

- **Basic permissions** (one row per module; toggle = module enabled; dropdown summary of allowed actions): Leads, Contacts, Accounts, Deals, Tasks, Meetings, Calls, Quotes, Sales Orders, Purchase Orders, Invoices, Products, Campaigns, Vendors, Price Books, Cases, Solutions — each "View, Create, Edit, Delete"; Reports "View, Manage, Schedule, Export"; Analytics "View, Manage, Export"; Documents "View, Create team folder, Associate team folder, Edit team folder"; Insights "View"; Visits "View, Delete" (Administrator only); Notes "View, Create, Edit, Delete"; Attachments "View, Create, Delete".
- **Import/Export:** Import Records (module list "Leads, Contacts, Accounts, Deals & N more"), Export (list with N more). Counts differ per profile (Administrator 18 vs Standard 16 exportable modules).
- **Send Email:** Show email permissions, Send Email, Mass Email, Delete Email, Mail Merge (each: module list).
- **Tools:** Mass Update, Mass Delete, Change Owner, Mass Transfer, Convert (Leads, Quotes, Sales Orders), Bulk Convert, Share, Lock, Print View, Page View, Find & Merge, Manage Views (chart/custom/kanban/split/timeline), Tags, Only list subordinates, Record timeline, Manage Deal team, Manage Support Access, Override Forecast.
- **Administrator-level permissions:** User Management (Users, Roles, Profiles, Groups, Data Sharing), Manage Teamspace, Manage Compliance Settings, Module Customization, Manage Portals, Create Team Module, Manage Portal User, Manage Calendar Record, Manage Currencies, Manage Domain Mapping, Manage Motivator, Customize Home Page, **View All Records**, **Modify All Records** (module lists), note: only Administrators may customise Company Details, Fiscal Year, Business Hours, Territory Management, Remove Duplicates, CRM Variables.
- **Email & Templates:** Email & chat settings, Manage templates. **Automation:** Cadences, Manage Automation, Event forwarding rules, CommandCenter, Assignment rules and threshold, Connected workflow, … **Data management, AI assistant, CPQ, Quick view dashboard widget, Recent actions**, extension and developer permissions as listed in nav.
- Info banner: "This is a system-defined profile; you can only change basic permissions and a few extension permissions. Clone it or create a new profile to manage other permissions." (Standard has the same note.) Banner note: Home, Feeds and Approvals tabs are visible to all profiles based on organisation settings.

Administrator vs Standard difference (diffed from captures): Standard lacks Visits permission row, has no *User Management* sub-actions, no "View All / Modify All Records" scope lists, export list shows 16 instead of 18 modules, print-view list 13 instead of 14. Everything else is identical. Standard = "all permissions except administrative privileges".

Rules: profile permissions are module-level and action-level, additive; profile determines *what* a user may do, never *which records*. "Only list subordinates" (Tools) limits assign/share/mention user pickers to subordinates in the role tree. "View All / Modify All Records" bypass role hierarchy and sharing for the listed modules.

### 2.3 Field-level permissions
Not on the profile page. They live per module under Setup → Modules and Fields → <module> → "Field Permissions" (capture `setup-leads-field-permissions`): one table per profile (tab per profile, here Administrator) with columns **Read and Write / Read Only / Don't Show** (radio per field), top buttons "Field Listing" / "Create and Edit Fields". Read-only inspection only; saving is a write. Metadata fields carry `visible`, `read_only`, `field_read_only`, `view_type` flags.

## 3. Roles (Roller)

### 3.1 Roles tree — `/settings/roles`
Tabs: **Roles**, **Data Sharing Settings**.
1. Title and help text.
2. Button **New Role** (Q4).
3. Links "Expand All | Collapse All".
4. Tree: root node = organisation name (not a role), then roles nested by reporting line, each node with a +/– toggle and dashed connectors. Captured tree: org → CEO → Manager (2 roles). Role names are links to the detail page.

### 3.2 Role detail — `/settings/roles/:id`
Rows: Role Name, Reporting To (parent role name), **Share data with peers** ("Aynı Seviyedekilerle Paylaşım": checkbox-style value, empty/blank when off, ticked when on), Description. Buttons: **Edit**, **Delete**, "Go to roles list". Table "Associated users": Name, Email address, User status, Confirmation status, with a "1 to 2" pager line.
Rules: the top role (CEO) has no Reporting To and cannot be deleted; its metadata description says users with it access data owned by all others. Managers (parents) see records of all subordinates (hierarchy grants access upwards, never downwards or sideways). "Share with peers" lets users in the same level see each other's records. Metadata shows `share_with_peers` true for the top role, false for Manager.

## 4. Groups (Gruplar)
Route `/settings/groups` (tab on the Users page). Empty state: "No groups have been created". Button **Create Group**. Group membership (users, roles, roles-and-subordinates, other groups — public docs) is used as source/target in sharing rules and in record sharing. Detail view not capturable (empty). The user detail has a Groups section with an add-to-group control.

## 5. Data sharing — `/settings/data-sharing/…`
Reached from the Roles page tab "Data Sharing Settings". Sub-tabs (pill switch): **Organization Default Permissions**, **Sharing Rules**. A help icon at the right.

### 5.1 Organization default permissions
Help text + table (Module, Default Access) with a dropdown per module (`<Module>_permission`; dropdown values not opened, only the current value is read). Modules (19): Leads, Accounts, Contacts, Deals, Campaigns, Tasks, Meetings, Cases, Solutions, Products, Vendors, Price Books, Quotes, Sales Orders, Purchase Orders, Invoices, Emails, Calls, Visits.
Current values: all "Owner can view" (Private) except Products "Public (Read only)" and Emails + Visits "Public (Read/Write/Delete)". Standard option set (public docs, not opened): Private, Public Read Only, Public Read/Write, Public Read/Write/Delete; Calls/Tasks/Meetings follow parent-record visibility in docs (the reference lists them separately, default Private).
Likely a "Save" and "Cancel" bar appears after a change (not observed, edit mode; Q5).

### 5.2 Sharing rules
The sub-tab "Sharing Rules" could not be captured: the capture tool's click guard refuses the label (contains "share"), and the direct URL returns the app's error page. Described from public documentation: list of rules per module with columns Rule Name, "Records owned by" (role/role+subordinates/group/territory/user) → "Shared with" (same types) , Access level (Read Only, Read/Write, Read/Write/Delete), plus a "New Rule" button per module; max rules per module limited (docs say 50 per module on higher editions). Only the Administrator (user-management permission) can create. Open question Q6.

## 6. Territories (Bölge Yönetimi) — out of scope
`/settings/territories`: marketing/empty-state page ("Get started" button) describing territory-based record sharing for Accounts, Contacts, Deals. Feature is not enabled in this org; no tree to capture. **Out of scope** for Feature D (separate access model; propose after roles/sharing ship).
Other security screens (Compliance settings, Trusted domain, Support access, SSO, Security policies, AD sync, Login history, Audit log) are navigation-only siblings; **out of scope** now, Audit log may be a later feature.

## 7. How access is combined (functional rules)
1. Profile → feature/action permission per module (view/create/edit/delete, import, export, mass update, convert …). No permission = control hidden/disabled and API refused.
2. Record visibility = union of: owner (always), role hierarchy (managers see subordinates' records), "share with peers", org default access for the module (Private / Public RO / RW / RWD), sharing rules (role/group/territory → role/group, with an access level), manual share (record Share action, requires Share permission), groups used as targets.
3. "View All / Modify All Records" (administrator-level profile permission) override 2 for listed modules.
4. Default access can only broaden, never restrict below owner+hierarchy. Public org defaults make the role hierarchy irrelevant for that module.
5. Field-level permission (per profile × module field) is applied on top of the module permission: hidden fields removed from UI and API; read-only enforced in forms and API.
6. System items: Administrator and Standard profiles non-deletable; only basic and some extension permissions editable on them; the super admin user cannot be deactivated or deleted and holds the top role; the top role cannot be deleted/reparented.
7. Limits seen: licence limit 25 users; 2 profiles and 2 roles in this org.

## 8. Permission matrix from metadata (structure only)
- `profiles.json`: top-level keys `profiles[]`, `info{license_limit}`; 2 profiles; keys per profile: `display_label, created_time, modified_time, custom, name, description, id, type (normal_profile)`. **No per-module permission objects are exported** — the matrix above comes from the profile pages. `custom=false` for both (system).
- `roles.json`: `roles[]`, 2 roles in a chain (top role → one child); keys: `display_label, name, description, reporting_to{name,id}|null, share_with_peers, forecast_manager, created_by__s, modified_by__s, created_time__s, modified_time__s, id`. Levels: 2. `share_with_peers`: top true, child false.
- `modules/<M>/fields.json`: per field `visible, read_only, field_read_only, view_type` — the source for field-level permission defaults. `layouts.json` carries a `profiles[]` list per layout (layout assignment per profile).
- Not available in metadata: sharing rules, groups, org default access, profile permission bits.

## 9. Open questions (write-only behaviour)
- Q1 Status filter options (Active / Inactive / Unconfirmed / Deleted / Confirmed / …) — public docs: Active, Inactive, Confirmed, Not confirmed, Deleted, Admin, Portal, CRM only, Mail users.
- Q2 New User form and the caret ("Add multiple users", "Import users" in docs): fields = name, email, role, profile (required), reporting-to via role, invitation e-mail; licence limit blocks creation.
- Q3 New Profile: name, description, "clone from existing" required (public docs: a new profile is cloned from an existing one, then permissions are edited).
- Q4 New Role: name, "Reports to" (required), "share data with peers", description.
- Q5 Changing org default to a more restrictive level recalculates access in the background (docs say it can take time and a notification mail follows).
- Q6 Sharing-rule form and limits — docs only; needs a board-allowed write window or screenshots from the board to confirm.
- Q7 Deleting a role asks for a **transfer role** for users and subordinates; deleting a user asks to transfer their records (docs); deleting a profile requires choosing a replacement profile.
- Q8 Changing a user's role: record visibility is recalculated; records they own stay theirs.
- Q9 Dropdown options of org default access per module (Calls/Tasks/Meetings rules differ from other modules).
- Q10 Field permissions UI for non-Administrator profiles (only Administrator tab captured).

Answers marked "docs" come from general public product documentation knowledge and were **not** re-verified in the reference; treat them as hypotheses for ADR 0017.

## 10. Inventory counts
Users: 5 list controls + 7 detail sections (≈45 fields). Profiles list: 5 controls, 2 rows; profile detail: 2 header buttons, 17 nav anchors, ≈100 permission rows. Roles: 4 controls + tree (2 roles), role detail 4 rows + 2 buttons + user table. Groups: 2 controls (empty). Data sharing: 2 sub-tabs, 19 module rows. Territories: 1 marketing page.
