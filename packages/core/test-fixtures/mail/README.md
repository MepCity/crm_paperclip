# Synthetic mail fixtures

Hand-written RFC 5322 samples. All addresses are invented and use reserved domains (`example.com`, `example.org`, `example.net`). CRLF line endings. Every file has `From`, `Date` and `Message-ID`; file 04 intentionally has no `In-Reply-To`/`References`.

- `01-thread-root.eml` — first message of a three-message thread.
- `02-thread-reply.eml` — reply with `In-Reply-To`, `References`, `Re:` subject.
- `03-thread-second-reply.eml` — second reply with a two-entry `References` chain.
- `04-reply-without-references.eml` — reply whose client dropped threading headers; only the subject remains.
- `05-multipart-alternative.eml` — `multipart/alternative` text + HTML.
- `06-multipart-mixed-attachment.eml` — `multipart/mixed` with a tiny base64 text attachment.
- `07-encoded-turkish.eml` — RFC 2047 encoded-word subject and quoted-printable UTF-8 Turkish body.
- `08-bounce-delivery-status.eml` — `multipart/report; report-type=delivery-status` bounce.
- `09-calendar-invite.eml` — `text/calendar; method=REQUEST` with a minimal VEVENT.
- `10-display-name-comma-quoted-local.eml` — display name with a comma and a quoted local part.
