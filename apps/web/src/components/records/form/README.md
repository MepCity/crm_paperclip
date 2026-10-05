# Record form presentation

## Select User dialog (`select-user-dialog.tsx`)

Presentation-only owner picker opened from the Lead Owner field icon. Data and copy
arrive through props; no API or `@crm/core` runtime imports.

### Interim: search filtering

Search keeps users whose **name** or **email** contains the query as a
case-insensitive substring. The reference capture showed an empty search field with
no typed filter term, so exact reference behaviour for partial matches is unknown
until a later capture confirms it.
