import { Icons } from "@/components/ui/icon";
import { buildAccountsRecordMoreMenuGroups } from "../accounts/accounts-record-more-options";
import {
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "../accounts/accounts-timeline";
import type { ModuleScreenDefinition } from "../types";
import { PRODUCTS_LIST_CURRENCY_CODE, productsListPageConfig } from "./list-config";
import { buildProductsFilterGroups } from "./list-filters";
import {
  buildProductsBusinessCardFields,
  buildProductsDetailSections,
} from "./products-detail-sections";
import {
  PRODUCTS_DELETE_CONFIRM_MESSAGE,
  PRODUCTS_DELETE_CONFIRM_TITLE,
  productsFormRules,
} from "./products-form-rules";
import { isProductInlineEditable } from "./products-inline-edit";
import { formatProductsLastUpdateLabel } from "./products-last-update";
import { productsRecordHeaderIdentity } from "./products-record-header";
import { productsRelatedListRail, productsRelatedLists } from "./products-related-lists";

export const productsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Products",
  tab: "Products",
  singularLabel: "Product",
  pluralLabel: "Products",
  pageTitle: "Products",
  navigation: { id: "products", icon: Icons.store, group: "flat" },
  list: productsListPageConfig,
  listCurrencyCode: PRODUCTS_LIST_CURRENCY_CODE,
  searchColumns: ["Product_Name", "Product_Code", "Manufacturer", "Product_Category", "Owner"],
  buildFilterGroups: buildProductsFilterGroups,
  form: {
    rules: productsFormRules,
    inventoryChrome: true,
    inventoryFooterEnd: true,
    profileImageLaterModule: "M6",
  },
  detail: {
    header: productsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    businessCard: buildProductsBusinessCardFields,
    sections: buildProductsDetailSections,
    inlineEditable: isProductInlineEditable,
    lastUpdate: formatProductsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: PRODUCTS_DELETE_CONFIRM_TITLE,
    deleteMessage: PRODUCTS_DELETE_CONFIRM_MESSAGE,
    relatedLists: productsRelatedLists,
    relatedListRail: productsRelatedListRail,
    timeline: {
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      normalizeEventKind: normalizeAccountsEventKind,
    },
  },
};
