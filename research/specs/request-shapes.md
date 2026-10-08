# Module 1 request and response shapes

Source: existing type-only `network.json` captures and Leads metadata. No live reference CRM request was made for this document. Paths use placeholders; no record or account values are reproduced. Each capture's shape function retains only the **first array item** and stops at depth 8. Thus `[]` paths describe the first item only; a `string` leaf in that item does not rule out `null` in later items. A union here joins shapes **across captures**, not across items in an array. Empty arrays and `<deep>` do not establish item keys. Each response-table row cites a capture containing that node; metadata-derived rows below cite their metadata source. Capture counts are a snapshot of the capture directories present on 2026-10-04; captures added later are not counted.

The capture stores HTTP response content type but does not retain request headers. For POST calls it records an opaque multipart marker; constituent field names are not observable in the captures. Query values written below are limited to non-identity constants preserved by the capture.

## Module definition

- Method and path: `GET /crm/v2.2/settings/modules/<module>`.
- Evidence: `analyst-smoke`, `analyst-sol-smoke`, `board-test-controls`, `detail-attachments-card`, `detail-create`, `detail-create-country`, `detail-create-owner`, `detail-create-owner-panel`, `detail-create-salutation-panel`, `detail-create-state`, `detail-create-status-panel`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `home-leads-navigation`, `leads-default`, `leads-detail`, `leads-main`, `list-actions`, `list-columns`, `list-converted`, `list-default`, `list-filter-text`, `list-main`, `list-more`, `list-page-size`, `list-settings`, `list-sort`, `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`, `list-view-edit`, `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `list-view-options`, `list-view-selector`, `setup-leads-summary`.
- Query parameters: `include` (`analyst-smoke`).
- Request body: none observed (`analyst-smoke`). Request content type: not applicable.
- Observed status: `200` (`analyst-smoke`).

The response tree below is the Leads module shape. The same path was also called for Accounts, Contacts, Deals, and Tasks in `setup-accounts-summary`, `setup-contacts-summary`, `setup-deals-summary`, and `setup-tasks-summary`; the last call supplies the nullable `modified_by` and `modified_time` variants and populated `parent_module` keys above. The three captured `include` lists for Leads are: `layouts,profiles` (`setup-leads-summary`), `layouts,lookup_field_properties,custom_view,related_lists,business_card_fields` (`detail-edit`), and a 33-name list, in this order: `$properties`, `$on_demand_properties`, `layouts`, `custom_view`, `show_social`, `show_webform`, `show_visitor`, `show_googlesync`, `show_emailparser`, `show_phonebridge`, `show_salessignals`, `show_emailsettings`, `show_dashboard`, `default_view`, `split_view_supported`, `chart_view_supported`, `chart_view_cache_supported`, `kanban_view_supported`, `customized_view`, omitted (name rule), `task_completed_rule_configured`, `new_call_view`, omitted (name rule), `group_by_field_available`, `module_mlabel`, `module_nlabel`, `related_lists`, `related_list_properties`, `business_card_fields`, `search_layout_fields`, `cpq_search_layout_fields`, `lookup_field_properties`, `map_view` (`list-default`). The other four modules use `include=layouts,profiles` in the setup captures (`setup-tasks-summary`); `board-lead-convert-probe` also calls Accounts and Contacts with the 33-name list.

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `modules` | array<object> | `analyst-smoke` |
| `modules[]` | object | `analyst-smoke` |
| `modules[].$on_demand_properties` | array<string> | `analyst-smoke` |
| `modules[].$properties` | array<string> | `analyst-smoke` |
| `modules[].access_type` | string | `analyst-smoke` |
| `modules[].actual_plural_label` | string | `analyst-smoke` |
| `modules[].actual_singular_label` | string | `analyst-smoke` |
| `modules[].api_name` | string | `analyst-smoke` |
| `modules[].api_supported` | boolean | `analyst-smoke` |
| `modules[].arguments` | array (empty; item type not observable) | `analyst-smoke` |
| `modules[].business_card_field_limit` | number | `analyst-smoke` |
| `modules[].business_card_fields` | array<object> | `analyst-smoke` |
| `modules[].business_card_fields[]` | object | `analyst-smoke` |
| `modules[].business_card_fields[].api_name` | string | `analyst-smoke` |
| `modules[].business_card_fields[].id` | string | `analyst-smoke` |
| `modules[].chart_view_supported` | boolean | `analyst-smoke` |
| `modules[].convertable` | boolean | `analyst-smoke` |
| `modules[].creatable` | boolean | `analyst-smoke` |
| `modules[].custom_view` | object | `analyst-smoke` |
| `modules[].custom_view.$modified_criteria` | boolean | `analyst-smoke` |
| `modules[].custom_view.access_type` | string | `analyst-smoke` |
| `modules[].custom_view.category` | string | `analyst-smoke` |
| `modules[].custom_view.created_by` | null | `analyst-smoke` |
| `modules[].custom_view.created_time` | null | `analyst-smoke` |
| `modules[].custom_view.criteria` | null, object | `analyst-smoke`, `board-lead-convert-probe` |
| `modules[].custom_view.criteria.comparator` | string | `analyst-smoke` |
| `modules[].custom_view.criteria.field` | object | `analyst-smoke` |
| `modules[].custom_view.criteria.field.api_name` | string | `analyst-smoke` |
| `modules[].custom_view.criteria.field.id` | string | `analyst-smoke` |
| `modules[].custom_view.criteria.type` | string | `analyst-smoke` |
| `modules[].custom_view.criteria.value` | boolean | `analyst-smoke` |
| `modules[].custom_view.default` | boolean | `analyst-smoke` |
| `modules[].custom_view.display_value` | string | `analyst-smoke` |
| `modules[].custom_view.favorite` | null | `analyst-smoke` |
| `modules[].custom_view.fields` | array<object> | `analyst-smoke` |
| `modules[].custom_view.fields[]` | object | `analyst-smoke` |
| `modules[].custom_view.fields[]._pin` | boolean | `analyst-smoke` |
| `modules[].custom_view.fields[].api_name` | string | `analyst-smoke` |
| `modules[].custom_view.fields[].id` | string | `analyst-smoke` |
| `modules[].custom_view.id` | string | `analyst-smoke` |
| `modules[].custom_view.last_accessed_time` | string | `analyst-smoke` |
| `modules[].custom_view.locked` | boolean | `analyst-smoke` |
| `modules[].custom_view.modified_by` | null | `analyst-smoke` |
| `modules[].custom_view.modified_time` | null | `analyst-smoke` |
| `modules[].custom_view.module` | object | `analyst-smoke` |
| `modules[].custom_view.module.api_name` | string | `analyst-smoke` |
| `modules[].custom_view.module.id` | string | `analyst-smoke` |
| `modules[].custom_view.name` | string | `analyst-smoke` |
| `modules[].custom_view.shared_to` | null | `analyst-smoke` |
| `modules[].custom_view.sort_by` | null | `analyst-smoke` |
| `modules[].custom_view.sort_order` | null | `analyst-smoke` |
| `modules[].custom_view.system_defined` | boolean | `analyst-smoke` |
| `modules[].custom_view.system_name` | string | `analyst-smoke` |
| `modules[].custom_view.wrap_text` | boolean | `analyst-smoke` |
| `modules[].customized_view` | boolean | `analyst-smoke` |
| `modules[].default_view` | object | `analyst-smoke` |
| `modules[].default_view.id` | string | `analyst-smoke` |
| `modules[].default_view.name` | string | `analyst-smoke` |
| `modules[].deletable` | boolean | `analyst-smoke` |
| `modules[].description` | null | `analyst-smoke` |
| `modules[].display_field` | object | `analyst-smoke` |
| `modules[].display_field.api_name` | string | `analyst-smoke` |
| `modules[].display_field.id` | string | `analyst-smoke` |
| `modules[].editable` | boolean | `analyst-smoke` |
| `modules[].emailTemplate_support` | boolean | `analyst-smoke` |
| `modules[].email_parser_supported` | boolean | `analyst-smoke` |
| `modules[].feeds_required` | boolean | `analyst-smoke` |
| `modules[].filter_supported` | boolean | `analyst-smoke` |
| `modules[].generated_type` | string | `analyst-smoke` |
| `modules[].global_search_supported` | boolean | `analyst-smoke` |
| `modules[].group_by_field_available` | boolean | `analyst-smoke` |
| `modules[].has_more_profiles` | boolean | `analyst-smoke` |
| `modules[].id` | string | `analyst-smoke` |
| `modules[].inventory_template_supported` | boolean | `analyst-smoke` |
| `modules[].isBlueprintSupported` | boolean | `analyst-smoke` |
| `modules[].kanban_view_supported` | boolean | `analyst-smoke` |
| `modules[].layouts` | array<object> | `analyst-smoke` |
| `modules[].layouts[]` | object | `analyst-smoke` |
| `modules[].layouts[].display_label` | string | `analyst-smoke` |
| `modules[].layouts[].generated_type` | string | `analyst-smoke` |
| `modules[].layouts[].id` | string | `analyst-smoke` |
| `modules[].layouts[].name` | string | `analyst-smoke` |
| `modules[].layouts[].profiles` | array<object> | `analyst-smoke` |
| `modules[].layouts[].profiles[]` | object | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_assignment_view` | object | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_assignment_view.id` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_assignment_view.name` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_assignment_view.type` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_view` | object | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_view.id` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_view.name` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[]._default_view.type` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[].default` | boolean | `analyst-smoke` |
| `modules[].layouts[].profiles[].id` | string | `analyst-smoke` |
| `modules[].layouts[].profiles[].name` | string | `analyst-smoke` |
| `modules[].layouts[].source` | string | `analyst-smoke` |
| `modules[].layouts[].status` | string | `analyst-smoke` |
| `modules[].lookup_field_properties` | object | `analyst-smoke` |
| `modules[].lookup_field_properties.fields` | array<object> | `analyst-smoke` |
| `modules[].lookup_field_properties.fields[]` | object | `analyst-smoke` |
| `modules[].lookup_field_properties.fields[].api_name` | string | `analyst-smoke` |
| `modules[].lookup_field_properties.fields[].id` | string | `analyst-smoke` |
| `modules[].lookup_field_properties.fields[].sequence_number` | number | `analyst-smoke` |
| `modules[].map_view` | boolean | `analyst-smoke` |
| `modules[].modified_by` | null, object | `analyst-smoke`, `setup-tasks-summary` |
| `modules[].modified_by.id` | string | `analyst-smoke` |
| `modules[].modified_by.name` | string | `analyst-smoke` |
| `modules[].modified_time` | null, string | `analyst-smoke`, `setup-tasks-summary` |
| `modules[].module_name` | string | `analyst-smoke` |
| `modules[].parent_module` | object | `analyst-smoke` |
| `modules[].parent_module.api_name` | string | `setup-tasks-summary` |
| `modules[].parent_module.id` | string | `setup-tasks-summary` |
| `modules[].per_page` | number | `analyst-smoke` |
| `modules[].plural_label` | string | `analyst-smoke` |
| `modules[].presence_sub_menu` | boolean | `analyst-smoke` |
| `modules[].private_profile` | null | `analyst-smoke` |
| `modules[].profile_count` | number | `analyst-smoke` |
| `modules[].profiles` | array<object> | `analyst-smoke` |
| `modules[].profiles[]` | object | `analyst-smoke` |
| `modules[].profiles[].id` | string | `analyst-smoke` |
| `modules[].profiles[].name` | string | `analyst-smoke` |
| `modules[].public_fields_configured` | boolean | `analyst-smoke` |
| `modules[].quick_create` | boolean | `analyst-smoke` |
| `modules[].related_list_properties` | object | `analyst-smoke` |
| `modules[].related_list_properties.fields` | array<object> | `analyst-smoke` |
| `modules[].related_list_properties.fields[]` | object | `analyst-smoke` |
| `modules[].related_list_properties.fields[].api_name` | string | `analyst-smoke` |
| `modules[].related_list_properties.fields[].id` | string | `analyst-smoke` |
| `modules[].related_list_properties.sort_by` | null | `analyst-smoke` |
| `modules[].related_list_properties.sort_order` | null | `analyst-smoke` |
| `modules[].related_lists` | array<object> | `analyst-smoke` |
| `modules[].related_lists[]` | object | `analyst-smoke` |
| `modules[].related_lists[].action` | null | `analyst-smoke` |
| `modules[].related_lists[].api_name` | string | `analyst-smoke` |
| `modules[].related_lists[].customize_display_label` | boolean | `analyst-smoke` |
| `modules[].related_lists[].customize_fields` | boolean | `analyst-smoke` |
| `modules[].related_lists[].customize_sort` | boolean | `analyst-smoke` |
| `modules[].related_lists[].display_label` | string | `analyst-smoke` |
| `modules[].related_lists[].href` | null | `analyst-smoke` |
| `modules[].related_lists[].id` | string | `analyst-smoke` |
| `modules[].related_lists[].module` | null | `analyst-smoke` |
| `modules[].related_lists[].name` | string | `analyst-smoke` |
| `modules[].related_lists[].personality_name` | string | `analyst-smoke` |
| `modules[].related_lists[].record_operations` | object | `analyst-smoke` |
| `modules[].related_lists[].record_operations.assign` | boolean | `analyst-smoke` |
| `modules[].related_lists[].record_operations.bulk_edit` | boolean | `analyst-smoke` |
| `modules[].related_lists[].record_operations.create` | boolean | `analyst-smoke` |
| `modules[].related_lists[].record_operations.delete` | boolean | `analyst-smoke` |
| `modules[].related_lists[].record_operations.disassociate` | boolean | `analyst-smoke` |
| `modules[].related_lists[].record_operations.edit` | boolean | `analyst-smoke` |
| `modules[].related_lists[].sequence_number` | string | `analyst-smoke` |
| `modules[].related_lists[].type` | string | `analyst-smoke` |
| `modules[].related_lists[].visibility` | number | `analyst-smoke` |
| `modules[].related_lists[].visible` | boolean | `analyst-smoke` |
| `modules[].scoring_supported` | boolean | `analyst-smoke` |
| `modules[].search_layout_fields` | array<object> | `analyst-smoke` |
| `modules[].search_layout_fields[]` | object | `analyst-smoke` |
| `modules[].search_layout_fields[].api_name` | string | `analyst-smoke` |
| `modules[].search_layout_fields[].id` | string | `analyst-smoke` |
| `modules[].sequence_number` | number | `analyst-smoke` |
| `modules[].show_as_tab` | boolean | `analyst-smoke` |
| `modules[].singular_label` | string | `analyst-smoke` |
| `modules[].source` | string | `analyst-smoke` |
| `modules[].split_view_supported` | boolean | `analyst-smoke` |
| `modules[].triggers_supported` | boolean | `analyst-smoke` |
| `modules[].viewable` | boolean | `analyst-smoke` |
| `modules[].visibility` | number | `analyst-smoke` |
| `modules[].visible` | boolean | `analyst-smoke` |
| `modules[].web_link` | null | `analyst-smoke` |
| `modules[].webform_supported` | boolean | `analyst-smoke` |
| `omitted (name rule)` | omitted (name rule) | `analyst-smoke` |

