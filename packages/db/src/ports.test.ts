import { createServer } from "node:net";
import { describe, expect, it } from "vitest";
import { isPortFree, pickFreePort } from "./ports";

describe("pickFreePort", () => {
  it("returns a usable, currently free port", async () => {
    const port = await pickFreePort();
    expect(port).toBeGreaterThan(1023);
    expect(await isPortFree(port)).toBe(true);
  });

  it("does not hand out a port that is in use", async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const busy = typeof address === "object" && address ? address.port : 0;
    try {
      expect(await isPortFree(busy)).toBe(false);
      expect(await pickFreePort()).not.toBe(busy);
    } finally {
      server.close();
    }
  });
});
