import { appendFile } from "node:fs/promises";

/** Reports failed stages too, so CI can distinguish build cost from browser cost. */
export async function timeE2eStage<T>(label: string, work: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    return await work();
  } finally {
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    const line = `${label}: ${seconds} s`;
    console.log(`e2e: ${line}`);
    // Step summary files are isolated per step; publish timing in this step too.
    if (process.env.GITHUB_ACTIONS === "true") {
      console.log(`::notice title=E2E stage timing::${line}`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `- ${line}\n`);
    }
  }
}
