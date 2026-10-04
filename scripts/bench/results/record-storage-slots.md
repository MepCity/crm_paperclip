# Record storage: typed index slots under RLS

Completed. 200000 measured-organization Leads; seed 1; 5 warmups, 30 measurements; 2000 writes per kind. Same-run A3/A4/B1; A4n is the non-null partial-index variant. Only synthetic data.

## Environment

| setting | value |
| --- | --- |
| postgres | PostgreSQL 18.4 on x86_64-apple-darwin24.6.0 |
| shared_buffers | 128MB |
| work_mem | 4MB |
| jit | on |
| cpus | 8 |
| memory_gib | 16.0 |

## RLS off / on comparison

Client median / p95 in ms. Final attempt and latest MCV state; original measurements are below.

| scenario | A3 off | A3 on | A4 off | A4 on | B1 off | B1 on | A4 on slot Index Cond |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | 1.12 / 1.73 | 0.72 / 1.26 | 1.38 / 1.72 | 1.25 / 1.40 | 1.08 / 3.78 | 1.21 / 5.25 | no |
| S2 | 1.19 / 1.31 | 1.19 / 1.34 | 1.28 / 2.21 | 0.73 / 1.61 | 2.45 / 16.01 | 2.69 / 4.60 | no |
| S2-KEYSET | 2.13 / 5.07 | 172.69 / 289.67 | 2.72 / 3.71 | 1.41 / 3.00 | 1.60 / 7.01 | 2.42 / 3.12 | yes |
| S2-OFFSET | 116.62 / 164.17 | 158.95 / 263.84 | 142.93 / 204.44 | 155.92 / 381.22 | 84.94 / 307.50 | 53.31 / 86.13 | yes |
| S3 | 5.61 / 14.31 | 68.46 / 92.83 | 4.80 / 11.91 | 11.25 / 15.22 | 5.79 / 13.89 | 5.55 / 12.68 | yes |
| S4 | 0.68 / 0.75 | 1.11 / 1.38 | 0.71 / 1.37 | 1.37 / 1.63 | 0.91 / 1.01 | 0.55 / 1.52 | no |
| S5 | 2.39 / 5.25 | 110.12 / 136.79 | 1.72 / 2.13 | 1.46 / 1.62 | 2.23 / 3.72 | 1.58 / 2.86 | yes |
| S11 | 0.76 / 0.87 | 111.36 / 149.13 | 0.54 / 0.71 | 0.44 / 0.50 | 0.92 / 1.15 | 0.81 / 1.24 | yes |
| S14 | 139.88 / 157.32 | 156.12 / 182.24 | 286.79 / 408.01 | 494.09 / 1689.50 | 61.83 / 79.01 | 91.14 / 245.86 | yes |
| S2 count | 27.23 / 38.85 | 129.30 / 231.61 | 3.47 / 18.91 | 4.00 / 32.30 | 147.23 / 346.18 | 160.63 / 313.42 | yes |
| S2 capped | 17.86 / 24.60 | 102.80 / 147.77 | 4.66 / 51.66 | 3.36 / 31.24 | 74.25 / 134.22 | 76.92 / 178.28 | yes |
| S8 | 0.63 / 1.08 | 0.40 / 0.49 | 1.28 / 5.50 | 0.70 / 8.17 | 1.25 / 1.80 | 0.90 / 1.05 | no |

## Writes (RLS on)

| stage | operation | ops | median_ms | p95_ms | WAL_bytes/op | GIN_flush_ms |
| --- | --- | --- | --- | --- | --- | --- |
| A2 | S9 insert | 2000 | 3.14 | 15.49 | 105142 | 5432.63 |
| A2 | S9 update1 | 2000 | 2.02 | 11.15 | 103923 | 3474.03 |
| A2 | S9 update5 | 2000 | 1.98 | 5.05 | 100178 | 3407.18 |
| B1 | S9 insert | 2000 | 1.95 | 4.33 | 53149 | 0.00 |
| B1 | S9 update1 | 2000 | 1.73 | 5.93 | 51268 | 0.00 |
| B1 | S9 update5 | 2000 | 1.51 | 4.41 | 46663 | 0.00 |
| A4 | S9 insert | 2000 | 4.71 | 10.97 | 104635 | 0.00 |
| A4 | S9 update1 | 2000 | 5.43 | 24.84 | 103724 | 0.00 |
| A4 | S9 update5 | 2000 | 4.77 | 17.17 | 100813 | 0.00 |
| A4n | S9 insert | 2000 | 1.34 | 3.16 | 41778 | 0.00 |
| A4n | S9 update1 | 2000 | 0.88 | 2.03 | 42515 | 0.00 |
| A4n | S9 update5 | 2000 | 0.95 | 1.27 | 40308 | 0.00 |

