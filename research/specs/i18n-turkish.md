# Turkish language and locale research — R1

Status: public-document research and Turkish-window capture research completed
on 2026-10-24. Observed terminology is separated from remaining proposals.
This is research input to the i18n ADR, not an implementation decision.

## Purpose and evidence boundaries

Establish the reference CRM's language behaviour, Turkish terminology coverage,
and Turkish formatting conventions for our English/Turkish product. The parent
requirement keeps English as our default/fallback; that is a product requirement,
not evidence of the reference's fallback for every language.

The board enabled Turkish and extended the window to approximately 23:30 local
time. The analyst did not change language, locale, records, translations or saved
preferences. Capture-only navigation, named existing record links, initial blank
create forms and content scrolling were used. No fields were filled, no form was
submitted and no tab/window was closed. Raw captures remain local because they
contain private data. Only static labels and synthetic format patterns appear here.

Evidence labels:

- **D**: behaviour documented in public reference help; not exercised live.
- **L**: Turkish locale convention from Unicode CLDR; not reference UI proof.
- **E**: existing English capture/spec evidence, with its original limitations.
- **T**: exact text in Turkish-window page/ARIA exports; screenshots inspected,
  with offscreen/transition limitations stated separately.
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

| English concept | Meaning / documented relationship | Turkish label / evidence |
| --- | --- | --- |
| Language | User interface language, distinct from country | Dil (T16) |
| Country Locale | Regional locale; updates the initial date format and affects phone display | Ülke Yerel Ayarı (T16) |
| Date Format | Selectable date representation | Tarih Biçimi (T16) |
| Time Format | 12-hour or 24-hour choice | Saat Biçimi (T16) |
| Time Zone | User time zone; distinct from language | Zaman Dilimi (T16) |
| Number Format → Grouping | Digit-group separator | Sayı Biçimi → Basamak Ayırıcı (P) |
| Number Format → Decimal | Decimal separator | Sayı Biçimi → Ondalık Ayırıcı (P) |

E1 also records Preferred Unit for Distance; it is adjacent context, not one of
the seven documented concepts above. Its locale rows were offscreen in the image.
E1 observed a dotted date pattern and period/comma number separators while the
interface was English: English language must not imply US formats. Organization
time zone, currency settings, and calendar working hours are separate surfaces.
Precedence, first-login inheritance and cross-session refresh remain unverified.
T16 now visually confirms the Turkish locale section after content scrolling;
the English E1 limits still describe that earlier capture only.

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

## Observed Turkish dictionary

These exact account-visible labels supersede earlier P candidates. Keep spelling
and context, including awkward wording. Organization-specific renamings versus
upstream defaults have not been independently established. English concepts are
semantic keys, not API keys. T proves text evidence; it does not claim every
exported label was visible in the initial image. Limits are recorded per row.

