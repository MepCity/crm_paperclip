# Record storage benchmark

Client-side timings. Each measured query uses bind parameters. Partial expression indexes are planned with session `plan_cache_mode=force_custom_plan` so a bound `module_id` still matches the index predicate. Other server settings stay at their defaults.

Storage C keeps the same system indexes as A0 on the record header, plus the value indexes named in the scenario. Search indexes are identical on every option. S7a and S7b run with those indexes. Storage-stage writes run without them; `+trgm` and `+tsv` write rows add one search index family on top of A2 or B1.

A3 is A2 plus one extended statistics object per indexed expression (`create statistics` on that expression, then `vacuum analyze`). A2 rows stay. RLS reads for A run on A3; B runs on B1. `est_rows`, `actual_rows`, and `rows_removed` come from the first scan node only.

Full-scale protocol: 5 warmup runs and 30 measured runs; 2000 writes of each kind.

## Environment

| setting | value |
| --- | --- |
| postgres | PostgreSQL 18.4 on x86_64-apple-darwin24.6.0 |
| shared_buffers | 128MB |
| work_mem | 4MB |
| jit | on |
| cpus | 8 |
| memory_gib | 16.0 |
| rows | 200000 |
| seed | 1 |
| warmup | 5 |
| measured_runs | 30 |
| writes_per_kind | 2000 |
| s2_status_share | 0.0667 |
| s4_opt_out_false_share | 0.9009 |

## Load

| phase | ms |
| --- | --- |
| generate | 32657.16 |
| copy A | 10703.85 |
| copy B | 7353.71 |
| copy C | 50927.52 |
| index A0 | 16708.77 |
| index B0 | 3208.60 |
| index C0 | 77158.23 |
| index A1 | 13551.50 |
| index A2 | 6671.36 |
| stats A3 | 27.22 |
| index B1 | 3849.57 |
| index trgm | 72574.27 |
| index tsv | 51319.68 |
| rebuild A1 | 13714.19 |
| rebuild A2 | 5964.24 |
| rebuild B1 | 3181.44 |
| rebuild trgm | 73335.48 |
| rebuild tsv | 47607.80 |

## Queries

