# Company Details implementation handoff

Issue: MEP-1188. Source: `research/specs/customization-company-locale.md`.
Route: `/crm/[orgSlug]/settings/company-details`.

## Inventory coverage

| Inventory IDs | Implementation / boundary |
| --- | --- |
| 1–7 | Existing settings shell; no shell reconstruction in this slice. |
| 8 | Personal Settings navigation added to the settings rail and landing page; destination screen belongs to MEP-1203. |
| 9 | Existing Members navigation retained; Users label parity belongs to the shell. |
| 10 | Company Details navigation added to the settings rail and landing page. |
| 11–26 | Existing settings shell owns these controls; no new unrelated settings destinations invented. |
| 27–47 | Existing global shell owns these controls, including the unverified utility bin; untouched. |
| 48 | Current Company Details navigation item, marked as current page. |
| 49–52 | Fiscal Year, Domain Mapping, Business hours and Holidays remain visible and disabled; their screens are outside this slice. |
| 53 | Currencies link points to the agreed settings/currencies route; also added to the rail and landing page. Destination belongs to MEP-1190 and is not opened by this issue's e2e. |
| 54 | Hierarchy Preference remains visible and disabled; destination unresearched. |
| 55 | Identity pencil beside the name; disabled, no write port. |
| 56 | Access URL pencil beside the heading; disabled, no write port. |
| 57 | Copy beside the access address; copies the displayed fixture URL, with accessible success/failure feedback. |
| 58 | Time Zone pencil beside the value; disabled, no write port. |
| 59 | Learn More beside the Team Licenses explanation; disabled because the documentation destination is unverified. |
| 60 | Get Team User License beneath its section; disabled, no purchase or licensing port. |

Identity and contact slots (email, phone, mobile, fax, website, location),
Access URL, Locale Information / Time Zone and Team Licenses are present.
The organization illustration uses a library building icon, not a reference
asset. All display values are independently invented fixture data. Empty
contact slots stay visually empty and have accessible “Not provided” text.
No country, locale, date/number format or home-currency field is inferred.
The fixture UTC time zone is demonstration data, not an application default.
The screen does not change locale policy, backend data, or user preferences.

## Open questions

- Identity/access/time-zone editor fields, validation, saves and propagation
  were never observed. Their controls stay disabled pending separate scope.
- Licensing acquisition and Learn More destinations remain unverified; no
  navigation or transaction is invented.
- Other company-tab pages remain unresearched and disabled. Currency and
  Personal Settings destinations are implemented by their own issues.
- Shell-only inventory rows remain the existing shell's responsibility;
  this slice does not claim full settings-shell parity.
- Loading/read failure and clipboard feedback are local adapter safeguards;
  the research did not establish reference behavior for these states.

## Verification scope

- Component tests: read-only inventory, injected port data, clipboard success
  and rejection, read failure/recovery and stale read suppression.
- Navigation tests: existing shell navigation plus new route resolution.
- E2E: settings landing navigation, destination URLs without opening currency
  or personal screens, Company Details contents, disabled writes, and reload.
- Task-required regression files: meetings-detail, tasks-form, meetings-form
  and leads-detail. Final check results and head SHA are in the issue comment.
