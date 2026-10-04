# Record storage benchmark

Client-side timings. Each measured query uses bind parameters. Partial expression indexes are planned with session `plan_cache_mode=force_custom_plan` so a bound `module_id` still matches the index predicate. Other server settings stay at their defaults.

Storage C keeps the same system indexes as A0 on the record header, plus the value indexes named in the scenario. Search indexes are identical on every option. S7a and S7b run with those indexes. Storage-stage writes run without them; `+trgm` and `+tsv` write rows add one search index family on top of A2 or B1.

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
| generate | 32337.93 |
| copy A | 11071.98 |
| copy B | 6706.28 |
| copy C | 79656.03 |
| index A0 | 6570.37 |
| index B0 | 2499.14 |
| index C0 | 71791.04 |
| index A1 | 12686.85 |
| index A2 | 5881.42 |
| index B1 | 3923.28 |
| index trgm | 73362.67 |
| index tsv | 49784.74 |
| rebuild A1 | 12626.93 |
| rebuild A2 | 4628.38 |
| rebuild B1 | 3898.01 |
| rebuild trgm | 70953.38 |
| rebuild tsv | 48804.22 |

## Queries

| scenario | option | stage | median_ms | p95_ms | plan | buffers | shared_read |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | A | A0 | 0.54 | 0.62 | Index Scan a_created_idx | 243 | 52 |
| S2 | A | A0 | 120.40 | 156.02 | Seq Scan records | 258042 | 54669 |
| S2-KEYSET | A | A0 | 339.12 | 359.32 | Subquery Scan; Seq Scan records; Subquery Scan; Seq Scan records | 445202 | 90280 |
| S2-OFFSET | A | A0 | 155.06 | 207.86 | Seq Scan records | 258042 | 45116 |
| S3 | A | A0 | 57.20 | 62.54 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 16345 |
| S4 | A | A0 | 526.29 | 611.07 | Seq Scan records | 925296 | 52682 |
| S5 | A | A0 | 176.67 | 489.86 | Seq Scan records | 197928 | 45113 |
| S11 | A | A0 | 131.53 | 148.33 | Seq Scan records | 196497 | 45115 |
| S2 count | A | A0 | 130.28 | 142.97 | Seq Scan records | 196329 | 45114 |
| S2 capped | A | A0 | 116.92 | 152.27 | Seq Scan records | 170783 | 44950 |
| S4 count | A | A0 | 132.32 | 145.51 | Seq Scan records | 196329 | 45103 |
| S4 capped | A | A0 | 10.07 | 37.92 | Seq Scan records | 8807 | 2303 |
| S8 | A | A0 | 0.40 | 0.83 | Index Scan records_pkey | 4 | 3 |
| S10 source | A | A0 | 269.33 | 350.85 | Seq Scan records | 109626 | 45180 |
| S10 owner | A | A0 | 221.03 | 278.72 | Seq Scan records | 109642 | 41685 |
| S1 | A | A1 | 0.51 | 0.63 | Index Scan a_created_idx | 243 | 75 |
| S2 | A | A1 | 105.14 | 108.11 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 82362 | 14410 |
| S2-KEYSET | A | A1 | 124.64 | 139.47 | Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 91722 | 17663 |
| S2-OFFSET | A | A1 | 112.79 | 115.31 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 82362 | 10131 |
| S3 | A | A1 | 53.76 | 54.48 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 30169 | 17659 |
| S4 | A | A1 | 304.02 | 308.85 | Seq Scan records | 925296 | 51236 |
| S5 | A | A1 | 4.40 | 5.43 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 2615 | 531 |
| S11 | A | A1 | 0.48 | 0.54 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 104 | 13 |
| S2 count | A | A1 | 51.18 | 52.79 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 20769 | 11968 |
| S2 capped | A | A1 | 41.97 | 42.88 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 15982 | 8046 |
| S4 count | A | A1 | 159.63 | 179.75 | Seq Scan records | 196329 | 48633 |
| S4 capped | A | A1 | 11.41 | 38.78 | Seq Scan records | 8826 | 2294 |
| S8 | A | A1 | 0.42 | 1.16 | Index Scan records_pkey | 4 | 3 |
| S10 source | A | A1 | 219.95 | 308.07 | Seq Scan records | 109626 | 45180 |
| S10 owner | A | A1 | 229.98 | 305.68 | Seq Scan records | 109642 | 41685 |
| S1 | A | A2 | 0.57 | 0.61 | Index Scan a_created_idx | 235 | 50 |
| S2 | A | A2 | 86.54 | 109.03 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 13864 |
| S2-KEYSET | A | A2 | 197.34 | 201.95 | Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_company | 139942 | 66961 |
| S2-OFFSET | A | A2 | 97.39 | 100.34 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 16506 |
| S3 | A | A2 | 7.19 | 7.49 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 10479 | 7060 |
| S4 | A | A2 | 1262.96 | 1319.12 | Index Scan a_x_email_opt_out | 950534 | 193362 |
| S5 | A | A2 | 2.77 | 3.04 | Bitmap Heap Scan records; Bitmap Index Scan a_x_country | 1548 | 468 |
| S11 | A | A2 | 0.59 | 0.83 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_lookup_1 | 88 | 15 |
| S2 count | A | A2 | 23.75 | 30.70 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 14287 | 12402 |
| S2 capped | A | A2 | 18.20 | 18.68 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 8847 | 7051 |
| S4 count | A | A2 | 619.91 | 653.39 | Index Scan a_x_email_opt_out | 221687 | 160097 |
| S4 capped | A | A2 | 3.68 | 3.74 | Index Scan a_x_email_opt_out | 12624 | 9149 |
| S8 | A | A2 | 0.43 | 0.84 | Index Scan records_pkey | 4 | 4 |
| S10 source | A | A2 | 220.05 | 275.54 | Seq Scan records | 109626 | 47143 |
| S10 owner | A | A2 | 296.58 | 357.92 | Seq Scan records | 109642 | 41685 |
| S1 | B | B0 | 0.37 | 0.45 | Index Scan bl_created_idx | 55 | 54 |
| S2 | B | B0 | 49.21 | 74.48 | Seq Scan leads | 38492 | 38066 |
| S2-KEYSET | B | B0 | 62.33 | 68.84 | Subquery Scan; Seq Scan leads; Subquery Scan; Index Scan leads_pkey | 41171 | 30160 |
| S2-OFFSET | B | B0 | 67.50 | 86.60 | Seq Scan leads | 38492 | 22382 |
| S3 | B | B0 | 33.56 | 38.59 | Bitmap Heap Scan leads; Bitmap Index Scan bl_owner_idx | 15187 | 10080 |
| S4 | B | B0 | 119.92 | 136.02 | Seq Scan leads | 38492 | 22401 |
| S5 | B | B0 | 68.79 | 85.26 | Seq Scan leads | 38510 | 22377 |
| S11 | B | B0 | 70.80 | 80.31 | Seq Scan leads | 38468 | 22370 |
| S2 count | B | B0 | 58.45 | 64.52 | Seq Scan leads | 38414 | 22381 |
| S2 capped | B | B0 | 76.01 | 79.28 | Seq Scan leads | 31346 | 22143 |
| S4 count | B | B0 | 80.30 | 85.32 | Seq Scan leads | 38372 | 22357 |
| S4 capped | B | B0 | 6.31 | 19.61 | Seq Scan leads | 1821 | 1782 |
| S8 | B | B0 | 0.55 | 0.71 | Index Scan leads_pkey | 4 | 4 |
| S10 source | B | B0 | 54.38 | 73.91 | Seq Scan leads | 38432 | 22575 |
| S10 owner | B | B0 | 51.18 | 57.11 | Seq Scan leads | 38448 | 22386 |
| S1 | B | B1 | 0.45 | 0.61 | Index Scan bl_created_idx | 55 | 25 |
| S2 | B | B1 | 1.00 | 1.15 | Index Scan bl_x_company | 1092 | 211 |
| S2-KEYSET | B | B1 | 1.12 | 1.59 | Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status | 388 | 318 |
| S2-OFFSET | B | B1 | 45.37 | 50.92 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 8472 |
| S3 | B | B1 | 7.51 | 7.70 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 8312 | 5458 |
| S4 | B | B1 | 0.50 | 0.54 | Index Scan bl_x_last_name | 87 | 54 |
| S5 | B | B1 | 1.79 | 1.88 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 581 | 349 |
| S11 | B | B1 | 0.30 | 0.35 | Index Scan bl_x_cf_lookup_1 | 16 | 11 |
| S2 count | B | B1 | 21.07 | 22.15 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 9547 |
| S2 capped | B | B1 | 15.13 | 15.65 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 8434 | 5851 |
| S4 count | B | B1 | 50.16 | 52.44 | Seq Scan leads | 38372 | 22562 |
| S4 capped | B | B1 | 6.07 | 17.03 | Seq Scan leads | 1841 | 1713 |
| S8 | B | B1 | 0.51 | 0.67 | Index Scan leads_pkey | 4 | 4 |
| S10 source | B | B1 | 39.03 | 41.94 | Seq Scan leads | 38432 | 22454 |
| S10 owner | B | B1 | 38.90 | 48.59 | Seq Scan leads | 38448 | 22386 |
| S1 | C | C0 | 4.98 | 5.05 | Index Scan c_created_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1152 | 123 |
| S2 | C | C0 | 321.44 | 1600.16 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 313684 | 42278 |
| S2-KEYSET | C | C0 | 366.58 | 463.46 | Subquery Scan; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Subquery Scan; Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 361441 | 70382 |
| S2-OFFSET | C | C0 | 278.50 | 496.39 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 313684 | 41259 |
| S3 | C | C0 | 38.14 | 42.53 | Index Only Scan c_value_num_idx; Index Only Scan c_value_ts_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 78326 | 5660 |
| S4 | C | C0 | 162.33 | 182.53 | Index Only Scan c_value_text_idx; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 156464 | 20794 |
| S5 | C | C0 | 17.94 | 20.82 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Only Scan c_value_text_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7545 | 1693 |
| S11 | C | C0 | 8.34 | 8.68 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 325 | 35 |
| S2 count | C | C0 | 40.28 | 44.12 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 74113 | 10720 |
| S2 capped | C | C0 | 32.72 | 35.43 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 60174 | 4207 |
| S4 count | C | C0 | 292.06 | 343.22 | Bitmap Heap Scan record_values; Bitmap Index Scan c_value_ts_idx; Index Only Scan c_created_idx | 81056 | 80987 |
| S4 capped | C | C0 | 46.83 | 163.81 | Seq Scan record_values; Index Scan records_pkey | 44407 | 5941 |
| S8 | C | C0 | 0.38 | 0.49 | Index Scan records_pkey; Bitmap Heap Scan record_values; Bitmap Index Scan record_values_pkey | 8 | 3 |
| S10 source | C | C0 | 74.04 | 75.20 | Index Only Scan c_value_text_idx; Index Only Scan c_value_num_idx; Index Only Scan c_created_idx | 136663 | 3131 |
| S10 owner | C | C0 | 83.40 | 97.31 | Index Only Scan c_value_num_idx; Index Only Scan c_value_text_idx; Seq Scan records | 158169 | 10411 |
| S7c common3 | A | no-search-index | 22.53 | 23.70 | Index Scan a_updated_idx | 11290 | 6088 |
| S7c rare3 | A | no-search-index | 55.26 | 57.72 | Index Scan a_updated_idx | 16697 | 8215 |
| S7c common8 | A | no-search-index | 22.36 | 26.31 | Index Scan a_updated_idx | 10890 | 199 |
| S7c rare8 | A | no-search-index | 274.13 | 278.32 | Seq Scan records | 53928 | 38299 |
| S7c common3 | B | no-search-index | 18.47 | 18.81 | Index Scan bl_updated_idx | 6106 | 5590 |
| S7c rare3 | B | no-search-index | 237.40 | 268.90 | Seq Scan leads | 38468 | 32842 |
| S7c common8 | B | no-search-index | 18.59 | 18.83 | Index Scan bl_updated_idx | 6102 | 0 |
| S7c rare8 | B | no-search-index | 272.81 | 425.96 | Seq Scan leads | 38468 | 22690 |
| S7c common3 | C | no-search-index | 6.25 | 7.17 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1272 | 261 |
| S7c rare3 | C | no-search-index | 53.97 | 59.23 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 17455 | 10650 |
| S7c common8 | C | no-search-index | 6.37 | 7.60 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1344 | 62 |
| S7c rare8 | C | no-search-index | 65.13 | 74.36 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 21128 | 1414 |
| S7a common3 | A | trgm | 22.60 | 24.01 | Index Scan a_updated_idx | 11290 | 5886 |
| S7a rare3 | A | trgm | 4.79 | 4.84 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 3077 | 735 |
| S7a common8 | A | trgm | 22.26 | 22.97 | Index Scan a_updated_idx | 10890 | 111 |
| S7a rare8 | A | trgm | 4.30 | 4.39 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 2455 | 638 |
| S7a common3 | B | trgm | 18.57 | 20.08 | Index Scan bl_updated_idx | 6106 | 5601 |
| S7a rare3 | B | trgm | 3.19 | 3.26 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 755 | 638 |
| S7a common8 | B | trgm | 18.70 | 19.75 | Index Scan bl_updated_idx | 6102 | 0 |
| S7a rare8 | B | trgm | 71.53 | 74.00 | Index Scan bl_updated_idx | 20934 | 9974 |
| S7a common3 | C | trgm | 6.55 | 6.70 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1272 | 261 |
| S7a rare3 | C | trgm | 55.46 | 59.07 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 17455 | 10650 |
| S7a common8 | C | trgm | 6.28 | 6.40 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1344 | 62 |
| S7a rare8 | C | trgm | 8.70 | 9.24 | Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 11370 | 1600 |
| S7b selective | A | tsv | 2.37 | 2.47 | Bitmap Heap Scan records; Bitmap Index Scan a_search_tsv | 2429 | 674 |
| S7b common | A | tsv | 260.08 | 267.59 | Index Scan a_updated_idx | 13767 | 5891 |
| S7b selective | B | tsv | 1.21 | 2.10 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_tsv | 629 | 624 |
| S7b common | B | tsv | 253.65 | 256.56 | Index Scan bl_updated_idx | 6099 | 5508 |
| S7b selective | C | tsv | 10.68 | 11.20 | Bitmap Heap Scan records; Bitmap Index Scan c_search_tsv; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1773 | 779 |
| S7b common | C | tsv | 11.79 | 12.00 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1234 | 211 |
| S1 | A | rls-off | 0.88 | 1.70 | Index Scan a_created_idx | 267 | 14 |
| S2 | A | rls-off | 86.89 | 92.46 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75884 | 15967 |
| S2-KEYSET | A | rls-off | 191.60 | 196.02 | Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_company | 139945 | 66982 |
| S2-OFFSET | A | rls-off | 102.23 | 109.56 | Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status | 75880 | 16506 |
| S7a common3 | A | rls-off | 23.72 | 24.39 | Index Scan a_updated_idx | 11290 | 4836 |
| S7a rare3 | A | rls-off | 5.09 | 5.83 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 3077 | 620 |
| S7a common8 | A | rls-off | 23.53 | 24.27 | Index Scan a_updated_idx | 10890 | 87 |
| S7a rare8 | A | rls-off | 102.79 | 113.38 | Index Scan a_updated_idx | 21168 | 11193 |
| S8 | A | rls-off | 0.65 | 1.39 | Index Scan records_pkey | 4 | 3 |
| S1 | B | rls-off | 0.70 | 0.79 | Index Scan bl_created_idx | 55 | 54 |
| S2 | B | rls-off | 1.28 | 1.55 | Index Scan bl_x_company | 1092 | 408 |
| S2-KEYSET | B | rls-off | 1.44 | 3.93 | Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status | 388 | 384 |
| S2-OFFSET | B | rls-off | 47.27 | 53.36 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 12549 |
| S7a common3 | B | rls-off | 19.06 | 21.34 | Index Scan bl_updated_idx | 6106 | 3704 |
| S7a rare3 | B | rls-off | 55.37 | 57.90 | Index Scan bl_updated_idx | 16481 | 6106 |
| S7a common8 | B | rls-off | 19.59 | 21.02 | Index Scan bl_updated_idx | 6102 | 0 |
| S7a rare8 | B | rls-off | 3.42 | 3.54 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 655 | 390 |
| S8 | B | rls-off | 0.81 | 1.04 | Index Scan leads_pkey | 4 | 3 |
| S1 | A | rls-on | 0.87 | 2.72 | Index Scan a_created_idx | 235 | 75 |
| S2 | A | rls-on | 1.77 | 2.02 | Index Scan a_x_company | 1889 | 566 |
| S2-KEYSET | A | rls-on | 271.56 | 303.62 | Subquery Scan; Index Scan a_x_company; Subquery Scan; Seq Scan records | 338206 | 84889 |
| S2-OFFSET | A | rls-on | 137.90 | 160.68 | Seq Scan records | 229181 | 43393 |
| S7a common3 | A | rls-on | 22.70 | 23.44 | Index Scan a_updated_idx | 11290 | 5502 |
| S7a rare3 | A | rls-on | 51.26 | 57.99 | Index Scan a_updated_idx | 16697 | 8456 |
| S7a common8 | A | rls-on | 307.41 | 410.12 | Seq Scan records | 206120 | 45005 |
| S7a rare8 | A | rls-on | 232.94 | 275.84 | Seq Scan records | 53894 | 41662 |
| S8 | A | rls-on | 0.75 | 2.16 | Index Scan records_pkey | 4 | 3 |
| S1 | B | rls-on | 0.86 | 1.10 | Index Scan bl_created_idx | 55 | 54 |
| S2 | B | rls-on | 1.37 | 1.67 | Index Scan bl_x_company | 1092 | 408 |
| S2-KEYSET | B | rls-on | 1.52 | 2.19 | Subquery Scan; Index Scan bl_x_company; Subquery Scan; Index Scan bl_x_lead_status | 388 | 384 |
| S2-OFFSET | B | rls-on | 46.09 | 51.41 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 13656 | 12549 |
| S7a common3 | B | rls-on | 18.52 | 19.23 | Index Scan bl_updated_idx | 6106 | 3704 |
| S7a rare3 | B | rls-on | 52.47 | 57.08 | Index Scan bl_updated_idx | 16481 | 6100 |
| S7a common8 | B | rls-on | 218.94 | 314.23 | Seq Scan leads | 38468 | 22581 |
| S7a rare8 | B | rls-on | 223.07 | 245.99 | Seq Scan leads | 38468 | 22381 |
| S8 | B | rls-on | 0.88 | 1.06 | Index Scan leads_pkey | 4 | 4 |