| scenario | option | stage | median_ms | p95_ms | plan | buffers | shared_read | est_rows | actual_rows | rows_removed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | A | A0 | 0.54 | 0.63 | Index Scan a_created_idx | 243 | 54 | 204720 | 51 | 0 |
| S2 | A | A0 | 146.99 | 162.62 | Seq Scan records | 257922 | 54505 | 862 | 13021 | 95660 |
| S2-KEYSET | A | A0 | 280.26 | 316.66 | Subquery Scan; Seq Scan records; Subquery Scan; Seq Scan records | 445126 | 90228 | 50 | 50 | 0 |
| S2-OFFSET | A | A0 | 194.70 | 238.55 | Seq Scan records | 258042 | 45116 | 862 | 13021 | 95660 |
| S3 | A | A0 | 74.29 | 84.77 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 16359 | 28 | 351 | 19642 |
| S4 | A | A0 | 389.96 | 410.16 | Seq Scan records | 925296 | 52715 | 48250 | 176589 | 41137 |
| S5 | A | A0 | 125.50 | 399.13 | Seq Scan records | 197928 | 45113 | 2 | 73 | 99976 |
| S11 | A | A0 | 142.63 | 193.74 | Seq Scan records | 196497 | 45106 | 8 | 12 | 99996 |
| S2 count | A | A0 | 165.41 | 175.35 | Seq Scan records | 196329 | 45114 | 862 | 13021 | 95660 |
| S2 capped | A | A0 | 131.40 | 172.53 | Seq Scan records | 170319 | 44722 | 862 | 10842 | 85292 |
| S4 count | A | A0 | 137.01 | 179.10 | Seq Scan records | 196329 | 45103 | 48250 | 176589 | 41137 |
| S4 capped | A | A0 | 10.43 | 38.29 | Seq Scan records | 49802 | 14432 | 115801 | 10001 | 101314 |
| S8 | A | A0 | 0.44 | 1.04 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S10 source | A | A0 | 221.57 | 296.66 | Seq Scan records | 109626 | 45177 | 21432 | 49181 | 83606 |
| S10 owner | A | A0 | 304.70 | 371.47 | Seq Scan records | 109642 | 41685 | 21432 | 49181 | 83606 |
| S1 | A | A1 | 0.50 | 0.65 | Index Scan a_created_idx | 243 | 75 | 203881 | 51 | 0 |
| S2 | A | A1 | 101.73 | 105.63 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 82362 | 14410 | 6178 | 13021 | 261 |
| S2-KEYSET | A | A1 | 123.06 | 125.70 | Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 91722 | 20251 | 50 | 50 | 0 |
| S2-OFFSET | A | A1 | 116.03 | 120.49 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 82362 | 10418 | 6178 | 13021 | 261 |
| S3 | A | A1 | 55.97 | 57.48 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 17611 | 28 | 351 | 19642 |
| S4 | A | A1 | 304.88 | 311.83 | Seq Scan records | 925296 | 50904 | 48911 | 176589 | 41137 |
| S5 | A | A1 | 4.41 | 5.26 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_data_gin | 821 | 114 | 220 | 73 | 24 |
| S11 | A | A1 | 0.49 | 0.51 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 104 | 14 | 20 | 12 | 1 |
| S2 count | A | A1 | 51.21 | 52.49 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 20769 | 11888 | 6178 | 13021 | 261 |
| S2 capped | A | A1 | 41.91 | 50.99 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 15982 | 8537 | 6178 | 10001 | 198 |
| S4 count | A | A1 | 158.49 | 306.73 | Seq Scan records | 196329 | 48932 | 48911 | 176589 | 41137 |
| S4 capped | A | A1 | 11.26 | 40.84 | Seq Scan records | 8912 | 2265 | 117386 | 10001 | 1293 |
| S8 | A | A1 | 0.47 | 0.68 | Index Scan records_pkey | 4 | 3 | 1 | 1 | 0 |
| S10 source | A | A1 | 652.77 | 838.32 | Seq Scan records | 109626 | 45182 | 21118 | 49181 | 83606 |
| S10 owner | A | A1 | 320.15 | 431.70 | Seq Scan records | 109642 | 41685 | 21118 | 49181 | 83606 |
| S1 | A | A2 | 0.96 | 1.09 | Index Scan a_created_idx | 235 | 50 | 204482 | 51 | 0 |
| S2 | A | A2 | 105.11 | 362.16 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 13570 | 1022 | 13021 | 3266 |
| S2-KEYSET | A | A2 | 209.88 | 998.84 | Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_company | 139942 | 66955 | 50 | 50 | 0 |
| S2-OFFSET | A | A2 | 97.53 | 101.32 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 16506 | 1022 | 13021 | 3266 |
| S3 | A | A2 | 7.16 | 7.74 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10479 | 7060 | 28 | 351 | 8784 |
| S4 | A | A2 | 1268.53 | 1286.98 | Index Scan a_x_email_opt_out | 950534 | 193359 | 1022 | 176589 | 44013 |
| S5 | A | A2 | 2.80 | 2.95 | Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1548 | 468 | 20 | 73 | 505 |
| S11 | A | A2 | 0.59 | 0.76 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_lookup_1 | 88 | 15 | 1022 | 12 | 1 |
| S2 count | A | A2 | 20.54 | 23.63 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 12402 | 1022 | 13021 | 3266 |
| S2 capped | A | A2 | 15.77 | 16.03 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 8847 | 7051 | 1022 | 10001 | 1 |
| S4 count | A | A2 | 558.47 | 614.42 | Index Scan a_x_email_opt_out | 221687 | 160097 | 1022 | 176589 | 44013 |
| S4 capped | A | A2 | 3.52 | 3.64 | Index Scan a_x_email_opt_out | 12624 | 9149 | 1022 | 10001 | 2559 |
| S8 | A | A2 | 0.49 | 0.85 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S10 source | A | A2 | 215.99 | 291.62 | Seq Scan records | 109626 | 47734 | 20986 | 49181 | 83606 |
| S10 owner | A | A2 | 225.05 | 286.06 | Seq Scan records | 109642 | 41685 | 20986 | 49181 | 83606 |
| S1 | A | A3 | 0.58 | 0.63 | Index Scan a_created_idx | 235 | 48 | 205003 | 51 | 0 |
| S2 | A | A3 | 1.45 | 1.63 | Index Scan a_x_company | 1889 | 368 | 11412 | 51 | 1433 |
| S2-KEYSET | A | A3 | 2.03 | 2.84 | Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan a_x_lead_status | 1425 | 439 | 50 | 50 | 0 |
| S2-OFFSET | A | A3 | 97.53 | 114.32 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 13224 | 11412 | 13021 | 3266 |
| S3 | A | A3 | 7.25 | 7.62 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10479 | 7049 | 190 | 351 | 8784 |
| S4 | A | A3 | 0.62 | 0.66 | Index Scan a_x_last_name | 192 | 67 | 153165 | 51 | 33 |
| S5 | A | A3 | 2.81 | 3.06 | Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1548 | 484 | 60 | 73 | 505 |
| S11 | A | A3 | 0.42 | 0.44 | Index Scan a_x_cf_lookup_1 | 88 | 15 | 1 | 12 | 1 |
| S2 count | A | A3 | 23.26 | 34.08 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 11818 | 11412 | 13021 | 3266 |
| S2 capped | A | A3 | 15.63 | 17.21 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 8847 | 7050 | 11412 | 10001 | 1 |
| S4 count | A | A3 | 143.40 | 170.07 | Seq Scan records | 167502 | 48354 | 63819 | 176589 | 41137 |
| S4 capped | A | A3 | 10.68 | 24.23 | Seq Scan records | 8967 | 2317 | 153165 | 10001 | 1315 |
| S8 | A | A3 | 0.26 | 0.33 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S10 source | A | A3 | 88.50 | 110.77 | Seq Scan records | 109566 | 43357 | 21531 | 49181 | 83606 |
| S10 owner | A | A3 | 97.41 | 99.98 | Seq Scan records | 109582 | 41701 | 21531 | 49181 | 83606 |
| S1 | B | B0 | 0.35 | 0.44 | Index Scan bl_created_idx | 55 | 54 | 195657 | 51 | 0 |
| S2 | B | B0 | 47.09 | 71.40 | Seq Scan leads | 38492 | 38066 | 5305 | 13021 | 78993 |
| S2-KEYSET | B | B0 | 62.25 | 69.86 | Subquery Scan; Seq Scan leads; Subquery Scan; Index Scan leads_pkey | 41205 | 30153 | 50 | 50 | 0 |
| S2-OFFSET | B | B0 | 67.78 | 81.02 | Seq Scan leads | 38492 | 22382 | 5305 | 13021 | 78993 |
| S3 | B | B0 | 37.15 | 38.81 | Bitmap Heap Scan leads; Bitmap Index Scan bl_owner_idx | 15187 | 9833 | 263 | 351 | 19642 |
| S4 | B | B0 | 108.43 | 123.39 | Seq Scan leads | 38492 | 22401 | 73657 | 176589 | 24470 |
| S5 | B | B0 | 75.83 | 96.70 | Seq Scan leads | 38510 | 22410 | 37 | 73 | 83309 |
| S11 | B | B0 | 89.57 | 101.85 | Seq Scan leads | 38468 | 22370 | 1 | 12 | 83329 |
| S2 count | B | B0 | 70.41 | 87.16 | Seq Scan leads | 38414 | 22381 | 5305 | 13021 | 78993 |
| S2 capped | B | B0 | 77.58 | 87.01 | Seq Scan leads | 31346 | 22119 | 12731 | 10001 | 194154 |
| S4 count | B | B0 | 65.89 | 75.97 | Seq Scan leads | 38372 | 22360 | 73657 | 176589 | 24470 |
| S4 capped | B | B0 | 7.02 | 21.05 | Seq Scan leads | 1824 | 1584 | 176776 | 10001 | 1298 |
| S8 | B | B0 | 0.49 | 0.68 | Index Scan leads_pkey | 4 | 3 | 1 | 1 | 0 |
| S10 source | B | B0 | 54.95 | 59.89 | Seq Scan leads | 38432 | 22458 | 20155 | 49181 | 66940 |
| S10 owner | B | B0 | 52.75 | 59.77 | Seq Scan leads | 38448 | 22386 | 20155 | 49181 | 66940 |
| S1 | B | B1 | 0.44 | 0.50 | Index Scan bl_created_idx | 55 | 25 | 195939 | 51 | 0 |
| S2 | B | B1 | 1.00 | 1.18 | Index Scan bl_x_company | 1092 | 211 | 12540 | 51 | 1433 |
| S2-KEYSET | B | B1 | 1.11 | 1.64 | Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status | 388 | 317 | 50 | 50 | 0 |
| S2-OFFSET | B | B1 | 45.26 | 45.76 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 8784 | 12540 | 13021 | 3266 |
| S3 | B | B1 | 7.72 | 11.50 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 | 259 | 351 | 8784 |
| S4 | B | B1 | 0.55 | 0.88 | Index Scan bl_x_last_name | 87 | 54 | 176698 | 51 | 33 |
| S5 | B | B1 | 1.76 | 1.91 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 349 | 89 | 73 | 505 |
| S11 | B | B1 | 0.32 | 0.35 | Index Scan bl_x_cf_lookup_1 | 16 | 11 | 3 | 12 | 1 |
| S2 count | B | B1 | 20.74 | 21.76 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9547 | 12540 | 13021 | 3266 |
| S2 capped | B | B1 | 15.00 | 15.38 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 8434 | 5851 | 12540 | 10001 | 0 |
| S4 count | B | B1 | 50.04 | 53.50 | Seq Scan leads | 38372 | 22562 | 73624 | 176589 | 24470 |
| S4 capped | B | B1 | 6.11 | 16.95 | Seq Scan leads | 1819 | 1721 | 176698 | 10001 | 1407 |
| S8 | B | B1 | 0.50 | 0.70 | Index Scan leads_pkey | 4 | 3 | 1 | 1 | 0 |
| S10 source | B | B1 | 38.93 | 41.63 | Seq Scan leads | 38432 | 22456 | 20300 | 49181 | 66940 |
| S10 owner | B | B1 | 52.48 | 68.33 | Seq Scan leads | 38448 | 22386 | 20300 | 49181 | 66940 |
| S1 | C | C0 | 5.11 | 5.98 | Index Scan c_created_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1152 | 123 | 204442 | 50 | 0 |
| S2 | C | C0 | 283.22 | 1137.12 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 313684 | 42271 | 431 | 16622 | 0 |
| S2-KEYSET | C | C0 | 347.17 | 440.52 | Subquery Scan; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Subquery Scan; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 361441 | 70382 | 50 | 50 | 0 |
| S2-OFFSET | C | C0 | 256.36 | 351.24 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 313684 | 41262 | 431 | 16622 | 0 |
| S3 | C | C0 | 37.91 | 41.96 | Index Only Scan c_value_num_idx; Index Only Scan c_value_ts_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 78326 | 5660 | 4902 | 112361 | 0 |
| S4 | C | C0 | 162.65 | 224.18 | Index Only Scan c_value_text_idx; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 156483 | 20793 | 118624 | 300000 | 0 |
| S5 | C | C0 | 15.20 | 17.85 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Only Scan c_value_text_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7545 | 1692 | 1 | 467 | 0 |
| S11 | C | C0 | 8.31 | 8.56 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 325 | 35 | 1 | 12 | 0 |
| S2 count | C | C0 | 39.91 | 40.69 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 74113 | 10722 | 431 | 16622 | 0 |
| S2 capped | C | C0 | 32.49 | 33.15 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 60174 | 4207 | 431 | 13534 | 0 |
| S4 count | C | C0 | 286.37 | 322.10 | Bitmap Heap Scan record_values; Bitmap Index Scan c_value_ts_idx; Index Only Scan c_updated_idx | 81028 | 80983 | 105856 | 225105 | 8298 |
| S4 capped | C | C0 | 46.96 | 162.87 | Seq Scan record_values; Index Scan records_pkey | 44407 | 5941 | 254054 | 10206 | 315569 |
| S8 | C | C0 | 0.40 | 0.75 | Index Scan records_pkey; Bitmap Heap Scan record_values; Bitmap Index Scan record_values_pkey | 8 | 3 | 1 | 1 | 0 |
| S10 source | C | C0 | 73.73 | 74.79 | Index Only Scan c_value_text_idx; Index Only Scan c_value_num_idx; Index Only Scan c_created_idx | 136663 | 3131 | 160373 | 150315 | 0 |
| S10 owner | C | C0 | 83.19 | 86.46 | Index Only Scan c_value_num_idx; Index Only Scan c_value_text_idx; Seq Scan records | 158170 | 10408 | 64676 | 149774 | 0 |
| S7c common3 | A | no-search-index | 22.46 | 23.01 | Index Scan a_updated_idx | 11290 | 6088 | 41415 | 1464 | 4582 |
| S7c rare3 | A | no-search-index | 269.85 | 403.48 | Seq Scan records | 54450 | 46440 | 9 | 592 | 99803 |
| S7c common8 | A | no-search-index | 22.93 | 26.25 | Index Scan a_updated_idx | 10890 | 188 | 31061 | 1187 | 4855 |
| S7c rare8 | A | no-search-index | 311.24 | 331.73 | Seq Scan records | 53928 | 36889 | 9 | 488 | 99837 |
| S7c common3 | B | no-search-index | 18.49 | 21.43 | Index Scan bl_updated_idx | 6106 | 5590 | 43542 | 1464 | 4582 |
| S7c rare3 | B | no-search-index | 287.15 | 392.72 | Seq Scan leads | 38468 | 32842 | 8 | 592 | 83136 |
| S7c common8 | B | no-search-index | 18.55 | 19.46 | Index Scan bl_updated_idx | 6102 | 0 | 37604 | 1187 | 4855 |
| S7c rare8 | B | no-search-index | 330.69 | 360.23 | Seq Scan leads | 38468 | 22690 | 8 | 488 | 83171 |
| S7c common3 | C | no-search-index | 5.98 | 6.94 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1272 | 261 | 37171 | 50 | 115 |
| S7c rare3 | C | no-search-index | 52.60 | 53.60 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 17455 | 10650 | 2065 | 50 | 16145 |
| S7c common8 | C | no-search-index | 5.94 | 6.06 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1344 | 62 | 33041 | 50 | 197 |
| S7c rare8 | C | no-search-index | 252.81 | 287.84 | Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 32560 | 12552 | 8 | 488 | 99837 |
| S7a common3 | A | trgm | 22.57 | 23.11 | Index Scan a_updated_idx | 11290 | 5871 | 39117 | 1464 | 4582 |
| S7a rare3 | A | trgm | 4.76 | 5.16 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 3077 | 726 | 20 | 592 | 160 |
| S7a common8 | A | trgm | 22.48 | 24.38 | Index Scan a_updated_idx | 10890 | 107 | 34999 | 1187 | 4855 |
| S7a rare8 | A | trgm | 4.38 | 4.54 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 2455 | 626 | 20 | 488 | 137 |
| S7a common3 | B | trgm | 18.53 | 18.94 | Index Scan bl_updated_idx | 6106 | 5601 | 41534 | 1464 | 4582 |
| S7a rare3 | B | trgm | 3.19 | 3.26 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 755 | 638 | 20 | 592 | 160 |
| S7a common8 | B | trgm | 19.21 | 19.85 | Index Scan bl_updated_idx | 6102 | 0 | 31645 | 1187 | 4855 |
| S7a rare8 | B | trgm | 3.89 | 4.73 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 655 | 555 | 20 | 488 | 137 |
| S7a common3 | C | trgm | 8.67 | 9.52 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1272 | 261 | 49549 | 50 | 115 |
| S7a rare3 | C | trgm | 11.40 | 12.14 | Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 13779 | 2285 | 20 | 592 | 160 |
| S7a common8 | C | trgm | 6.26 | 6.39 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1344 | 141 | 39226 | 50 | 197 |
| S7a rare8 | C | trgm | 8.93 | 9.39 | Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 11370 | 1700 | 20 | 488 | 137 |
| S7b selective | A | tsv | 2.44 | 2.60 | Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv | 2429 | 676 | 1020 | 488 | 137 |
| S7b common | A | tsv | 260.08 | 265.03 | Index Scan a_updated_idx | 13767 | 5879 | 56050 | 2060 | 3979 |
| S7b selective | B | tsv | 1.17 | 1.29 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv | 629 | 627 | 977 | 488 | 137 |
| S7b common | B | tsv | 252.44 | 254.28 | Index Scan bl_updated_idx | 6099 | 5509 | 65529 | 2060 | 3979 |
| S7b selective | C | tsv | 10.78 | 11.14 | Bitmap Heap Scan records; Bitmap Index Scan c_search_tsv; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1773 | 779 | 601 | 488 | 68 |
| S7b common | C | tsv | 11.68 | 11.82 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1234 | 211 | 56877 | 50 | 76 |
| S1 | A | rls-off | 0.91 | 1.03 | Index Scan a_created_idx | 267 | 53 | 204067 | 51 | 0 |
| S2 | A | rls-off | 1.76 | 1.95 | Index Scan a_x_company | 1889 | 529 | 11326 | 51 | 1433 |
| S2-KEYSET | A | rls-off | 2.29 | 3.95 | Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan a_x_lead_status | 1425 | 487 | 50 | 50 | 0 |
| S2-OFFSET | A | rls-off | 98.00 | 105.58 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 14055 | 11326 | 13021 | 3266 |
| S3 | A | rls-off | 7.53 | 7.88 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10482 | 7058 | 189 | 351 | 8784 |
| S4 | A | rls-off | 0.92 | 0.94 | Index Scan a_x_last_name | 192 | 67 | 152343 | 51 | 33 |
| S5 | A | rls-off | 3.09 | 3.53 | Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1548 | 484 | 59 | 73 | 505 |
| S11 | A | rls-off | 0.90 | 1.12 | Index Scan a_x_cf_lookup_1 | 88 | 15 | 1 | 12 | 1 |
| S2 count | A | rls-off | 21.06 | 22.24 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 11760 | 11326 | 13021 | 3266 |
| S7a common3 | A | rls-off | 23.14 | 34.54 | Index Scan a_updated_idx | 11290 | 4597 | 59777 | 1464 | 4582 |
| S7a rare3 | A | rls-off | 5.07 | 5.20 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 3077 | 644 | 20 | 592 | 160 |
| S7a common8 | A | rls-off | 22.68 | 23.59 | Index Scan a_updated_idx | 10890 | 188 | 28858 | 1187 | 4855 |
| S7a rare8 | A | rls-off | 4.66 | 5.23 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 2455 | 551 | 20 | 488 | 137 |
| S7b selective | A | rls-off | 2.71 | 2.81 | Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv | 2429 | 3 | 1020 | 488 | 137 |
| S7b common | A | rls-off | 259.94 | 265.36 | Index Scan a_updated_idx | 13767 | 236 | 56050 | 2060 | 3979 |
| S8 | A | rls-off | 0.67 | 1.15 | Index Scan records_pkey | 4 | 3 | 1 | 1 | 0 |
| S1 | B | rls-off | 0.74 | 0.78 | Index Scan bl_created_idx | 55 | 54 | 195473 | 51 | 0 |
| S2 | B | rls-off | 1.35 | 1.53 | Index Scan bl_x_company | 1092 | 408 | 12250 | 51 | 1433 |
| S2-KEYSET | B | rls-off | 1.52 | 2.93 | Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status | 388 | 384 | 50 | 50 | 0 |
| S2-OFFSET | B | rls-off | 45.84 | 48.19 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 12580 | 12250 | 13021 | 3266 |
| S3 | B | rls-off | 7.85 | 8.01 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 | 272 | 351 | 8784 |
| S4 | B | rls-off | 0.75 | 0.80 | Index Scan bl_x_last_name | 87 | 54 | 176401 | 51 | 33 |
| S5 | B | rls-off | 2.00 | 2.16 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 351 | 88 | 73 | 505 |
| S11 | B | rls-off | 0.80 | 1.19 | Index Scan bl_x_cf_lookup_1 | 16 | 11 | 3 | 12 | 1 |
| S2 count | B | rls-off | 21.87 | 35.51 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9549 | 12250 | 13021 | 3266 |
| S7a common3 | B | rls-off | 18.93 | 20.11 | Index Scan bl_updated_idx | 6106 | 3704 | 53311 | 1464 | 4582 |
| S7a rare3 | B | rls-off | 3.48 | 3.84 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 755 | 428 | 20 | 592 | 160 |
| S7a common8 | B | rls-off | 19.25 | 20.30 | Index Scan bl_updated_idx | 6102 | 0 | 29617 | 1187 | 4855 |
| S7a rare8 | B | rls-off | 3.34 | 3.48 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 655 | 389 | 20 | 488 | 137 |
| S7b selective | B | rls-off | 1.43 | 1.50 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv | 629 | 3 | 977 | 488 | 137 |
| S7b common | B | rls-off | 253.57 | 257.13 | Index Scan bl_updated_idx | 6099 | 0 | 65529 | 2060 | 3979 |
| S8 | B | rls-off | 0.79 | 0.99 | Index Scan leads_pkey | 4 | 3 | 1 | 1 | 0 |
| S1 | A | rls-on | 0.92 | 1.70 | Index Scan a_created_idx | 235 | 75 | 204067 | 51 | 0 |
| S2 | A | rls-on | 1.77 | 1.98 | Index Scan a_x_company | 1889 | 566 | 11326 | 51 | 1433 |
| S2-KEYSET | A | rls-on | 182.57 | 192.48 | Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan records_pkey | 119566 | 42929 | 50 | 50 | 0 |
| S2-OFFSET | A | rls-on | 104.35 | 113.86 | Seq Scan records | 229181 | 44478 | 4719 | 13021 | 95660 |
| S3 | A | rls-on | 57.16 | 64.58 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 12945 | 126 | 351 | 19642 |
| S4 | A | rls-on | 1.04 | 1.16 | Index Scan a_x_last_name | 192 | 70 | 152343 | 51 | 33 |
| S5 | A | rls-on | 134.78 | 151.42 | Seq Scan records | 168572 | 46582 | 25 | 73 | 99976 |
| S11 | A | rls-on | 109.31 | 124.70 | Seq Scan records | 167582 | 43307 | 1 | 12 | 99996 |
| S2 count | A | rls-on | 111.30 | 125.97 | Seq Scan records | 167510 | 43302 | 4719 | 13021 | 95660 |
| S7a common3 | A | rls-on | 22.53 | 23.23 | Index Scan a_updated_idx | 11290 | 4874 | 8163 | 1464 | 4582 |
| S7a rare3 | A | rls-on | 49.66 | 52.44 | Index Scan a_updated_idx | 16697 | 8378 | 8163 | 51 | 16274 |
| S7a common8 | A | rls-on | 295.12 | 314.24 | Seq Scan records | 206120 | 44426 | 8 | 39208 | 86931 |
| S7a rare8 | A | rls-on | 307.03 | 322.09 | Seq Scan records | 53894 | 41662 | 8 | 488 | 99837 |
| S7b selective | A | rls-on | 1666.94 | 1743.75 | Index Scan a_updated_idx | 75791 | 51457 | 425 | 187 | 24715 |
| S7b common | A | rls-on | 259.93 | 261.52 | Index Scan a_updated_idx | 13767 | 4515 | 56050 | 2060 | 3979 |
| S8 | A | rls-on | 0.72 | 3.51 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S1 | B | rls-on | 0.76 | 1.04 | Index Scan bl_created_idx | 55 | 54 | 195473 | 51 | 0 |
| S2 | B | rls-on | 1.36 | 1.52 | Index Scan bl_x_company | 1092 | 408 | 12250 | 51 | 1433 |
| S2-KEYSET | B | rls-on | 1.53 | 2.39 | Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status | 388 | 384 | 50 | 50 | 0 |
| S2-OFFSET | B | rls-on | 45.59 | 46.57 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 12549 | 12250 | 13021 | 3266 |
| S3 | B | rls-on | 7.77 | 8.09 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 | 181 | 351 | 8784 |
| S4 | B | rls-on | 0.74 | 0.77 | Index Scan bl_x_last_name | 87 | 54 | 176401 | 51 | 33 |
| S5 | B | rls-on | 2.04 | 2.24 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 349 | 88 | 73 | 505 |
| S11 | B | rls-on | 0.79 | 1.15 | Index Scan bl_x_cf_lookup_1 | 16 | 11 | 3 | 12 | 1 |
| S2 count | B | rls-on | 21.51 | 22.64 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9547 | 12250 | 13021 | 3266 |
| S7a common3 | B | rls-on | 18.56 | 19.25 | Index Scan bl_updated_idx | 6106 | 3703 | 7819 | 1464 | 4582 |
| S7a rare3 | B | rls-on | 49.41 | 53.17 | Index Scan bl_updated_idx | 16481 | 6100 | 7819 | 51 | 16274 |
| S7a common8 | B | rls-on | 211.38 | 219.33 | Seq Scan leads | 38468 | 22548 | 8 | 39208 | 70264 |
| S7a rare8 | B | rls-on | 204.79 | 526.06 | Seq Scan leads | 38468 | 22381 | 8 | 488 | 83171 |
| S7b selective | B | rls-on | 1696.08 | 4217.82 | Index Scan bl_updated_idx | 77495 | 40866 | 407 | 198 | 25468 |
| S7b common | B | rls-on | 302.29 | 1002.33 | Index Scan bl_updated_idx | 6099 | 3228 | 65529 | 2060 | 3979 |
| S8 | B | rls-on | 1.43 | 14.55 | Index Scan leads_pkey | 4 | 4 | 1 | 1 | 0 |