## Size summary

Table bytes use pg_table_size (including TOAST); indexes use pg_relation_size. A2 includes GIN and expression indexes. B1 includes Leads and Contacts. Snapshots are taken before timed writes; events are excluded.

| stage | table_bytes | all_index_bytes | slot_index_bytes | slot_index_count |
| --- | --- | --- | --- | --- |
| A2 | 500850688 | 438722560 | 0 | 0 |
| A4 | 518840320 | 527851520 | 468484096 | 20 |
| A4n | 518840320 | 202162176 | 142794752 | 20 |
| B1 | 329121792 | 182370304 | 0 | 0 |

## Operator leakproof flags

| operator/function | left_type | right_type | procedure | proleakproof |
| --- | --- | --- | --- | --- |
| < | bigint | bigint | int8lt | yes |
| = | bigint | bigint | int8eq | yes |
| = | boolean | boolean | booleq | yes |
| < | date | date | date_lt | yes |
| = | date | date | date_eq | yes |
| < | double precision | double precision | float8lt | yes |
| = | double precision | double precision | float8eq | yes |
| >= | double precision | double precision | float8ge | yes |
| -> | jsonb | text | jsonb_object_field | no |
| ->> | jsonb | text | jsonb_object_field_text | no |
| @> | jsonb | jsonb | jsonb_contains | no |
| >= | numeric | numeric | numeric_ge | no |
| < | text | text | text_lt | yes |
| = | text | text | texteq | yes |
| > | text | text | text_gt | yes |
| >= | text | text | text_ge | yes |
| ~~* | text | text | texticlike | no |
| < | timestamp with time zone | timestamp with time zone | timestamptz_lt | yes |
| >= | timestamp with time zone | timestamp with time zone | timestamptz_ge | yes |
| @@ | tsvector | tsquery | ts_match_vq | no |
| = | uuid | uuid | uuid_eq | yes |
| > | uuid | uuid | uuid_gt | yes |
| lower(text) | text | — | lower | no |

## Query evidence (all attempts)

