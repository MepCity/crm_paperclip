"use client";

import type { FieldDefinition, ModuleMetadata, PicklistOption } from "@crm/core/records";
import { useMemo } from "react";
import { english, type MessageKey, type MessageValues } from "./catalogs";
import { useUiLanguage, useUiTranslations } from "./client-provider";
import type { UiLanguage } from "./resolve-language";

export interface MetadataDisplayAdapter {
  language: UiLanguage;
  getModuleSingular(moduleApiName: string, fallback?: string): string;
  getModulePlural(moduleApiName: string, fallback?: string): string;
  getFieldLabel(
    moduleApiName: string,
    field: { apiName: string; label: string; custom?: boolean },
  ): string;
  getNamedLabel(label: string): string;
  getRelatedListTitle(id: string, fallbackTitle: string): string;
  getLayoutSectionLabel(moduleApiName: string, sectionTitle: string): string;
  getPicklistOptionLabel(
    moduleApiName: string,
    fieldApiName: string,
    option: PicklistOption,
  ): string;
  adaptField(moduleApiName: string, field: FieldDefinition): FieldDefinition;
  adaptModule(module: ModuleMetadata): ModuleMetadata;
}

export function createMetadataDisplayAdapter(
  t: (key: MessageKey, values?: MessageValues) => string,
  language: UiLanguage,
): MetadataDisplayAdapter {
  const isTr = language === "tr";

  function getModuleSingular(moduleApiName: string, fallback?: string): string {
    const builtIn = (
      english.metadata.modules as Record<string, { singular: string; plural: string }>
    )[moduleApiName];
    if (builtIn && fallback && fallback !== builtIn.singular) {
      return fallback;
    }
    if (isTr && builtIn) {
      return t(`metadata.modules.${moduleApiName}.singular` as MessageKey);
    }
    return fallback ?? builtIn?.singular ?? moduleApiName;
  }

  function getModulePlural(moduleApiName: string, fallback?: string): string {
    const builtIn = (
      english.metadata.modules as Record<string, { singular: string; plural: string }>
    )[moduleApiName];
    if (builtIn && fallback && fallback !== builtIn.plural) {
      return fallback;
    }
    if (isTr && builtIn) {
      return t(`metadata.modules.${moduleApiName}.plural` as MessageKey);
    }
    return fallback ?? builtIn?.plural ?? moduleApiName;
  }

  function getNamedLabel(label: string): string {
    const labelKey = label.replace(/\s+/g, "_");
    const builtIn = (english.metadata.fields as Record<string, string>)[labelKey];
    if (builtIn === label && isTr) {
      return t(`metadata.fields.${labelKey}` as MessageKey);
    }
    return label;
  }

  function getFieldLabel(
    _moduleApiName: string,
    field: { apiName: string; label: string; custom?: boolean },
  ): string {
    if (field.custom) {
      return field.label;
    }
    const labelKey = field.label.replace(/\s+/g, "_");
    const builtInByLabel = (english.metadata.fields as Record<string, string>)[labelKey];
    if (builtInByLabel === field.label && isTr) {
      return t(`metadata.fields.${labelKey}` as MessageKey);
    }
    const builtIn = (english.metadata.fields as Record<string, string>)[field.apiName];
    if (!builtIn || field.label !== builtIn) {
      return field.label;
    }
    if (isTr) {
      return t(`metadata.fields.${field.apiName}` as MessageKey);
    }
    return field.label;
  }

  function getRelatedListTitle(id: string, fallbackTitle: string): string {
    const camelId = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const key = (english.metadata.relatedLists as Record<string, string>)[id]
      ? id
      : (english.metadata.relatedLists as Record<string, string>)[camelId]
        ? camelId
        : Object.entries(english.metadata.relatedLists).find(
            ([_, title]) => title === fallbackTitle,
          )?.[0];
    if (!key) {
      return fallbackTitle;
    }
    const builtIn = (english.metadata.relatedLists as Record<string, string>)[key];
    if (!builtIn || fallbackTitle !== builtIn) {
      return fallbackTitle;
    }
    if (isTr) {
      return t(`metadata.relatedLists.${key}` as MessageKey);
    }
    return fallbackTitle;
  }

  function getLayoutSectionLabel(_moduleApiName: string, sectionTitle: string): string {
    const builtIn = (english.metadata.sections as Record<string, string>)[sectionTitle];
    if (!builtIn || sectionTitle !== builtIn) {
      return sectionTitle;
    }
    if (isTr) {
      return t(`metadata.sections.${sectionTitle}` as MessageKey);
    }
    return sectionTitle;
  }

  function getPicklistOptionLabel(
    _moduleApiName: string,
    _fieldApiName: string,
    option: PicklistOption,
  ): string {
    return option.displayValue;
  }

  function adaptField(moduleApiName: string, field: FieldDefinition): FieldDefinition {
    const adaptedLabel = getFieldLabel(moduleApiName, field);
    const adaptedPicklist = field.picklist?.map((opt) => ({
      ...opt,
      displayValue: getPicklistOptionLabel(moduleApiName, field.apiName, opt),
    }));
    if (adaptedLabel === field.label && (!adaptedPicklist || adaptedPicklist === field.picklist)) {
      return field;
    }
    return {
      ...field,
      label: adaptedLabel,
      ...(adaptedPicklist ? { picklist: adaptedPicklist } : {}),
    };
  }

  function adaptModule(module: ModuleMetadata): ModuleMetadata {
    const singularLabel = getModuleSingular(module.apiName, module.singularLabel);
    const pluralLabel = getModulePlural(module.apiName, module.pluralLabel);
    const fields = module.fields.map((f) => adaptField(module.apiName, f));
    const layout = module.layout.map((sec) => ({
      ...sec,
      label: getLayoutSectionLabel(module.apiName, sec.label),
    }));
    return {
      ...module,
      singularLabel,
      pluralLabel,
      fields,
      layout,
    };
  }

  return {
    language,
    getModuleSingular,
    getModulePlural,
    getFieldLabel,
    getNamedLabel,
    getRelatedListTitle,
    getLayoutSectionLabel,
    getPicklistOptionLabel,
    adaptField,
    adaptModule,
  };
}

export function useMetadataDisplayAdapter(): MetadataDisplayAdapter {
  const language = useUiLanguage();
  const t = useUiTranslations();
  return useMemo(() => createMetadataDisplayAdapter(t, language), [t, language]);
}
