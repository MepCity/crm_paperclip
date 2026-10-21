# Email and calendar — metadata review and gap table

Status: desk review, no capture. Issue: MEP-1018 / M10-R8. Review date: 2026-10-21.
Approval: CTO. Feeds: ADR 0009 data model.

## Purpose

Record what the local metadata export says about the Module 10 modules, and
which data-model decisions it cannot settle. Structure only: no values, no
record ids. The reference CRM was not opened and the capture tool was not used.
Follows [module-10-email-calendar-research-plan.md](../module-10-email-calendar-research-plan.md),
section 4.8.

Inputs read: module list, per-module field, layout, related-list and custom-view
files, profile and role files, workflow and assignment rule files.

## 1. Module table

`Flags` = creatable / editable / deletable / viewable (module level, as exported).
Both profiles in the export (Administrator, Standard) are listed on every module
below; per-profile read/write flags are **not** in the export (see section 6).

| Module | In export | Folder with fields | Flags (C/E/D/V) | API supported | Tab shown | Gap |
| --- | --- | --- | --- | --- | --- | --- |
| Events (meetings) | yes | yes (34 fields) | yes/yes/yes/yes | yes | yes | none for fields; invitation and RSVP model not in export |
| Calls | yes | yes (26 fields) | yes/yes/yes/yes | yes | yes | context only (activity sibling) |
| Emails | yes | **no** | no/no/no/no | no | yes | no field export |
| Email_Drafts__s | yes | **no** | no/no/no/no | no | no | no field export |
| Email_Template__s | yes | **no** | no/no/no/no | no | no | no field export |
| CalendarBookings__s | yes | **no** | no/no/yes/no | no | no | no field export |
| Unknown__s | yes | **no** | no/no/no/no | no | no | unidentified module; no field export |
| SalesInbox | yes | no | no/no/no/yes | no | not checked | no field export; unclear role |
| Email_Analytics | yes | yes (24 fields) | no/no/no/no | yes | no | read-only counters |
| Email_Template_Analytics | yes | yes (14 fields) | no/no/no/no | yes | no | read-only counters |
| Email_Sentiment | yes | yes (16 fields) | yes/yes/yes/yes | yes | no | not shown as tab; related list hidden |
| Qualify_Leads_through_Email | yes | yes (51 fields) | yes/yes/no/yes | yes | not checked | orchestration state, not mail storage |

## 2. Events (meetings) fields

Mandatory (system or layout): Event_Title (text 255), Start_DateTime and
End_DateTime (datetime), Meeting_Venue__s (picklist). No field is marked unique
except the record id.

| Field | Type | Length | Notes |
| --- | --- | --- | --- |
| Owner | owner lookup | - | |
| Event_Title | text | 255 | mandatory |
| Venue | text | 255 | free-text place |
| Who_Id | lookup | - | contact/lead link |
| What_Id | lookup | - | account/deal/case link |
| Start_DateTime, End_DateTime | datetime | - | mandatory |
| All_day | boolean | - | |
| Description | textarea | 32000 | |
| Recurring_Activity | RRULE | - | recurrence rule string |
| Remind_At | multi reminder | - | |
| Remind_Participants | multi reminder | - | |
| Participants | bigint | - | count-like numeric field; invitee rows are a related list |
| Tag | text | 2000 | |
| Meeting_Venue__s | picklist | - | mandatory; 3 values (office, client location, online) |
| Meeting_Provider__s | picklist | - | exported with **no values** |
| Check_In_* (Time, By, Comment, Sub_Locality, City, State, Country, Address, Status), Latitude, Longitude, ZIP_Code | mixed | up to 3000 | read-only; visits/check-in set |
| Created_By, Modified_By, Created_Time, Modified_Time, Last_Activity_Time, id | system | - | id read-only |

Related lists: Notes, Attachments, Invitees, CheckLists. Custom views: 11 (all,
mine, today, this week, upcoming, completed, cancelled variants).

## 3. Calls (context)

26 fields. Mandatory: Call_Type, Call_Start_Time, Call_Duration. Picklists:
Call_Type (3), Call_Purpose (7), Call_Result (7), Reminder (9),
Outgoing_Call_Status (5), Scheduled_In_CRM (2, read-only). Related lists: Notes,
CheckLists. Has no invitee model. Listed only because calendar views show calls.