| English concept / context | Exact observed Turkish text | Evidence | Visibility / boundary |
| --- | --- | --- | --- |
| Home | Ana Sayfa | T01 | text; some panel labels clipped/offscreen |
| Leads | Müşteri Adayları | T01 | text; some panel labels clipped/offscreen |
| Contacts | Kişiler | T01 | text; some panel labels clipped/offscreen |
| Accounts | Firmalar | T01 | text; some panel labels clipped/offscreen |
| Deals | Satış Fırsatları | T01 | text; some panel labels clipped/offscreen |
| Activities | Aktiviteler | T01 | text; some panel labels clipped/offscreen |
| Tasks | Görevler | T01 | text; some panel labels clipped/offscreen |
| Meetings | Toplantılar | T01 | text; some panel labels clipped/offscreen |
| Calls | Aramalar | T01 | text; some panel labels clipped/offscreen |
| Campaigns | Kampanyalar | T01 | text; some panel labels clipped/offscreen |
| Solutions | Çözümler | T01 | text; some panel labels clipped/offscreen |
| Documents | Belgeler | T01 | text; some panel labels clipped/offscreen |
| Reports | Raporlar | T01 | text; some panel labels clipped/offscreen |
| Analytics | Analitikler | T01 | text; some panel labels clipped/offscreen |
| Workqueue | İş Kuyruğu | T01 | text; some panel labels clipped/offscreen |
| Visits | Ziyaretler | T01 | text; some panel labels clipped/offscreen |
| Social | Sosyal | T01 | text; some panel labels clipped/offscreen |
| Search records | kayıtlar ara | T01 | text; some panel labels clipped/offscreen |
| Filter | Filtre Uygula | T01 | text; some panel labels clipped/offscreen |
| Sort | Sırala | T01 | text; some panel labels clipped/offscreen |
| Actions | Eylemler | T01 | text; some panel labels clipped/offscreen |
| System Defined Filters | Sistem Tanımlı Filtreler | T01 | text; some panel labels clipped/offscreen |
| Filter By Fields | Alanlara Göre Filtrele | T01 | text; some panel labels clipped/offscreen |
| Filter By Related Modules | İlgili Modüllere Göre Filtrele | T01 | text; some panel labels clipped/offscreen |
| Cases | Servis Dosyaları | T02 | text; image inspected |
| Setup | Ayarlar | T03 | text; image inspected |
| Personal Settings | Kişisel Ayarlar | T03 | text; image inspected |
| Company Settings | Şirket Ayarları | T03 | text; image inspected |
| Modules and Fields | Modüller ve Alanlar | T03 | text; image inspected |
| Translations | Çeviriler | T03 | text; image inspected |
| General | Genel | T03 | text; image inspected |
| Security Control | Güvenlik Denetimi | T03 | text; image inspected |
| Channels | Kanallar | T03 | text; image inspected |
| Customization | Özelleştirme | T03 | text; image inspected |
| Automation | Otomasyon | T03 | text; image inspected |
| Data Administration | Veri Yönetimi | T03 | text; image inspected |
| Developer Hub | Geliştirici Merkezi | T03 | text; image inspected |
| Recycle Bin | Geri Dönüşüm Kutusu | T03 | text only; below initial viewport |
| Notifications | Bildirimler | T03 | text only; below initial viewport |
| Overview | Genel Bakış | T04 | text; image inspected |
| Timeline | Zaman Çizelgesi | T04 | text; image inspected |
| Related Lists | İlgili Liste | T04 | text; image inspected |
| Notes | Notlar | T04 | text; image inspected |
| Attachments | Eklentiler | T04 | text; image inspected |
| Edit | Düzenle | T04 | text; image inspected |
| Convert | Dönüştür | T04 | text; image inspected |
| Send Email | E-posta Gönder | T04 | text; image inspected |
| Add Tags | Etiketleri Ekle | T04 | text; image inspected |
| Open Activities | Açık Aktiviteler | T04 | text; image inspected |
| Closed Activities | Kapalı Aktiviteler | T04 | text; image inspected |
| Invited Meetings | Davet Edilen Toplantılar | T04 | text; image inspected |
| Connected Records | Bağlı Kayıtlar | T04 | text; image inspected |
| Create Lead | Müşteri Adayı Oluştur | T05 | text; image inspected |
| First Name | Adı | T05 | text; image inspected |
| Last Name | Soyadı | T05 | text; image inspected |
| Company | Şirket | T05 | text; image inspected |
| Lead Owner | Müşteri Adayı Kayıt Sahibi | T05 | text; image inspected |
| Title | Ünvan | T05 | text; image inspected |
| Email | E-posta | T05 | text; image inspected |
| Phone | Telefon | T05 | text; image inspected |
| Mobile | Cep Telefonu | T05 | text; image inspected |
| Website | Web sitesi | T05 | text; image inspected |
| Industry | Sektör | T05 | text; image inspected |
| Lead Source | Müşteri Adayı Kaynağı | T05 | text; image inspected |
| Lead Status | Müşteri Adayı Durumu | T05 | text; image inspected |
| Rating | Derece | T05 | text; image inspected |
| Save | Kaydet | T05 | text; image inspected |
| Save and New | Kaydet ve Yeni | T05 | text; image inspected |
| Cancel | İptal | T05 | text; image inspected |
| Edit Page Layout | Sayfa Tasarımını Düzenle | T05 | text; image inspected |
| Annual Revenue | Yıllık Gelir | T05 | text; image inspected |
| Number of Employees | Çalışan Sayısı | T05 | text; image inspected |
| Email Opt Out | E-posta Gönderilmesin | T05 | text; image inspected |
| Contact Owner | Kişi Kayıt Sahibi | T06 | text; image inspected |
| Account Name | Firma Adı | T06 | text; image inspected |
| Create Contact | Kişi Oluştur | T06 | text; image inspected |
| Department | Bölümü | T06 | text; image inspected |
| Birth Date | Doğum Tarihi | T06 | text; image inspected |
| Other Phone | Diğer Telefon | T06 | text; image inspected |
| Home Phone | Ev Telefonu | T06 | text; image inspected |
| Assistant | Asistanı | T06 | text; image inspected |
| Contact Name | Kişi Adı | T07 | text; image inspected |
| Subject | Konu | T08 | text; right-hand columns clipped |
| Due Date | Son Tarih | T08 | text; right-hand columns clipped |
| Status | Durum | T08 | text; right-hand columns clipped |
| Priority | Öncelik | T08 | text; right-hand columns clipped |
| Task Owner | Görev Sahibi | T08 | text; right-hand columns clipped |
| Related To | İlgilisi | T08 | text; right-hand columns clipped |
| Contact Name / activity lookup | İrtibat Adı | T08 | text; right-hand columns clipped |
| Call Type | Arama Tipi | T09 | text; owner column clipped |
| Call Start Time | Arama Saati | T09 | text; owner column clipped |
| Call Duration | Arama Süresi | T09 | text; owner column clipped |
| Call Owner | Arama Sahibi | T09 | text; owner column clipped |
| Create Deal | Satış Fırsatı Oluştur | T10 | text; image inspected |
| Deal Name | Satış Fırsatı Adı | T10 | text; image inspected |
| Deal Owner | Satış Fırsatı Kayıt Sahibi | T10 | text; image inspected |
| Stage | Aşama | T10 | text; image inspected |
| Amount | Tutar | T10 | text; image inspected |
| Probability | Olasılık (%) | T10 | text; image inspected |
| Closing Date | Kapanış Tarihi | T10 | text; image inspected |
| Description | Açıklama | T10 | text; image inspected |
| Expected Revenue | Beklenen Ciro | T10 | text; image inspected |
| Next Step | Sonraki Adım | T10 | text; image inspected |
| Start Date | Başlangıç Tarihi | T11 | text; right-hand end column clipped |
| End Date | Bitiş Tarihi | T11 | text; right-hand end column clipped |
| Create Report | Rapor Oluştur | T12 | text; image inspected |
| Report Name | Rapor Adı | T12 | text; image inspected |
| Folder | Klasör | T12 | text; image inspected |
| Last Accessed | Son Erişim Tarihi | T12 | text; image inspected |
| Create Dashboard | Pano Oluştur | T13 | text; image inspected |
| Add Component | Bileşen Ekle | T13 | text; image inspected |
| Organization Overview | Kuruluşa Genel Bakış | T13 | text; image inspected |
| My Folders | Klasörlerim | T14 | text; image inspected |
| Team Folders | EKİP KLASÖRLERİ | T14 | text; image inspected |
| Today & Overdue | Bugün & Geciken | T15 | text; image inspected |
| My Workqueue | Benim İş Kuyruğu | T15 | text; image inspected |
| My Open Activities | Benim Etkinlikleri Aç | T15 | text; image inspected |
| My Jobs | Benim İşler | T15 | text; image inspected |
| Total Records | Toplam Kayıtlar | T15 | text; image inspected |
| Late by {count} days | {count} gün geç | T15 | visible; red overdue text |
| Locale Information | Lokalizasyon Bilgisi | T16 | visible after content scroll |
| Language | Dil | T16 | visible after content scroll |
| Country Locale | Ülke Yerel Ayarı | T16 | visible after content scroll |
| Date Format | Tarih Biçimi | T16 | visible after content scroll |
| Time Format | Saat Biçimi | T16 | visible after content scroll |
| Time Zone | Zaman Dilimi | T16 | visible after content scroll |
| Number Format | Sayı Biçimi | T16 | visible after content scroll |
| Preferred Unit for Distance | Mesafe için Tercih Edilen Birim | T16 | visible after content scroll |
| 'Create Meeting | Toplantı Oluştur | T17 | text; image inspected |
| Subject / meeting | Başlık | T17 | text; image inspected |
| From / meeting | Başlangıç | T17 | text; image inspected |
| To / meeting | Bitiş | T17 | text; image inspected |
| 'Create Account | Firma Oluştur | T18 | text; image inspected |
| Account Owner | Firma Kayıt Sahibi | T18 | text; image inspected |

