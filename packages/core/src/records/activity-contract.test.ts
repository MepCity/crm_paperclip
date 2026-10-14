import { describeActivityReadContract } from "./contract-suite";
import { createFixtureRecordService } from "./fixture";

describeActivityReadContract("fixture", createFixtureRecordService);
