import { createFixtureRecordService } from "./fixture";
import { describeKanbanViewContract } from "./kanban-contract-suite";

describeKanbanViewContract("fixture", (ctx, options) => createFixtureRecordService(ctx, options));