### Mixed-language values and naturally empty states

Tasks and Workqueue retain English `Not Started`, `In Progress`, `Completed`,
`Highest`, `High`, `Normal` and `Low` values in existing cells. Leads retains
English status-path values including `Contacted`, `Lost Lead`, `Not Contacted`,
`Pre-Qualified` and `Not Qualified`; blank form selections display `-None-`.
Deals stage names and Calls `Outbound` remain English. Do not promote the
remaining P translations for these values to reference parity or change stored
option values. These observations do not establish why they remain English or
whether administrative translations could change them.

Naturally empty lists provide exact read-only messages: Campaigns shows
`Hiçbir Kampanyalar bulunamadı.`, Cases `Hiçbir Servis Dosyaları bulunamadı.`,
and Solutions `Hiçbir Çözümler bulunamadı.` No validation, success or error
message was triggered through a write.

### Live locale and formatting findings

- The read-only locale section is `Lokalizasyon Bilgisi`; its timezone label is
  `Zaman Dilimi`. Grouping/decimal are not separate displayed row labels here;
  their editor controls were not opened.
- The date token and form placeholder use `DD.MM.YYYY`. Numeric lists show dotted
  day/month/year dates. All format examples in this spec are synthetic.
- The current time setting displays a twelve-hour preference; Calls shows
  localized `ÖÖ` / `ÖS` markers. The CLDR 24-hour convention is not proof of this
  user's selected preference.
