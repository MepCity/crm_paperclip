import { describe, expect, it } from "vitest";
import { runCleanupSteps } from "./e2e-cleanup";

describe("E2E cleanup", () => {
  it("awaits port, cluster and lock cleanup in order", async () => {
    const calls: string[] = [];
    await runCleanupSteps(
      ["port", "cluster", "lock"].map((name) => async () => {
        await Promise.resolve();
        calls.push(name);
      }),
    );
    expect(calls).toEqual(["port", "cluster", "lock"]);
  });

  it.each([0, 1, 2])(
    "continues after step %i fails and preserves the first error",
    async (index) => {
      const calls: string[] = [];
      const first = new Error("first failure");
      const later = new Error("later failure");
      await expect(
        runCleanupSteps(
          ["port", "cluster", "lock"].map((name, step) => async () => {
            calls.push(name);
            if (step === index) throw first;
            if (step > index) throw later;
          }),
        ),
      ).rejects.toBe(first);
      expect(calls).toEqual(["port", "cluster", "lock"]);
    },
  );

  it("preserves even an undefined synchronous failure", async () => {
    let released = false;
    await expect(
      runCleanupSteps([
        () => {
          throw undefined;
        },
        () => {
          released = true;
        },
      ]),
    ).rejects.toBeUndefined();
    expect(released).toBe(true);
  });
});