## Field definitions

- Method and path: `GET /crm/v2.2/settings/fields`.
- Evidence: `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `setup-leads-field-permissions`, `setup-leads-layout-rules`, `setup-leads-locking`.
- Query parameters: `include` (`setup-leads-field-permissions`), `include_external_fields` (`setup-leads-field-permissions`), `module` (`list-view-edit-1`), `type` (`list-view-edit-1`).
- Request body: none observed (`list-view-edit-1`). Request content type: not applicable.
- Observed status: `200` (`list-view-edit-1`).

The tree below uses `module=Leads` calls: `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `setup-leads-field-permissions`, `setup-leads-layout-rules`, and `setup-leads-locking` (seven captures). The four view-edit captures also request `module=Campaigns` at the same endpoint, with a different first-item shape. Ordinary Leads list and detail captures contain no request for Leads field definitions; their source is not observable in the captures. `include=allowed_permissions_to_update` occurs in `setup-leads-field-permissions`.

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `fields` | array<object> | `list-view-edit-1` |
| `fields[]` | object | `list-view-edit-1` |
| `fields[].additional_column` | null | `list-view-edit-1` |
| `fields[].address` | null, object | `list-view-edit-1` |
| `fields[].address.type` | string | `list-view-edit-1` |
| `fields[].allowed_permissions_to_update` | object | `setup-leads-field-permissions` |
| `fields[].allowed_permissions_to_update.hidden` | boolean | `setup-leads-field-permissions` |
| `fields[].allowed_permissions_to_update.read_only` | boolean | `setup-leads-field-permissions` |
| `fields[].allowed_permissions_to_update.read_write` | boolean | `setup-leads-field-permissions` |
| `fields[].api_name` | string | `list-view-edit-1` |
| `fields[].association_details` | null | `list-view-edit-1` |
| `fields[].auto_number` | object | `list-view-edit-1` |
| `fields[].available_in_user_layout` | boolean | `list-view-edit-1` |
| `fields[].businesscard_supported` | boolean | `list-view-edit-1` |
| `fields[].category` | number | `list-view-edit-1` |
| `fields[].child_fields` | null | `list-view-edit-1` |
| `fields[].colour_code_enabled_by_system` | boolean | `list-view-edit-1` |
| `fields[].column_name` | string | `list-view-edit-1` |
| `fields[].convert_mapping` | object | `list-view-edit-1` |
| `fields[].convert_mapping.Accounts` | string | `list-view-edit-1` |
| `fields[].convert_mapping.Contacts` | string | `list-view-edit-1` |
| `fields[].convert_mapping.Deals` | null | `list-view-edit-1` |
| `fields[].created_source` | string | `list-view-edit-1` |
| `fields[].created_time` | null | `list-view-edit-1` |
| `fields[].crypt` | null | `list-view-edit-1` |
| `fields[].currency` | object | `list-view-edit-1` |
| `fields[].custom_field` | boolean | `list-view-edit-1` |
| `fields[].data_type` | string | `list-view-edit-1` |
| `fields[].decimal_place` | null, number | `list-view-edit-1` |
| `fields[].display_field` | boolean | `list-view-edit-1` |
| `fields[].display_format` | null | `list-view-edit-1` |
| `fields[].display_format_properties` | null | `list-view-edit-1` |
| `fields[].display_label` | string | `list-view-edit-1` |
| `fields[].display_type` | number | `list-view-edit-1` |
| `fields[].email_parser` | object | `list-view-edit-1` |
| `fields[].email_parser.fields_update_supported` | boolean | `list-view-edit-1` |
| `fields[].email_parser.record_operations_supported` | boolean | `list-view-edit-1` |
| `fields[].enable_colour_code` | boolean | `list-view-edit-1` |
| `fields[].enable_record_category` | boolean | `list-view-edit-1` |
| `fields[].external` | null | `list-view-edit-1` |
| `fields[].field_label` | string | `list-view-edit-1` |
| `fields[].field_read_only` | boolean | `list-view-edit-1` |
| `fields[].filterable` | boolean | `list-view-edit-1` |
| `fields[].formula` | object | `list-view-edit-1` |
| `fields[].global_picklist` | null | `list-view-edit-1` |
| `fields[].history_tracking` | null | `list-view-edit-1` |
| `fields[].id` | string | `list-view-edit-1` |
| `fields[].json_type` | string | `list-view-edit-1` |
| `fields[].length` | number | `list-view-edit-1` |
| `fields[].lookup` | object | `list-view-edit-1` |
| `fields[].mass_update` | boolean | `list-view-edit-1` |
| `fields[].modified_time` | null | `list-view-edit-1` |
| `fields[].multi_module_lookup` | object | `list-view-edit-1` |
| `fields[].multiselectlookup` | object | `list-view-edit-1` |
| `fields[].parent_field` | null, object | `list-view-edit-1` |
| `fields[].parent_field.api_name` | string | `list-view-edit-1` |
| `fields[].parent_field.id` | string | `list-view-edit-1` |
| `fields[].parent_field.name` | string | `list-view-edit-1` |
| `fields[].pick_list_values` | array (empty; item type not observable) | `list-view-edit-1` |
| `fields[].pick_list_values_sorted_lexically` | boolean | `list-view-edit-1` |
| `fields[].profiles` | array<object> | `list-view-edit-1` |
| `fields[].profiles[]` | object | `list-view-edit-1` |
| `fields[].profiles[].id` | string | `list-view-edit-1` |
| `fields[].profiles[].name` | string | `list-view-edit-1` |
| `fields[].profiles[].permission_type` | string | `list-view-edit-1` |
| `fields[].public` | boolean | `list-view-edit-1` |
| `fields[].range` | null | `list-view-edit-1` |
| `fields[].read_only` | boolean | `list-view-edit-1` |
| `fields[].refer_from_field` | null | `list-view-edit-1` |
| `fields[].rollup_summary` | object | `list-view-edit-1` |
| `fields[].searchable` | boolean | `list-view-edit-1` |
| `fields[].separator` | boolean | `list-view-edit-1` |
| `fields[].show_type` | number | `list-view-edit-1` |
| `fields[].sortable` | boolean | `list-view-edit-1` |
| `fields[].static_field` | boolean | `list-view-edit-1` |
| `fields[].subform` | null | `list-view-edit-1` |
| `fields[].system_mandatory` | boolean | `list-view-edit-1` |
| `fields[].tooltip` | null | `list-view-edit-1` |
| `fields[].type` | string | `list-view-edit-1` |
| `fields[].ui_type` | number | `list-view-edit-1` |
| `fields[].unique` | object | `list-view-edit-1` |
| `fields[].view_type` | object | `list-view-edit-1` |
| `fields[].view_type.create` | boolean | `list-view-edit-1` |
| `fields[].view_type.edit` | boolean | `list-view-edit-1` |
| `fields[].view_type.quick_create` | boolean | `list-view-edit-1` |
| `fields[].view_type.view` | boolean | `list-view-edit-1` |
| `fields[].virtual_field` | boolean | `list-view-edit-1` |
| `fields[].visible` | boolean | `list-view-edit-1` |
| `fields[].webhook` | boolean | `list-view-edit-1` |