## Writes

| scenario | option | stage | rls | ops | total_ms | median_ms | p95_ms | wal_bytes_per_op |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S9 insert | A | A0 | n/a | 2000 | 2145.80 | 0.96 | 1.86 | 17405 |
| S9 update1 | A | A0 | n/a | 2000 | 1648.85 | 0.79 | 1.11 | 12821 |
| S9 update5 | A | A0 | n/a | 2000 | 1482.97 | 0.70 | 1.08 | 13180 |
| S9 insert | A | A1 | n/a | 2000 | 1430.86 | 0.66 | 1.04 | 17156 |
| S9 update1 | A | A1 | n/a | 2000 | 1524.19 | 0.72 | 1.12 | 15848 |
| S9 update5 | A | A1 | n/a | 2000 | 1641.39 | 0.79 | 1.09 | 13900 |
| S9 insert | A | A2 | n/a | 2000 | 5598.07 | 1.18 | 1.88 | 127795 |
| S9 update1 | A | A2 | n/a | 2000 | 2736.86 | 1.21 | 2.12 | 55357 |
| S9 update5 | A | A2 | n/a | 2000 | 2210.54 | 1.06 | 1.42 | 50926 |
| S9 insert | B | B0 | n/a | 2000 | 2182.04 | 0.98 | 1.76 | 15569 |
| S9 update1 | B | B0 | n/a | 2000 | 1759.18 | 0.82 | 1.17 | 10949 |
| S9 update5 | B | B0 | n/a | 2000 | 1391.59 | 0.67 | 1.03 | 11151 |
| S9 insert | B | B1 | n/a | 2000 | 1957.50 | 0.97 | 1.25 | 54021 |
| S9 update1 | B | B1 | n/a | 2000 | 2320.40 | 1.13 | 1.47 | 51093 |
| S9 update5 | B | B1 | n/a | 2000 | 2236.67 | 1.06 | 1.38 | 46745 |
| S9 insert | C | C0 | n/a | 2000 | 35338.30 | 16.74 | 31.46 | 487448 |
| S9 update1 | C | C0 | n/a | 2000 | 3312.78 | 1.52 | 2.54 | 28372 |
| S9 update5 | C | C0 | n/a | 2000 | 3879.16 | 1.69 | 3.23 | 59857 |
| S9 insert | A | A2 | off | 2000 | 2262.89 | 1.08 | 1.48 | 57287 |
| S9 update1 | A | A2 | off | 2000 | 5820.89 | 1.20 | 1.53 | 128825 |
| S9 update5 | A | A2 | off | 2000 | 4876.36 | 1.91 | 4.33 | 52281 |
| S9 insert | B | B1 | off | 2000 | 2608.29 | 1.10 | 2.59 | 54387 |
| S9 update1 | B | B1 | off | 2000 | 4266.78 | 1.67 | 3.96 | 52804 |
| S9 update5 | B | B1 | off | 2000 | 2450.18 | 1.17 | 1.48 | 48303 |
| S9 insert | A | A2 | on | 2000 | 2301.30 | 1.06 | 1.41 | 58426 |
| S9 update1 | A | A2 | on | 2000 | 6014.07 | 1.34 | 1.75 | 131394 |
| S9 update5 | A | A2 | on | 2000 | 2495.08 | 1.21 | 1.58 | 53830 |
| S9 insert | B | B1 | on | 2000 | 2134.51 | 1.04 | 1.32 | 55852 |
| S9 update1 | B | B1 | on | 2000 | 2851.61 | 1.27 | 1.90 | 61640 |
| S9 update5 | B | B1 | on | 2000 | 2589.34 | 1.22 | 1.73 | 54804 |
| S9 insert | A | A2+trgm | n/a | 2000 | 5281.00 | 1.10 | 1.50 | 133000 |
| S9 update1 | A | A2+trgm | n/a | 2000 | 5618.37 | 1.33 | 2.16 | 131031 |
| S9 update5 | A | A2+trgm | n/a | 2000 | 6170.77 | 1.34 | 1.89 | 116012 |
| S9 insert | B | B1+trgm | n/a | 2000 | 5854.97 | 1.27 | 3.31 | 109164 |
| S9 update1 | B | B1+trgm | n/a | 2000 | 7657.63 | 1.63 | 5.12 | 110407 |
| S9 update5 | B | B1+trgm | n/a | 2000 | 9629.89 | 1.80 | 5.98 | 102406 |
| S9 insert | A | A2+tsv | n/a | 2000 | 5707.96 | 1.08 | 1.60 | 135564 |
| S9 update1 | A | A2+tsv | n/a | 2000 | 3718.27 | 1.25 | 1.65 | 85438 |
| S9 update5 | A | A2+tsv | n/a | 2000 | 3592.46 | 1.23 | 1.59 | 78654 |
| S9 insert | B | B1+tsv | n/a | 2000 | 2324.54 | 1.13 | 1.57 | 58717 |
| S9 update1 | B | B1+tsv | n/a | 2000 | 3821.78 | 1.25 | 1.59 | 79815 |
| S9 update5 | B | B1+tsv | n/a | 2000 | 3621.04 | 1.25 | 1.57 | 73630 |

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
| trgm | bench_a | a_search_trgm | index | 232783872 |
| trgm | bench_b | bc_search_trgm | index | 7249920 |
| trgm | bench_b | bl_search_trgm | index | 221429760 |
| trgm | bench_c | c_search_trgm | index | 208420864 |
| tsv | bench_a | a_search_tsv | index | 154583040 |
| tsv | bench_b | bc_search_tsv | index | 7626752 |
| tsv | bench_b | bl_search_tsv | index | 148889600 |
| tsv | bench_c | c_search_tsv | index | 146489344 |