| stage | scenario | RLS | attempt | MCV slots | median_ms | p95_ms | slot Index Cond | est_rows | actual_rows | removed | buffers | reads | plan | slot conditions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A3 | S1 | off | 0 | none | 1.12 | 1.73 | no | 204092 | 50 | 0 | 257 | 53 | Index Scan a_created_idx | — |
| A3 | S1 | on | 0 | none | 0.72 | 1.26 | no | 204092 | 50 | 0 | 234 | 0 | Index Scan a_created_idx | — |
| A3 | S2 | off | 0 | none | 1.19 | 1.31 | no | 11184 | 50 | 1913 | 2284 | 612 | Index Scan a_x_company | — |
| A3 | S2 | on | 0 | none | 1.19 | 1.34 | no | 11184 | 50 | 1913 | 2284 | 0 | Index Scan a_x_company | — |
| A3 | S2-KEYSET | off | 0 | none | 2.13 | 5.07 | no | 50 | 50 | 0 | 1256 | 331 | Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan a_x_lead_status | — |
| A3 | S2-KEYSET | on | 0 | none | 172.69 | 289.67 | no | 50 | 50 | 0 | 116181 | 40234 | Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan records_pkey | — |
| A3 | S2-OFFSET | off | 0 | none | 116.62 | 164.17 | no | 11184 | 13157 | 3275 | 74997 | 14126 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | — |
| A3 | S2-OFFSET | on | 0 | none | 158.95 | 263.84 | no | 4660 | 13157.01 | 95614 | 228147 | 46392 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | — |
| A3 | S3 | off | 0 | none | 5.61 | 14.31 | no | 192 | 313 | 8822 | 10611 | 8263 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | — |
| A3 | S3 | on | 0 | none | 68.46 | 92.83 | no | 128 | 313 | 19628 | 30237 | 15405 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | — |
| A3 | S4 | off | 0 | none | 0.68 | 0.75 | no | 153484 | 50 | 33 | 191 | 65 | Index Scan a_x_last_name | — |
| A3 | S4 | on | 0 | none | 1.11 | 1.38 | no | 153484 | 50 | 33 | 191 | 0 | Index Scan a_x_last_name | — |
| A3 | S5 | off | 0 | none | 2.39 | 5.25 | no | 40 | 50 | 500 | 1497 | 460 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_country | — |
| A3 | S5 | on | 0 | none | 110.12 | 136.79 | no | 17 | 50.010000000000005 | 99983 | 168545 | 47683 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | — |
| A3 | S11 | off | 0 | none | 0.76 | 0.87 | no | 1 | 3 | 0 | 6 | 6 | Sort; Index Scan a_x_cf_lookup_1 | — |
| A3 | S11 | on | 0 | none | 111.36 | 149.13 | no | 1 | 3 | 99999 | 167510 | 43363 | Sort; Gather planned=2 launched=2; Seq Scan records | — |
| A3 | S14 | off | 0 | none | 139.88 | 157.32 | no | 16786 | 19602 | 4870 | 107070 | 20151 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_annual_revenue | — |
| A3 | S14 | on | 0 | none | 156.12 | 182.24 | no | 21346 | 19602 | 93466 | 254489 | 47286 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | — |
| A3 | S2 count | off | 0 | none | 27.23 | 38.85 | no | 11184 | 13157 | 3275 | 14451 | 14451 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | — |
| A3 | S2 count | on | 0 | none | 129.30 | 231.61 | no | 4660 | 13157.01 | 95614 | 167510 | 48497 | Gather planned=2 launched=2; Seq Scan records | — |
| A3 | S2 capped | off | 0 | none | 17.86 | 24.60 | no | 11184 | 10001 | 0 | 8870 | 8870 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | — |
| A3 | S2 capped | on | 0 | none | 102.80 | 147.77 | no | 4660 | 10698 | 74426 | 133019 | 34389 | Gather planned=2 launched=2; Seq Scan records | — |
| A3 | S8 | off | 0 | none | 0.63 | 1.08 | no | 1 | 1 | 0 | 4 | 4 | Index Scan records_pkey | — |
| A3 | S8 | on | 0 | none | 0.40 | 0.49 | no | 1 | 1 | 0 | 4 | 0 | Index Scan records_pkey | — |
| B1 | S1 | off | 0 | none | 1.08 | 3.78 | no | 196374 | 50 | 0 | 54 | 30 | Index Scan bl_created_idx | — |
| B1 | S1 | on | 0 | none | 1.21 | 5.25 | no | 196374 | 50 | 0 | 54 | 0 | Index Scan bl_created_idx | — |
| B1 | S2 | off | 0 | none | 2.45 | 16.01 | no | 12987 | 50 | 1913 | 1443 | 391 | Index Scan bl_x_company | — |
| B1 | S2 | on | 0 | none | 2.69 | 4.60 | no | 12987 | 50 | 1913 | 1443 | 0 | Index Scan bl_x_company | — |
| B1 | S2-KEYSET | off | 0 | none | 1.60 | 7.01 | no | 50 | 50 | 0 | 353 | 154 | Incremental Sort; Subquery Scan; Index Scan bl_x_company; Sort; Subquery Scan; Index Scan bl_x_lead_status | — |
| B1 | S2-KEYSET | on | 0 | none | 2.42 | 3.12 | no | 50 | 50 | 0 | 353 | 0 | Incremental Sort; Subquery Scan; Index Scan bl_x_company; Sort; Subquery Scan; Index Scan bl_x_lead_status | — |
| B1 | S2-OFFSET | off | 0 | none | 84.94 | 307.50 | no | 12987 | 13157 | 3275 | 13766 | 9137 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | — |
| B1 | S2-OFFSET | on | 0 | none | 53.31 | 86.13 | no | 12987 | 13157 | 3275 | 13766 | 9587 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | — |
| B1 | S3 | off | 0 | none | 5.79 | 13.89 | no | 262 | 313 | 8822 | 8312 | 5440 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | — |
| B1 | S3 | on | 0 | none | 5.55 | 12.68 | no | 175 | 313 | 8822 | 8312 | 0 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | — |
| B1 | S4 | off | 0 | none | 0.91 | 1.01 | no | 176501 | 50 | 33 | 86 | 49 | Index Scan bl_x_last_name | — |
| B1 | S4 | on | 0 | none | 0.55 | 1.52 | no | 176501 | 50 | 33 | 86 | 0 | Index Scan bl_x_last_name | — |
| B1 | S5 | off | 0 | none | 2.23 | 3.72 | no | 62 | 50 | 500 | 553 | 339 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | — |
| B1 | S5 | on | 0 | none | 1.58 | 2.86 | no | 62 | 50 | 500 | 553 | 0 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | — |
| B1 | S11 | off | 0 | none | 0.92 | 1.15 | no | 3 | 3 | 0 | 6 | 4 | Sort; Index Scan bl_x_cf_lookup_1 | — |
| B1 | S11 | on | 0 | none | 0.81 | 1.24 | no | 3 | 3 | 0 | 6 | 0 | Sort; Index Scan bl_x_cf_lookup_1 | — |
| B1 | S14 | off | 0 | none | 61.83 | 79.01 | no | 19834 | 19602 | 4870 | 18904 | 14846 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_annual_revenue | — |
| B1 | S14 | on | 0 | none | 91.14 | 245.86 | no | 24739 | 19602 | 76799 | 38492 | 22426 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | — |
| B1 | S2 count | off | 0 | none | 147.23 | 346.18 | no | 12987 | 13157 | 3275 | 13766 | 11290 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | — |
| B1 | S2 count | on | 0 | none | 160.63 | 313.42 | no | 12987 | 13157 | 3275 | 13766 | 9587 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | — |
| B1 | S2 capped | off | 0 | none | 74.25 | 134.22 | no | 12987 | 10001 | 2 | 8470 | 5896 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | — |
| B1 | S2 capped | on | 0 | none | 76.92 | 178.28 | no | 12987 | 10001 | 2 | 8475 | 3621 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | — |
| B1 | S8 | off | 0 | none | 1.25 | 1.80 | no | 1 | 1 | 0 | 4 | 3 | Index Scan leads_pkey | — |
| B1 | S8 | on | 0 | none | 0.90 | 1.05 | no | 1 | 1 | 0 | 4 | 0 | Index Scan leads_pkey | — |
| A4 | S1 | off | 0 | none | 1.38 | 1.72 | no | 203779 | 50 | 0 | 419 | 56 | Index Scan a_created_idx | — |
| A4 | S1 | on | 0 | none | 1.25 | 1.40 | no | 203779 | 50 | 0 | 396 | 0 | Index Scan a_created_idx | — |
| A4 | S2 | off | 0 | none | 1.68 | 1.92 | no | 11418 | 50 | 934 | 645 | 334 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | on | 0 | none | 0.82 | 0.93 | no | 11418 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | off | 1 | none | 0.80 | 1.54 | no | 11418 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | on | 1 | none | 1.61 | 2.24 | no | 11418 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | off | 2 | none | 0.81 | 1.52 | no | 11418 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | on | 2 | none | 0.82 | 0.90 | no | 11418 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | off | 0 | ix_text_3 | 1.28 | 2.21 | no | 13663 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2 | on | 0 | ix_text_3 | 0.73 | 1.61 | no | 13663 | 50 | 934 | 645 | 0 | Index Scan a_slot_ix_text_1 | — |
| A4 | S2-KEYSET | off | 0 | ix_text_3 | 2.72 | 3.71 | yes | 50 | 50 | 0 | 892 | 252 | Incremental Sort; Subquery Scan; Index Scan a_slot_ix_text_1; Sort; Subquery Scan; Index Scan a_slot_ix_text_3 | a_slot_ix_text_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ROW(ix_text_1, id) > ROW('?' ::text COLLATE "und-x-icu", '?' ::uuid))); a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S2-KEYSET | on | 0 | ix_text_3 | 1.41 | 3.00 | yes | 50 | 50 | 0 | 892 | 0 | Incremental Sort; Subquery Scan; Index Scan a_slot_ix_text_1; Sort; Subquery Scan; Index Scan a_slot_ix_text_3 | a_slot_ix_text_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ROW(ix_text_1, id) > ROW('?' ::text COLLATE "und-x-icu", '?' ::uuid))); a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S2-OFFSET | off | 0 | ix_text_3 | 142.93 | 204.44 | yes | 13663 | 13157 | 0 | 92730 | 12389 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S2-OFFSET | on | 0 | ix_text_3 | 155.92 | 381.22 | yes | 13663 | 13157 | 0 | 92730 | 13203 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S3 | off | 0 | ix_text_3 | 4.80 | 11.91 | yes | 192 | 313 | 6993 | 8909 | 5535 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_time_1 | a_slot_ix_time_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_time_1 >= '?' ::timestamp with time zone) AND (ix_time_1 < '?' ::timestamp with time zone)) |
| A4 | S3 | on | 0 | ix_text_3 | 11.25 | 15.22 | yes | 192 | 313 | 6993 | 8906 | 0 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_time_1 | a_slot_ix_time_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_time_1 >= '?' ::timestamp with time zone) AND (ix_time_1 < '?' ::timestamp with time zone)) |
| A4 | S4 | off | 0 | ix_text_3 | 0.71 | 1.37 | no | 1020 | 50 | 10 | 303 | 49 | Index Scan a_slot_ix_text_2 | — |
| A4 | S4 | on | 0 | ix_text_3 | 1.37 | 1.63 | no | 1020 | 50 | 10 | 303 | 0 | Index Scan a_slot_ix_text_2 | — |
| A4 | S5 | off | 0 | ix_text_3 | 1.72 | 2.13 | yes | 45 | 50 | 403 | 892 | 362 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_7 | a_slot_ix_text_7: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_7 = '?' ::text)) |
| A4 | S5 | on | 0 | ix_text_3 | 1.46 | 1.62 | yes | 45 | 50 | 403 | 892 | 0 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_7 | a_slot_ix_text_7: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_7 = '?' ::text)) |
| A4 | S11 | off | 0 | ix_text_3 | 0.54 | 0.71 | yes | 3 | 3 | 0 | 7 | 5 | Sort; Index Scan a_slot_ix_ref_1 | a_slot_ix_ref_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_ref_1 = '?' ::uuid)) |
| A4 | S11 | on | 0 | ix_text_3 | 0.44 | 0.50 | yes | 3 | 3 | 0 | 7 | 0 | Sort; Index Scan a_slot_ix_ref_1 | a_slot_ix_ref_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_ref_1 = '?' ::uuid)) |
| A4 | S14 | off | 0 | ix_text_3 | 141.00 | 196.36 | yes | 16784 | 19602 | 0 | 132458 | 17603 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_num_1 | a_slot_ix_num_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_num_1 >= '?' ::double precision)) |
| A4 | S14 | on | 0 | ix_text_3 | 283.64 | 377.91 | yes | 16784 | 19602 | 0 | 132458 | 16070 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_num_1 | a_slot_ix_num_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_num_1 >= '?' ::double precision)) |
| A4 | S14 | off | 1 | ix_text_3 | 286.79 | 408.01 | yes | 16784 | 19602 | 0 | 132458 | 16070 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_num_1 | a_slot_ix_num_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_num_1 >= '?' ::double precision)) |
| A4 | S14 | on | 1 | ix_text_3 | 494.09 | 1689.50 | yes | 16784 | 19602 | 0 | 132458 | 16070 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_num_1 | a_slot_ix_num_1: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_num_1 >= '?' ::double precision)) |
| A4 | S2 count | off | 0 | ix_text_3 | 3.47 | 18.91 | yes | 13663 | 13157 | 0 | 4429 | 142 | Index Only Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S2 count | on | 0 | ix_text_3 | 4.00 | 32.30 | yes | 13663 | 13157 | 0 | 4429 | 0 | Index Only Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S2 capped | off | 0 | ix_text_3 | 4.66 | 51.66 | yes | 13663 | 10001 | 0 | 3350 | 0 | Index Only Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S2 capped | on | 0 | ix_text_3 | 3.36 | 31.24 | yes | 13663 | 10001 | 0 | 3350 | 0 | Index Only Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4 | S8 | off | 0 | ix_text_3 | 2.57 | 24.88 | no | 1 | 1 | 0 | 4 | 4 | Index Scan records_pkey | — |
| A4 | S8 | on | 0 | ix_text_3 | 0.65 | 0.98 | no | 1 | 1 | 0 | 4 | 0 | Index Scan records_pkey | — |
| A4 | S8 | off | 1 | ix_text_3 | 1.28 | 5.50 | no | 1 | 1 | 0 | 4 | 0 | Index Scan records_pkey | — |
| A4 | S8 | on | 1 | ix_text_3 | 0.70 | 8.17 | no | 1 | 1 | 0 | 4 | 0 | Index Scan records_pkey | — |
| A4n | S2 | off | 0 | none | 101.37 | 130.09 | yes | 11168 | 13157 | 0 | 92753 | 12329 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4n | S2 | on | 0 | none | 107.26 | 147.90 | yes | 11168 | 13157 | 0 | 92730 | 13203 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4n | S2-KEYSET | off | 0 | none | 47.40 | 101.15 | yes | 50 | 50 | 0 | 31040 | 11991 | Sort; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_3; Subquery Scan; Index Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)); a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |
| A4n | S2-KEYSET | on | 0 | none | 40.32 | 57.67 | yes | 50 | 50 | 0 | 31040 | 9384 | Sort; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_slot_ix_text_3; Subquery Scan; Index Scan a_slot_ix_text_3 | a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)); a_slot_ix_text_3: ((organization_id = '?' ::uuid) AND (module_id = '?' ::uuid) AND (ix_text_3 = '?' ::text)) |

