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
| generate | 31037.19 |
| copy A | 8477.98 |
| copy B | 5059.67 |
| copy C | 32645.23 |
| index A0 | 8868.42 |
| index B0 | 1216.54 |
| index C0 | 85266.44 |
| index A1 | 16046.19 |
| index A2 | 6192.04 |
| stats A3 | 8.20 |
| index B1 | 4555.98 |
| index trgm | 73014.97 |
| index tsv | 70292.95 |
| rebuild A1 | 22683.86 |
| rebuild A2 | 5819.49 |
| rebuild B1 | 3851.92 |
| rebuild trgm | 59923.27 |
| rebuild tsv | 41059.12 |

## Queries

| scenario | option | stage | median_ms | p95_ms | plan | buffers | shared_read | est_rows | actual_rows | rows_removed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | A | A0 | 0.36 | 0.45 | Index Scan a_created_idx | 242 | 53 | 204111 | 50 | 0 |
| S2 | A | A0 | 129.67 | 164.66 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 258058 | 54416 | 4295 | 13021 | 95660 |
| S2-KEYSET | A | A0 | 228.10 | 281.04 | Sort; Subquery Scan; Sort; Gather planned=2 launched=2; Seq Scan records; Subquery Scan; Gather Merge planned=2 launched=2; Sort; Seq Scan records | 445168 | 90226 | 50 | 50 | 0 |
| S2-OFFSET | A | A0 | 136.83 | 173.78 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 258058 | 45113 | 4295 | 13021 | 95660 |
| S3 | A | A0 | 49.31 | 69.00 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 16345 | 27 | 351 | 19642 |
| S4 | A | A0 | 376.22 | 411.57 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 925312 | 52508 | 48107 | 176589 | 41137 |
| S5 | A | A0 | 121.45 | 313.00 | Sort; Gather planned=2 launched=2; Seq Scan records | 197928 | 45117 | 2 | 73 | 99976 |
| S11 | A | A0 | 118.21 | 155.25 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 196497 | 45105 | 8 | 12 | 99996 |
| S2 count | A | A0 | 127.00 | 162.01 | Gather planned=2 launched=2; Seq Scan records | 196329 | 45113 | 4295 | 13021 | 95660 |
| S2 capped | A | A0 | 100.40 | 195.46 | Gather planned=2 launched=2; Seq Scan records | 170274 | 44708 | 4295 | 10794 | 85248 |
| S4 count | A | A0 | 118.67 | 164.16 | Gather planned=2 launched=2; Seq Scan records | 196329 | 45103 | 48107 | 176589 | 41137 |
| S4 capped | A | A0 | 8.14 | 43.30 | Seq Scan records | 9015 | 2316 | 115457 | 10001 | 1393 |
| S8 | A | A0 | 0.37 | 0.81 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S10 source | A | A0 | 220.63 | 265.79 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109626 | 45182 | 21078 | 49181 | 83606 |
| S10 owner | A | A0 | 242.01 | 308.53 | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109642 | 41685 | 21078 | 49181 | 83606 |
| S1 | A | A1 | 0.37 | 0.76 | Index Scan a_created_idx | 242 | 74 | 204392 | 50 | 0 |
| S2 | A | A1 | 107.38 | 154.05 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 82362 | 14410 | 18581 | 13021 | 261 |
| S2-KEYSET | A | A1 | 121.70 | 149.92 | Sort; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 91722 | 20190 | 50 | 50 | 0 |
| S2-OFFSET | A | A1 | 119.09 | 210.14 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 82362 | 10428 | 18581 | 13021 | 261 |
| S3 | A | A1 | 64.59 | 100.47 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 17610 | 29 | 351 | 19642 |
| S4 | A | A1 | 533.39 | 790.66 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 925312 | 51109 | 49033 | 176589 | 41137 |
| S5 | A | A1 | 6.69 | 7.93 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 2615 | 528 | 2 | 73 | 515 |
| S11 | A | A1 | 0.37 | 0.40 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 104 | 15 | 20 | 12 | 1 |
| S2 count | A | A1 | 56.30 | 78.49 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 20769 | 11923 | 18581 | 13021 | 261 |
| S2 capped | A | A1 | 44.94 | 64.42 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 15982 | 8720 | 18581 | 10001 | 198 |
| S4 count | A | A1 | 149.57 | 209.69 | Gather planned=2 launched=2; Seq Scan records | 196329 | 48487 | 49033 | 176589 | 41137 |
| S4 capped | A | A1 | 16.04 | 39.25 | Seq Scan records | 8907 | 2282 | 117680 | 10001 | 1316 |
| S8 | A | A1 | 0.47 | 0.87 | Index Scan records_pkey | 4 | 3 | 1 | 1 | 0 |
| S10 source | A | A1 | 260.07 | 307.23 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109626 | 45181 | 21205 | 49181 | 83606 |
| S10 owner | A | A1 | 266.44 | 329.88 | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109642 | 41685 | 21205 | 49181 | 83606 |
| S1 | A | A2 | 0.38 | 0.43 | Index Scan a_created_idx | 234 | 52 | 203896 | 50 | 0 |
| S2 | A | A2 | 98.47 | 142.60 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 14098 | 1019 | 13021 | 3266 |
| S2-KEYSET | A | A2 | 240.16 | 379.23 | Sort; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_company | 139942 | 66960 | 50 | 50 | 0 |
| S2-OFFSET | A | A2 | 108.54 | 131.01 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 16506 | 1019 | 13021 | 3266 |
| S3 | A | A2 | 5.82 | 17.05 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10479 | 7060 | 28 | 351 | 8784 |
| S4 | A | A2 | 1233.73 | 1590.20 | Sort; Index Scan a_x_email_opt_out | 950534 | 193362 | 1019 | 176589 | 44013 |
| S5 | A | A2 | 2.20 | 4.26 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1548 | 468 | 20 | 73 | 505 |
| S11 | A | A2 | 0.79 | 1.15 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_lookup_1 | 88 | 15 | 1019 | 12 | 1 |
| S2 count | A | A2 | 29.84 | 41.82 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 12402 | 1019 | 13021 | 3266 |
| S2 capped | A | A2 | 21.14 | 26.56 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 8847 | 7051 | 1019 | 10001 | 1 |
| S4 count | A | A2 | 485.97 | 706.43 | Index Scan a_x_email_opt_out | 221687 | 160097 | 1019 | 176589 | 44013 |
| S4 capped | A | A2 | 2.61 | 8.12 | Index Scan a_x_email_opt_out | 12624 | 9149 | 1019 | 10001 | 2559 |
| S8 | A | A2 | 0.40 | 0.79 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S10 source | A | A2 | 271.72 | 440.89 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109626 | 47702 | 21372 | 49181 | 83606 |
| S10 owner | A | A2 | 259.95 | 348.43 | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109642 | 41685 | 21372 | 49181 | 83606 |
| S1 | A | A3 | 0.40 | 0.43 | Index Scan a_created_idx | 234 | 52 | 204161 | 50 | 0 |
| S2 | A | A3 | 2.00 | 3.69 | Index Scan a_x_company | 1855 | 353 | 11562 | 50 | 1393 |
| S2-KEYSET | A | A3 | 2.00 | 3.61 | Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan a_x_lead_status | 1425 | 441 | 50 | 50 | 0 |
| S2-OFFSET | A | A3 | 105.35 | 142.43 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 13459 | 11562 | 13021 | 3266 |
| S3 | A | A3 | 5.55 | 14.43 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10479 | 7049 | 187 | 351 | 8784 |
| S4 | A | A3 | 0.40 | 0.48 | Index Scan a_x_last_name | 191 | 67 | 153005 | 50 | 33 |
| S5 | A | A3 | 2.38 | 5.11 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1548 | 484 | 67 | 73 | 505 |
| S11 | A | A3 | 0.71 | 1.06 | Sort; Index Scan a_x_cf_lookup_1 | 88 | 15 | 1 | 12 | 1 |
| S2 count | A | A3 | 30.52 | 49.93 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 11808 | 11562 | 13021 | 3266 |
| S2 capped | A | A3 | 21.72 | 33.35 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 8847 | 7050 | 11562 | 10001 | 1 |
| S4 count | A | A3 | 124.05 | 150.67 | Gather planned=2 launched=2; Seq Scan records | 167502 | 48336 | 63752 | 176589 | 41137 |
| S4 capped | A | A3 | 13.66 | 19.64 | Seq Scan records | 8876 | 2303 | 153005 | 10001 | 1258 |
| S8 | A | A3 | 0.44 | 0.87 | Index Scan records_pkey | 4 | 3 | 1 | 1 | 0 |
| S10 source | A | A3 | 104.71 | 162.19 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109566 | 43359 | 21228 | 49181 | 83606 |
| S10 owner | A | A3 | 102.36 | 142.43 | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records | 109582 | 41720 | 21228 | 49181 | 83606 |
| S1 | B | B0 | 0.23 | 0.39 | Index Scan bl_created_idx | 54 | 53 | 195684 | 50 | 0 |
| S2 | B | B0 | 64.47 | 85.92 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38508 | 38067 | 5433 | 13021 | 78993 |
| S2-KEYSET | B | B0 | 73.44 | 98.51 | Sort; Subquery Scan; Sort; Gather planned=2 launched=2; Seq Scan leads; Subquery Scan; Index Scan leads_pkey | 41171 | 30153 | 50 | 50 | 0 |
| S2-OFFSET | B | B0 | 81.35 | 104.88 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38508 | 22382 | 5433 | 13021 | 78993 |
| S3 | B | B0 | 40.32 | 61.72 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_owner_idx | 15187 | 9867 | 261 | 351 | 19642 |
| S4 | B | B0 | 112.13 | 159.61 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38508 | 22410 | 73466 | 176589 | 24470 |
| S5 | B | B0 | 70.33 | 88.44 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38510 | 22379 | 38 | 73 | 83309 |
| S11 | B | B0 | 76.37 | 93.41 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38468 | 22369 | 1 | 12 | 83329 |
| S2 count | B | B0 | 66.65 | 80.27 | Gather planned=2 launched=2; Seq Scan leads | 38414 | 22380 | 5433 | 13021 | 78993 |
| S2 capped | B | B0 | 82.32 | 156.90 | Seq Scan leads | 31346 | 22118 | 13039 | 10001 | 194154 |
| S4 count | B | B0 | 77.36 | 90.39 | Gather planned=2 launched=2; Seq Scan leads | 38372 | 22357 | 73466 | 176589 | 24470 |
| S4 capped | B | B0 | 4.33 | 14.22 | Seq Scan leads | 1798 | 1632 | 176318 | 10001 | 1314 |
| S8 | B | B0 | 0.40 | 0.61 | Index Scan leads_pkey | 4 | 4 | 1 | 1 | 0 |
| S10 source | B | B0 | 57.85 | 67.74 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38432 | 22457 | 20255 | 49181 | 66940 |
| S10 owner | B | B0 | 59.61 | 76.23 | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38448 | 22386 | 20255 | 49181 | 66940 |
| S1 | B | B1 | 0.31 | 0.66 | Index Scan bl_created_idx | 54 | 24 | 195967 | 50 | 0 |
| S2 | B | B1 | 1.31 | 2.85 | Index Scan bl_x_company | 1061 | 206 | 13247 | 50 | 1393 |
| S2-KEYSET | B | B1 | 1.04 | 2.36 | Incremental Sort; Subquery Scan; Index Scan bl_x_company; Sort; Subquery Scan; Index Scan bl_x_lead_status | 388 | 316 | 50 | 50 | 0 |
| S2-OFFSET | B | B1 | 61.14 | 76.24 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 8663 | 13247 | 13021 | 3266 |
| S3 | B | B1 | 5.66 | 14.49 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 | 260 | 351 | 8784 |
| S4 | B | B1 | 0.32 | 0.34 | Index Scan bl_x_last_name | 86 | 54 | 176429 | 50 | 33 |
| S5 | B | B1 | 1.31 | 1.39 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 349 | 88 | 73 | 505 |
| S11 | B | B1 | 0.25 | 0.34 | Sort; Index Scan bl_x_cf_lookup_1 | 16 | 11 | 3 | 12 | 1 |
| S2 count | B | B1 | 29.23 | 37.53 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9547 | 13247 | 13021 | 3266 |
| S2 capped | B | B1 | 22.93 | 27.63 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 8434 | 5851 | 13247 | 10001 | 0 |
| S4 count | B | B1 | 84.27 | 234.23 | Gather planned=2 launched=2; Seq Scan leads | 38372 | 22562 | 73512 | 176589 | 24470 |
| S4 capped | B | B1 | 5.29 | 16.15 | Seq Scan leads | 1825 | 1020 | 176429 | 10001 | 1346 |
| S8 | B | B1 | 0.44 | 0.64 | Index Scan leads_pkey | 4 | 3 | 1 | 1 | 0 |
| S10 source | B | B1 | 63.21 | 88.77 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38432 | 22452 | 20115 | 49181 | 66940 |
| S10 owner | B | B1 | 61.99 | 72.92 | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38448 | 22386 | 20115 | 49181 | 66940 |
| S1 | C | C0 | 3.35 | 3.43 | Index Scan c_created_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1152 | 123 | 204511 | 50 | 0 |
| S2 | C | C0 | 209.22 | 2085.01 | Sort; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 313684 | 42281 | 364 | 16622 | 0 |
| S2-KEYSET | C | C0 | 280.40 | 392.45 | Sort; Subquery Scan; Sort; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Subquery Scan; Sort; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 361441 | 70382 | 50 | 50 | 0 |
| S2-OFFSET | C | C0 | 229.15 | 589.99 | Sort; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 313684 | 41261 | 364 | 16622 | 0 |
| S3 | C | C0 | 27.95 | 33.33 | Sort; Index Only Scan c_value_num_idx; Index Only Scan c_value_ts_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 78326 | 5660 | 4754 | 112361 | 0 |
| S4 | C | C0 | 179.04 | 265.26 | Gather Merge planned=2 launched=2; Sort; Index Only Scan c_value_text_idx; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 156478 | 20796 | 131324 | 300000 | 0 |
| S5 | C | C0 | 13.36 | 17.34 | Sort; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Only Scan c_value_text_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7545 | 1690 | 1 | 467 | 0 |
| S11 | C | C0 | 5.72 | 11.22 | Sort; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 325 | 35 | 1 | 12 | 0 |
| S2 count | C | C0 | 30.98 | 62.45 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 74113 | 10723 | 364 | 16622 | 0 |
| S2 capped | C | C0 | 24.82 | 54.78 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 60174 | 4209 | 364 | 13534 | 0 |
| S4 count | C | C0 | 571.25 | 1472.92 | Gather planned=2 launched=2; Bitmap Heap Scan record_values; Bitmap Index Scan c_value_ts_idx; Index Only Scan c_created_idx | 81028 | 80983 | 98959 | 225105 | 8298 |
| S4 capped | C | C0 | 421.59 | 1361.47 | Seq Scan record_values; Index Scan records_pkey | 44407 | 5941 | 237501 | 10206 | 315569 |
| S8 | C | C0 | 1.48 | 2.45 | Index Scan records_pkey; Bitmap Heap Scan record_values; Bitmap Index Scan record_values_pkey | 8 | 3 | 1 | 1 | 0 |
| S10 source | C | C0 | 149.28 | 705.62 | Sort; Index Only Scan c_value_text_idx; Index Only Scan c_value_num_idx; Index Only Scan c_created_idx | 136663 | 3131 | 165315 | 150315 | 0 |
| S10 owner | C | C0 | 161.28 | 223.51 | Gather Merge planned=2 launched=2; Sort; Index Only Scan c_value_num_idx; Index Only Scan c_value_text_idx; Seq Scan records | 158142 | 10407 | 66531 | 149774 | 0 |
| S7c common3 | A | no-search-index | 2.12 | 5.61 | Index Scan a_updated_idx | 350 | 190 | 39182 | 50 | 115 |
| S7c rare3 | A | no-search-index | 512.53 | 1066.46 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 54450 | 51995 | 8 | 592 | 99803 |
| S7c common8 | A | no-search-index | 1.04 | 1.20 | Index Scan a_updated_idx | 468 | 87 | 39182 | 50 | 197 |
| S7c rare8 | A | no-search-index | 1911.69 | 2681.97 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 53928 | 41673 | 8 | 488 | 99837 |
| S7c common3 | B | no-search-index | 1.76 | 11.20 | Index Scan bl_updated_idx | 170 | 169 | 57404 | 50 | 115 |
| S7c rare3 | B | no-search-index | 630.94 | 1385.08 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38468 | 38208 | 8 | 592 | 83136 |
| S7c common8 | B | no-search-index | 2.17 | 4.99 | Index Scan bl_updated_idx | 253 | 58 | 43548 | 50 | 197 |
| S7c rare8 | B | no-search-index | 386.67 | 678.01 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38468 | 27999 | 8 | 488 | 83171 |
| S7c common3 | C | no-search-index | 10.25 | 19.50 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1272 | 261 | 51644 | 50 | 115 |
| S7c rare3 | C | no-search-index | 544.28 | 1284.65 | Sort; Gather planned=2 launched=2; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 34833 | 23181 | 8 | 592 | 99803 |
| S7c common8 | C | no-search-index | 12.91 | 33.86 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1344 | 109 | 26855 | 50 | 197 |
| S7c rare8 | C | no-search-index | 700.96 | 1328.35 | Sort; Gather planned=2 launched=2; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 32524 | 12531 | 8 | 488 | 99837 |
| S7a common3 | A | trgm | 0.89 | 1.11 | Index Scan a_updated_idx | 350 | 176 | 45345 | 50 | 115 |
| S7a rare3 | A | trgm | 3.29 | 3.36 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 3077 | 833 | 20 | 592 | 160 |
| S7a common8 | A | trgm | 1.06 | 1.09 | Index Scan a_updated_idx | 468 | 86 | 47406 | 50 | 197 |
| S7a rare8 | A | trgm | 2.98 | 3.04 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 2455 | 681 | 20 | 488 | 137 |
| S7a common3 | B | trgm | 0.79 | 0.84 | Index Scan bl_updated_idx | 170 | 169 | 45606 | 50 | 115 |
| S7a rare3 | B | trgm | 2.20 | 2.28 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 755 | 746 | 20 | 592 | 160 |
| S7a common8 | B | trgm | 0.96 | 0.99 | Index Scan bl_updated_idx | 253 | 82 | 45606 | 50 | 197 |
| S7a rare8 | B | trgm | 2.13 | 2.24 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 655 | 622 | 20 | 488 | 137 |
| S7a common3 | C | trgm | 4.09 | 4.17 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1272 | 261 | 43260 | 50 | 115 |
| S7a rare3 | C | trgm | 6.55 | 6.68 | Sort; Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 13779 | 2273 | 20 | 592 | 160 |
| S7a common8 | C | trgm | 4.25 | 4.35 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1344 | 141 | 59740 | 50 | 197 |
| S7a rare8 | C | trgm | 6.04 | 6.21 | Sort; Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 11370 | 1682 | 20 | 488 | 137 |
| S7b selective | A | tsv | 1.72 | 1.85 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv | 2429 | 684 | 1019 | 488 | 137 |
| S7b common | A | tsv | 3.99 | 4.04 | Index Scan a_updated_idx | 310 | 131 | 55910 | 50 | 76 |
| S7b selective | B | tsv | 0.84 | 0.92 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv | 629 | 623 | 980 | 488 | 137 |
| S7b common | B | tsv | 3.86 | 3.94 | Index Scan bl_updated_idx | 130 | 126 | 65139 | 50 | 76 |
| S7b selective | C | tsv | 7.44 | 7.70 | Gather Merge planned=1 launched=1; Sort; Bitmap Heap Scan records; Bitmap Index Scan c_search_tsv; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1773 | 769 | 599 | 488 | 68 |
| S7b common | C | tsv | 7.89 | 8.05 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1234 | 211 | 57130 | 50 | 76 |
| S1 | A | rls-off | 0.67 | 0.95 | Index Scan a_created_idx | 257 | 51 | 203829 | 50 | 0 |
| S2 | A | rls-off | 1.17 | 1.34 | Index Scan a_x_company | 1855 | 513 | 11503 | 50 | 1393 |
| S2-KEYSET | A | rls-off | 1.73 | 4.16 | Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan a_x_lead_status | 1425 | 488 | 50 | 50 | 0 |
| S2-OFFSET | A | rls-off | 76.16 | 78.13 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75883 | 14064 | 11503 | 13021 | 3266 |
| S3 | A | rls-off | 5.80 | 6.87 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10482 | 7057 | 187 | 351 | 8784 |
| S4 | A | rls-off | 0.66 | 0.71 | Index Scan a_x_last_name | 191 | 67 | 154061 | 50 | 33 |
| S5 | A | rls-off | 2.42 | 2.80 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1551 | 484 | 59 | 73 | 505 |
| S11 | A | rls-off | 0.78 | 1.28 | Sort; Index Scan a_x_cf_lookup_1 | 88 | 15 | 1 | 12 | 1 |
| S2 count | A | rls-off | 15.57 | 15.94 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 11766 | 11503 | 13021 | 3266 |
| S7a common3 | A | rls-off | 1.14 | 1.19 | Index Scan a_updated_idx | 350 | 142 | 53531 | 50 | 115 |
| S7a rare3 | A | rls-off | 3.54 | 3.62 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 3077 | 718 | 20 | 592 | 160 |
| S7a common8 | A | rls-off | 1.33 | 1.38 | Index Scan a_updated_idx | 468 | 70 | 26765 | 50 | 197 |
| S7a rare8 | A | rls-off | 3.20 | 3.36 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 2455 | 571 | 20 | 488 | 137 |
| S7b selective | A | rls-off | 1.96 | 2.07 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv | 2429 | 3 | 1019 | 488 | 137 |
| S7b common | A | rls-off | 4.23 | 4.31 | Index Scan a_updated_idx | 310 | 8 | 55910 | 50 | 76 |
| S8 | A | rls-off | 0.65 | 0.84 | Index Scan records_pkey | 4 | 3 | 1 | 1 | 0 |
| S1 | B | rls-off | 0.56 | 0.61 | Index Scan bl_created_idx | 54 | 53 | 195946 | 50 | 0 |
| S2 | B | rls-off | 0.83 | 0.97 | Index Scan bl_x_company | 1061 | 398 | 12345 | 50 | 1393 |
| S2-KEYSET | B | rls-off | 1.09 | 2.08 | Incremental Sort; Subquery Scan; Index Scan bl_x_company; Sort; Subquery Scan; Index Scan bl_x_lead_status | 388 | 384 | 50 | 50 | 0 |
| S2-OFFSET | B | rls-off | 34.76 | 37.24 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 12549 | 12345 | 13021 | 3266 |
| S3 | B | rls-off | 5.74 | 6.14 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 | 266 | 351 | 8784 |
| S4 | B | rls-off | 0.49 | 0.58 | Index Scan bl_x_last_name | 86 | 54 | 175887 | 50 | 33 |
| S5 | B | rls-off | 1.64 | 9.05 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 351 | 90 | 73 | 505 |
| S11 | B | rls-off | 0.61 | 0.87 | Sort; Index Scan bl_x_cf_lookup_1 | 16 | 11 | 3 | 12 | 1 |
| S2 count | B | rls-off | 15.12 | 18.70 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9549 | 12345 | 13021 | 3266 |
| S7a common3 | B | rls-off | 1.05 | 1.09 | Index Scan bl_updated_idx | 170 | 108 | 39585 | 50 | 115 |
| S7a rare3 | B | rls-off | 34.83 | 54.55 | Index Scan bl_updated_idx | 16350 | 9619 | 1979 | 50 | 16145 |
| S7a common8 | B | rls-off | 1.20 | 1.25 | Index Scan bl_updated_idx | 253 | 0 | 41564 | 50 | 197 |
| S7a rare8 | B | rls-off | 2.37 | 2.43 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 655 | 393 | 20 | 488 | 137 |
| S7b selective | B | rls-off | 1.01 | 1.09 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv | 629 | 3 | 980 | 488 | 137 |
| S7b common | B | rls-off | 3.93 | 4.84 | Index Scan bl_updated_idx | 130 | 0 | 65139 | 50 | 76 |
| S8 | B | rls-off | 1.12 | 21.59 | Index Scan leads_pkey | 4 | 3 | 1 | 1 | 0 |
| S1 | A | rls-on | 0.68 | 0.77 | Index Scan a_created_idx | 234 | 74 | 203829 | 50 | 0 |
| S2 | A | rls-on | 1.21 | 1.35 | Index Scan a_x_company | 1855 | 550 | 11503 | 50 | 1393 |
| S2-KEYSET | A | rls-on | 145.03 | 180.39 | Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan records_pkey | 119566 | 42923 | 50 | 50 | 0 |
| S2-OFFSET | A | rls-on | 132.64 | 175.83 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 229197 | 44445 | 4793 | 13021 | 95660 |
| S3 | A | rls-on | 61.09 | 67.97 | Sort; Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 13170 | 125 | 351 | 19642 |
| S4 | A | rls-on | 0.62 | 0.76 | Index Scan a_x_last_name | 191 | 70 | 154061 | 50 | 33 |
| S5 | A | rls-on | 101.16 | 138.87 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 168572 | 46714 | 25 | 73 | 99976 |
| S11 | A | rls-on | 100.94 | 139.84 | Sort; Gather planned=2 launched=2; Seq Scan records | 167582 | 43306 | 1 | 12 | 99996 |
| S2 count | A | rls-on | 114.57 | 181.64 | Gather planned=2 launched=2; Seq Scan records | 167510 | 43302 | 4793 | 13021 | 95660 |
| S7a common3 | A | rls-on | 1.54 | 2.52 | Index Scan a_updated_idx | 350 | 135 | 8153 | 50 | 115 |
| S7a rare3 | A | rls-on | 34.85 | 47.10 | Index Scan a_updated_idx | 16566 | 13135 | 8153 | 50 | 16145 |
| S7a common8 | A | rls-on | 489.23 | 777.78 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 206120 | 44158 | 8 | 39208 | 86931 |
| S7a rare8 | A | rls-on | 399.32 | 840.34 | Gather Merge planned=2 launched=2; Sort; Seq Scan records | 53894 | 41661 | 8 | 488 | 99837 |
| S7b selective | A | rls-on | 1607.97 | 2181.35 | Gather Merge planned=2 launched=2; Index Scan a_updated_idx | 39583 | 27748 | 425 | 102 | 12856 |
| S7b common | A | rls-on | 10.52 | 19.33 | Index Scan a_updated_idx | 310 | 87 | 55910 | 50 | 76 |
| S8 | A | rls-on | 2.45 | 22.00 | Index Scan records_pkey | 4 | 4 | 1 | 1 | 0 |
| S1 | B | rls-on | 1.79 | 4.86 | Index Scan bl_created_idx | 54 | 53 | 195946 | 50 | 0 |
| S2 | B | rls-on | 4.21 | 7.67 | Index Scan bl_x_company | 1061 | 398 | 12345 | 50 | 1393 |
| S2-KEYSET | B | rls-on | 3.09 | 16.83 | Incremental Sort; Subquery Scan; Index Scan bl_x_company; Sort; Subquery Scan; Index Scan bl_x_lead_status | 388 | 384 | 50 | 50 | 0 |
| S2-OFFSET | B | rls-on | 167.12 | 341.19 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 12549 | 12345 | 13021 | 3266 |
| S3 | B | rls-on | 30.44 | 63.51 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 | 177 | 351 | 8784 |
| S4 | B | rls-on | 6.29 | 34.57 | Index Scan bl_x_last_name | 86 | 54 | 175887 | 50 | 33 |
| S5 | B | rls-on | 21.72 | 84.52 | Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 349 | 90 | 73 | 505 |
| S11 | B | rls-on | 3.27 | 9.38 | Sort; Index Scan bl_x_cf_lookup_1 | 16 | 11 | 3 | 12 | 1 |
| S2 count | B | rls-on | 42.03 | 278.20 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9547 | 12345 | 13021 | 3266 |
| S7a common3 | B | rls-on | 1.62 | 3.90 | Index Scan bl_updated_idx | 170 | 108 | 7838 | 50 | 115 |
| S7a rare3 | B | rls-on | 85.80 | 130.50 | Index Scan bl_updated_idx | 16350 | 9613 | 7838 | 50 | 16145 |
| S7a common8 | B | rls-on | 457.36 | 831.66 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38468 | 22547 | 8 | 39208 | 70264 |
| S7a rare8 | B | rls-on | 250.26 | 438.41 | Gather Merge planned=2 launched=2; Sort; Seq Scan leads | 38468 | 22380 | 8 | 488 | 83171 |
| S7b selective | B | rls-on | 1489.13 | 2184.48 | Gather Merge planned=2 launched=2; Index Scan bl_updated_idx | 39310 | 22185 | 408 | 102 | 12889 |
| S7b common | B | rls-on | 9.59 | 13.81 | Index Scan bl_updated_idx | 130 | 55 | 65139 | 50 | 76 |
| S8 | B | rls-on | 1.63 | 2.39 | Index Scan leads_pkey | 4 | 4 | 1 | 1 | 0 |

