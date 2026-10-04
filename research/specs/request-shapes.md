# Module 1 request and response shapes

Source: existing type-only `network.json` captures. No live reference CRM request was made for this document. Paths use placeholders; no record or account values are reproduced. The table lists the union of observed keys, not a promise that every key is always present. `array<object>` denotes the captured item schema; an empty array or a capture depth limit cannot establish nested keys. Each row cites a capture that contains that node.

The capture stores HTTP response content type but does not retain request headers. For POST calls it records an opaque multipart marker; constituent field names are not observable in the captures. Query values written below are limited to non-identity constants preserved by the capture.

## Module definition

- Method and path: `GET /crm/v2.2/settings/modules/<module>`.
- Evidence: `analyst-smoke`, `analyst-sol-smoke`, `board-test-controls`, `detail-attachments-card`, `detail-create`, `detail-create-country`, `detail-create-owner`, `detail-create-owner-panel`, `detail-create-salutation-panel`, `detail-create-state`, `detail-create-status-panel`, `detail-description`, `detail-edit`, `detail-edit-state`, `detail-filter-modules`, `detail-filter-modules-valid`, `detail-filter-sources`, `detail-filter-sources-valid`, `detail-filter-time`, `detail-filter-time-valid`, `detail-inline-rating`, `detail-interactions`, `detail-interactions-filter`, `detail-interactions-filter-valid`, `detail-main`, `detail-meetings-card`, `detail-more`, `detail-notes`, `detail-notes-card`, `detail-timeline`, `detail-timeline-filter`, `detail-voc-card`, `home-leads-navigation`, `leads-default`, `leads-detail`, `leads-main`, `list-actions`, `list-columns`, `list-converted`, `list-default`, `list-filter-text`, `list-main`, `list-more`, `list-page-size`, `list-settings`, `list-sort`, `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`, `list-view-edit`, `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3`, `list-view-edit-default`, `list-view-options`, `list-view-selector`, `setup-leads-summary`.
- Query parameters: `include` (`analyst-smoke`).
- Request body: none observed (`analyst-smoke`). Request content type: not applicable.
- Observed status: `200` (`analyst-smoke`).

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
| `modules[].custom_view.criteria` | object | `analyst-smoke` |
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
| `modules[].modified_by` | object | `analyst-smoke` |
| `modules[].modified_by.id` | string | `analyst-smoke` |
| `modules[].modified_by.name` | string | `analyst-smoke` |
| `modules[].modified_time` | string | `analyst-smoke` |
| `modules[].module_name` | string | `analyst-smoke` |
| `modules[].parent_module` | object | `analyst-smoke` |
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