## Writes

| scenario | option | stage | rls | ops | total_ms | median_ms | p95_ms | wal_bytes_per_op | gin_flush_ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S9 insert | A | A0 | n/a | 2000 | 7027.28 | 1.95 | 11.32 | 17471 | 0.00 |
| S9 update1 | A | A0 | n/a | 2000 | 1604.83 | 0.75 | 1.14 | 12840 | 0.00 |
| S9 update5 | A | A0 | n/a | 2000 | 1680.23 | 0.82 | 1.17 | 13176 | 0.00 |
| S9 insert | A | A1 | n/a | 2000 | 1465.43 | 0.66 | 1.42 | 64494 | 2034.71 |
| S9 update1 | A | A1 | n/a | 2000 | 3203.14 | 1.09 | 3.44 | 62697 | 2278.18 |
| S9 update5 | A | A1 | n/a | 2000 | 1745.16 | 0.84 | 1.13 | 63481 | 2011.98 |
| S9 insert | A | A2 | n/a | 2000 | 1906.88 | 0.94 | 1.19 | 103843 | 2050.48 |
| S9 update1 | A | A2 | n/a | 2000 | 2274.16 | 1.12 | 1.38 | 104485 | 1207.98 |
| S9 update5 | A | A2 | n/a | 2000 | 2067.06 | 1.04 | 1.20 | 100597 | 973.02 |
| S9 insert | B | B0 | n/a | 2000 | 1797.40 | 0.83 | 1.51 | 15569 | 0.00 |
| S9 update1 | B | B0 | n/a | 2000 | 1204.27 | 0.56 | 0.87 | 10941 | 0.00 |
| S9 update5 | B | B0 | n/a | 2000 | 1079.99 | 0.53 | 0.63 | 11151 | 0.00 |
| S9 insert | B | B1 | n/a | 2000 | 1789.92 | 0.87 | 1.15 | 54021 | 0.00 |
| S9 update1 | B | B1 | n/a | 2000 | 1595.39 | 0.76 | 1.06 | 51103 | 0.00 |
| S9 update5 | B | B1 | n/a | 2000 | 1763.91 | 0.88 | 1.15 | 46747 | 0.00 |
| S9 insert | C | C0 | n/a | 2000 | 39622.08 | 18.45 | 35.12 | 483124 | 0.00 |
| S9 update1 | C | C0 | n/a | 2000 | 3429.83 | 1.50 | 2.88 | 28363 | 0.00 |
| S9 update5 | C | C0 | n/a | 2000 | 8773.77 | 2.97 | 11.55 | 60671 | 0.00 |
| S9 insert | A | A2 | off | 2000 | 2215.82 | 1.05 | 1.43 | 105313 | 2323.35 |
| S9 update1 | A | A2 | off | 2000 | 3823.41 | 1.38 | 3.83 | 106198 | 2335.75 |
| S9 update5 | A | A2 | off | 2000 | 2699.57 | 1.25 | 1.55 | 102908 | 2184.95 |
| S9 insert | B | B1 | off | 2000 | 2125.51 | 1.01 | 1.36 | 54391 | 0.00 |
| S9 update1 | B | B1 | off | 2000 | 2358.09 | 1.15 | 1.43 | 52804 | 0.00 |
| S9 update5 | B | B1 | off | 2000 | 2365.02 | 1.16 | 1.47 | 48303 | 0.00 |
| S9 insert | A | A2 | on | 2000 | 2210.50 | 1.08 | 1.40 | 107455 | 2080.22 |
| S9 update1 | A | A2 | on | 2000 | 3079.98 | 1.35 | 2.24 | 108548 | 1967.61 |
| S9 update5 | A | A2 | on | 2000 | 5343.93 | 1.77 | 6.00 | 104531 | 2457.66 |
| S9 insert | B | B1 | on | 2000 | 3513.87 | 1.09 | 4.01 | 55851 | 0.00 |
| S9 update1 | B | B1 | on | 2000 | 2667.09 | 1.20 | 1.76 | 54268 | 0.00 |
| S9 update5 | B | B1 | on | 2000 | 2683.23 | 1.27 | 1.69 | 49885 | 0.00 |
| S9 insert | A | A2+trgm | n/a | 2000 | 4828.72 | 1.10 | 1.50 | 168192 | 2557.34 |
| S9 update1 | A | A2+trgm | n/a | 2000 | 5007.80 | 1.32 | 1.69 | 168690 | 2621.16 |
| S9 update5 | A | A2+trgm | n/a | 2000 | 5485.95 | 1.41 | 1.82 | 168105 | 3128.31 |
| S9 insert | B | B1+trgm | n/a | 2000 | 4646.63 | 1.16 | 1.53 | 107181 | 116.36 |
| S9 update1 | B | B1+trgm | n/a | 2000 | 5191.74 | 1.35 | 1.83 | 109621 | 181.23 |
| S9 update5 | B | B1+trgm | n/a | 2000 | 4848.48 | 1.32 | 1.82 | 98497 | 265.07 |
| S9 insert | A | A2+tsv | n/a | 2000 | 2225.38 | 1.06 | 1.56 | 133680 | 3542.61 |
| S9 update1 | A | A2+tsv | n/a | 2000 | 2942.28 | 1.28 | 2.36 | 133070 | 3513.92 |
| S9 update5 | A | A2+tsv | n/a | 2000 | 4433.38 | 1.09 | 6.31 | 130609 | 3629.66 |
| S9 insert | B | B1+tsv | n/a | 2000 | 5691.74 | 2.24 | 6.47 | 78816 | 1901.29 |
| S9 update1 | B | B1+tsv | n/a | 2000 | 2658.24 | 1.24 | 1.73 | 75334 | 1031.66 |
| S9 update5 | B | B1+tsv | n/a | 2000 | 2529.90 | 1.22 | 1.53 | 71218 | 1028.20 |

