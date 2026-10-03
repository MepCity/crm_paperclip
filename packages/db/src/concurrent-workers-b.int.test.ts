import { describe, it } from "vitest";
import { expectDistinctFromPeer } from "./concurrent-workers";

describe("concurrent Vitest workers (b)", () => {
  it("get different databases from the peer file", async (context) => {
    if (!(await expectDistinctFromPeer("b"))) context.skip("peer test file did not run");
  });
});