| Response path | Observed type | Evidence |
| --- | --- | --- |
| `layouts` | array<object> | `detail-main` |
| `layouts[]` | object | `detail-main` |
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
| `layouts[].created_by` | null | `detail-main` |
| `layouts[].created_for` | null | `detail-main` |
| `layouts[].created_time` | null | `detail-main` |
| `layouts[].display_label` | string | `detail-main` |
| `layouts[].id` | string | `detail-main` |
| `layouts[].modified_by` | null | `detail-main` |
| `layouts[].modified_time` | null | `detail-main` |
| `layouts[].name` | string | `detail-main` |
| `layouts[].profiles` | array<object> | `detail-main` |
| `layouts[].profiles[]` | object | `detail-main` |
| `layouts[].profiles[]._default_assignment_view` | object | `detail-main` |
| `layouts[].profiles[]._default_assignment_view.id` | string | `detail-main` |
| `layouts[].profiles[]._default_assignment_view.name` | string | `detail-main` |
| `layouts[].profiles[]._default_assignment_view.type` | string | `detail-main` |
| `layouts[].profiles[]._default_view` | object | `detail-main` |
| `layouts[].profiles[]._default_view.id` | string | `detail-main` |
| `layouts[].profiles[]._default_view.name` | string | `detail-main` |
| `layouts[].profiles[]._default_view.type` | string | `detail-main` |
| `layouts[].profiles[].default` | boolean | `detail-main` |
| `layouts[].profiles[].id` | string | `detail-main` |
| `layouts[].profiles[].name` | string | `detail-main` |
| `layouts[].sections` | array<object> | `detail-main` |
| `layouts[].sections[]` | object | `detail-main` |
| `layouts[].sections[].api_name` | string | `detail-main` |
| `layouts[].sections[].column_count` | number | `detail-main` |
| `layouts[].sections[].display_label` | string | `detail-main` |
| `layouts[].sections[].fields` | array<object> | `detail-main` |
| `layouts[].sections[].fields[]` | object | `detail-main` |
| `layouts[].sections[].fields[].additional_column` | null | `detail-main` |
| `layouts[].sections[].fields[].address` | null | `detail-main` |
| `layouts[].sections[].fields[].api_name` | string | `detail-main` |
| `layouts[].sections[].fields[].association_details` | null | `detail-main` |
| `layouts[].sections[].fields[].auto_number` | object | `detail-main` |
| `layouts[].sections[].fields[].businesscard_supported` | boolean | `detail-main` |
| `layouts[].sections[].fields[].category` | number | `detail-main` |
| `layouts[].sections[].fields[].child_fields` | null | `detail-main` |
| `layouts[].sections[].fields[].column_name` | string | `detail-main` |
| `layouts[].sections[].fields[].convert_mapping` | object | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping.Accounts` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping.Contacts` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].convert_mapping.Deals` | null | `setup-leads-layout-rules` |
| `layouts[].sections[].fields[].created_source` | string | `detail-main` |
| `layouts[].sections[].fields[].created_time` | null | `detail-main` |
| `layouts[].sections[].fields[].crypt` | null | `detail-main` |
| `layouts[].sections[].fields[].currency` | object | `detail-main` |
| `layouts[].sections[].fields[].custom_field` | boolean | `detail-main` |
| `layouts[].sections[].fields[].data_type` | string | `detail-main` |
| `layouts[].sections[].fields[].decimal_place` | null | `detail-main` |
| `layouts[].sections[].fields[].default_value` | null | `detail-main` |
| `layouts[].sections[].fields[].display_field` | boolean | `detail-main` |
| `layouts[].sections[].fields[].display_format` | null | `detail-main` |
| `layouts[].sections[].fields[].display_format_properties` | null | `detail-main` |
| `layouts[].sections[].fields[].display_label` | string | `detail-main` |
| `layouts[].sections[].fields[].display_type` | number | `detail-main` |
| `layouts[].sections[].fields[].enable_record_category` | boolean | `detail-main` |
| `layouts[].sections[].fields[].external` | null | `detail-main` |
| `layouts[].sections[].fields[].field_label` | string | `detail-main` |
| `layouts[].sections[].fields[].field_read_only` | boolean | `detail-main` |
| `layouts[].sections[].fields[].filterable` | boolean | `detail-main` |
| `layouts[].sections[].fields[].formula` | object | `detail-main` |
| `layouts[].sections[].fields[].history_tracking` | null | `detail-main` |
| `layouts[].sections[].fields[].id` | string | `detail-main` |
| `layouts[].sections[].fields[].json_type` | string | `detail-main` |
| `layouts[].sections[].fields[].length` | number | `detail-main` |
| `layouts[].sections[].fields[].lookup` | object | `detail-main` |
| `layouts[].sections[].fields[].modified_time` | null | `detail-main` |
| `layouts[].sections[].fields[].multi_module_lookup` | object | `detail-main` |
| `layouts[].sections[].fields[].multiselectlookup` | object | `detail-main` |
| `layouts[].sections[].fields[].parent_field` | null | `detail-main` |
| `layouts[].sections[].fields[].pick_list_values` | array (empty; item type not observable) | `detail-main` |
| `layouts[].sections[].fields[].pick_list_values_sorted_lexically` | boolean | `detail-main` |
| `layouts[].sections[].fields[].profiles` | array<object> | `detail-main` |
| `layouts[].sections[].fields[].profiles[]` | object | `detail-main` |
| `layouts[].sections[].fields[].profiles[].id` | not observable in the captures (depth limit) | `detail-main` |
| `layouts[].sections[].fields[].profiles[].name` | not observable in the captures (depth limit) | `detail-main` |
| `layouts[].sections[].fields[].profiles[].permission_type` | not observable in the captures (depth limit) | `detail-main` |
| `layouts[].sections[].fields[].public` | boolean | `detail-main` |
| `layouts[].sections[].fields[].range` | null | `detail-main` |
| `layouts[].sections[].fields[].read_only` | boolean | `detail-main` |
| `layouts[].sections[].fields[].refer_from_field` | null | `detail-main` |
| `layouts[].sections[].fields[].required` | boolean | `detail-main` |
| `layouts[].sections[].fields[].rollup_summary` | object | `detail-main` |
| `layouts[].sections[].fields[].section_id` | number | `detail-main` |
| `layouts[].sections[].fields[].sequence_number` | number | `detail-main` |
| `layouts[].sections[].fields[].show_type` | number | `detail-main` |
| `layouts[].sections[].fields[].sortable` | boolean | `detail-main` |
| `layouts[].sections[].fields[].static_field` | boolean | `detail-main` |
| `layouts[].sections[].fields[].static_values` | null | `detail-main` |
| `layouts[].sections[].fields[].subform` | null | `detail-main` |
| `layouts[].sections[].fields[].subform_properties` | null | `detail-main` |
| `layouts[].sections[].fields[].system_mandatory` | boolean | `detail-main` |
| `layouts[].sections[].fields[].tooltip` | null | `detail-main` |
| `layouts[].sections[].fields[].type` | string | `detail-main` |
| `layouts[].sections[].fields[].ui_type` | number | `detail-main` |
| `layouts[].sections[].fields[].unique` | object | `detail-main` |
| `layouts[].sections[].fields[].validation_rule` | null | `detail-main` |
| `layouts[].sections[].fields[].view_type` | object | `detail-main` |
| `layouts[].sections[].fields[].view_type.create` | boolean | `detail-main` |
| `layouts[].sections[].fields[].view_type.edit` | boolean | `detail-main` |
| `layouts[].sections[].fields[].view_type.quick_create` | boolean | `detail-main` |
| `layouts[].sections[].fields[].view_type.view` | boolean | `detail-main` |
| `layouts[].sections[].fields[].visible` | boolean | `detail-main` |
| `layouts[].sections[].fields[].webhook` | boolean | `detail-main` |
| `layouts[].sections[].generated_type` | string | `detail-main` |
| `layouts[].sections[].isSubformSection` | boolean | `detail-main` |
| `layouts[].sections[].is_parent_section` | boolean | `detail-main` |
| `layouts[].sections[].name` | string | `detail-main` |
| `layouts[].sections[].parent_section` | null | `detail-main` |
| `layouts[].sections[].properties` | null | `detail-main` |
| `layouts[].sections[].sequence_number` | number | `detail-main` |
| `layouts[].sections[].tab_traversal` | number | `detail-main` |
| `layouts[].sections[].type` | string | `detail-main` |
| `layouts[].show_business_card` | boolean | `detail-main` |
| `layouts[].status` | number | `detail-main` |
| `layouts[].visible` | boolean | `detail-main` |

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

## Query values and field projection

- `fields` on `POST /crm/v2.2/<module>/bulk` is one comma-separated query value of field API names and `$` properties (`list-default`). The preserved list includes `Full_Name`, `First_Name`, `Last_Name`, `Owner`, `Tag`, `Layout`, `Locked__s`, `Currency`, `Exchange_Rate`, and `Data_Processing_Basis_Details`. It also includes the state and permission properties listed below. The default view metadata lists `Full_Name`, `Company`, `Email`, `Phone`, `Lead_Source`, and `Owner` as columns (`metadata/modules/Leads/custom_views/`; `list-default` identifies the default view). Thus `First_Name`, `Last_Name`, `Tag`, `Layout`, `Locked__s`, `Currency`, `Exchange_Rate`, `Data_Processing_Basis_Details`, and the `$` properties are beyond those columns, while `Company`, `Email`, `Phone`, and `Lead_Source` are columns absent from this query value. This is an inference from the default-view metadata and capture; it does not establish how the service applies `fields`.
- Preserved non-identity constants: `type=all` on field definitions (`setup-leads-fields`), `type=ActiveUsers` on user inventory (`detail-create-owner`), `type=sent_from_crm` on another observed request (`detail-main`), and `mode=all` on layouts (`detail-main`). The capture masks `approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `include_element_types`, `insert_recent_item`, `filters`, `include_inner_details`, and `type__s` values as `<v>`; their values are not observable in the captures.
- Query values for `module`, `cvid`, `relatedId`, `relationId`, and user or record identifiers are intentionally omitted.