## Sizes

Table bytes are `pg_table_size` (heap, toast, free space). Index bytes are `pg_relation_size`.

| stage | schema | relation | kind | bytes |
| --- | --- | --- | --- | --- |
| A0 | bench_a | a_created_idx | index | 22732800 |
| A0 | bench_a | a_owner_idx | index | 2244608 |
| A0 | bench_a | a_updated_idx | index | 22740992 |
| A0 | bench_a | events | table | 8192 |
| A0 | bench_a | events_pkey | index | 8192 |
| A0 | bench_a | records | table | 500850688 |
| A0 | bench_a | records_pkey | index | 11649024 |
| A1 | bench_a | a_created_idx | index | 22732800 |
| A1 | bench_a | a_data_gin | index | 248741888 |
| A1 | bench_a | a_owner_idx | index | 2244608 |
| A1 | bench_a | a_updated_idx | index | 22740992 |
| A1 | bench_a | events | table | 8192 |
| A1 | bench_a | events_pkey | index | 8192 |
| A1 | bench_a | records | table | 500850688 |
| A1 | bench_a | records_pkey | index | 11649024 |
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
| A2 | bench_a | events | table | 8192 |
| A2 | bench_a | events_pkey | index | 8192 |
| A2 | bench_a | records | table | 500850688 |
| A2 | bench_a | records_pkey | index | 11649024 |
| A3 | bench_a | a_created_idx | index | 22732800 |
| A3 | bench_a | a_data_gin | index | 248741888 |
| A3 | bench_a | a_owner_idx | index | 2244608 |
| A3 | bench_a | a_updated_idx | index | 22740992 |
| A3 | bench_a | a_x_annual_revenue | index | 11280384 |
| A3 | bench_a | a_x_cf_datetime_1 | index | 13959168 |
| A3 | bench_a | a_x_cf_lookup_1 | index | 15409152 |
| A3 | bench_a | a_x_company | index | 11296768 |
| A3 | bench_a | a_x_country | index | 11313152 |
| A3 | bench_a | a_x_email_opt_out | index | 9969664 |
| A3 | bench_a | a_x_industry | index | 11313152 |
| A3 | bench_a | a_x_last_name | index | 12140544 |
| A3 | bench_a | a_x_lead_source | index | 11313152 |
| A3 | bench_a | a_x_lead_status | index | 11313152 |
| A3 | bench_a | a_x_rating | index | 11304960 |
| A3 | bench_a | events | table | 8192 |
| A3 | bench_a | events_pkey | index | 8192 |
| A3 | bench_a | records | table | 500850688 |
| A3 | bench_a | records_pkey | index | 11649024 |
| B0 | bench_b | bc_created_idx | index | 3809280 |
| B0 | bench_b | bc_owner_idx | index | 385024 |
| B0 | bench_b | bc_updated_idx | index | 3809280 |
| B0 | bench_b | bl_created_idx | index | 18948096 |
| B0 | bench_b | bl_owner_idx | index | 1867776 |
| B0 | bench_b | bl_updated_idx | index | 18956288 |
| B0 | bench_b | contacts | table | 14426112 |
| B0 | bench_b | contacts_pkey | index | 2269184 |
| B0 | bench_b | events | table | 8192 |
| B0 | bench_b | events_pkey | index | 8192 |
| B0 | bench_b | leads | table | 314466304 |
| B0 | bench_b | leads_pkey | index | 9814016 |
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
| B1 | bench_b | events | table | 8192 |
| B1 | bench_b | events_pkey | index | 8192 |
| B1 | bench_b | leads | table | 314466304 |
| B1 | bench_b | leads_pkey | index | 9814016 |
| C0 | bench_c | c_created_idx | index | 22732800 |
| C0 | bench_c | c_owner_idx | index | 2244608 |
| C0 | bench_c | c_updated_idx | index | 22740992 |
| C0 | bench_c | c_value_num_idx | index | 499228672 |
| C0 | bench_c | c_value_text_idx | index | 603463680 |
| C0 | bench_c | c_value_ts_idx | index | 499179520 |
| C0 | bench_c | events | table | 8192 |
| C0 | bench_c | events_pkey | index | 8192 |
| C0 | bench_c | record_values | table | 645980160 |
| C0 | bench_c | record_values_pkey | index | 400056320 |
| C0 | bench_c | records | table | 178724864 |
| C0 | bench_c | records_pkey | index | 11649024 |
| trgm | bench_a | a_search_trgm | index | 232775680 |
| trgm | bench_b | bc_search_trgm | index | 7249920 |
| trgm | bench_b | bl_search_trgm | index | 221429760 |
| trgm | bench_c | c_search_trgm | index | 208543744 |
| tsv | bench_a | a_search_tsv | index | 154583040 |
| tsv | bench_b | bc_search_tsv | index | 7626752 |
| tsv | bench_b | bl_search_tsv | index | 148889600 |
| tsv | bench_c | c_search_tsv | index | 146481152 |