## 4. Analytics and sentiment modules

| Module | Fields (structure) |
| --- | --- |
| Email_Analytics | User (owner lookup), Mail_Source (picklist), Entity_Source (module), Date, then integer counters: Sent, Bounced, Tracked, Bounced_Among_Tracked, Opened, Clicked, Replied, Received, Responded; call counters (dialled attended/unattended, received, missed, total duration); Events_Created, Event_Duration, Checkins, Task_Completed; Amount (currency) |
| Email_Template_Analytics | User, Template_Name (lookup to templates), Mail_Source, Entity_Source, Date, counters Sent, Bounced, Tracked, Bounced_Among_Tracked, Opened, Clicked, Replied, Received |
| Email_Sentiment | Positive, Negative, Neutral, Last_Email_Sentiment (integers), Received_Date, Seid (multi-module lookup: the message id link), User, Module, Email (email 100), internal counters |

Implication: tracking is per user per day (analytics) and per template, so
open/click/bounce tracking and a `Mail_Source` distinction (CRM-sent vs other)
are part of the reference model.

## 5. Related lists on parent modules

| Parent | Mail/calendar related lists | Notes |
| --- | --- | --- |
| Leads | Emails, Email_Drafts__s, Email_Sentiment, Events, Events_History, Invited_Events, Calls, Calls_History | Emails: create allowed, delete allowed, edit not; Drafts and Sentiment lists exported hidden; Events: create/edit allowed, delete not; Invited_Events: edit/delete allowed, create not |
| Contacts | same set | |
| Accounts | same set | |
| Deals | same set | |
| Cases | same set plus Mailing_History | extra history list |

Sort is customisable on Emails and Events lists; field customisation is off for
Emails, on for Drafts and Events.

## 6. Rules and permissions

- `workflow_rules.json` holds an API-not-supported error object; `assignment_rules.json`
  is null. **Rules that fire on mail or calendar records cannot be listed from
  metadata.** Covered by R10 and an open question.
- `profiles.json` lists two profiles (Administrator, Standard) with names and
  descriptions only; `roles.json` lists the role hierarchy. **Per-module and
  per-field read/write flags are not in the export**; only the module-level
  creatable/editable/deletable/viewable flags in section 1 exist.
- Mail modules show profile lists of both profiles but module flags disallow
  create/edit; the actual access check for the capture user was an access-denied
  dialog (see [email-inbox.md](email-inbox.md)).

## 7. Data-model decisions blocked by gaps

| Decision (ADR 0009) | Blocked by | Interim handling |
| --- | --- | --- |
| Message storage (headers, body, size, attachment links, read state) | Emails has no field export | Choose own model from mail standards; flag as non-parity |
| Conversation/thread model | No thread field or module in export; Seid is only a sentiment link | Own thread model (headers References/In-Reply-To); open question |
| Draft model | Email_Drafts__s has no field export | Own draft entity; ownership and auto-save unknown |
| Template merge fields | Email_Template__s has no field export; only analytics link by name | Merge-field list derived per module from fields.json; syntax from documentation (R9) |
| Booking model | CalendarBookings__s and Unknown__s have no field export | Defer booking pages; document as gap |
| Meeting invitees and RSVP | Invitees related list exists; its field model and states are not exported; Participants is a bare number | Own invitee table; state set from iTIP standard; confirm in sandbox |
| Meeting provider | Meeting_Provider__s exported without values | Provider list undecided |
| Recurrence | Recurring_Activity is an RRULE string (shape only) | Store RRULE; exception handling unknown |
| Rule-driven side effects | Workflow/assignment rules not exportable | R10 settings check |
| Per-profile access | Flags not exported | Follow module-level flags only |

## Open questions

1. Which role or licence gives access to the mail modules for the capture user?
2. What is the purpose of the unnamed module (Unknown__s) and SalesInbox?
3. Can the board export the missing modules' fields through an allowed route, or is a sandbox org the only route?
4. Who owns rules that react to mail events, given workflow rules are not exportable?

## Capture refs

None: metadata only. No capture, click list or click test applies.