## Relation sizes

| stage | schema | relation | kind | bytes |
| --- | --- | --- | --- | --- |
| A2 | bench_a | a_created_idx | index | 22732800 |
| A2 | bench_a | a_data_gin | index | 248741888 |
| A2 | bench_a | a_owner_idx | index | 2244608 |
| A2 | bench_a | a_updated_idx | index | 22740992 |
| A2 | bench_a | a_x_annual_revenue | index | 11280384 |
| A2 | bench_a | a_x_cf_datetime_1 | index | 13959168 |
| A2 | bench_a | a_x_cf_lookup_1 | index | 15409152 |
| A2 | bench_a | a_x_company | index | 11296768 |
| A2 | bench_a | a_x_country | index | 11313152 |
| A2 | bench_a | a_x_email_opt_out | index | 9969664 |
| A2 | bench_a | a_x_industry | index | 11313152 |
| A2 | bench_a | a_x_last_name | index | 12140544 |
| A2 | bench_a | a_x_lead_source | index | 11313152 |
| A2 | bench_a | a_x_lead_status | index | 11313152 |
| A2 | bench_a | a_x_rating | index | 11304960 |
| A2 | bench_a | records | table | 500850688 |
| A2 | bench_a | records_pkey | index | 11649024 |
| B1 | bench_b | bc_created_idx | index | 3809280 |
| B1 | bench_b | bc_owner_idx | index | 385024 |
| B1 | bench_b | bc_updated_idx | index | 3809280 |
| B1 | bench_b | bl_created_idx | index | 18948096 |
| B1 | bench_b | bl_owner_idx | index | 1867776 |
| B1 | bench_b | bl_updated_idx | index | 18956288 |
| B1 | bench_b | bl_x_annual_revenue | index | 11280384 |
| B1 | bench_b | bl_x_cf_datetime_1 | index | 9953280 |
| B1 | bench_b | bl_x_cf_lookup_1 | index | 11313152 |
| B1 | bench_b | bl_x_company | index | 11296768 |
| B1 | bench_b | bl_x_country | index | 11313152 |
| B1 | bench_b | bl_x_email_opt_out | index | 9969664 |
| B1 | bench_b | bl_x_industry | index | 11313152 |
| B1 | bench_b | bl_x_last_name | index | 12140544 |
| B1 | bench_b | bl_x_lead_source | index | 11313152 |
| B1 | bench_b | bl_x_lead_status | index | 11313152 |
| B1 | bench_b | bl_x_rating | index | 11304960 |
| B1 | bench_b | contacts | table | 14426112 |
| B1 | bench_b | contacts_pkey | index | 2269184 |
| B1 | bench_b | leads | table | 314695680 |
| B1 | bench_b | leads_pkey | index | 9814016 |
| A4 | bench_a | a_created_idx | index | 22732800 |
| A4 | bench_a | a_owner_idx | index | 2244608 |
| A4 | bench_a | a_slot_ix_num_1 | index | 22765568 |
| A4 | bench_a | a_slot_ix_num_2 | index | 22798336 |
| A4 | bench_a | a_slot_ix_num_3 | index | 22798336 |
| A4 | bench_a | a_slot_ix_num_4 | index | 22798336 |
| A4 | bench_a | a_slot_ix_ref_1 | index | 24109056 |
| A4 | bench_a | a_slot_ix_ref_2 | index | 22798336 |
| A4 | bench_a | a_slot_ix_ref_3 | index | 22798336 |
| A4 | bench_a | a_slot_ix_ref_4 | index | 22798336 |
| A4 | bench_a | a_slot_ix_text_1 | index | 24518656 |
| A4 | bench_a | a_slot_ix_text_2 | index | 25198592 |
| A4 | bench_a | a_slot_ix_text_3 | index | 24649728 |
| A4 | bench_a | a_slot_ix_text_4 | index | 24125440 |
| A4 | bench_a | a_slot_ix_text_5 | index | 24125440 |
| A4 | bench_a | a_slot_ix_text_6 | index | 24117248 |
| A4 | bench_a | a_slot_ix_text_7 | index | 24125440 |
| A4 | bench_a | a_slot_ix_text_8 | index | 22798336 |
| A4 | bench_a | a_slot_ix_time_1 | index | 22765568 |
| A4 | bench_a | a_slot_ix_time_2 | index | 22798336 |
| A4 | bench_a | a_slot_ix_time_3 | index | 22798336 |
| A4 | bench_a | a_slot_ix_time_4 | index | 22798336 |
| A4 | bench_a | a_updated_idx | index | 22740992 |
| A4 | bench_a | records | table | 518840320 |
| A4 | bench_a | records_pkey | index | 11649024 |
| A4n | bench_a | a_created_idx | index | 22732800 |
| A4n | bench_a | a_owner_idx | index | 2244608 |
| A4n | bench_a | a_slot_ix_num_1 | index | 11362304 |
| A4n | bench_a | a_slot_ix_num_2 | index | 8192 |
| A4n | bench_a | a_slot_ix_num_3 | index | 8192 |
| A4n | bench_a | a_slot_ix_num_4 | index | 8192 |
| A4n | bench_a | a_slot_ix_ref_1 | index | 12779520 |
| A4n | bench_a | a_slot_ix_ref_2 | index | 8192 |
| A4n | bench_a | a_slot_ix_ref_3 | index | 8192 |
| A4n | bench_a | a_slot_ix_ref_4 | index | 8192 |
| A4n | bench_a | a_slot_ix_text_1 | index | 16932864 |
| A4n | bench_a | a_slot_ix_text_2 | index | 23683072 |
| A4n | bench_a | a_slot_ix_text_3 | index | 15548416 |
| A4n | bench_a | a_slot_ix_text_4 | index | 12763136 |
| A4n | bench_a | a_slot_ix_text_5 | index | 12763136 |
| A4n | bench_a | a_slot_ix_text_6 | index | 12713984 |
| A4n | bench_a | a_slot_ix_text_7 | index | 12771328 |
| A4n | bench_a | a_slot_ix_text_8 | index | 8192 |
| A4n | bench_a | a_slot_ix_time_1 | index | 11395072 |
| A4n | bench_a | a_slot_ix_time_2 | index | 8192 |
| A4n | bench_a | a_slot_ix_time_3 | index | 8192 |
| A4n | bench_a | a_slot_ix_time_4 | index | 8192 |
| A4n | bench_a | a_updated_idx | index | 22740992 |
| A4n | bench_a | records | table | 518840320 |
| A4n | bench_a | records_pkey | index | 11649024 |