## Alter on the typed leads table

| operation | ms | rows |
| --- | --- | --- |
| add column (no default) | 0.73 | 250000 |
| add column (constant default) | 2.63 | 250000 |
| create index concurrently | 583.62 | 250000 |

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

## Notes

- S2 lead_status equality matches about 6.7% of non-deleted org A leads. The field is optional (about 40% empty), so one filled value is about one ninth of the filled rows, not 11% of the table. S4 email_opt_out = false matches about 90.1%.
- Buffers are the root plan node's shared hit blocks plus shared read blocks. Child nodes already roll into that total.
- A2 equality predicates use the expression-index form. A0 and A1 keep jsonb containment.
- S2 keyset seeks with a row comparison on (sort expression, id). Rows with a null sort key are a second branch, union all, then ordered outside the limit. A null cursor continues with sort expression is null and id greater than the cursor.
- Storage-stage writes run without search indexes. Each stage, write kind, and RLS setting updates its own record range. A checkpoint runs before each batch. WAL per operation is the batch LSN delta divided by the operation count. +trgm and +tsv rows are the same writes with one search index family added on A2 and B1.
- S7b measures two prefixes: zzrare:* (prefix of the rare 8-character token) and alpha:* (about one row in three). The plan summary appends JIT total time when JIT ran.
- Update writes rebuild the record's search text from the stored searchable fields with the changed values applied. Search maintenance is part of the write, not a constant placeholder.
- S7b did not use the tsvector GIN for: A S7b common median 260.1 ms (Index Scan a_updated_idx); B S7b common median 253.7 ms (Index Scan bl_updated_idx); C S7b common median 11.8 ms (Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey). A common prefix matches about one row in three, so the planner can walk updated_at instead. A and B heap tuples are wider than C's header row, so the same plan costs more there. JIT time is in the plan summary when JIT ran.
- S2 keyset on A A2 took 197.3 ms and 139942 buffers (first page 86.5 ms / 75880 buffers; offset 5000 97.4 ms / 75880 buffers). Plan: Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_lead_status; Subquery Scan; Bitmap Heap Scan records; Bitmap Index Scan a_x_company.
- S2 keyset on A rls-on took 271.6 ms and 338206 buffers (first page 1.8 ms / 1889 buffers; offset 5000 137.9 ms / 229181 buffers). Plan: Subquery Scan; Index Scan a_x_company; Subquery Scan; Seq Scan records.
- S4 on A2 used Index Scan a_x_email_opt_out (1263.0 ms, 950534 buffers) while B1 used Index Scan bl_x_last_name (0.5 ms, 87 buffers). Both filters are boolean equality with last_name order. The expression-index plan walks the low-selectivity boolean index; the typed plan walks last_name and stops after 50 rows.
