# Turkish language and locale research — R1

Status: documentation research complete; Turkish interface terminology is a
**provisional translation worksheet**, pending the board-controlled Turkish
capture window. This is research input to the i18n ADR, not an approved string
catalogue or an implementation decision. Checked on 2026-10-24.

## Purpose and evidence boundaries

Establish the reference CRM's language behaviour, Turkish terminology coverage,
and Turkish formatting conventions for our English/Turkish product. The parent
requirement keeps English as our default/fallback; that is a product requirement,
not evidence of the reference's fallback for every language.

No reference language, locale, calendar preference, translation setting or record
was changed. No export/import or translation editor was used. A fresh English
capture attempt failed while creating its output directory, before browser
inspection; it supplies no new evidence. Existing English observations are
linked below. No Turkish live capture is claimed.

Evidence labels:

- **D**: behaviour documented in public reference help; not exercised live.
- **L**: Turkish locale convention from Unicode CLDR; not reference UI proof.
- **E**: existing English capture/spec evidence, with its original limitations.
- **P**: analyst-proposed Turkish wording; unverified in the reference or its
  Turkish documentation. Every P row requires capture confirmation or an
  explicit terminology decision before being treated as reference parity.

## Source register

Public reference help URLs and original titles are kept only in the local
research source index `docs-notes/i18n-turkish-sources.md`, outside version
control. Neutral locators below make the sources identifiable without recording
prohibited names or URLs. No customer values are reproduced.