## Record row value forms

- `Owner` is an object with `name`, `id`, and `email` string leaves (`list-default`). Other observed owner-like and lookup objects are represented by their exact paths in the record list and detail tables above. Those tables are the evidence for each key and type, including nullable alternatives.
- Date and time leaves are captured as `string` or `null`, numeric leaves as `number` or `null`, and checkboxes as `boolean` or `null` where those alternatives appear in the tables. The capture does not retain date-time string format, numeric precision, or checkbox wire values beyond type.
- A captured `null` proves an explicit null at that path; absence of a path in another response proves only that the key was not represented in that type snapshot. It does not establish a universal omission rule.
- Multi-module lookup value objects: not observable in the captures. Metadata defines field configuration, but it does not establish a record value shape.
- For the populated default list, `info.sort_by` and `info.sort_order` are both `string` (`list-default`). ADR 0004's open question states an interim `null` for an unset sort; that differs from the captured default-view types.
- Observed `$` row properties in the `fields` projection: `$approval`, `$approval_state`, `$approved`, `$blocked_reason`, `$converted`, `$converted_detail`, `$cpq_executions`, `$currency_symbol`, `$editable`, `$field_states`, `$in_merge`, `$layout_id`, `$locked_for_me`, `$orchestration`, `$pathfinder`, `$photo_id`, `$process_flow`, `$review`, `$review_process`, `$sharing_permission`, `$state`, `$status`, `$upcoming_activity`, `$wizard_connection_path`, and omitted (name rule) (`list-default`). A projected name does not prove the row response contains the key; use the response table for that.

