# Record storage benchmark

Client-side timings. Each measured query uses bind parameters. Partial expression indexes are planned with session `plan_cache_mode=force_custom_plan` so a bound `module_id` still matches the index predicate. Other server settings stay at their defaults.

Storage C keeps the same system indexes as A0 on the record header, plus the value indexes named in the scenario. Search indexes (trigram and `simple` tsvector) are identical on every option and stay in place for the write scenarios.

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

## Load

| phase | ms |
| --- | --- |
| generate | 56059.68 |
| copy A | 22353.18 |
| copy B | 10096.52 |
| copy C | 94371.70 |
| index A0 | 2134.19 |
| index B0 | 4298.26 |
| index C0 | 83487.70 |
| index A1 | 14058.06 |
| index A2 | 7701.77 |
| index B1 | 4421.19 |
| index trgm | 102818.87 |
| index tsv | 59761.12 |
| rebuild A1 | 17203.94 |
| rebuild A2 | 5950.23 |
| rebuild B1 | 5251.54 |

## Queries

| scenario | option | stage | median_ms | p95_ms | plan | buffers | shared_read |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | A | A0 | 0.60 | 0.69 | Index Scan a_created_idx | 729 | 159 |
| S2 | A | A0 | 110.79 | 163.34 | Seq Scan records | 1032048 | 217348 |
| S2-KEYSET | A | A0 | 152.24 | 179.21 | Seq Scan records | 1016580 | 180436 |
| S2-OFFSET | A | A0 | 163.64 | 227.36 | Seq Scan records | 1032048 | 180436 |
| S3 | A | A0 | 75.53 | 89.06 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 90527 | 49055 |
| S4 | A | A0 | 397.55 | 427.50 | Seq Scan records | 3701064 | 209894 |
| S5 | A | A0 | 142.60 | 443.95 | Seq Scan records | 791712 | 180452 |
| S11 | A | A0 | 140.39 | 169.62 | Seq Scan records | 785892 | 180457 |
| S2 count | A | A0 | 168.52 | 193.86 | Seq Scan records | 785316 | 180456 |
| S2 capped | A | A0 | 134.56 | 215.50 | Seq Scan records | 679816 | 179544 |
| S4 count | A | A0 | 180.84 | 208.76 | Seq Scan records | 785316 | 180412 |
| S4 capped | A | A0 | 11.65 | 14.22 | Seq Scan records | 27336 | 7005 |
| S8 | A | A0 | 0.37 | 0.87 | Index Scan records_pkey | 4 | 4 |
| S10 source | A | A0 | 251.30 | 344.37 | Seq Scan records | 352173 | 180714 |
| S10 owner | A | A0 | 298.17 | 391.92 | Seq Scan records | 461863 | 208421 |
| S1 | A | A1 | 0.52 | 0.73 | Index Scan a_created_idx | 729 | 225 |
| S2 | A | A1 | 104.90 | 115.17 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 247466 | 43606 |
| S2-KEYSET | A | A1 | 98.97 | 106.32 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 235865 | 39519 |
| S2-OFFSET | A | A1 | 117.06 | 146.68 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 247466 | 39513 |
| S3 | A | A1 | 54.54 | 55.96 | Bitmap Heap Scan records; Bitmap Index Scan a_owner_idx | 90527 | 52856 |
| S4 | A | A1 | 520.91 | 1235.02 | Seq Scan records | 3701064 | 204723 |
| S5 | A | A1 | 10.87 | 25.49 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 7849 | 1590 |
| S11 | A | A1 | 0.98 | 1.75 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 316 | 47 |
| S2 count | A | A1 | 116.76 | 361.62 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 41918 | 24192 |
| S2 capped | A | A1 | 120.61 | 930.59 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 48326 | 25627 |
| S4 count | A | A1 | 152.40 | 211.28 | Seq Scan records | 785316 | 194704 |
| S4 capped | A | A1 | 10.01 | 37.81 | Seq Scan records | 26532 | 6906 |
| S8 | A | A1 | 0.43 | 0.99 | Index Scan records_pkey | 4 | 3 |
| S10 source | A | A1 | 268.57 | 358.88 | Seq Scan records | 352173 | 180714 |
| S10 owner | A | A1 | 375.16 | 530.96 | Seq Scan records | 461863 | 208421 |
| S1 | A | A2 | 0.75 | 0.92 | Index Scan a_created_idx | 705 | 162 |
| S2 | A | A2 | 2.55 | 3.11 | Index Scan a_x_company | 7071 | 801 |
| S2-KEYSET | A | A2 | 215.88 | 286.98 | Index Scan a_x_company | 424284 | 117306 |
| S2-OFFSET | A | A2 | 137.18 | 154.00 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 247466 | 34287 |
| S3 | A | A2 | 7.84 | 8.22 | Bitmap Heap Scan records; Bitmap Index Scan a_x_cf_datetime_1 | 31515 | 20193 |
| S4 | A | A2 | 0.74 | 0.80 | Index Scan a_x_last_name | 630 | 234 |
| S5 | A | A2 | 4.65 | 5.07 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 7849 | 1626 |
| S11 | A | A2 | 0.57 | 0.65 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin | 316 | 44 |
| S2 count | A | A2 | 53.37 | 75.56 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 41918 | 24058 |
| S2 capped | A | A2 | 50.06 | 69.67 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 48326 | 26538 |
| S4 count | A | A2 | 167.57 | 228.17 | Seq Scan records | 785316 | 193504 |
| S4 capped | A | A2 | 11.66 | 42.31 | Seq Scan records | 26583 | 6909 |
| S8 | A | A2 | 0.46 | 0.79 | Index Scan records_pkey | 4 | 3 |
| S10 source | A | A2 | 234.98 | 360.96 | Seq Scan records | 352173 | 180774 |
| S10 owner | A | A2 | 328.12 | 417.53 | Seq Scan records | 461863 | 208421 |
| S1 | B | B0 | 0.41 | 1.06 | Index Scan bl_created_idx | 165 | 162 |
| S2 | B | B0 | 50.06 | 103.70 | Seq Scan leads | 153848 | 152264 |
| S2-KEYSET | B | B0 | 85.81 | 115.51 | Seq Scan leads | 153848 | 112660 |
| S2-OFFSET | B | B0 | 108.04 | 164.80 | Seq Scan leads | 153848 | 89448 |
| S3 | B | B0 | 52.54 | 56.57 | Bitmap Heap Scan leads; Bitmap Index Scan bl_owner_idx | 45581 | 30350 |
| S4 | B | B0 | 148.20 | 178.94 | Seq Scan leads | 153848 | 89591 |
| S5 | B | B0 | 90.77 | 153.63 | Seq Scan leads | 153944 | 89500 |
| S11 | B | B0 | 135.31 | 164.28 | Seq Scan leads | 153776 | 89476 |
| S2 count | B | B0 | 84.88 | 150.47 | Seq Scan leads | 153656 | 89524 |
| S2 capped | B | B0 | 75.39 | 78.65 | Seq Scan leads | 94038 | 66429 |
| S4 count | B | B0 | 87.76 | 112.04 | Seq Scan leads | 153488 | 89428 |
| S4 capped | B | B0 | 6.04 | 18.41 | Seq Scan leads | 5469 | 5235 |
| S8 | B | B0 | 0.50 | 0.66 | Index Scan leads_pkey | 4 | 4 |
| S10 source | B | B0 | 64.50 | 86.91 | Seq Scan leads | 192040 | 112264 |
| S10 owner | B | B0 | 63.66 | 69.48 | Seq Scan leads | 230536 | 134316 |
| S1 | B | B1 | 0.46 | 0.60 | Index Scan bl_created_idx | 165 | 75 |
| S2 | B | B1 | 1.02 | 1.23 | Index Scan bl_x_company | 3276 | 633 |
| S2-KEYSET | B | B1 | 118.75 | 142.24 | Index Scan bl_x_company | 166704 | 68898 |
| S2-OFFSET | B | B1 | 47.71 | 50.82 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 41069 | 28481 |
| S3 | B | B1 | 8.62 | 9.01 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_cf_datetime_1 | 24984 | 16422 |
| S4 | B | B1 | 0.47 | 0.90 | Index Scan bl_x_last_name | 261 | 162 |
| S5 | B | B1 | 1.88 | 2.75 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_country | 1749 | 1053 |
| S11 | B | B1 | 0.51 | 0.73 | Index Scan bl_x_cf_lookup_1 | 48 | 33 |
| S2 count | B | B1 | 22.91 | 27.15 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 27413 | 19195 |
| S2 capped | B | B1 | 15.50 | 17.51 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 25403 | 17653 |
| S4 count | B | B1 | 63.17 | 94.53 | Seq Scan leads | 153488 | 90248 |
| S4 capped | B | B1 | 6.84 | 19.00 | Seq Scan leads | 5433 | 5091 |
| S8 | B | B1 | 0.52 | 0.65 | Index Scan leads_pkey | 4 | 3 |
| S10 source | B | B1 | 68.07 | 113.48 | Seq Scan leads | 192040 | 112932 |
| S10 owner | B | B1 | 64.73 | 82.96 | Seq Scan leads | 230536 | 134316 |
| S1 | C | C0 | 5.00 | 5.08 | Index Scan c_created_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 6418 | 926 |
| S2 | C | C0 | 348.91 | 1579.85 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 2094109 | 338450 |
| S2-KEYSET | C | C0 | 220.45 | 373.85 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1694291 | 325275 |
| S2-OFFSET | C | C0 | 259.70 | 283.77 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 2094109 | 331585 |
| S3 | C | C0 | 39.03 | 41.69 | Index Only Scan c_value_num_idx; Index Only Scan c_value_ts_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 745244 | 51222 |
| S4 | C | C0 | 160.13 | 293.32 | Index Only Scan c_value_text_idx; Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 1736870 | 246382 |
| S5 | C | C0 | 17.21 | 23.08 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Only Scan c_value_text_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 73688 | 17894 |
| S11 | C | C0 | 8.42 | 9.25 | Index Only Scan c_value_text_idx; Index Scan records_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 2322 | 326 |
| S2 count | C | C0 | 41.47 | 48.17 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 222339 | 32163 |
| S2 capped | C | C0 | 33.09 | 35.15 | Index Only Scan c_value_text_idx; Index Scan records_pkey | 240696 | 16832 |
| S4 count | C | C0 | 458.63 | 912.13 | Bitmap Heap Scan record_values; Bitmap Index Scan c_value_ts_idx; Index Only Scan c_updated_idx | 409217 | 408840 |
| S4 capped | C | C0 | 48.04 | 168.77 | Seq Scan record_values; Index Scan records_pkey | 218452 | 26122 |
| S8 | C | C0 | 0.39 | 0.57 | Index Scan records_pkey; Bitmap Heap Scan record_values; Bitmap Index Scan record_values_pkey | 19 | 8 |
| S10 source | C | C0 | 75.04 | 79.41 | Index Only Scan c_value_text_idx; Index Only Scan c_value_num_idx; Index Only Scan c_created_idx | 683592 | 16403 |
| S10 owner | C | C0 | 84.51 | 329.27 | Index Only Scan c_value_num_idx; Index Only Scan c_value_text_idx; Seq Scan records | 993022 | 83470 |
| S7c common3 | A | no-search-index | 24.45 | 27.68 | Index Scan a_updated_idx | 33870 | 18264 |
| S7c rare3 | A | no-search-index | 515.52 | 739.43 | Seq Scan records | 217704 | 185758 |
| S7c common8 | A | no-search-index | 23.61 | 24.52 | Index Scan a_updated_idx | 32670 | 564 |
| S7c rare8 | A | no-search-index | 455.58 | 782.82 | Seq Scan records | 215616 | 147556 |
| S7c common3 | B | no-search-index | 21.57 | 23.76 | Index Scan bl_updated_idx | 18318 | 16770 |
| S7c rare3 | B | no-search-index | 51.65 | 58.09 | Index Scan bl_updated_idx | 49443 | 22731 |
| S7c common8 | B | no-search-index | 18.89 | 20.29 | Index Scan bl_updated_idx | 18306 | 0 |
| S7c rare8 | B | no-search-index | 392.42 | 577.79 | Seq Scan leads | 153776 | 101444 |
| S7c common3 | C | no-search-index | 7.27 | 7.47 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7367 | 2032 |
| S7c rare3 | C | no-search-index | 355.79 | 411.32 | Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 316397 | 231329 |
| S7c common8 | C | no-search-index | 6.61 | 7.88 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7962 | 841 |
| S7c rare8 | C | no-search-index | 286.44 | 307.02 | Seq Scan records; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 299069 | 124905 |
| S7a common3 | A | trgm | 23.46 | 24.85 | Index Scan a_updated_idx | 33870 | 17607 |
| S7a rare3 | A | trgm | 4.79 | 4.91 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 9234 | 2234 |
| S7a common8 | A | trgm | 23.12 | 24.57 | Index Scan a_updated_idx | 32670 | 357 |
| S7a rare8 | A | trgm | 4.36 | 4.66 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 7395 | 1897 |
| S7a common3 | B | trgm | 19.80 | 22.43 | Index Scan bl_updated_idx | 18318 | 16800 |
| S7a rare3 | B | trgm | 3.46 | 4.02 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 2268 | 1916 |
| S7a common8 | B | trgm | 19.09 | 23.71 | Index Scan bl_updated_idx | 18306 | 0 |
| S7a rare8 | B | trgm | 3.09 | 3.28 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 1995 | 1683 |
| S7a common3 | C | trgm | 6.06 | 6.29 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7367 | 2032 |
| S7a rare3 | C | trgm | 9.79 | 11.11 | Bitmap Heap Scan records; Bitmap Index Scan c_search_trgm; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 90789 | 19675 |
| S7a common8 | C | trgm | 6.96 | 7.12 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7962 | 1089 |
| S7a rare8 | C | trgm | 73.89 | 85.10 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 166203 | 103427 |
| S7b prefix | A | tsv | 261.46 | 309.48 | Index Scan a_updated_idx | 41301 | 17799 |
| S7b prefix | B | tsv | 256.88 | 282.74 | Index Scan bl_updated_idx | 18297 | 16752 |
| S7b prefix | C | tsv | 11.88 | 12.83 | Index Scan c_updated_idx; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey; Index Scan record_values_pkey | 7055 | 1655 |
| S1 | A | rls-off | 0.90 | 0.97 | Index Scan a_created_idx | 792 | 28 |
| S2 | A | rls-off | 2.48 | 2.92 | Index Scan a_x_company | 7085 | 1634 |
| S2-KEYSET | A | rls-off | 209.66 | 230.66 | Index Scan a_x_company | 424284 | 124338 |
| S2-OFFSET | A | rls-off | 172.79 | 424.66 | Bitmap Heap Scan records; Bitmap Index Scan a_data_gin; Bitmap Index Scan a_owner_idx | 247466 | 34287 |
| S7a common3 | A | rls-off | 68.75 | 192.70 | Index Scan a_updated_idx | 33870 | 13482 |
| S7a rare3 | A | rls-off | 16.34 | 28.99 | Bitmap Heap Scan records; Bitmap Index Scan a_search_trgm | 9234 | 1883 |
| S7a common8 | A | rls-off | 27.25 | 77.58 | Index Scan a_updated_idx | 32670 | 228 |
| S7a rare8 | A | rls-off | 145.31 | 218.81 | Index Scan a_updated_idx | 63504 | 32871 |
| S8 | A | rls-off | 0.78 | 1.08 | Index Scan records_pkey | 4 | 3 |
| S1 | B | rls-off | 0.85 | 1.25 | Index Scan bl_created_idx | 165 | 162 |
| S2 | B | rls-off | 1.41 | 1.79 | Index Scan bl_x_company | 3276 | 1224 |
| S2-KEYSET | B | rls-off | 119.50 | 203.46 | Index Scan bl_x_company | 166704 | 83157 |
| S2-OFFSET | B | rls-off | 47.41 | 63.85 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 41069 | 28610 |
| S7a common3 | B | rls-off | 19.41 | 20.66 | Index Scan bl_updated_idx | 18318 | 11112 |
| S7a rare3 | B | rls-off | 53.23 | 58.62 | Index Scan bl_updated_idx | 49443 | 18315 |
| S7a common8 | B | rls-off | 20.23 | 21.02 | Index Scan bl_updated_idx | 18306 | 0 |
| S7a rare8 | B | rls-off | 3.38 | 3.46 | Bitmap Heap Scan leads; Bitmap Index Scan bl_search_trgm | 1995 | 1195 |
| S8 | B | rls-off | 0.86 | 1.02 | Index Scan leads_pkey | 4 | 3 |
| S1 | A | rls-on | 0.89 | 0.96 | Index Scan a_created_idx | 760 | 279 |
| S2 | A | rls-on | 1.79 | 2.03 | Index Scan a_x_company | 7220 | 2264 |
| S2-KEYSET | A | rls-on | 186.86 | 224.94 | Index Scan a_x_company | 488300 | 160840 |
| S2-OFFSET | A | rls-on | 162.68 | 251.69 | Seq Scan records | 1084102 | 237778 |
| S7a common3 | A | rls-on | 23.26 | 29.82 | Index Scan a_updated_idx | 39976 | 19164 |
| S7a rare3 | A | rls-on | 57.27 | 60.37 | Index Scan a_updated_idx | 66572 | 33551 |
| S7a common8 | A | rls-on | 455.47 | 1425.51 | Seq Scan records | 876336 | 219519 |
| S7a rare8 | A | rls-on | 355.66 | 493.50 | Seq Scan records | 267432 | 208279 |
| S8 | A | rls-on | 0.99 | 1.28 | Index Scan records_pkey | 4 | 4 |
| S1 | B | rls-on | 1.08 | 1.26 | Index Scan bl_created_idx | 220 | 216 |
| S2 | B | rls-on | 1.53 | 1.78 | Index Scan bl_x_company | 4368 | 1632 |
| S2-KEYSET | B | rls-on | 126.32 | 146.21 | Index Scan bl_x_company | 222272 | 110868 |
| S2-OFFSET | B | rls-on | 46.30 | 49.73 | Bitmap Heap Scan leads; Bitmap Index Scan bl_x_lead_status | 54725 | 38137 |
| S7a common3 | B | rls-on | 19.92 | 22.52 | Index Scan bl_updated_idx | 24424 | 14812 |
| S7a rare3 | B | rls-on | 54.81 | 64.86 | Index Scan bl_updated_idx | 65924 | 24432 |
| S7a common8 | B | rls-on | 268.71 | 338.67 | Seq Scan leads | 192148 | 112883 |
| S7a rare8 | B | rls-on | 320.58 | 688.00 | Seq Scan leads | 192148 | 111905 |
| S8 | B | rls-on | 1.15 | 1.74 | Index Scan leads_pkey | 4 | 4 |