- The number-format illustration uses period grouping/comma decimals with three
  fraction digits. That illustration does not establish currency precision.
- Deals and Analytics show `TL`, with period grouping/comma decimals; symbol
  placement varies by surface. Synthetic patterns: `TL 1.234,56` and
  `1.234,56 TL`. The earlier CLDR `₺` example is not an observed reference rule.
- List activity badges use abbreviated Turkish month names (e.g. `Ekm`, `Kas`,
  `Oca`) and some month-first text. Reports shows a localized relative-hours
  expression. Workqueue uses red `{count} gün geç`. No universal date renderer
  can be inferred.
- Week start was not newly inspected or changed. Monday remains the CLDR
  baseline. No before/after mutation experiment tested preference persistence.

## Turkish capture register and safety accounting

Each slug has screenshot.png, page.txt, aria.yml, controls.json, network.json and
meta.json in the local research workspace. Raw private data remains there and is
not committed or uploaded. This sanitized specification is the deliverable.
Images were inspected; text-only and transition limits are described explicitly.

| Key | Capture slug | UTC timestamp | Blocked requests |
| --- | --- | --- | --- |
| T01 | `m1336-tr-leads-list` | 2026-10-24T18:37:21Z | 2 |
| T02 | `m1336-tr-cases-list` | 2026-10-24T18:41:46Z | 2 |
| T03 | `m1336-tr-setup` | 2026-10-24T18:40:17Z | 2 |
| T04 | `m1336-tr-leads-detail` | 2026-10-24T18:42:57Z | 4 |
| T05 | `m1336-tr-leads-form` | 2026-10-24T18:43:23Z | 3 |
| T06 | `m1336-tr-contacts-form` | 2026-10-24T18:44:09Z | 2 |
| T07 | `m1336-tr-contacts-list` | 2026-10-24T18:37:40Z | 2 |
| T08 | `m1336-tr-tasks-list` | 2026-10-24T18:38:30Z | 2 |
| T09 | `m1336-tr-calls-list` | 2026-10-24T18:39:01Z | 2 |
| T10 | `m1336-tr-deals-form` | 2026-10-24T18:46:03Z | 4 |
| T11 | `m1336-tr-campaigns-list` | 2026-10-24T18:41:27Z | 2 |
| T12 | `m1336-tr-reports` | 2026-10-24T18:40:54Z | 2 |
| T13 | `m1336-tr-analytics` | 2026-10-24T18:41:08Z | 2 |
| T14 | `m1336-tr-documents-list` | 2026-10-24T18:42:21Z | 1 |
| T15 | `m1336-tr-workqueue` | 2026-10-24T18:39:30Z | 3 |
| T16 | `m1336-tr-personal-locale-scroll` | 2026-10-24T18:47:50Z | 2 |
| T17 | `m1336-tr-meetings-list-final` | 2026-10-24T18:47:26Z | 2 |
| T18 | `m1336-tr-accounts-form-ready` | 2026-10-24T18:48:21Z | 2 |
| T19 | `m1336-tr-accounts-list` | 2026-10-24T18:37:58Z | 2 |
| T20 | `m1336-tr-contacts-detail` | 2026-10-24T18:43:47Z | 4 |
| T21 | `m1336-tr-accounts-detail-ready` | 2026-10-24T18:47:05Z | 3 |
| T22 | `m1336-tr-deals-detail` | 2026-10-24T18:45:41Z | 5 |
| T23 | `m1336-tr-deals-list-ready` | 2026-10-24T18:39:51Z | 4 |
| T24 | `m1336-tr-solutions-list` | 2026-10-24T18:42:07Z | 2 |

| T25 | `m1336-tr-home` | 2026-10-24T18:36:53Z | 2 |
| T26 | `m1336-tr-personal-locale` | 2026-10-24T18:40:37Z | 2 |
| T27 | `m1336-tr-finish` | 2026-10-24T18:48:55Z | 2 |

The register contains 27 completed captures. Five earlier loading, transitional
or readiness-failed attempts remain local and are not completion evidence.