## Alter on the typed leads table

| operation | ms | rows |
| --- | --- | --- |
| add column (no default) | 1.63 | 250000 |
| add column (constant default) | 1.32 | 250000 |
| create index concurrently | 612.00 | 250000 |

## RLS isolation

| option | check | result | detail |
| --- | --- | --- | --- |
| A | unset setting returns no rows | pass | count=0 |
| A | org B cannot read an org A row | pass | rows=0 |
| A | org B cannot update an org A row | pass | updated=0 |
| A | org B cannot insert an org A row | pass | with check rejected the insert |
| B | unset setting returns no rows | pass | count=0 |
| B | org B cannot read an org A row | pass | rows=0 |
| B | org B cannot update an org A row | pass | updated=0 |
| B | org B cannot insert an org A row | pass | with check rejected the insert |

## Filter operators

Operators that appear in scenario filters. `~~*` is `ilike`. `leakproof` is `pg_proc.proleakproof` of `pg_operator.oprcode`. With row level security, a non-leakproof operator cannot be an index condition and cannot use statistics.

| operator | left | right | function | leakproof |
| --- | --- | --- | --- | --- |
| = | boolean | boolean | booleq | yes |
| -> | jsonb | text | jsonb_object_field | no |
| ->> | jsonb | text | jsonb_object_field_text | no |
| @> | jsonb | jsonb | jsonb_contains | no |
| >= | numeric | numeric | numeric_ge | no |
| > | record | record | record_gt | no |
| < | text | text | text_lt | yes |
| = | text | text | texteq | yes |
| > | text | text | text_gt | yes |
| >= | text | text | text_ge | yes |
| ~~* | text | text | texticlike | no |
| < | timestamp with time zone | timestamp with time zone | timestamptz_lt | yes |
| >= | timestamp with time zone | timestamp with time zone | timestamptz_ge | yes |
| @@ | tsvector | tsquery | ts_match_vq | no |
| = | uuid | uuid | uuid_eq | yes |

