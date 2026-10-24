import { createFixtureRecordService } from "./fixture";
import { describeNotesContract } from "./notes-contract-suite";

describeNotesContract("fixture", createFixtureRecordService);