| Key | Source and locator | Use |
| --- | --- | --- |
| D1 | Public help, Customize account → Translations → Languages supported for Translation; fully/partially supported sections | Support classes and fallback families |
| D2 | Public help, Customize account → Translations → Working with Translations; overview, language behaviour and translation-file notes | Translation scope and administration |
| D3 | Public help, Organization settings → Personal settings → Managing CRM Account Settings; Change Locale Information | User locale fields and permissions |
| L1 | [Unicode CLDR 49 Turkish summary](https://unicode.org/cldr/charts/49/summary/tr.html), Gregorian formats, number symbols and TRY currency | Turkish format conventions |
| L2 | [Unicode CLDR supplemental data](https://raw.githubusercontent.com/unicode-org/cldr/main/common/supplemental/supplementalData.xml), weekData/firstDay, territory TR | Monday convention |
| E1 | [Personal locale research](customization-personal-locale.md), capture `m11r3-personal-locale` | English locale rows; lower rows are DOM/ARIA evidence, not screenshot-confirmed |
| E2 | [Calendar settings research](calendar-settings.md), CD-02 and CD-03 | Week start is configurable separately |

### Language support (D1)

The 28 fully supported choices are: Arabic (Egypt), Indonesian, Bulgarian,
Chinese (Simplified), Chinese (Traditional), Croatian, Czech, Danish, Dutch
(Netherlands), English (United Kingdom), English (United States), French,
German, Hebrew (Israel), Hindi, Hungarian, Italian, Japanese, Korean, Polish
(Poland), Portuguese (Brazil), Portuguese (Portugal), Russian, Spanish,
Swedish, Thai, **Turkish**, and Vietnamese.

Partial support covers additional languages and regional variants. Examples:
Afrikaans, Albanian, Armenian, Bangla, Basque, Catalan, Finnish, Greek,
Tamil, Ukrainian, Urdu, and Welsh; regional English, Arabic, French, German,
Italian, Korean, Spanish and other variants are also listed. This paragraph is
representative, not an exhaustive partial-language catalogue; D1 is the
authoritative full inventory. **Turkish (Cyprus) is listed as partial support**
and must not be conflated with fully supported Turkish.

Partial-language fallback is family-dependent: many use English; Arabic variants
use Arabic (Egypt), French variants use French, German variants use German, and
Spanish variants use Spanish. Thus “partial support means English buttons” is
incorrect as a universal rule. Setup components/default buttons remain in that
language's system fallback; only the supported manually translated entities use
the selected partial language. Exact regional combinations are in D1.

### User language versus organization translations (D2, D3)

Interface language is an individual preference. Administrators manage the shared
translation definitions; these are separate responsibilities. The documented
translation surface covers module names, subform labels, related-list labels,
field labels (including custom fields) and picklist values. Full support supplies
system UI translations, alongside manually translated entities. Partial support
does not supply a complete system UI translation.

The administrative process uses language files and preserves their original
keys/language codes while translating their displayed values. This documents
label translation, not permission to rename API keys or translate stored record
content. Automatic translation of customer-entered text is not established.
Untranslated custom labels and values must not be assumed to have Turkish
equivalents merely because Turkish has full system support. Exact missing-value
fallback and interaction with module renaming remain open.

No translation operation described in the documents was executed. Public help
describes capabilities; it does not prove their edition availability in the
current account or authorize implementing the administration feature in R1.

## Locale Information

D3 places locale editing under Setup → General → Personal Settings. Standard
users as well as administrators may change their own language, date format and
time zone. Documentation describes a saved edit; save/validation feedback was
not exercised.

| English concept | Meaning / documented relationship | Turkish proposal |
| --- | --- | --- |
| Language | User interface language, distinct from country | Dil (P) |
| Country Locale | Regional locale; updates the initial date format and affects phone display | Ülke Yerel Ayarı (P) |
| Date Format | Selectable date representation | Tarih Biçimi (P) |
| Time Format | 12-hour or 24-hour choice | Saat Biçimi (P) |
| Time Zone | User time zone; distinct from language | Saat Dilimi (P) |
| Number Format → Grouping | Digit-group separator | Sayı Biçimi → Basamak Ayırıcı (P) |
| Number Format → Decimal | Decimal separator | Sayı Biçimi → Ondalık Ayırıcı (P) |

E1 also records Preferred Unit for Distance; it is adjacent context, not one of
the seven documented concepts above. Its locale rows were offscreen in the image.
E1 observed a dotted date pattern and period/comma number separators while the
interface was English: English language must not imply US formats. Organization
time zone, currency settings, and calendar working hours are separate surfaces.
Precedence, first-login inheritance and cross-session refresh remain unverified.

## Turkish formatting baseline

These are **locale conventions and proposed verification fixtures**, not claims
about current reference preferences. All examples are synthetic. Language change
alone must not be assumed to overwrite a user's explicit formats, zone or currency.

| Kind | Baseline / example | Evidence and boundary |
| --- | --- | --- |
| Numeric date | `gg.aa.yyyy` / `24.10.2026`; technical pattern `dd.MM.yyyy` | L1; request's desired convention; reference option/padding needs capture |
| Time | `14:05`, or `14:05:09` when seconds are relevant | L1 24-hour convention; D3 also allows a 12-hour preference |
| Number | `1.234,56`; grouping `.`, decimal `,` | L1; precision depends on field, not language |
| Negative number | `-1.234,56` | L1; not proof of every input parser |
| TRY currency | `₺1.234,56`; code TRY; symbol ₺ | L1 standard symbol placement; actual reference spacing/symbol mode unverified |
| Other currency | Keep original currency identity, localize numeric display | Research recommendation; do not convert USD/EUR amounts to TRY when selecting Turkish |
| Week start | Monday / Pazartesi | L2 territory TR; E2 documents configurable calendar week start |

Turkish uses dotted/dotless I (`i/İ`, `ı/I`). Locale-aware casing/search/sorting
needs separate implementation verification; this research does not establish
the reference's matching algorithm. Absolute timestamps, date-only due dates,
relative dates and audit labels must be checked separately. An existing mixed
date presentation in E1 prevents assuming one global date renderer.

## Terminology worksheet

**All Turkish CRM labels in the following tables are P.** They are useful
translation candidates, not quotations, documentation-confirmed Turkish labels,
or an approved departure from the reference. No row currently has Turkish live
evidence. English terms identify concepts; their exact appearance varies by
module. Keep the English concept stable when updating the Turkish evidence.

### Shell and module names

| English concept | Turkish candidate (P) | Confirmation concern |
| --- | --- | --- |
| Home | Ana Sayfa | Capitalization |
| Leads | Potansiyel Müşteriler | Could use a different sales term |
| Contacts | Kişiler | Distinguish from leads |
| Accounts | Hesaplar | Company module versus user account |
| Deals | Anlaşmalar | Could instead use a sales-opportunity term |
| Activities | Etkinlikler | Parent group versus calendar events |
| Tasks | Görevler | Module name |
| Meetings | Toplantılar | Module name |
| Calls | Aramalar | Distinguish from search |
| Campaigns | Kampanyalar | Module name |
| Cases | Destek Talepleri | Could instead use cases terminology |
| Solutions | Çözümler | Module name |
| Documents | Belgeler | Module name |
| Reports | Raporlar | Module name |
| Analytics | Analizler | May overlap dashboard terminology |
| Dashboards | Panolar | Distinguish from Analytics |
| Workqueue | İş Kuyruğu | Exact label particularly uncertain |
| Visits | Ziyaretler | Module name |
| Social | Sosyal | Module name |
| Email | E-posta | Navigation versus field |
| Calendar | Takvim | Module name |
| Notes | Notlar | Related list |
| Attachments | Ekler | Related list |
| Timeline | Zaman Çizelgesi | Record detail tab |
| Related Lists | İlgili Listeler | Record detail region |
| Overview | Genel Bakış | Record detail tab |
| Setup | Kurulum | Could instead use settings terminology |
| Personal Settings | Kişisel Ayarlar | Settings navigation |
| Company Settings | Şirket Ayarları | Organization scope |
| Locale Information | Yerel Ayar Bilgileri | Section name |
| Modules and Fields | Modüller ve Alanlar | Setup entry |
| Translations | Çeviriler | Setup entry |
| Search records | Kayıtlarda ara | Search placeholder |
| All Modules | Tüm Modüller | Navigation/search scope |
| Notifications | Bildirimler | Utility |
| Recycle Bin | Geri Dönüşüm Kutusu | Utility |
| Tags | Etiketler | Utility |

### Common fields

| English concept | Turkish candidate (P) |
| --- | --- |
| First Name | Ad |
| Last Name | Soyad |
| Full Name | Ad Soyad |
| Company | Şirket |
| Account Name | Hesap Adı |
| Contact Name | Kişi Adı |
| Deal Name | Anlaşma Adı |
| Owner | Kayıt Sahibi |
| Lead Owner | Potansiyel Müşteri Sahibi |
| Assigned To | Atanan Kişi |
| Title | Unvan |
| Subject | Konu |
| Description | Açıklama |
| Email | E-posta |
| Phone | Telefon |
| Mobile | Cep Telefonu |
| Website | Web Sitesi |
| Industry | Sektör |
| Lead Source | Potansiyel Müşteri Kaynağı |
| Lead Status | Potansiyel Müşteri Durumu |
| Status | Durum |
| Priority | Öncelik |
| Rating | Derecelendirme |
| Stage | Aşama |
| Amount | Tutar |
| Currency | Para Birimi |
| Probability | Olasılık |
| Closing Date | Kapanış Tarihi |
| Due Date | Bitiş Tarihi |
| Start Date / End Date | Başlangıç Tarihi / Bitiş Tarihi |
| Start Time / End Time | Başlangıç Saati / Bitiş Saati |
| Duration | Süre |
| Location | Konum |
| Participants | Katılımcılar |
| Reminder | Hatırlatıcı |
| Repeat | Tekrar |
| All Day | Tüm Gün |
| Created By / Modified By | Oluşturan / Değiştiren |
| Created Time / Modified Time | Oluşturulma Zamanı / Değiştirilme Zamanı |
| Street | Sokak |
| City | Şehir |
| State | Eyalet/İl |
| Zip Code | Posta Kodu |
| Country | Ülke |

Owner versus Assigned To, Title versus Subject, and Due Date versus End Date
must be checked in context; the candidates are not interchangeable keys.

### Actions, feedback and list controls

| English concept | Turkish candidate (P) |
| --- | --- |
| Create / New | Oluştur / Yeni |
| Save | Kaydet |
| Save and New | Kaydet ve Yeni Oluştur |
| Cancel | İptal |
| Edit | Düzenle |
| Delete | Sil |
| Clone | Kopyala |
| Convert | Dönüştür |
| Add / Remove | Ekle / Kaldır |
| Update | Güncelle |
| Close | Kapat |
| Back / Next | Geri / İleri |
| Search | Ara |
| Filter / Apply / Clear | Filtrele / Uygula / Temizle |
| Sort | Sırala |
| More / Actions | Diğer / İşlemler |
| Change Owner | Kayıt Sahibini Değiştir |
| Mark as Completed | Tamamlandı Olarak İşaretle |
| Send Email | E-posta Gönder |
| Import / Export | İçe Aktar / Dışa Aktar |
| Upload / Download | Yükle / İndir |
| Select All | Tümünü Seç |
| All Records | Tüm Kayıtlar |
| No records found | Kayıt bulunamadı |
| Loading | Yükleniyor |
| Required field | Zorunlu alan |
| Invalid value | Geçersiz değer |
| Something went wrong | Bir hata oluştu |
| Try again | Yeniden dene |

Feedback rows express concepts only. They are not evidence of exact validation,
empty-state or error sentences. Write-triggered success/error wording cannot be
captured by testing mutations against the reference.

### Status and priority values

| English concept / context | Turkish candidate (P) |
| --- | --- |
| Not Started / task | Başlamadı |
| Deferred / task | Ertelendi |
| In Progress / task or case | Devam Ediyor |
| Completed / task | Tamamlandı |
| Waiting for input / task | Girdi Bekleniyor |
| High / priority | Yüksek |
| Highest / priority | En Yüksek |
| Normal / priority | Normal |
| Low / priority | Düşük |
| Lowest / priority | En Düşük |
| Open / case | Açık |
| Closed / case | Kapalı |
| Planned / campaign | Planlandı |
| Active / campaign | Etkin |
| Inactive / campaign | Etkin Değil |
| Contacted / lead | İletişime Geçildi |
| Not Contacted / lead | İletişime Geçilmedi |
| Qualified / lead | Nitelikli |
| Unqualified / lead | Niteliksiz |
| Lost Lead / lead | Kaybedilen Potansiyel Müşteri |
| Closed Won / deal stage | Kapandı - Kazanıldı |
| Closed Lost / deal stage | Kapandı - Kaybedildi |

This is a translation coverage set, not an exhaustive list of enabled picklist
options or stage transitions. Module metadata remains the data-model source of
truth. Existing organization-specific option sets must be reconciled without
copying customer/custom business values into this spec. Language changes display
labels; proposed translations do not authorize changing stored option values.

### Dates, relative time and count messages

| English concept | Turkish candidate | Status / concern |
| --- | --- | --- |
| Today / Yesterday / Tomorrow | Bugün / Dün / Yarın | L1 convention; reference label unverified |
| This Week / Last Week / Next Week | Bu Hafta / Geçen Hafta / Gelecek Hafta | P |
| This Month / Last Month / Next Month | Bu Ay / Geçen Ay / Gelecek Ay | P |
| Overdue | Gecikmiş | P |
| Late by {count} days | {count} gün gecikmiş | P; exact reference sentence/capitalization unknown |
| Due in {count} days | {count} gün içinde | P; context may need a due-date verb |
| {count} days ago | {count} gün önce | L1 linguistic convention; reference label unverified |
| in {count} days | {count} gün sonra | L1 linguistic convention; reference label unverified |
| {count} records selected | {count} kayıt seçildi | P; zero/singular/plural must be checked |

Keep full messages with placeholders, rather than concatenating English word
order. Preserve numeric meaning, overdue highlighting and count badges when
localizing. The day-boundary calculation (user zone versus organization zone,
calendar days versus elapsed 24-hour periods) is not established by these labels.

## Turkish capture window and verification work

Only the board changes the reference language. Once the board reports an active
Turkish window, the analyst uses the capture tool for these existing/read-only
surfaces; the analyst neither enables Turkish nor restores English.

1. Shell/Home with module navigation and global utilities; Workqueue with an
   already-existing overdue item if available. Capture title, groups, counts,
   selected state and relative date text. Never manufacture an overdue item.
2. Existing Leads, Contacts, Accounts and Deals list/detail pages: module names,
   common fields, Overview/Timeline/related-list labels and available actions.
3. Tasks, Meetings and Calls list/detail pages: subject, owner, dates, priority,
   status and overdue expressions. Observe only existing values; no completion
   or status action. Picklist candidates absent from existing records stay open.
4. Campaigns, Cases, Solutions, Documents, Reports and Analytics landing pages;
   inspect navigation and headings, without changing a saved view or report.
5. Setup landing and Personal Settings initial page for translated section/row
   labels. No edit pencil, locale selector, save, collapse or preference control.

For every successful capture, record slug/time, inspect the image, reconcile text
and control exports, and check `meta.json` blocked requests and successful
non-GET accounting. Raw captures remain local and customer data must be redacted
from any derivative evidence. No record write, export or saved preference change
is allowed. If a term is offscreen/unreachable under the tool guard, leave it
unverified instead of inferring it. Broad screen inventories remain in their
own specs; this document records only language evidence.

## Open questions

1. Board: when is the Turkish window available? Until then the terminology
   worksheet cannot be promoted to an observed reference dictionary.
2. Exact Turkish system labels, capitalization and terminology for Leads,
   Accounts, Deals, Cases, Setup, Analytics and Workqueue are unverified. Does
   this account have renamed modules or organization translations?
3. Which custom labels/picklist values remain unchanged in Turkish, and what is
   their missing-translation fallback? Existing records may reveal only a subset.
4. Does changing language preserve independent Country Locale, date/time format,
   zone and separator preferences? Documentation describes distinct fields but
   does not establish every automatic update or inheritance rule.
5. What are the exact Turkish overdue phrases and their rounding/zone rules?
   Only already-existing overdue records may be inspected.
6. Does the reference use Monday for this user's calendar, or a configured
   override? CLDR Monday is a baseline, not proof of current calendar settings.
7. Which currency symbol placement, spacing, precision and rounding appear in
   lists, forms and reports? Locale must not imply conversion or storage changes.
8. Reload/session propagation, language change failure states and write-result
   translations are not observable without a change; use public documentation
   or a board decision rather than test mutations.

## Verification and disposition

Documentation-only scope: source/evidence classification, glossary coverage,
neutral naming, absence of personal values and `git diff --check`. No application
runtime, UI, API, database or dependency changes; application tests and e2e runs
are not applicable. Await the saved Turkish-window question before completing
the capture-dependent terminology research and submitting the final review.