## Writes

| scenario | option | stage | rls | ops | total_ms | median_ms | p95_ms | wal_bytes_per_op | gin_flush_ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S9 insert | A | A0 | n/a | 2000 | 2850.37 | 1.05 | 2.65 | 17429 | 0.00 |
| S9 update1 | A | A0 | n/a | 2000 | 3155.42 | 1.33 | 3.29 | 12821 | 0.00 |
| S9 update5 | A | A0 | n/a | 2000 | 4978.83 | 1.50 | 6.99 | 13176 | 0.00 |
| S9 insert | A | A1 | n/a | 2000 | 2591.29 | 0.82 | 2.20 | 64481 | 1949.36 |
| S9 update1 | A | A1 | n/a | 2000 | 1599.02 | 0.66 | 1.20 | 64238 | 3370.65 |
| S9 update5 | A | A1 | n/a | 2000 | 5399.35 | 1.14 | 9.32 | 63171 | 2349.80 |
| S9 insert | A | A2 | n/a | 2000 | 2735.68 | 1.20 | 2.45 | 103885 | 2164.89 |
| S9 update1 | A | A2 | n/a | 2000 | 3023.19 | 1.13 | 2.48 | 104506 | 1899.30 |
| S9 update5 | A | A2 | n/a | 2000 | 2254.87 | 1.03 | 1.78 | 100505 | 1830.84 |
| S9 insert | B | B0 | n/a | 2000 | 1965.41 | 0.85 | 1.69 | 15569 | 0.00 |
| S9 update1 | B | B0 | n/a | 2000 | 1392.29 | 0.53 | 0.99 | 10941 | 0.00 |
| S9 update5 | B | B0 | n/a | 2000 | 1050.53 | 0.46 | 0.76 | 11151 | 0.00 |
| S9 insert | B | B1 | n/a | 2000 | 1484.14 | 0.70 | 1.08 | 54021 | 0.00 |
| S9 update1 | B | B1 | n/a | 2000 | 1403.00 | 0.66 | 0.97 | 51093 | 0.00 |
| S9 update5 | B | B1 | n/a | 2000 | 1805.57 | 0.81 | 1.21 | 51428 | 0.00 |
| S9 insert | C | C0 | n/a | 2000 | 52785.10 | 20.37 | 44.17 | 482996 | 0.00 |
| S9 update1 | C | C0 | n/a | 2000 | 2768.93 | 1.26 | 2.20 | 28363 | 0.00 |
| S9 update5 | C | C0 | n/a | 2000 | 3252.90 | 1.39 | 2.92 | 60482 | 0.00 |
| S9 insert | A | A2 | off | 2000 | 2515.75 | 1.06 | 2.10 | 105323 | 1947.72 |
| S9 update1 | A | A2 | off | 2000 | 2106.40 | 1.04 | 1.36 | 107508 | 1750.48 |
| S9 update5 | A | A2 | off | 2000 | 4911.59 | 1.00 | 19.24 | 104189 | 1642.44 |
| S9 insert | B | B1 | off | 2000 | 2011.64 | 0.93 | 1.50 | 54374 | 0.00 |
| S9 update1 | B | B1 | off | 2000 | 1626.13 | 0.79 | 1.09 | 52801 | 0.00 |
| S9 update5 | B | B1 | off | 2000 | 1451.09 | 0.71 | 1.04 | 48312 | 0.00 |
| S9 insert | A | A2 | on | 2000 | 1961.81 | 0.92 | 1.42 | 106998 | 1609.56 |
| S9 update1 | A | A2 | on | 2000 | 5250.65 | 1.96 | 6.22 | 108749 | 1994.38 |
| S9 update5 | A | A2 | on | 2000 | 2429.42 | 1.14 | 1.74 | 105029 | 1910.78 |
| S9 insert | B | B1 | on | 2000 | 3488.07 | 1.18 | 4.11 | 55851 | 0.00 |
| S9 update1 | B | B1 | on | 2000 | 2782.70 | 0.96 | 3.52 | 54275 | 0.00 |
| S9 update5 | B | B1 | on | 2000 | 1645.29 | 0.81 | 1.11 | 49898 | 0.00 |
| S9 insert | A | A2+trgm | n/a | 2000 | 4007.03 | 0.89 | 1.33 | 167186 | 1905.99 |
| S9 update1 | A | A2+trgm | n/a | 2000 | 4576.91 | 1.15 | 1.87 | 171087 | 1733.58 |
| S9 update5 | A | A2+trgm | n/a | 2000 | 12995.46 | 1.52 | 10.59 | 175383 | 2277.59 |
| S9 insert | B | B1+trgm | n/a | 2000 | 5229.46 | 0.98 | 1.63 | 106077 | 109.02 |
| S9 update1 | B | B1+trgm | n/a | 2000 | 5181.95 | 1.14 | 2.08 | 110007 | 122.28 |
| S9 update5 | B | B1+trgm | n/a | 2000 | 4458.10 | 1.13 | 1.70 | 99130 | 179.24 |
| S9 insert | A | A2+tsv | n/a | 2000 | 2035.85 | 0.91 | 1.77 | 134042 | 2700.75 |
| S9 update1 | A | A2+tsv | n/a | 2000 | 2404.74 | 1.03 | 1.71 | 133625 | 3669.44 |
| S9 update5 | A | A2+tsv | n/a | 2000 | 2777.69 | 1.27 | 2.30 | 130231 | 2815.78 |
| S9 insert | B | B1+tsv | n/a | 2000 | 2086.21 | 0.95 | 1.76 | 78759 | 1191.64 |
| S9 update1 | B | B1+tsv | n/a | 2000 | 1942.26 | 0.93 | 1.25 | 75452 | 736.61 |
| S9 update5 | B | B1+tsv | n/a | 2000 | 1932.10 | 0.94 | 1.21 | 70630 | 739.29 |

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
| trgm | bench_a | a_search_trgm | index | 232742912 |
| trgm | bench_b | bc_search_trgm | index | 7249920 |
| trgm | bench_b | bl_search_trgm | index | 221437952 |
| trgm | bench_c | c_search_trgm | index | 208535552 |
| tsv | bench_a | a_search_tsv | index | 154583040 |
| tsv | bench_b | bc_search_tsv | index | 7626752 |
| tsv | bench_b | bl_search_tsv | index | 148889600 |
| tsv | bench_c | c_search_tsv | index | 146472960 |