## Writes

| scenario | option | stage | rls | ops | total_ms | median_ms | p95_ms | wal_bytes_per_op |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S9 insert | A | A0 | n/a | 2000 | 10198.16 | 1.36 | 2.47 | 103264 |
| S9 update1 | A | A0 | n/a | 2000 | 1670.44 | 0.76 | 1.48 | 8948 |
| S9 update5 | A | A0 | n/a | 2000 | 1481.22 | 0.67 | 1.11 | 5786 |
| S9 insert | A | A1 | n/a | 2000 | 10606.70 | 1.23 | 3.03 | 119636 |
| S9 update1 | A | A1 | n/a | 2000 | 2087.58 | 0.95 | 1.82 | 15989 |
| S9 update5 | A | A1 | n/a | 2000 | 1355.66 | 0.58 | 1.01 | 6501 |
| S9 insert | A | A2 | n/a | 2000 | 19383.76 | 2.34 | 16.67 | 199581 |
| S9 update1 | A | A2 | n/a | 2000 | 3227.79 | 1.30 | 3.19 | 37940 |
| S9 update5 | A | A2 | n/a | 2000 | 1796.48 | 0.81 | 1.43 | 5153 |
| S9 insert | B | B0 | n/a | 2000 | 28273.79 | 2.50 | 16.80 | 90019 |
| S9 update1 | B | B0 | n/a | 2000 | 5950.64 | 1.69 | 8.16 | 6128 |
| S9 update5 | B | B0 | n/a | 2000 | 2608.79 | 0.62 | 4.43 | 3031 |
| S9 insert | B | B1 | n/a | 2000 | 13577.91 | 2.33 | 5.32 | 135880 |
| S9 update1 | B | B1 | n/a | 2000 | 2318.40 | 1.03 | 2.08 | 10965 |
| S9 update5 | B | B1 | n/a | 2000 | 2533.76 | 0.83 | 2.24 | 4256 |
| S9 insert | C | C0 | n/a | 2000 | 86676.37 | 26.32 | 89.93 | 704218 |
| S9 update1 | C | C0 | n/a | 2000 | 4788.68 | 1.81 | 4.11 | 26206 |
| S9 update5 | C | C0 | n/a | 2000 | 5033.32 | 1.66 | 5.35 | 29787 |
| S9 insert | A | A2 | off | 2000 | 25609.89 | 3.25 | 7.05 | 253229 |
| S9 update1 | A | A2 | off | 2000 | 4619.00 | 1.92 | 4.18 | 48518 |
| S9 update5 | A | A2 | off | 2000 | 2244.27 | 0.82 | 1.62 | 4045 |
| S9 insert | B | B1 | off | 2000 | 15868.58 | 3.02 | 9.40 | 97346 |
| S9 update1 | B | B1 | off | 2000 | 2636.08 | 1.15 | 2.33 | 18119 |
| S9 update5 | B | B1 | off | 2000 | 3696.07 | 0.66 | 2.24 | 5075 |
| S9 insert | A | A2 | on | 2000 | 16117.45 | 3.02 | 6.65 | 120141 |
| S9 update1 | A | A2 | on | 2000 | 33762.09 | 2.91 | 17.01 | 128451 |
| S9 update5 | A | A2 | on | 2000 | 4020.57 | 1.35 | 4.57 | 17482 |
| S9 insert | B | B1 | on | 2000 | 51372.32 | 5.09 | 24.07 | 269416 |
| S9 update1 | B | B1 | on | 2000 | 3617.77 | 1.50 | 3.31 | 63853 |
| S9 update5 | B | B1 | on | 2000 | 11246.33 | 2.49 | 10.49 | 111994 |

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

## Alter on the typed leads table

| operation | ms | rows |
| --- | --- | --- |
| add column (no default) | 2.87 | 250000 |
| add column (constant default) | 4.76 | 250000 |
| create index concurrently | 761.13 | 250000 |

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

- none