## Equivalence and isolation

| stage | check | pass | detail |
| --- | --- | --- | --- |
| A3 | S1 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S2 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S2-KEYSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S2-OFFSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S3 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S4 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S5 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S11 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S14 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S2 count equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S2 capped equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A3 | S8 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S1 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S2 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S2-KEYSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S2-OFFSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S3 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S4 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S5 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S11 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S14 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S2 count equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S2 capped equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| B1 | S8 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S1 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S2 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S2-KEYSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S2-OFFSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S3 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S4 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S5 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S11 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S14 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S2 count equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S2 capped equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4 | S8 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4/A | unset setting returns no rows | yes | count=0 |
| A4/A | org B cannot read an org A row | yes | rows=0 |
| A4/A | org B cannot update an org A row | yes | updated=0 |
| A4/A | org B cannot insert an org A row | yes | with check rejected the insert |
| A4/B | unset setting returns no rows | yes | count=0 |
| A4/B | org B cannot read an org A row | yes | rows=0 |
| A4/B | org B cannot update an org A row | yes | updated=0 |
| A4/B | org B cannot insert an org A row | yes | with check rejected the insert |
| A4n | S2 equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4n | S2-KEYSET equivalence/nonempty | yes | 30 parameter sets; identity/order (count/full row for counts/S8) |
| A4n/A | unset setting returns no rows | yes | count=0 |
| A4n/A | org B cannot read an org A row | yes | rows=0 |
| A4n/A | org B cannot update an org A row | yes | updated=0 |
| A4n/A | org B cannot insert an org A row | yes | with check rejected the insert |
| A4n/B | unset setting returns no rows | yes | count=0 |
| A4n/B | org B cannot read an org A row | yes | rows=0 |
| A4n/B | org B cannot update an org A row | yes | updated=0 |
| A4n/B | org B cannot insert an org A row | yes | with check rejected the insert |