## Notes

- S2 lead_status equality matches about 6.7% of non-deleted org A leads. The field is optional (about 40% empty), so one filled value is about one ninth of the filled rows, not 11% of the table. S4 email_opt_out = false matches about 90.1%.
- Buffers are the root plan node's shared hit blocks plus shared read blocks. Child nodes already roll into that total. est_rows, actual_rows, and rows_removed are taken from the first scan node (Plan Rows, Actual Rows times Actual Loops, Rows Removed by Filter).
- A2 equality predicates use the expression-index form. A0 and A1 keep jsonb containment. A3 adds one extended statistics object on each of those expressions and runs vacuum analyze. PostgreSQL does not use expression statistics stored on a partial index, so A2 equality estimates fall back to the default and the filter index can beat the sort index.
- S2 keyset seeks with a row comparison on (sort expression, id). Rows with a null sort key are a second branch, union all, then ordered outside the limit. A null cursor continues with sort expression is null and id greater than the cursor.
- Storage-stage writes run without search indexes. Each stage, write kind, and RLS setting updates its own record range. A checkpoint runs before each batch. GIN pending lists on the written table are cleaned before the starting LSN and again before the ending LSN; gin_flush_ms is that second call. WAL per operation is the batch LSN delta divided by the operation count, so the flush is inside the delta. +trgm and +tsv rows are the same writes with one search index family added on A2 and B1.
- S7b measures two prefixes: zzrare:* (prefix of the rare 8-character token) and alpha:* (about one row in three). The plan summary appends JIT total time when JIT ran.
- Update writes rebuild the record's search text from the stored searchable fields with the changed values applied. Search maintenance is part of the write, not a constant placeholder.
- Read scenarios, including every S7 parameter, run before any write. Equivalence of the four ILIKE fragments and both prefixes is checked on the loaded data and again immediately before the RLS reads, so A, B, and C still hold the same logical rows at each read.
- RLS reads for A use A3 (expression indexes plus expression statistics). B uses B1. A non-leakproof operator cannot be an index condition and cannot use statistics while row level security is enabled. The operator table has the flags. text comparisons, boolean equality, timestamptz comparisons, and uuid equality are leakproof. numeric >=, record >, jsonb operators (->> , ->, @>), ILIKE, and @@ are not, so an expression built on jsonb cannot be an index condition under RLS.
- S2 keyset on A A2 took 209.9 ms and 139942 buffers (first page 105.1 ms / 75880 buffers; offset 5000 97.5 ms / 75880 buffers). Plan: Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_company.
- S2 keyset on A rls-on took 182.6 ms and 119566 buffers (first page 1.8 ms / 1889 buffers; offset 5000 104.3 ms / 229181 buffers). Plan: Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan records_pkey.
- S4 on A2 used Index Scan a_x_email_opt_out (1268.5 ms, 950534 buffers) while B1 used Index Scan bl_x_last_name (0.6 ms, 87 buffers). Both filters are boolean equality with last_name order. The expression-index plan walks the low-selectivity boolean index; the typed plan walks last_name and stops after 50 rows.
- S7b did not use the tsvector GIN for: A S7b common median 260.1 ms (Index Scan a_updated_idx); B S7b common median 252.4 ms (Index Scan bl_updated_idx); C S7b common median 11.7 ms (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). A common prefix matches about one row in three, so the planner can walk updated_at instead. A and B heap tuples are wider than C's header row, so the same plan costs more there. JIT time is in the plan summary when JIT ran.
- A3 against B1: S2 A3 1889 buf / 1.5 ms (removed 1433 est 11412 actual 51 buf 1889 (Index Scan a_x_company)) vs B1 1092 buf / 1.0 ms (removed 1433 est 12540 actual 51 buf 1092 (Index Scan bl_x_company)); S2-KEYSET A3 1425 buf / 2.0 ms (removed 0 est 50 actual 50 buf 1425 (Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan a_x_lead_status)) vs B1 388 buf / 1.1 ms (removed 0 est 50 actual 50 buf 388 (Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status)); S4 A3 192 buf / 0.6 ms (removed 33 est 153165 actual 51 buf 192 (Index Scan a_x_last_name)) vs B1 87 buf / 0.6 ms (removed 33 est 176698 actual 51 buf 87 (Index Scan bl_x_last_name)).
- S7 first-scan rows: S7c common3: A removed 4582 est 41415 actual 1464 buf 11290 (Index Scan a_updated_idx); B removed 4582 est 43542 actual 1464 buf 6106 (Index Scan bl_updated_idx); C removed 115 est 37171 actual 50 buf 1272 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7c common8: A removed 4855 est 31061 actual 1187 buf 10890 (Index Scan a_updated_idx); B removed 4855 est 37604 actual 1187 buf 6102 (Index Scan bl_updated_idx); C removed 197 est 33041 actual 50 buf 1344 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7a common3: A removed 4582 est 39117 actual 1464 buf 11290 (Index Scan a_updated_idx); B removed 4582 est 41534 actual 1464 buf 6106 (Index Scan bl_updated_idx); C removed 115 est 49549 actual 50 buf 1272 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7a common8: A removed 4855 est 34999 actual 1187 buf 10890 (Index Scan a_updated_idx); B removed 4855 est 31645 actual 1187 buf 6102 (Index Scan bl_updated_idx); C removed 197 est 39226 actual 50 buf 1344 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7b common: A removed 3979 est 56050 actual 2060 buf 13767 (Index Scan a_updated_idx); B removed 3979 est 65529 actual 2060 buf 6099 (Index Scan bl_updated_idx); C removed 76 est 56877 actual 50 buf 1234 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7c rare3: A removed 99803 est 9 actual 592 buf 54450 (Seq Scan records); B removed 83136 est 8 actual 592 buf 38468 (Seq Scan leads); C removed 16145 est 2065 actual 50 buf 17455 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7a rare3: A removed 160 est 20 actual 592 buf 3077 (Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm); B removed 160 est 20 actual 592 buf 755 (Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm); C removed 160 est 20 actual 592 buf 13779 (Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7b selective: A removed 137 est 1020 actual 488 buf 2429 (Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv); B removed 137 est 977 actual 488 buf 629 (Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv); C removed 68 est 601 actual 488 buf 1773 (Bitmap Heap Scan records; Bitmap Index Scan c_search_tsv; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey).
- On the common terms A and B do not stop the updated_at index scan at 50 matches. They examine a fixed window of about 6043 index entries (S7c common3 examined A 6046 (emitted 1464), B 6046, C 165 (emitted 50); S7c common8 examined A 6042 (emitted 1187), B 6042, C 247 (emitted 50); S7a common3 examined A 6046 (emitted 1464), B 6046, C 165 (emitted 50); S7a common8 examined A 6042 (emitted 1187), B 6042, C 247 (emitted 50); S7b common examined A 6039 (emitted 2060), B 6039, C 126 (emitted 50)). A and B remove the same number of rows as each other, and equivalence returned the same 50 ids, so the order matches; the extra emitted rows are later matches inside that window. The window does not move when the term changes, which is why the buffer count stays flat. 6043 projected tuples are on the order of one work_mem (4MB). C's plan nests the value lookups under the limit, so the outer index scan stops when 50 rows are filled.
- RLS off used an index that RLS on did not: A S2-KEYSET lost a_x_lead_status (off: Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan a_x_lead_status; on: Subquery Scan; Index Scan a_x_company; Subquery Scan; Index Scan records_pkey); A S2-OFFSET lost a_x_lead_status (off: Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; on: Seq Scan records); A S3 lost a_x_cf_datetime_1 (off: Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1; on: Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx); A S5 lost a_x_country (off: Bitmap Heap Scan records; Bitmap Index Scan a_x_country; on: Seq Scan records); A S11 lost a_x_cf_lookup_1 (off: Index Scan a_x_cf_lookup_1; on: Seq Scan records); A S2 count lost a_x_lead_status (off: Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; on: Seq Scan records); A S7a rare3 lost a_search_trgm (off: Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm; on: Index Scan a_updated_idx); A S7a common8 lost a_updated_idx (off: Index Scan a_updated_idx; on: Seq Scan records); A S7a rare8 lost a_search_trgm (off: Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm; on: Seq Scan records); A S7b selective lost a_search_tsv (off: Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv; on: Index Scan a_updated_idx); B S7a rare3 lost bl_search_trgm (off: Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm; on: Index Scan bl_updated_idx); B S7a common8 lost bl_updated_idx (off: Index Scan bl_updated_idx; on: Seq Scan leads); B S7a rare8 lost bl_search_trgm (off: Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm; on: Seq Scan leads); B S7b selective lost bl_search_tsv (off: Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv; on: Index Scan bl_updated_idx). Non-leakproof predicates are applied as filters, so the planner also loses the expression statistics that depend on them.
- WAL per operation for n/a and RLS off stays within 10% after the pending-list flush: S9 insert A A2 n/a 103843 (flush 2050.5 ms) vs rls-off 105313 (flush 2323.3 ms); S9 insert B B1 n/a 54021 (flush 0.0 ms) vs rls-off 54391 (flush 0.0 ms); S9 update1 A A2 n/a 104485 (flush 1208.0 ms) vs rls-off 106198 (flush 2335.8 ms); S9 update1 B B1 n/a 51103 (flush 0.0 ms) vs rls-off 52804 (flush 0.0 ms); S9 update5 A A2 n/a 100597 (flush 973.0 ms) vs rls-off 102908 (flush 2184.9 ms); S9 update5 B B1 n/a 46747 (flush 0.0 ms) vs rls-off 48303 (flush 0.0 ms).