## Alter on the typed leads table

| operation | ms | rows |
| --- | --- | --- |
| add column (no default) | 1.50 | 250000 |
| add column (constant default) | 1.36 | 250000 |
| create index concurrently | 436.36 | 250000 |

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

## Notes

- S2 lead_status equality matches about 6.7% of non-deleted org A leads. The field is optional (about 40% empty), so one filled value is about one ninth of the filled rows, not 11% of the table. S4 email_opt_out = false matches about 90.1%.
- Buffers are the root plan node's shared hit blocks plus shared read blocks. Child nodes already roll into that total. est_rows, actual_rows, and rows_removed are taken from the first scan node (Plan Rows, Actual Rows times Actual Loops, Rows Removed by Filter).
- A2 equality predicates use the expression-index form. A0 and A1 keep jsonb containment. A3 adds one extended statistics object on each of those expressions and runs vacuum analyze. PostgreSQL does not use expression statistics stored on a partial index, so A2 equality estimates fall back to the default and the filter index can beat the sort index.
- S2 keyset seeks with a row comparison on (sort expression, id). Rows with a null sort key are a second branch, union all, then ordered outside the limit. A null cursor continues with sort expression is null and id greater than the cursor.
- Storage-stage writes run without search indexes. Each stage, write kind, and RLS setting updates its own record range. A checkpoint runs before each batch. GIN pending lists on the written table are cleaned before the starting LSN and again before the ending LSN; gin_flush_ms is that second call. WAL per operation is the batch LSN delta divided by the operation count, so the flush is inside the delta. +trgm and +tsv rows are the same writes with one search index family added on A2 and B1.
- S7b measures two prefixes: zzrare:* (prefix of the rare 8-character token) and alpha:* (about one row in three). The plan summary appends JIT total time when JIT ran.
- Update writes rebuild the record's search text from the stored searchable fields with the changed values applied. Search maintenance is part of the write, not a constant placeholder.
- Read scenarios, including every S7 parameter, run before any write. Equivalence of the four ILIKE fragments and both prefixes is checked on the loaded data and again immediately before the RLS reads, so A, B, and C still hold the same logical rows at each read.
- RLS reads for A use A3 (expression indexes plus expression statistics). B uses B1. A non-leakproof operator cannot be an index condition and cannot use statistics while row level security is enabled. The operator table has the flags. text comparisons, boolean equality, timestamptz comparisons, and uuid comparisons (= and >) are leakproof. numeric >=, jsonb operators (->> , ->, @>), ILIKE, and @@ are not, so an expression built on jsonb cannot be an index condition under RLS.
- C C0 S2 p95 is 2085.0 ms versus median 209.2 ms.
- B rls-off S8 p95 is 21.6 ms versus median 1.1 ms.
- A rls-on S8 p95 is 22.0 ms versus median 2.5 ms.
- S2 keyset on A A2 took 240.2 ms and 139942 buffers (first page 98.5 ms / 75880 buffers; offset 5000 108.5 ms / 75880 buffers). Plan: Sort; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_company.
- S2 keyset on A rls-on took 145.0 ms and 119566 buffers (first page 1.2 ms / 1855 buffers; offset 5000 132.6 ms / 229197 buffers). Plan: Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan records_pkey.
- S4 on A2 used Sort; Index Scan a_x_email_opt_out (1233.7 ms, 950534 buffers) while B1 used Index Scan bl_x_last_name (0.3 ms, 86 buffers). Both filters are boolean equality with last_name order. The expression-index plan walks the low-selectivity boolean index; the typed plan walks last_name and stops after 50 rows.
- S7b did not use the tsvector GIN for: A S7b common median 4.0 ms (Index Scan a_updated_idx); B S7b common median 3.9 ms (Index Scan bl_updated_idx); C S7b common median 7.9 ms (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). A common prefix matches about one row in three, so the planner can walk updated_at instead. JIT time is in the plan summary when JIT ran.
- A3 against B1: S2 A3 1855 buf / 2.0 ms (removed 1393 est 11562 actual 50 buf 1855 (Index Scan a_x_company)) vs B1 1061 buf / 1.3 ms (removed 1393 est 13247 actual 50 buf 1061 (Index Scan bl_x_company)); S2-KEYSET A3 1425 buf / 2.0 ms (removed 0 est 50 actual 50 buf 1425 (Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan a_x_lead_status)) vs B1 388 buf / 1.0 ms (removed 0 est 50 actual 50 buf 388 (Incremental Sort; Subquery Scan; Index Scan bl_x_company; Sort; Subquery Scan; Index Scan bl_x_lead_status)); S4 A3 191 buf / 0.4 ms (removed 33 est 153005 actual 50 buf 191 (Index Scan a_x_last_name)) vs B1 86 buf / 0.3 ms (removed 33 est 176429 actual 50 buf 86 (Index Scan bl_x_last_name)).
- S7 first-scan rows: S7c common3: A removed 115 est 39182 actual 50 buf 350 (Index Scan a_updated_idx); B removed 115 est 57404 actual 50 buf 170 (Index Scan bl_updated_idx); C removed 115 est 51644 actual 50 buf 1272 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7c common8: A removed 197 est 39182 actual 50 buf 468 (Index Scan a_updated_idx); B removed 197 est 43548 actual 50 buf 253 (Index Scan bl_updated_idx); C removed 197 est 26855 actual 50 buf 1344 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7a common3: A removed 115 est 45345 actual 50 buf 350 (Index Scan a_updated_idx); B removed 115 est 45606 actual 50 buf 170 (Index Scan bl_updated_idx); C removed 115 est 43260 actual 50 buf 1272 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7a common8: A removed 197 est 47406 actual 50 buf 468 (Index Scan a_updated_idx); B removed 197 est 45606 actual 50 buf 253 (Index Scan bl_updated_idx); C removed 197 est 59740 actual 50 buf 1344 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7b common: A removed 76 est 55910 actual 50 buf 310 (Index Scan a_updated_idx); B removed 76 est 65139 actual 50 buf 130 (Index Scan bl_updated_idx); C removed 76 est 57130 actual 50 buf 1234 (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7c rare3: A removed 99803 est 8 actual 592 buf 54450 (Gather Merge planned=2 launched=2; Sort; Seq Scan records); B removed 83136 est 8 actual 592 buf 38468 (Gather Merge planned=2 launched=2; Sort; Seq Scan leads); C removed 99803 est 8 actual 592 buf 34833 (Sort; Gather planned=2 launched=2; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7a rare3: A removed 160 est 20 actual 592 buf 3077 (Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm); B removed 160 est 20 actual 592 buf 755 (Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm); C removed 160 est 20 actual 592 buf 13779 (Sort; Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). S7b selective: A removed 137 est 1019 actual 488 buf 2429 (Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv); B removed 137 est 980 actual 488 buf 629 (Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv); C removed 68 est 599 actual 488 buf 1773 (Gather Merge planned=1 launched=1; Sort; Bitmap Heap Scan records; Bitmap Index Scan c_search_tsv; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey).
- On the common terms A and B have no Sort or Incremental Sort. The first scan's actual_rows is 50, and the rows examined (actual plus removed) are the same order as C. The order by uses the table id column, so the updated_at index supplies both sort keys and the scan stops at the limit.
- S1 on A3 and B1 has no Sort or Incremental Sort. The first scan actual_rows is 50, the same as C.
- S10 source A medians differ by more than 2x on the same plan and the same buffer count: A0 220.6 ms / 109626 buffers / shared_read 45182; A1 260.1 ms / 109626 buffers / shared_read 45181; A2 271.7 ms / 109626 buffers / shared_read 47702; A3 104.7 ms / 109566 buffers / shared_read 43359. Plan: Gather Merge planned=2 launched=2; Sort; Seq Scan records. Gather is in the plan and the launched worker count is the same on every stage in this group, so the spread is not a different number of parallel workers. Equal buffer counts mean the same pages were read. The elapsed-time spread is machine load or OS cache warmth between stages: a stage measured just after a large index build can miss the OS page cache, while a later stage of the same scan hits it. shared_read counts blocks missing from shared_buffers, not physical I/O.
- S10 owner A medians differ by more than 2x on the same plan and the same buffer count: A0 242.0 ms / 109642 buffers / shared_read 41685; A1 266.4 ms / 109642 buffers / shared_read 41685; A2 259.9 ms / 109642 buffers / shared_read 41685; A3 102.4 ms / 109582 buffers / shared_read 41720. Plan: Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records. Gather is in the plan and the launched worker count is the same on every stage in this group, so the spread is not a different number of parallel workers. Equal buffer counts mean the same pages were read. The elapsed-time spread is machine load or OS cache warmth between stages: a stage measured just after a large index build can miss the OS page cache, while a later stage of the same scan hits it. shared_read counts blocks missing from shared_buffers, not physical I/O.
- RLS off used an index that RLS on did not: A S2-KEYSET lost a_x_lead_status (off: Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan a_x_lead_status; on: Incremental Sort; Subquery Scan; Index Scan a_x_company; Sort; Subquery Scan; Index Scan records_pkey); A S2-OFFSET lost a_x_lead_status (off: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; on: Gather Merge planned=2 launched=2; Sort; Seq Scan records); A S3 lost a_x_cf_datetime_1 (off: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1; on: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx); A S5 lost a_x_country (off: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_x_country; on: Gather Merge planned=2 launched=2; Sort; Seq Scan records); A S11 lost a_x_cf_lookup_1 (off: Sort; Index Scan a_x_cf_lookup_1; on: Sort; Gather planned=2 launched=2; Seq Scan records); A S2 count lost a_x_lead_status (off: Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; on: Gather planned=2 launched=2; Seq Scan records); A S7a rare3 lost a_search_trgm (off: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm; on: Index Scan a_updated_idx); A S7a common8 lost a_updated_idx (off: Index Scan a_updated_idx; on: Gather Merge planned=2 launched=2; Sort; Seq Scan records); A S7a rare8 lost a_search_trgm (off: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm; on: Gather Merge planned=2 launched=2; Sort; Seq Scan records); A S7b selective lost a_search_tsv (off: Sort; Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv; on: Gather Merge planned=2 launched=2; Index Scan a_updated_idx); B S7a common8 lost bl_updated_idx (off: Index Scan bl_updated_idx; on: Gather Merge planned=2 launched=2; Sort; Seq Scan leads); B S7a rare8 lost bl_search_trgm (off: Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm; on: Gather Merge planned=2 launched=2; Sort; Seq Scan leads); B S7b selective lost bl_search_tsv (off: Sort; Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv; on: Gather Merge planned=2 launched=2; Index Scan bl_updated_idx). Non-leakproof predicates are applied as filters, so the planner also loses the expression statistics that depend on them.
- WAL per operation for n/a and RLS off stays within 10% after the pending-list flush: S9 insert A A2 n/a 103885 (flush 2164.9 ms) vs rls-off 105323 (flush 1947.7 ms); S9 insert B B1 n/a 54021 (flush 0.0 ms) vs rls-off 54374 (flush 0.0 ms); S9 update1 A A2 n/a 104506 (flush 1899.3 ms) vs rls-off 107508 (flush 1750.5 ms); S9 update1 B B1 n/a 51093 (flush 0.0 ms) vs rls-off 52801 (flush 0.0 ms); S9 update5 A A2 n/a 100505 (flush 1830.8 ms) vs rls-off 104189 (flush 1642.4 ms); S9 update5 B B1 n/a 51428 (flush 0.0 ms) vs rls-off 48312 (flush 0.0 ms).