## Load

| phase | ms |
| --- | --- |
| generate A/B | 46572.12 |
| copy A | 8094.27 |
| copy B | 6646.07 |
| A0 | 15007.78 |
| A1 | 14477.66 |
| A2 | 4957.47 |
| A3 | 8.07 |
| B0 | 9812.12 |
| B1 | 12563.30 |
| A4 reload | 12812.48 |
| A4 indexes (20) | 15240.01 |
| A4n reload | 13059.63 |
| A4n indexes (20) | 4891.12 |

## Notes

- C and S7 are skipped. A3 and B1 retain their original data types, indexes and SQL shapes. A4 is reloaded from the same seed into records with slots; A4n is reloaded before its measurements. No reference CRM access is required.
- Text expression indexes and slots both use und-x-icu. Slot values are written with data in the same COPY/INSERT/UPDATE statement. Unassigned slots are NULL. Contacts map last_name/company/email to text slots 1/2/3; statistics mix both modules.
- All RLS off/on reads use bench_app, begin + local organization setting + query + commit; role and policy match S12. Each off sample batch is immediately followed by the on batch. Client medians include transaction setup. Plans use the first parameter set; timings rotate loaded parameter sets.
- est_rows is first scan Plan Rows; actual_rows is Actual Rows × Actual Loops. The >10x check compares these reported row counts; stopped LIMIT scans can also trigger MCV, and the original result is retained. MCV remeasurements and noise retries retain original rows.
- A slot Index Cond means a_slot_* has a condition on a slot, including keyset comparisons; using a slot index only for ordering is no. S4 keeps its JSONB boolean filter. S8 still reads data by primary key.
- A4 S2 stats=none: same plan/buffers off 1.68 ms vs on 0.82 ms (>2x); retry 1/2.
- A4 S2 stats=none: same plan/buffers off 0.80 ms vs on 1.61 ms (>2x); retry 2/2.
- A4 S2: first-scan estimate/actual differs by 228.4x; added MCV on module_id with ix_text_3, ANALYZE, then repeated off/on. The before/after rows are retained.
- A4 S14 stats=ix_text_3: same plan/buffers off 141.00 ms vs on 283.64 ms (>2x); retry 1/2.
- A4 S8 stats=ix_text_3: same plan/buffers off 2.57 ms vs on 0.65 ms (>2x); retry 1/2.

## Outcome

Expectation NOT met: S3: A4/B1 2.03x; S14: A4/B1 5.42x. Storage decision belongs in ADR 0002; no solution is attempted.