## Errors in all existing captures

| Method and path | Status | Body key and type | Evidence |
| --- | --- | --- | --- |
| `GET /crm/v2.2/<module>/list` | `404` | `code`: string, `details`: object, `message`: string, `status`: string | `leads-main`, `list-main`, `list-view-edit` |
| `GET /crm/v6/settings/recycle_bin/list` | `404` | `code`: string, `details`: object, `message`: string, `status`: string | `leads-main`, `list-main`, `list-view-edit` |

The error `details` object has no nested keys in these captures; its value content is not reproduced.

## Differences across captures

- The module definition endpoint has captured `200` responses with a `modules[]` body and other `200` entries whose response is absent in `network.json` (`list-main`, `list-default`). The absent entry is a capture limitation, not a confirmed empty response.
- The list endpoint returns `200` with `data[]` and `info` in populated views (`list-default`) and `204` with no body in an empty view (`list-converted`). A related-row variant uses `relatedId` and `relationId` and also returns `204` (`detail-main`).
- The populated list captures `request: null` (`list-default`), whereas the related-row `204` variant records only an opaque multipart marker (`detail-main`). This does not show the multipart field names.
- The selected view criteria may be one leaf or a nested group; the union table includes both (`list-default`, `list-sysview-1`, `list-sysview-9`). Null, absent, and populated optional metadata fields vary between captures.
- The record detail endpoint is used by both detail and edit loads; the captured paths carry different optional query flags (`detail-main`, `detail-edit`). The response node types above are the union.

## Not observed

- Record create, update, or delete request and response shapes: not observable in the captures.
- Validation, authorization, and conflict error bodies: not observable in the captures.
- Request headers, including request `Content-Type`: not observable in the captures.
- Transport of a changed sort, ad-hoc filter, or search text: not observable in the captures.
- Exact values of masked flags and request bodies behind the opaque multipart marker: not observable in the captures.
- Nested fields behind a `<deep>` capture truncation: not observable in the captures.