## Layouts

- Method and path: `GET /crm/v2.1/settings/layouts`.
- Evidence: `detail-attachments-card`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `leads-detail`, `setup-leads-layout-rules`.
- Query parameters: `mode` (`detail-attachments-card`), `module` (`detail-attachments-card`).
- Request body: none observed (`detail-attachments-card`). Request content type: not applicable.
- Observed status: `200` (`detail-attachments-card`).

The 136 response paths below all occur with `module=Leads` in `setup-leads-layout-rules` (also `board-lead-convert-probe`); that is the evidence for this table. In 23 other captures the request uses `module=Campaigns`, with `mode=all`, and 16 of those entries have no retained response body. Ordinary Leads list and detail captures contain no request for Leads layout sections; their source is not observable in the captures.

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `layouts` | array<object> | `setup-leads-layout-rules` |
| `layouts[]` | object | `setup-leads-layout-rules` |
| `layouts[].convert_mapping` | object | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Accounts` | object | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Accounts.display_label` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Accounts.id` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Accounts.name` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Contacts` | object | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Contacts.display_label` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Contacts.id` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Contacts.name` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals` | object | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.display_label` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.fields` | array<object> | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.fields[]` | object | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.fields[].api_name` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.fields[].field_label` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.fields[].id` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.fields[].required` | boolean | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.id` | string | `setup-leads-layout-rules` |
| `layouts[].convert_mapping.Deals.name` | string | `setup-leads-layout-rules` |
| `layouts[].created_by` | null | `setup-leads-layout-rules` |
| `layouts[].created_for` | null | `setup-leads-layout-rules` |
| `layouts[].created_time` | null | `setup-leads-layout-rules` |
| `layouts[].display_label` | string | `setup-leads-layout-rules` |
| `layouts[].id` | string | `setup-leads-layout-rules` |
| `layouts[].modified_by` | null | `setup-leads-layout-rules` |
| `layouts[].modified_time` | null | `setup-leads-layout-rules` |
| `layouts[].name` | string | `setup-leads-layout-rules` |
| `layouts[].profiles` | array<object> | `setup-leads-layout-rules` |
| `layouts[].profiles[]` | object | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_assignment_view` | object | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_assignment_view.id` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_assignment_view.name` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_assignment_view.type` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_view` | object | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_view.id` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_view.name` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[]._default_view.type` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[].default` | boolean | `setup-leads-layout-rules` |
| `layouts[].profiles[].id` | string | `setup-leads-layout-rules` |
| `layouts[].profiles[].name` | string | `setup-leads-layout-rules` |
| `layouts[].sections` | array<object> | `setup-leads-layout-rules` |
| `layouts[].sections[]` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].api_name` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].column_count` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].display_label` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields` | array<object> | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[]` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].additional_column` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].address` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].api_name` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].association_details` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].auto_number` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].businesscard_supported` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].category` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].child_fields` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].column_name` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping.Accounts` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping.Contacts` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping.Deals` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].created_source` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].created_time` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].crypt` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].currency` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].custom_field` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].data_type` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].decimal_place` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].default_value` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].display_field` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].display_format` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].display_format_properties` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].display_label` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].display_type` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].enable_record_category` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].external` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].field_label` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].field_read_only` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].filterable` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].formula` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].history_tracking` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].id` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].json_type` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].length` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].lookup` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].modified_time` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].multi_module_lookup` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].multiselectlookup` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].parent_field` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].pick_list_values` | array (empty; item type not observable) | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].pick_list_values_sorted_lexically` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].profiles` | array<object> | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].profiles[]` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].profiles[].id` | not observable in the captures (depth limit) | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].profiles[].name` | not observable in the captures (depth limit) | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].profiles[].permission_type` | not observable in the captures (depth limit) | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].public` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].range` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].read_only` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].refer_from_field` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].required` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].rollup_summary` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].section_id` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].sequence_number` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].show_type` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].sortable` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].static_field` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].static_values` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].subform` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].subform_properties` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].system_mandatory` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].tooltip` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].type` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].ui_type` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].unique` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].validation_rule` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].view_type` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].view_type.create` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].view_type.edit` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].view_type.quick_create` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].view_type.view` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].visible` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].webhook` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].generated_type` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].isSubformSection` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].is_parent_section` | boolean | `setup-leads-layout-rules` |
| `layouts[].sections[].name` | string | `setup-leads-layout-rules` |
| `layouts[].sections[].parent_section` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].properties` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].sequence_number` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].tab_traversal` | number | `setup-leads-layout-rules` |
| `layouts[].sections[].type` | string | `setup-leads-layout-rules` |
| `layouts[].show_business_card` | boolean | `setup-leads-layout-rules` |
| `layouts[].status` | number | `setup-leads-layout-rules` |
| `layouts[].visible` | boolean | `setup-leads-layout-rules` |

## View inventory

- Method and path: `GET /crm/v9/settings/custom_views`.
- Evidence: `analyst-smoke`, `analyst-sol-smoke`, `board-test-controls`, `detail-attachments-card`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `home-leads-navigation`, `leads-default`, `leads-detail`, `list-actions`, `list-columns`, `list-converted`, `list-default`, `list-filter-text`, `list-more`, `list-page-size`, `list-settings`, `list-sort`, `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`, `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `list-view-options`, `list-view-selector`.
- Query parameters: `filters` (`analyst-smoke`), `module` (`analyst-smoke`), `page` (`analyst-smoke`), `per_page` (`analyst-smoke`).
- Request body: none observed (`analyst-smoke`). Request content type: not applicable.
- Observed status: `200` (`analyst-smoke`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `custom_views` | array<object> | `analyst-smoke` |
| `custom_views[]` | object | `analyst-smoke` |
| `custom_views[].access_type` | string | `analyst-smoke` |
| `custom_views[].category` | string | `analyst-smoke` |
| `custom_views[].created_by` | null | `analyst-smoke` |
| `custom_views[].created_time` | null | `analyst-smoke` |
| `custom_views[].default` | boolean | `analyst-smoke` |
| `custom_views[].display_value` | string | `analyst-smoke` |
| `custom_views[].favorite` | null | `analyst-smoke` |
| `custom_views[].id` | string | `analyst-smoke` |
| `custom_views[].last_accessed_time` | string | `analyst-smoke` |
| `custom_views[].locked` | boolean | `analyst-smoke` |
| `custom_views[].modified_by` | null | `analyst-smoke` |
| `custom_views[].modified_time` | null | `analyst-smoke` |
| `custom_views[].module` | object | `analyst-smoke` |
| `custom_views[].module.api_name` | string | `analyst-smoke` |
| `custom_views[].module.id` | string | `analyst-smoke` |
| `custom_views[].name` | string | `analyst-smoke` |
| `custom_views[].pin` | boolean | `analyst-smoke` |
| `custom_views[].system_defined` | boolean | `analyst-smoke` |
| `custom_views[].system_name` | string | `analyst-smoke` |
| `custom_views[].tab_order` | number | `analyst-smoke` |
| `info` | object | `analyst-smoke` |
| `info.count` | number | `analyst-smoke` |
| `info.default` | string | `analyst-smoke` |
| `info.more_records` | boolean | `analyst-smoke` |
| `info.page` | number | `analyst-smoke` |
| `info.per_page` | number | `analyst-smoke` |
| `info.translation` | object | `analyst-smoke` |
| `info.translation.created_by_me` | string | `analyst-smoke` |
| `info.translation.other_users_views` | string | `analyst-smoke` |
| `info.translation.public_views` | string | `analyst-smoke` |
| `info.translation.shared_with_me` | string | `analyst-smoke` |

## Selected view

- Method and path: `GET /crm/v9/settings/custom_views/<viewId>`.
- Evidence: `analyst-smoke`, `analyst-sol-smoke`, `board-test-controls`, `detail-attachments-card`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `home-leads-navigation`, `leads-default`, `leads-detail`, `list-actions`, `list-columns`, `list-converted`, `list-default`, `list-filter-text`, `list-more`, `list-page-size`, `list-settings`, `list-sort`, `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`, `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `list-view-options`, `list-view-selector`.
- Query parameters: `include_inner_details` (`list-view-edit-1`), `module` (`analyst-smoke`).
- Request body: none observed (`analyst-smoke`). Request content type: not applicable.
- Observed status: `200` (`analyst-smoke`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `custom_views` | array<object> | `analyst-smoke` |
| `custom_views[]` | object | `analyst-smoke` |
| `custom_views[].$modified_criteria` | boolean | `analyst-smoke` |
| `custom_views[].access_type` | string | `analyst-smoke` |
| `custom_views[].category` | string | `analyst-smoke` |
| `custom_views[].created_by` | null, object | `analyst-smoke` |
| `custom_views[].created_by.id` | string | `list-view-edit-1` |
| `custom_views[].created_by.name` | string | `list-view-edit-1` |
| `custom_views[].created_by.rid` | string | `list-view-edit-1` |
| `custom_views[].created_time` | null, string | `analyst-smoke` |
| `custom_views[].criteria` | object | `analyst-smoke` |
| `custom_views[].criteria.$disrupted` | boolean | `analyst-smoke` |
| `custom_views[].criteria.comparator` | string | `analyst-smoke` |
| `custom_views[].criteria.field` | object | `analyst-smoke` |
| `custom_views[].criteria.field.api_name` | string | `analyst-smoke` |
| `custom_views[].criteria.field.field_label` | string | `list-view-edit-1` |
| `custom_views[].criteria.field.id` | string | `analyst-smoke` |
| `custom_views[].criteria.group` | array<object> | `list-sysview-1` |
| `custom_views[].criteria.group[]` | object | `list-sysview-1` |
| `custom_views[].criteria.group[].$disrupted` | boolean | `list-sysview-1` |
| `custom_views[].criteria.group[].comparator` | string | `list-sysview-1` |
| `custom_views[].criteria.group[].field` | object | `list-sysview-1` |
| `custom_views[].criteria.group[].field.api_name` | string | `list-sysview-1` |
| `custom_views[].criteria.group[].field.id` | string | `list-sysview-1` |
| `custom_views[].criteria.group[].group` | array<object> | `list-sysview-5` |
| `custom_views[].criteria.group[].group[]` | object | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].$disrupted` | boolean | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].comparator` | string | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].field` | object | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].field.api_name` | not observable in the captures (depth limit) | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].field.id` | not observable in the captures (depth limit) | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].type` | string | `list-sysview-5` |
| `custom_views[].criteria.group[].group[].value` | string | `list-sysview-5` |
| `custom_views[].criteria.group[].group_operator` | string | `list-sysview-5` |
| `custom_views[].criteria.group[].type` | string | `list-sysview-1` |
| `custom_views[].criteria.group[].value` | boolean, object, string | `list-sysview-1` |
| `custom_views[].criteria.group[].value.name` | string | `list-sysview-4` |
| `custom_views[].criteria.group_operator` | string | `list-sysview-1` |
| `custom_views[].criteria.type` | string | `analyst-smoke` |
| `custom_views[].criteria.value` | boolean, string | `analyst-smoke` |
| `custom_views[].default` | boolean | `analyst-smoke` |
| `custom_views[].display_value` | string | `analyst-smoke` |
| `custom_views[].favorite` | null | `analyst-smoke` |
| `custom_views[].fields` | array<object> | `analyst-smoke` |
| `custom_views[].fields[]` | object | `analyst-smoke` |
| `custom_views[].fields[]._pin` | boolean | `analyst-smoke` |
| `custom_views[].fields[].api_name` | string | `analyst-smoke` |
| `custom_views[].fields[].id` | string | `analyst-smoke` |
| `custom_views[].id` | string | `analyst-smoke` |
| `custom_views[].last_accessed_time` | null, string | `analyst-smoke` |
| `custom_views[].locked` | boolean | `analyst-smoke` |
| `custom_views[].modified_by` | null, object | `analyst-smoke` |
| `custom_views[].modified_by.id` | string | `list-view-edit-1` |
| `custom_views[].modified_by.name` | string | `list-view-edit-1` |
| `custom_views[].modified_by.rid` | string | `list-view-edit-1` |
| `custom_views[].modified_time` | null, string | `analyst-smoke` |
| `custom_views[].module` | object | `analyst-smoke` |
| `custom_views[].module.api_name` | string | `analyst-smoke` |
| `custom_views[].module.id` | string | `analyst-smoke` |
| `custom_views[].name` | string | `analyst-smoke` |
| `custom_views[].pin` | boolean | `analyst-smoke` |
| `custom_views[].rid` | string | `list-view-edit-1` |
| `custom_views[].shared_to` | null | `analyst-smoke` |
| `custom_views[].sort_by` | null | `analyst-smoke` |
| `custom_views[].sort_order` | null | `analyst-smoke` |
| `custom_views[].system_defined` | boolean | `analyst-smoke` |
| `custom_views[].system_name` | null, string | `analyst-smoke` |
| `custom_views[].tab_order` | null, number | `analyst-smoke` |
| `custom_views[].wrap_text` | boolean | `analyst-smoke` |

## Record list

- Method and path: `POST /crm/v2.2/<module>/bulk`.
- Evidence: `analyst-smoke`, `analyst-sol-smoke`, `board-test-controls`, `detail-attachments-card`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `home-leads-navigation`, `leads-default`, `leads-detail`, `list-actions`, `list-columns`, `list-converted`, `list-default`, `list-filter-text`, `list-more`, `list-page-size`, `list-settings`, `list-sort`, `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`, `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `list-view-options`, `list-view-selector`.
- Query parameters: `approved` (`analyst-smoke`), `cvid` (`analyst-smoke`), `fields` (`analyst-smoke`), `formatted_currency` (`analyst-smoke`), `home_converted_currency` (`analyst-smoke`), `on_demand_properties` (`analyst-smoke`), `page` (`analyst-smoke`), `per_page` (`analyst-smoke`), `relatedId` (`detail-attachments-card`), `relationId` (`detail-attachments-card`).
- Request body: `opaque multipart marker` (`detail-attachments-card`). Constituent field names are not observable in the captures. Request content type is not observable in the captures; the marker says multipart/form-data, while `contentType` on the entry describes the response.
- Observed status: `200` (`analyst-smoke`), `204` (`detail-attachments-card`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `data` | array<object> | `analyst-smoke` |
| `data[]` | object | `analyst-smoke` |
| `data[].$approval` | object | `analyst-smoke` |
| `data[].$approval.add_approver` | boolean | `analyst-smoke` |
| `data[].$approval.approve` | boolean | `analyst-smoke` |
| `data[].$approval.delegate` | boolean | `analyst-smoke` |
| `data[].$approval.recall` | boolean | `analyst-smoke` |
| `data[].$approval.reject` | boolean | `analyst-smoke` |
| `data[].$approval.resubmit` | boolean | `analyst-smoke` |
| `data[].$approval.takeover` | boolean | `analyst-smoke` |
| `data[].$approval_state` | string | `analyst-smoke` |
| `data[].$approved` | boolean | `analyst-smoke` |
| `data[].$converted` | boolean | `analyst-smoke` |
| `data[].$converted_detail` | object | `analyst-smoke` |
| `data[].$currency_symbol` | string | `analyst-smoke` |
| `data[].$editable` | boolean | `analyst-smoke` |
| `data[].$field_states` | null | `analyst-smoke` |
| `data[].$formatted_currency` | null | `analyst-smoke` |
| `data[].$home_converted_currency` | null | `analyst-smoke` |
| `data[].$in_merge` | boolean | `analyst-smoke` |
| `data[].$layout_id` | object | `analyst-smoke` |
| `data[].$layout_id.display_label` | string | `analyst-smoke` |
| `data[].$layout_id.id` | string | `analyst-smoke` |
| `data[].$layout_id.name` | string | `analyst-smoke` |
| `data[].$locked_for_me` | boolean | `analyst-smoke` |
| `data[].$orchestration` | boolean | `analyst-smoke` |
| `data[].$pathfinder` | boolean | `analyst-smoke` |
| `data[].$photo_id` | string | `analyst-smoke` |
| `data[].$process_flow` | boolean | `analyst-smoke` |
| `data[].$review` | null | `analyst-smoke` |
| `data[].$review_process` | object | `analyst-smoke` |
| `data[].$review_process.approve` | boolean | `analyst-smoke` |
| `data[].$review_process.reject` | boolean | `analyst-smoke` |
| `data[].$review_process.resubmit` | boolean | `analyst-smoke` |
| `data[].$sharing_permission` | string | `analyst-smoke` |
| `data[].$state` | string | `analyst-smoke` |
| `data[].$status` | string | `analyst-smoke` |
| `data[].$upcoming_activity` | null | `analyst-smoke` |
| `data[].$wizard_connection_path` | null | `analyst-smoke` |
| `data[].Company` | string | `analyst-smoke` |
| `data[].Email` | string | `analyst-smoke` |
| `data[].First_Name` | string | `analyst-smoke` |
| `data[].Full_Name` | string | `analyst-smoke` |
| `data[].Last_Name` | string | `analyst-smoke` |
| `data[].Lead_Source` | string | `analyst-smoke` |
| `data[].Locked__s` | boolean | `analyst-smoke` |
| `data[].Owner` | object | `analyst-smoke` |
| `data[].Owner.email` | string | `analyst-smoke` |
| `data[].Owner.id` | string | `analyst-smoke` |
| `data[].Owner.name` | string | `analyst-smoke` |
| `data[].Phone` | string | `analyst-smoke` |
| `data[].Salutation` | string | `list-sysview-2` |
| `data[].Tag` | array (empty; item type not observable) | `analyst-smoke` |
| `data[].id` | string | `analyst-smoke` |
| `info` | object | `analyst-smoke` |
| `info.count` | number | `analyst-smoke` |
| `info.more_records` | boolean | `analyst-smoke` |
| `info.page` | number | `analyst-smoke` |
| `info.per_page` | number | `analyst-smoke` |
| `info.sort_by` | string | `analyst-smoke` |
| `info.sort_order` | string | `analyst-smoke` |
| `omitted (name rule)` | omitted (name rule) | `analyst-smoke` |

The `204` response has no body (`detail-attachments-card`).

## Record count

- Method and path: `POST /crm/v2.2/<module>/actions/count`.
- Evidence: `analyst-smoke`, `analyst-sol-smoke`, `board-test-controls`, `detail-attachments-card`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `home-leads-navigation`, `leads-default`, `leads-detail`, `list-actions`, `list-columns`, `list-converted`, `list-default`, `list-filter-text`, `list-more`, `list-page-size`, `list-settings`, `list-sort`, `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`, `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `list-view-options`, `list-view-selector`.
- Query parameters: `approved` (`analyst-smoke`), `cvid` (`analyst-smoke`), `formatted_currency` (`analyst-smoke`), `home_converted_currency` (`analyst-smoke`), `on_demand_properties` (`analyst-smoke`).
- Request body: `opaque multipart marker` (`analyst-smoke`). Constituent field names are not observable in the captures. Request content type is not observable in the captures; the marker says multipart/form-data, while `contentType` on the entry describes the response.
- Observed status: `200` (`analyst-smoke`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `count` | number | `analyst-smoke` |

## Record detail and edit load

- Method and path: `GET /crm/v2.2/<module>/<recordId>`.
- Evidence: `detail-attachments-card`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `leads-detail`.
- Query parameters: `approved` (`detail-attachments-card`), `converted` (`detail-attachments-card`), `formatted_currency` (`detail-attachments-card`), `home_converted_currency` (`detail-attachments-card`), `include_element_types` (`detail-attachments-card`), `insert_recent_item` (`detail-attachments-card`), `on_demand_properties` (`detail-attachments-card`).
- Request body: none observed (`detail-attachments-card`). Request content type: not applicable.
- Observed status: `200` (`detail-attachments-card`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `data` | array<object> | `detail-attachments-card` |
| `data[]` | object | `detail-attachments-card` |
| `data[].$approval` | object | `detail-attachments-card` |
| `data[].$approval.add_approver` | boolean | `detail-attachments-card` |
| `data[].$approval.approve` | boolean | `detail-attachments-card` |
| `data[].$approval.delegate` | boolean | `detail-attachments-card` |
| `data[].$approval.recall` | boolean | `detail-attachments-card` |
| `data[].$approval.reject` | boolean | `detail-attachments-card` |
| `data[].$approval.resubmit` | boolean | `detail-attachments-card` |
| `data[].$approval.takeover` | boolean | `detail-attachments-card` |
| `data[].$approval_state` | string | `detail-attachments-card` |
| `data[].$approved` | boolean | `detail-attachments-card` |
| `data[].$converted` | boolean | `detail-attachments-card` |
| `data[].$converted_detail` | object | `detail-attachments-card` |
| `data[].$currency_symbol` | string | `detail-attachments-card` |
| `data[].$editable` | boolean | `detail-attachments-card` |
| `data[].$field_states` | null | `detail-attachments-card` |
| `data[].$formatted_currency` | object | `detail-attachments-card` |
| `data[].$formatted_currency.Annual_Revenue` | string | `detail-attachments-card` |
| `data[].$home_converted_currency` | null | `detail-attachments-card` |
| `data[].$in_merge` | boolean | `detail-attachments-card` |
| `data[].$layout_id` | object | `detail-attachments-card` |
| `data[].$layout_id.display_label` | string | `detail-attachments-card` |
| `data[].$layout_id.id` | string | `detail-attachments-card` |
| `data[].$layout_id.name` | string | `detail-attachments-card` |
| `data[].$locked_for_me` | boolean | `detail-attachments-card` |
| `data[].$orchestration` | boolean | `detail-attachments-card` |
| `data[].$pathfinder` | boolean | `detail-attachments-card` |
| `data[].$photo_id` | string | `detail-attachments-card` |
| `data[].$process_flow` | boolean | `detail-attachments-card` |
| `data[].$review` | null | `detail-attachments-card` |
| `data[].$review_process` | object | `detail-attachments-card` |
| `data[].$review_process.approve` | boolean | `detail-attachments-card` |
| `data[].$review_process.reject` | boolean | `detail-attachments-card` |
| `data[].$review_process.resubmit` | boolean | `detail-attachments-card` |
| `data[].$sharing_permission` | string | `detail-attachments-card` |
| `data[].$state` | string | `detail-attachments-card` |
| `data[].$status` | string | `detail-attachments-card` |
| `data[].$wizard_connection_path` | null | `detail-attachments-card` |
| `data[].Address` | string | `detail-attachments-card` |
| `data[].Annual_Revenue` | number | `detail-attachments-card` |
| `data[].City` | string | `detail-attachments-card` |
| `data[].Company` | string | `detail-attachments-card` |
| `data[].Connected_To__s` | null | `detail-attachments-card` |
| `data[].Converted_Account` | null | `detail-attachments-card` |
| `data[].Converted_Contact` | null | `detail-attachments-card` |
| `data[].Converted_Deal` | null | `detail-attachments-card` |
| `data[].Coordinates` | string | `detail-attachments-card` |
| `data[].Country` | string | `detail-attachments-card` |
| `data[].Created_By` | object | `detail-attachments-card` |
| `data[].Created_By.email` | string | `detail-attachments-card` |
| `data[].Created_By.id` | string | `detail-attachments-card` |
| `data[].Created_By.name` | string | `detail-attachments-card` |
| `data[].Created_Time` | string | `detail-attachments-card` |
| `data[].Description` | null | `detail-attachments-card` |
| `data[].Designation` | string | `detail-attachments-card` |
| `data[].Email` | string | `detail-attachments-card` |
| `data[].Email_Opt_Out` | boolean | `detail-attachments-card` |
| `data[].Fax` | null | `detail-attachments-card` |
| `data[].First_Name` | string | `detail-attachments-card` |
| `data[].Flat_House_No_Building_Apartment_Name` | null | `detail-attachments-card` |
| `data[].Full_Name` | string | `detail-attachments-card` |
| `data[].Industry` | string | `detail-attachments-card` |
| `data[].Last_Activity_Time` | string | `detail-attachments-card` |
| `data[].Last_Name` | string | `detail-attachments-card` |
| `data[].Latitude` | null | `detail-attachments-card` |
| `data[].Lead_Conversion_Time` | null | `detail-attachments-card` |
| `data[].Lead_Source` | string | `detail-attachments-card` |
| `data[].Lead_Status` | string | `detail-attachments-card` |
| `data[].Lead_Status_Modified_Time` | string | `detail-attachments-card` |
| `data[].Locked__s` | boolean | `detail-attachments-card` |
| `data[].Longitude` | null | `detail-attachments-card` |
| `data[].Mobile` | string | `detail-attachments-card` |
| `data[].Modified_By` | object | `detail-attachments-card` |
| `data[].Modified_By.email` | string | `detail-attachments-card` |
| `data[].Modified_By.id` | string | `detail-attachments-card` |
| `data[].Modified_By.name` | string | `detail-attachments-card` |
| `data[].Modified_Time` | string | `detail-attachments-card` |
| `data[].No_of_Employees` | null | `detail-attachments-card` |
| `data[].Owner` | object | `detail-attachments-card` |
| `data[].Owner.email` | string | `detail-attachments-card` |
| `data[].Owner.id` | string | `detail-attachments-card` |
| `data[].Owner.name` | string | `detail-attachments-card` |
| `data[].Phone` | string | `detail-attachments-card` |
| `data[].Rating` | null | `detail-attachments-card` |
| `data[].Record_Image` | string | `detail-attachments-card` |
| `data[].Salutation` | string | `detail-attachments-card` |
| `data[].Secondary_Email` | null | `detail-attachments-card` |
| `data[].Skype_ID` | string | `detail-attachments-card` |
| `data[].State` | string | `detail-attachments-card` |
| `data[].Street` | string | `detail-attachments-card` |
| `data[].Tag` | array (empty; item type not observable) | `detail-attachments-card` |
| `data[].Twitter` | string | `detail-attachments-card` |
| `data[].Unsubscribed_Mode` | null | `detail-attachments-card` |
| `data[].Unsubscribed_Time` | null | `detail-attachments-card` |
| `data[].Website` | string | `detail-attachments-card` |
| `data[].Zip_Code` | string | `detail-attachments-card` |
| `data[].id` | string | `detail-attachments-card` |
| `data[].nearby_distance__s` | null | `detail-attachments-card` |
| `omitted (name rule)` | omitted (name rule) | `detail-attachments-card` |

## User inventory

- Method and path: `GET /crm/v9/users`.
- Evidence: `detail-create-owner`, `detail-create-owner-panel`.
- Query parameters: `filters` (`detail-create-owner`), `page` (`detail-create-owner`), `per_page` (`detail-create-owner`), `type` (`detail-create-owner`), `type__s` (`detail-create-owner`).
- Request body: none observed (`detail-create-owner`). Request content type: not applicable.
- Observed status: `200` (`detail-create-owner`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `info` | object | `detail-create-owner` |
| `info.count` | number | `detail-create-owner` |
| `info.more_records` | boolean | `detail-create-owner` |
| `info.page` | number | `detail-create-owner` |
| `info.per_page` | number | `detail-create-owner` |
| `users` | array<object> | `detail-create-owner` |
| `users[]` | object | `detail-create-owner` |
| `users[].Current_Shift__s` | null | `detail-create-owner` |
| `users[].Modified_By` | object | `detail-create-owner` |
| `users[].Modified_By.id` | string | `detail-create-owner` |
| `users[].Modified_By.name` | string | `detail-create-owner` |
| `users[].Modified_Time` | string | `detail-create-owner` |
| `users[].Next_Shift__s` | null | `detail-create-owner` |
| `users[].Preferred_Currency__s` | null | `detail-create-owner` |
| `users[].Shift_Effective_From__s` | null | `detail-create-owner` |
| `users[].alias` | null | `detail-create-owner` |
| `users[].confirm` | boolean | `detail-create-owner` |
| `users[].created_by` | object | `detail-create-owner` |
| `users[].created_by.id` | string | `detail-create-owner` |
| `users[].created_by.name` | string | `detail-create-owner` |
| `users[].created_time` | string | `detail-create-owner` |
| `users[].date_format` | string | `detail-create-owner` |
| `users[].decimal_separator` | string | `detail-create-owner` |
| `users[].distance_preference__s` | string | `detail-create-owner` |
| `users[].email` | string | `detail-create-owner` |
| `users[].first_name` | string | `detail-create-owner` |
| `users[].full_name` | string | `detail-create-owner` |
| `users[].id` | string | `detail-create-owner` |
| `users[].image_link` | string | `detail-create-owner` |
| `users[].last_name` | string | `detail-create-owner` |
| `users[].locale` | string | `detail-create-owner` |
| `users[].microsoft` | boolean | `detail-create-owner` |
| `users[].phone` | null | `detail-create-owner` |
| `users[].profile` | object | `detail-create-owner` |
| `users[].profile.id` | string | `detail-create-owner` |
| `users[].profile.name` | string | `detail-create-owner` |
| `users[].rid` | string | `detail-create-owner` |
| `users[].role` | object | `detail-create-owner` |
| `users[].role.id` | string | `detail-create-owner` |
| `users[].role.name` | string | `detail-create-owner` |
| `users[].sandboxDeveloper` | boolean | `detail-create-owner` |
| `users[].status` | string | `detail-create-owner` |
| `users[].status_reason__s` | null | `detail-create-owner` |
| `users[].type__s` | string | `detail-create-owner` |
| `users[].zuid` | string | `detail-create-owner` |

## Selected user

- Method and path: `GET /crm/v9/users/<userId>`.
- Evidence: `detail-create-owner`.
- Query parameters: none observed.
- Request body: none observed (`detail-create-owner`). Request content type: not applicable.
- Observed status: `200` (`detail-create-owner`).

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `users` | array<object> | `detail-create-owner` |
| `users[]` | object | `detail-create-owner` |
| `users[].Confirmed_Time__s` | string | `detail-create-owner` |
| `users[].Current_Shift__s` | null | `detail-create-owner` |
| `users[].Invited_By__s` | null | `detail-create-owner` |
| `users[].Invited_Time__s` | null | `detail-create-owner` |
| `users[].Modified_By` | object | `detail-create-owner` |
| `users[].Modified_By.id` | string | `detail-create-owner` |
| `users[].Modified_By.name` | string | `detail-create-owner` |
| `users[].Modified_Time` | string | `detail-create-owner` |
| `users[].Next_Shift__s` | null | `detail-create-owner` |
| `users[].Preferred_Currency__s` | null | `detail-create-owner` |
| `users[].Shift_Effective_From__s` | null | `detail-create-owner` |
| `users[].Status_Updated_By__s` | object | `detail-create-owner` |
| `users[].Status_Updated_By__s.id` | string | `detail-create-owner` |
| `users[].Status_Updated_By__s.name` | string | `detail-create-owner` |
| `users[].Status_Updated_Time__s` | string | `detail-create-owner` |
| `users[].alias` | null | `detail-create-owner` |
| `users[].city` | null | `detail-create-owner` |
| `users[].confirm` | boolean | `detail-create-owner` |
| `users[].country` | null | `detail-create-owner` |
| `users[].country_locale` | string | `detail-create-owner` |
| `users[].created_by` | object | `detail-create-owner` |
| `users[].created_by.id` | string | `detail-create-owner` |
| `users[].created_by.name` | string | `detail-create-owner` |
| `users[].created_time` | string | `detail-create-owner` |
| `users[].customize_info` | object | `detail-create-owner` |
| `users[].customize_info.bc_view` | null | `detail-create-owner` |
| `users[].customize_info.notes_desc` | null | `detail-create-owner` |
| `users[].customize_info.open_notes_format` | boolean | `detail-create-owner` |
| `users[].customize_info.show_detail_view` | boolean | `detail-create-owner` |
| `users[].customize_info.show_home` | boolean | `detail-create-owner` |
| `users[].customize_info.show_left_panel` | boolean | `detail-create-owner` |
| `users[].customize_info.show_right_panel` | null | `detail-create-owner` |
| `users[].customize_info.unpin_recent_item` | null | `detail-create-owner` |
| `users[].date_format` | string | `detail-create-owner` |
| `users[].decimal_separator` | string | `detail-create-owner` |
| `users[].default_tab_group` | string | `detail-create-owner` |
| `users[].distance_preference__s` | string | `detail-create-owner` |
| `users[].dob` | null | `detail-create-owner` |
| `users[].email` | string | `detail-create-owner` |
| `users[].ezuid` | string | `detail-create-owner` |
| `users[].fax` | null | `detail-create-owner` |
| `users[].first_name` | string | `detail-create-owner` |
| `users[].full_name` | string | `detail-create-owner` |
| `users[].id` | string | `detail-create-owner` |
| `users[].image_link` | string | `detail-create-owner` |
| `users[].imap_status` | boolean | `detail-create-owner` |
| `users[].language` | string | `detail-create-owner` |
| `users[].last_name` | string | `detail-create-owner` |
| `users[].locale` | string | `detail-create-owner` |
| `users[].microsoft` | boolean | `detail-create-owner` |
| `users[].mobile` | null | `detail-create-owner` |
| `users[].name_format__s` | string | `detail-create-owner` |
| `users[].ntc_enabled` | boolean | `detail-create-owner` |
| `users[].ntc_notification_type` | array<number> | `detail-create-owner` |
| `users[].number_separator` | string | `detail-create-owner` |
| `users[].offset` | number | `detail-create-owner` |
| `users[].personal_account` | boolean | `detail-create-owner` |
| `users[].phone` | null | `detail-create-owner` |
| `users[].profile` | object | `detail-create-owner` |
| `users[].profile.id` | string | `detail-create-owner` |
| `users[].profile.name` | string | `detail-create-owner` |
| `users[].rid` | string | `detail-create-owner` |
| `users[].role` | object | `detail-create-owner` |
| `users[].role.id` | string | `detail-create-owner` |
| `users[].role.name` | string | `detail-create-owner` |
| `users[].rtl_enabled` | boolean | `detail-create-owner` |
| `users[].sandboxDeveloper` | boolean | `detail-create-owner` |
| `users[].sort_order_preference__s` | string | `detail-create-owner` |
| `users[].state` | null | `detail-create-owner` |
| `users[].status` | string | `detail-create-owner` |
| `users[].status_reason__s` | null | `detail-create-owner` |
| `users[].street` | null | `detail-create-owner` |
| `users[].telephony_enabled` | boolean | `detail-create-owner` |
| `users[].theme` | object | `detail-create-owner` |
| `users[].theme.background` | string | `detail-create-owner` |
| `users[].theme.new_background` | null | `detail-create-owner` |
| `users[].theme.normal_tab` | object | `detail-create-owner` |
| `users[].theme.normal_tab.background` | string | `detail-create-owner` |
| `users[].theme.normal_tab.font_color` | string | `detail-create-owner` |
| `users[].theme.screen` | string | `detail-create-owner` |
| `users[].theme.selected_tab` | object | `detail-create-owner` |
| `users[].theme.selected_tab.background` | string | `detail-create-owner` |
| `users[].theme.selected_tab.font_color` | string | `detail-create-owner` |
| `users[].theme.type` | string | `detail-create-owner` |
| `users[].time_format` | string | `detail-create-owner` |
| `users[].time_zone` | string | `detail-create-owner` |
| `users[].type__s` | string | `detail-create-owner` |
| `users[].website` | null | `detail-create-owner` |
| `users[].zip` | null | `detail-create-owner` |
| `users[].zuid` | string | `detail-create-owner` |

## Nested field configuration from metadata

In the v2.2 field and v2.1 layout captures, the first field item's `auto_number`, `currency`, `formula`, `lookup`, `multi_module_lookup`, `multiselectlookup`, `rollup_summary`, and `unique` are each `object (empty in every capture)` (`list-view-edit-1`, `setup-leads-layout-rules`). The first `pick_list_values` array is empty in those captures; its item type is not observable **at those endpoints**. The Leads metadata export is the data-model source and shows populated configuration across all 56 fields: `pick_list_values` in 9 fields, `lookup` in 3, `currency` in 1, and `multi_module_lookup` in 1. The v4.0 and v2 field variants below independently expose some `pick_list_values[]` keys. The other five objects remain empty across all 56 metadata fields. These metadata rows enrich the configuration model; they are **not** keys observed in the first v2.2 field item or first v2.1 layout field item.

| Configuration path | Observed metadata type | Evidence |
| --- | --- | --- |
| `pick_list_values` | array | `metadata/modules/Leads/fields.json` |
| `pick_list_values[]` | object | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].actual_value` | string | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].colour_code` | null | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].display_value` | string | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].id` | string | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].record_category_value` | null, object | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].record_category_value.api_name` | string | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].record_category_value.id` | string | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].reference_value` | string | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].sequence_number` | number | `metadata/modules/Leads/fields.json` |
| `pick_list_values[].type` | string | `metadata/modules/Leads/fields.json` |
| `lookup` | object | `metadata/modules/Leads/fields.json` |
| `lookup.api_name` | null | `metadata/modules/Leads/fields.json` |
| `lookup.display_label` | null | `metadata/modules/Leads/fields.json` |
| `lookup.id` | null | `metadata/modules/Leads/fields.json` |
| `lookup.module` | object | `metadata/modules/Leads/fields.json` |
| `lookup.module.api_name` | string | `metadata/modules/Leads/fields.json` |
| `lookup.module.crypt` | boolean | `metadata/modules/Leads/fields.json` |
| `lookup.module.id` | string | `metadata/modules/Leads/fields.json` |
| `lookup.query_details` | object | `metadata/modules/Leads/fields.json` |
| `lookup.query_details.system_query_id` | null | `metadata/modules/Leads/fields.json` |
| `lookup.revalidate_filter_during_edit` | boolean | `metadata/modules/Leads/fields.json` |
| `currency` | object | `metadata/modules/Leads/fields.json` |
| `currency.precision` | number | `metadata/modules/Leads/fields.json` |
| `currency.rounding_option` | string | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup` | object | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.api_name` | string | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.display_label` | string | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.dynamic_module_addition_allowed` | boolean | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.modules` | array | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.modules[]` | object | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.modules[].api_name` | string | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.modules[].id` | string | `metadata/modules/Leads/fields.json` |
| `multi_module_lookup.modules[].module_name` | string | `metadata/modules/Leads/fields.json` |