All 32 attempts together record **84 blocked-request entries** (including the
five excluded attempts). No block was bypassed:

| Category | Blocked entries |
| --- | --- |
| Automatic reminder / notification-status legacy POSTs | 31 / 27 |
| Deals grouped-count POSTs / module-settings PUTs | 3 / 3 |
| Analytics metadata PUT / Workqueue view-preference PUT | 1 / 1 |
| Client-tracking and monitoring telemetry POSTs | 15 |
| Lead/contact related-count POSTs | 2 |
| Legacy record-navigation POST | 1 |

Successful non-GET traffic is not zero. Across capture exports there are 98
successful non-GET endpoint entries (entries aggregate requests): count (19),
bulk (33), query-run (13), triggers (29), and legacy customization reads (4).
All are POSTs permitted by the capture guard's read allowlist, including its
legacy read-action check; no successful PUT/PATCH/DELETE entry was observed.
This is bounded capture evidence, not a server-side audit. No intentional
record, translation, locale or saved-preference mutation was executed.

Deals opened in its existing stage-card view. No table-view switch was made,
because that would persist a preference. Treat this as the current opening view,
not a table capture. Early short-path Deals/Meetings captures were loading shells
and are excluded as completed evidence. An Accounts detail attempt with an
inexact link name failed readiness before any click; the corrected attempt used
the exact exported named selector. The first Accounts form image was transitional;
only its later ready capture can establish the painted form. Documents showed
folder navigation with a blank content area, so it proves shell terminology only.
Blank forms were left through subsequent navigation, without input or save.
No tab or window was closed, and only the board may restore English.

## Remaining unverified coverage worksheet

Only the remaining rows below are P candidates, not observed reference labels.
Combined concepts still require confirmation in their own contexts.

### Shell and module names

| English concept | Turkish candidate (P) | Confirmation concern |
| --- | --- | --- |
| Dashboards | Panolar | Distinguish from Analytics |
| Calendar | Takvim | Module name |
| All Modules | Tüm Modüller | Navigation/search scope |
| Tags | Etiketler | Utility |

### Common fields

| English concept | Turkish candidate (P) |
| --- | --- |
| Full Name | Ad Soyad |
| Owner | Kayıt Sahibi |
| Assigned To | Atanan Kişi |
| Currency | Para Birimi |
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
| Delete | Sil |
| Clone | Kopyala |
| Add / Remove | Ekle / Kaldır |
| Update | Güncelle |
| Close | Kapat |
| Back / Next | Geri / İleri |
| Search | Ara |
| Filter / Apply / Clear | Filtrele / Uygula / Temizle |
| More / Actions | Diğer / İşlemler |
| Change Owner | Kayıt Sahibini Değiştir |
| Mark as Completed | Tamamlandı Olarak İşaretle |
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
| Due in {count} days | {count} gün içinde | P; context may need a due-date verb |
| {count} days ago | {count} gün önce | L1 linguistic convention; reference label unverified |
| in {count} days | {count} gün sonra | L1 linguistic convention; reference label unverified |
| {count} records selected | {count} kayıt seçildi | P; zero/singular/plural must be checked |

Keep full messages with placeholders, rather than concatenating English word
order. Preserve numeric meaning, overdue highlighting and count badges when
localizing. The day-boundary calculation (user zone versus organization zone,
calendar days versus elapsed 24-hour periods) is not established by these labels.


## Open questions and observation limits

1. Which observed labels are account-specific renamings rather than system
   defaults? Account-visible labels are the evidence boundary.
2. Remaining P rows, unseen option alternatives, grouping/decimal editor labels
   and localized validation/success/error messages are unverified. Writes are
   not authorized to resolve these questions.
3. Does language selection preserve all explicit locale/time/currency preferences,
   and how does it propagate between sessions? No mutation experiment was run.
4. Workqueue wording is established, but day-boundary, rounding and timezone
   precedence are not. Week-start override, currency precision/rounding and
   locale-aware search/casing remain unverified.
5. Loading/transition captures and the blank Documents content area must not be
   treated as complete module coverage. This is language research, not screen QA.

## Verification and disposition

Documentation-only update: exact dictionary strings checked against capture text,
completed images inspected, controls and ARIA reconciled for the controls used,
and blocked plus successful non-GET accounting reviewed. Naming/privacy checks
and `git diff --check` apply. Application tests, typecheck and e2e are inapplicable
because no product code changed. The Turkish capture window is no longer needed
for this R1 delivery. Submit the sanitized update to the configured non-Claude
reviewer; only the board restores the reference language.
