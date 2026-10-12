/** Attempt every cleanup in order, then rethrow the first failure unchanged. */
export async function runCleanupSteps(
  steps: readonly (() => void | Promise<void>)[],
): Promise<void> {
  let failed = false;
  let firstError: unknown;
  for (const step of steps) {
    try {
      await step();
    } catch (error) {
      if (!failed) {
        failed = true;
        firstError = error;
      }
    }
  }
  if (failed) throw firstError;
}