The metadata `lookup.module`, `lookup.query_details`, `multi_module_lookup.modules[]`, and `pick_list_values[].record_category_value` branches above include their nested keys. No record values are implied by these configuration objects.

## Endpoint version variants

These adjacent calls are listed for codec routing. Their first-item keys may differ by module and capture depth; the full response tables above cover the requested versions only. All counts refer to distinct capture directories, except that a directory may contain multiple calls.

| Variant | Query keys and module values | Captures / retained bodies / status | Key difference from the documented version | Evidence |
| --- | --- | --- | --- | --- |
| `GET /crm/v4.0/settings/fields` | `module=Entity_Cadences__s` | 51 / 13 / `200` | Adds `blueprint_supported` and `pick_list_values[]{display_value,actual_value,reference_value,id,sequence_number,type,colour_code}`; 13 paths from the v2.2 union are absent: `allowed_permissions_to_update` and its three children, `convert_mapping` and its three children, `parent_field.api_name`, `parent_field.name`, `parent_field.id`, `address.type`, and `public`. | `detail-main`, `list-default` |
| `GET /crm/v2/settings/fields` | `module=Campaign_Leads_Members` (27), `users` (6), `Checklists` (1), `Leads` (1) | 34 / 19 / `200` | Adds `quick_sequence_number`, `blueprint_supported`, `pick_list_values[]{display_value,actual_value,reference_value,id}`; 28 keys from the v2.2 union are absent, including `allowed_permissions_to_update`. | `detail-main`, `detail-create-owner`, `setup-leads-map-dependency`, `board-lead-detail-controls` |
| `GET /crm/v2.2/settings/layouts` | `module=Leads` or `Deals`; `fields`, `include`, `include_element_types`, `include_inner_details`, `module` | 4 / 5 / `200` | Adds 25 paths over the v2.1 union, including `actions_allowed.*`, `sections[].id`, `sections[].fields[].element_type`, `total_profiles`. | `setup-leads-fields`, `setup-leads-layout-editor`, `setup-leads-validation-rules`, `setup-deals-fields` |
| `GET /crm/v3/settings/layouts` | `module=Leads`; `fields`, `include`, `include_inner_details`, `module` | 2 / 2 / `200` | Adds `actions_allowed.*`, `generated_type`, `total_profiles`; the first-item shape has no `sections` branch. | `setup-leads-buttons`, `setup-leads-layouts` |
| `GET /crm/v8/settings/layouts` | `module=Leads` | 1 / 1 / `200` | Adds `sections[].mode`, `sections[].actions_allowed.*`, `sections[].fields[].operation_type.*`, `api_name`; lacks v2.1 `sections[].parent_section`, `sections[].is_parent_section`, and `sections[].fields[].subform`. | `setup-leads-map-dependency` |
| `GET /crm/v8/settings/layouts/<layoutId>` | `module=Leads`; `mode`, `include_inner_details`, `module` | 2 / 2 / `200` | Same 40-path extra and three-path absent set as the v8 inventory in these captures. | `setup-leads-layout-editor`, `setup-leads-map-dependency` |
| `GET /crm/v8/settings/custom_views` | `module=Leads`; `favourite`, `page=1`, `per_page=200`, `module` | 4 / 0 / `204` | No response tree; v9 inventory has `custom_views[]`. | `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default` |

