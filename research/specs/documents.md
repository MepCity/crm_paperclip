# Documents

Status: incomplete research draft for MEP-922. Metadata reviewed; the first
capture failed its readiness gate. This document is not an implementation-ready
screen specification. Further captures require reviewed continuation.

## Purpose

Research the Documents module entry, folder navigation and file listing under
the Module 2+ screenshot-and-behaviour parity rule. No measurements or request
contract are required. Write actions and persisted preferences remain forbidden.

## Metadata

Source: research workspace `metadata/modules.json`, Documents entry.

| Property | Exported value |
| --- | --- |
| API name / module name | `Documents` |
| Singular / plural label | Documents |
| Access type | `org_based` |
| Generated type | `default` |
| Visible / viewable / shown as tab | true / true / true |
| Sequence number | 22 |
| API supported | false |
| Creatable / editable / deletable | false / false / false |
| Filter supported / quick create / global search supported | false / false / false |

There is no `metadata/modules/Documents/` directory in the exported dataset.
Consequently no Documents field dictionary, layouts, custom views or related-list
configuration is available there. Do not invent a record-style schema or infer
that file operations are unavailable in the UI from these module API flags.

## Layout and fields

The retained failed-gate screenshot provisionally shows the shared shell, a
Documents heading, a folder-navigation pane and a larger listing pane. The
navigation pane contains personal and team-folder regions. The listing has a
breadcrumb, Name and Last Modified columns, a folder row and a right utility
strip. This is diagnostic evidence only: a passing gate and control reconciliation
are still required before accepting it as a screen baseline. No customer folder,
uploader or modifier values are reproduced here.

## Control inventory

Pending. Do not treat a failed-gate capture as a completed numbered inventory.
Reconcile screenshot, accessibility tree and controls evidence after the reviewed
continuation. Include the shared shell and bottom utility strip, distinguish
visible controls from hidden/zero-area entries, and record owning modules.

## Actions, filters, views, sorting and search

No controls were operated. Folder opening, file-detail navigation, empty states,
search, sorting and filter behaviour are not established. View-type, panel,
column, pin and other persisted-preference controls must not be exercised.
Upload, create-folder, move, delete and share controls must not be clicked.
Write-dependent behaviour requires public documentation or explicit open questions.

## Flows, validation and errors

Only navigation to `/crm/<org>/tab/Documents` was attempted. No fields were
filled, no file chooser was opened, and no record or preference was changed
intentionally. No validation, success or write-dependent error state was tested.

## Capture refs and safety audit

Local-only evidence: `captures/m9-documents-main/`, captured 2026-10-20.
All six base evidence files exist; screenshots and raw evidence stay out of git.

- Initial sandbox invocation stopped before capture-directory creation with a
  filesystem permission error; the authorized invocation used the same slug.
- Readiness probe: `text=Documents`; `ok=false`, `waitedMs=30028`, timeout 30000 ms.
- Failure: selector matched two elements instead of exactly one. Exit code 2.
- Requested clicks and steps: empty; no interaction steps ran. No automatic retry.
- Failed scripts: none; pending requests at readiness: none; API calls: 57.
- Six blocked POST requests: one reminder action, one notification status action
  and four telemetry calls. The existing write guard aborted them.
- Diagnostics also contain client-side initialization errors. A more specific
  probe alone does not establish application health; review both before resuming.

The capture usage instructions require stopping and reporting failed readiness
evidence to Platform Lead before continuation. No guard changes, browser/profile
changes or alternate browser access were attempted.

## Open questions and remaining research

1. Establish a reviewed, single visible Documents-content readiness probe and
   assess initialization diagnostics before authorizing a new capture.
2. Capture a passing main-screen baseline and enumerate every visible control.
3. Inspect safe folder navigation and any existing file detail/preview entry;
   determine whether embedded content exposes usable selectors through the tool.
4. Observe existing empty folders without creating or changing data, if available.
5. Research upload, folder creation, permissions, sharing, moving and deletion
   through public documentation; keep write-dependent UI states unobserved.

CTO owns subsequent research issue creation. During the priority overnight
capture window for MEP-539, do not run Documents captures.

## Proposed parity-checklist entries

These are proposals only; no checklist row is marked complete in this slice.

- Documents metadata availability and explicit missing field/layout exports.
- Main-screen folder pane, breadcrumb, listing and complete control inventory.
- Existing-folder navigation and empty-folder presentation.
- Existing-file detail/preview and utility-strip behaviour.
- Documented file/folder write flows, permissions and unobservable state gaps.
