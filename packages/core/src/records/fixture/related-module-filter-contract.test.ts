import { describeRelatedModuleFiltersContract } from "../related-module-filters-contract-suite";
import { createFixtureRecordService } from "./index";

describeRelatedModuleFiltersContract("fixture", (ctx) => createFixtureRecordService(ctx));