One capture calls the v2 path for two modules (`detail-filter-time-valid`), so the per-module counts add up to 35 over 34 capture directories.

## Query values and field projection

- The main `POST /crm/v2.2/Leads/bulk` call has the **same** comma-separated `fields` query value in all 53 captures: the default, converted, nine system views, and view-edit screens (`list-default`, `list-converted`, `list-sysview-1` through `list-sysview-9`, `list-view-edit-1` through `list-view-edit-3`). It contains field API names `Exchange_Rate`, `First_Name`, `Last_Name`, `Full_Name`, `Currency`, `Tag`, `Owner`, `Layout`, `Data_Processing_Basis_Details`, `Locked__s` and the `$` names listed below; two names are omitted (name rule). The default view columns are `Full_Name`, `Company`, `Email`, `Phone`, `Lead_Source`, and `Owner` (`metadata/modules/Leads/custom_views/`, `list-default`). Thus the parameter includes non-column fields and properties and omits four default columns.
- This is also visible **in the response**: first rows in all 44 populated main-list captures include keys outside `fields`; the default view returns `Company`, `Email`, `Phone`, `Lead_Source` (`list-default`), and another view returns `Salutation` (`list-sysview-2`). The server response is therefore not limited to the named `fields` projection. The nine `204` main-list calls cannot establish row keys (`list-converted`).
- `POST /crm/v2.2/Leads/bulk` also has a related-row form with `relatedId` and `relationId` but **no** `fields` query value in 24 captures; those calls are marked multipart and return `204` (`detail-main`). The 53 main-list calls have `request: null` in 52 captures and an opaque multipart marker with `200` in `home-leads-navigation`. All 53 count calls carry the multipart marker (`list-default`). The marker does not reveal form field names or establish the actual request header.
- Preserved non-identity constants: main list `page=1`, `per_page=30` (`list-default`); view inventory `page=1`, `per_page=11` (`list-default`); user inventory `page=1`, `per_page=200`, `type=ActiveUsers` (`detail-create-owner`); field definitions `type=all` (`setup-leads-fields`) and `include=allowed_permissions_to_update` (`setup-leads-field-permissions`); layouts `mode=all` for `module=Campaigns` (`detail-main`). Module-definition `include` lists appear in its section above. Captured `approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `include_element_types`, `insert_recent_item`, `filters`, `include_inner_details`, and `type__s` values are masked as `<v>`; their constants are not observable in the captures. `type=sent_from_crm` appears on an adjacent request outside the endpoint table (`detail-main`).
- Query values for `cvid`, `relatedId`, `relationId`, and user or record identifiers are intentionally omitted. The `module` values are documented where they determine the meaning of a metadata response.

## Record row value forms

The table joins `data_type` / `json_type` from `metadata/modules/Leads/fields.json` with first-row leaves in the `GET /crm/v2.2/Leads/<recordId>` detail response (`detail-main`, `detail-edit`). It reports types, not values or a guarantee for later array items.

| Metadata data type | Detail response value form | Evidence |
| --- | --- | --- |
| `ownerlookup` / `jsonobject` | `Owner`, `Created_By`, `Modified_By`: object with `name`, `id`, `email` string leaves. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `lookup` / `jsonobject` (3 fields) | `null` only; populated object keys are not observable in the captures. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `multi_module_lookup` / `jsonobject` (1 field) | `null` only; populated object keys are not observable in the captures. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `datetime` / `string` | Four fields are `string`; one is `null`. The string's date-time syntax is not retained. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `boolean` / `boolean` | `boolean` for `Email_Opt_Out` and `Locked__s`. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `currency` / `double` | `Annual_Revenue` is `number`; `$formatted_currency.<field>` is `string`. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `integer` / `integer` (2 fields), `double` / `double` (3 fields) | `null` only; non-null numeric encoding is not observable in the captures. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `picklist` / `string` | Six fields are `string`; two are `null`. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `text`, `textarea`, `email`, `phone`, `website` | `string` or `null`, depending on the field. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `profileimage` / `string` | `string`. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `text` / `jsonarray` | `Tag` is an empty array; item type is not observable in the captures. | `detail-main`; `metadata/modules/Leads/fields.json` |
| `bigint` / `string` | `id` is `string`. | `detail-main`; `metadata/modules/Leads/fields.json` |

In the retained detail first item, empty fields are **present with `null`**: 16 non-`$` leaves have only `null` across the 24 detail captures (`detail-main`, `detail-edit`). Five metadata fields are absent from the detail response altogether: `Converted_Date_Time`, `Change_Log_Time__s`, `Converted__s`, `Last_Enriched_Time__s`, `Enrich_Status__s` (`metadata/modules/Leads/fields.json`, `detail-main`). Because list captures retain only their first row, the presence/null rule for other list rows is not observable in the captures. The populated list's `Owner` object likewise has `name`, `id`, `email` string leaves (`list-default`).

For the populated default list, `info` has `count:number`, `more_records:boolean`, `page:number`, `per_page:number`, `sort_by:string`, and `sort_order:string` (`list-default`). The `info` table above gives each path and capture. The observed `$` row keys in the list and detail response tables are: `$approval`, `$approval_state`, `$approved`, `$converted`, `$converted_detail`, `$currency_symbol`, `$editable`, `$field_states`, `$formatted_currency`, `$home_converted_currency`, `$in_merge`, `$layout_id`, `$locked_for_me`, `$orchestration`, `$pathfinder`, `$photo_id`, `$process_flow`, `$review`, `$review_process`, `$sharing_permission`, `$state`, `$status`, `$upcoming_activity`, `$wizard_connection_path`, and omitted (name rule) (`list-default`, `detail-main`). Other `$` names appear only in the `fields` query, including `$blocked_reason` and `$cpq_executions`; a projected name alone is not proof of a response key.

## Errors in all existing captures

| Method and path | Status | Body key and type | Evidence |
| --- | --- | --- | --- |
| `GET /crm/v2.2/<module>/list` | `404` | `code`: string, `details`: object, `message`: string, `status`: string | `leads-main`, `list-main`, `list-view-edit` |
| `GET /crm/v6/settings/recycle_bin/list` | `404` | `code`: string, `details`: object, `message`: string, `status`: string | `leads-main`, `list-main`, `list-view-edit` |

The error `details` object has no nested keys in these captures; its value content is not reproduced.

## Differences across captures

- The module definition endpoint has captured `200` responses with a `modules[]` body and other `200` entries whose response is absent in `network.json` (`list-main`, `list-default`). The absent entry is a capture limitation, not a confirmed empty response.
- The list endpoint returns `200` with `data[]` and `info` in 44 populated main-list captures (`list-default`) and `204` with no body in nine empty-view captures (`list-converted`). A related-row variant uses `relatedId` and `relationId`, omits `fields`, and returns `204` in 24 captures (`detail-main`).
- Main-list calls have `request: null` in 52 captures (`list-default`), but `home-leads-navigation` has a multipart marker and `200`. All 24 related-row calls and all 53 count calls have a multipart marker (`detail-main`, `list-default`). This does not show form field names or the actual request `Content-Type` header.
- The main-list `fields` value is identical in all 53 captures, while returned first rows contain keys missing from that query (`list-default`, `list-sysview-2`). ADR 0004 §6 describes it as a column projection; that reading is not supported by these captured response keys. ADR 0004's open question 4 already records the default `info.sort_by` and `info.sort_order` string finding, so that is not a new contradiction.
- Metadata endpoints sometimes target a different module: the v2.1 layout calls on detail screens use `module=Campaigns`, and four v2.2 field calls in view editing do too (`detail-main`, `list-view-edit-1`). The v2.2 field and v2.1 layout tables above describe their Leads calls only; version variants are listed separately.
- The selected view criteria may be one leaf or a nested group; the union table includes both (`list-default`, `list-sysview-1`, `list-sysview-9`). Null, absent, and populated optional metadata fields vary between captures.
- The record detail endpoint is used by both detail and edit loads; the captured paths carry different optional query flags (`detail-main`, `detail-edit`). The response node types above are the union.
- `data[].$converted_detail` is `object (empty in every capture)` in both list and detail first items (`list-default`, `detail-main`). For Leads module definitions, `modules[].parent_module` is also `object (empty in every Leads capture)`; the Tasks call supplies the nested keys in the union table (`analyst-smoke`, `setup-tasks-summary`).

## Not observed

- Record create, update, or delete request and response shapes: not observable in the captures.
- Validation, authorization, and conflict error bodies: not observable in the captures.
- Request headers, including request `Content-Type`: not observable in the captures.
- Transport of a changed sort, ad-hoc filter, or search text: not observable in the captures.
- Exact values of masked flags and request bodies behind the opaque multipart marker: not observable in the captures.
- Nested fields behind a `<deep>` capture truncation: not observable in the captures.
- Values and nullability of array items beyond the first retained item: not observable in the captures.
- The source of Leads field definitions and Leads layout sections on ordinary list and detail screens: not observable in the captures.
